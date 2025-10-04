import { supabase } from './supabase';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOrderOptions {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, any>;
}

export interface RazorpayPaymentOptions {
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, any>;
  theme?: {
    color?: string;
  };
}

export interface PaymentResult {
  success: boolean;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  error?: string;
}

export class RazorpayService {
  private static instance: RazorpayService;
  private keyId: string;
  private scriptLoaded: boolean = false;

  private constructor() {
    this.keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
    if (!this.keyId) {
      console.warn('Razorpay Key ID not found in environment variables');
    }
  }

  static getInstance(): RazorpayService {
    if (!RazorpayService.instance) {
      RazorpayService.instance = new RazorpayService();
    }
    return RazorpayService.instance;
  }

  async loadScript(): Promise<boolean> {
    if (this.scriptLoaded) {
      return true;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        this.scriptLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  async createOrder(
    userId: string,
    eventId: string,
    amount: number,
    registrationId?: string
  ): Promise<{ orderId: string; transactionId: string } | null> {
    try {
      const { data: transaction, error } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: userId,
          event_id: eventId,
          registration_id: registrationId,
          amount: amount,
          currency: 'INR',
          status: 'initiated',
        })
        .select()
        .single();

      if (error) throw error;

      const orderId = `order_${transaction.id.substring(0, 14)}`;

      await supabase
        .from('payment_transactions')
        .update({ razorpay_order_id: orderId })
        .eq('id', transaction.id);

      return { orderId, transactionId: transaction.id };
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  async openPaymentModal(
    options: RazorpayPaymentOptions,
    transactionId: string
  ): Promise<PaymentResult> {
    const isLoaded = await this.loadScript();

    if (!isLoaded) {
      return {
        success: false,
        error: 'Failed to load Razorpay SDK. Please check your internet connection.',
      };
    }

    if (!this.keyId) {
      return {
        success: false,
        error: 'Razorpay configuration error. Please contact support.',
      };
    }

    return new Promise((resolve) => {
      const razorpayOptions = {
        key: this.keyId,
        amount: options.amount * 100,
        currency: options.currency,
        name: options.name,
        description: options.description,
        image: options.image,
        order_id: options.orderId,
        prefill: options.prefill,
        notes: options.notes,
        theme: {
          color: options.theme?.color || '#3B82F6',
        },
        handler: async (response: any) => {
          try {
            await supabase
              .from('payment_transactions')
              .update({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                status: 'success',
                completed_at: new Date().toISOString(),
                payment_method: 'razorpay',
              })
              .eq('id', transactionId);

            resolve({
              success: true,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
          } catch (error) {
            resolve({
              success: false,
              error: 'Payment completed but failed to update records. Please contact support.',
            });
          }
        },
        modal: {
          ondismiss: async () => {
            await supabase
              .from('payment_transactions')
              .update({
                status: 'failed',
                error_message: 'Payment cancelled by user',
              })
              .eq('id', transactionId);

            resolve({
              success: false,
              error: 'Payment cancelled',
            });
          },
        },
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();
    });
  }

  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('razorpay_order_id', razorpayOrderId)
        .eq('razorpay_payment_id', razorpayPaymentId)
        .eq('status', 'success')
        .maybeSingle();

      if (error || !data) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }

  async completeRegistration(transactionId: string, registrationId: string): Promise<boolean> {
    try {
      const { error: regError } = await supabase
        .from('registrations')
        .update({
          payment_status: 'completed',
          payment_completed_at: new Date().toISOString(),
        })
        .eq('id', registrationId);

      if (regError) throw regError;

      return true;
    } catch (error) {
      console.error('Error completing registration:', error);
      return false;
    }
  }

  async getPaymentHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*, events(title, image_url)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  }
}

export const razorpayService = RazorpayService.getInstance();
