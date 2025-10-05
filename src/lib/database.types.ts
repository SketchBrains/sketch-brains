export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          college: string | null
          referral_code: string
          referred_by: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          college?: string | null
          referral_code: string
          referred_by?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          college?: string | null
          referral_code?: string
          referred_by?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          category: 'soft_skills' | 'technical'
          price: number
          start_date: string
          end_date: string
          status: 'upcoming' | 'active' | 'completed'
          max_participants: number | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: 'soft_skills' | 'technical'
          price?: number
          start_date: string
          end_date: string
          status?: 'upcoming' | 'active' | 'completed'
          max_participants?: number | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: 'soft_skills' | 'technical'
          price?: number
          start_date?: string
          end_date?: string
          status?: 'upcoming' | 'active' | 'completed'
          max_participants?: number | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      registrations: {
        Row: {
          id: string
          user_id: string
          event_id: string
          payment_status: 'pending' | 'completed' | 'failed' | 'refunded' | 'free'
          payment_id: string | null
          amount_paid: number
          coupon_code: string | null
          registered_at: string
          payment_completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'free'
          payment_id?: string | null
          amount_paid?: number
          coupon_code?: string | null
          registered_at?: string
          payment_completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'free'
          payment_id?: string | null
          amount_paid?: number
          coupon_code?: string | null
          registered_at?: string
          payment_completed_at?: string | null
        }
      }
      materials: {
        Row: {
          id: string
          event_id: string
          title: string
          description: string | null
          file_url: string
          file_type: 'notes' | 'slides' | 'recording' | 'other'
          uploaded_at: string
        }
        Insert: {
          id?: string
          event_id: string
          title: string
          description?: string | null
          file_url: string
          file_type: 'notes' | 'slides' | 'recording' | 'other'
          uploaded_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          title?: string
          description?: string | null
          file_url?: string
          file_type?: 'notes' | 'slides' | 'recording' | 'other'
          uploaded_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          event_id: string
          user_id: string
          rating: number
          comments: string | null
          submitted_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          rating: number
          comments?: string | null
          submitted_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          rating?: number
          comments?: string | null
          submitted_at?: string
        }
      }
      coupons: {
        Row: {
          id: string
          code: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          valid_from: string
          valid_until: string
          applicable_events: string[] | null
          max_uses: number | null
          current_uses: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          valid_from: string
          valid_until: string
          applicable_events?: string[] | null
          max_uses?: number | null
          current_uses?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          discount_type?: 'percentage' | 'fixed'
          discount_value?: number
          valid_from?: string
          valid_until?: string
          applicable_events?: string[] | null
          max_uses?: number | null
          current_uses?: number
          is_active?: boolean
          created_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referee_id: string
          event_id: string
          registration_id: string
          status: 'pending' | 'completed' | 'rewarded'
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referee_id: string
          event_id: string
          registration_id: string
          status?: 'pending' | 'completed' | 'rewarded'
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referee_id?: string
          event_id?: string
          registration_id?: string
          status?: 'pending' | 'completed' | 'rewarded'
          created_at?: string
        }
      }
      referral_rewards: {
        Row: {
          id: string
          referrer_id: string
          event_id: string
          referral_count: number
          reward_status: 'pending' | 'granted'
          granted_at: string | null
        }
        Insert: {
          id?: string
          referrer_id: string
          event_id: string
          referral_count?: number
          reward_status?: 'pending' | 'granted'
          granted_at?: string | null
        }
        Update: {
          id?: string
          referrer_id?: string
          event_id?: string
          referral_count?: number
          reward_status?: 'pending' | 'granted'
          granted_at?: string | null
        }
      }
      payment_transactions: {
        Row: {
          id: string
          user_id: string
          event_id: string
          registration_id: string | null
          amount: number
          currency: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: 'initiated' | 'success' | 'failed' | 'refunded'
          payment_method: string | null
          error_code: string | null
          error_message: string | null
          created_at: string
          completed_at: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          registration_id?: string | null
          amount?: number
          currency?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: 'initiated' | 'success' | 'failed' | 'refunded'
          payment_method?: string | null
          error_code?: string | null
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          registration_id?: string | null
          amount?: number
          currency?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: 'initiated' | 'success' | 'failed' | 'refunded'
          payment_method?: string | null
          error_code?: string | null
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
          metadata?: Json
        }
      }
      session_attendance: {
        Row: {
          id: string
          registration_id: string
          user_id: string
          event_id: string
          check_in_time: string
          check_out_time: string | null
          duration_minutes: number | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          registration_id: string
          user_id: string
          event_id: string
          check_in_time?: string
          check_out_time?: string | null
          duration_minutes?: number | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          registration_id?: string
          user_id?: string
          event_id?: string
          check_in_time?: string
          check_out_time?: string | null
          duration_minutes?: number | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      certificates: {
        Row: {
          id: string
          user_id: string
          event_id: string
          registration_id: string
          certificate_number: string
          verification_token: string
          issued_at: string
          revoked_at: string | null
          revoke_reason: string | null
          pdf_url: string | null
          blockchain_hash: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          registration_id: string
          certificate_number: string
          verification_token?: string
          issued_at?: string
          revoked_at?: string | null
          revoke_reason?: string | null
          pdf_url?: string | null
          blockchain_hash?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          registration_id?: string
          certificate_number?: string
          verification_token?: string
          issued_at?: string
          revoked_at?: string | null
          revoke_reason?: string | null
          pdf_url?: string | null
          blockchain_hash?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      notifications_queue: {
        Row: {
          id: string
          user_id: string
          type: 'email' | 'sms' | 'in_app'
          channel: 'transactional' | 'marketing' | 'alert'
          subject: string | null
          body: string
          status: 'pending' | 'sent' | 'failed' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          scheduled_for: string
          sent_at: string | null
          retry_count: number
          error_message: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'email' | 'sms' | 'in_app'
          channel?: 'transactional' | 'marketing' | 'alert'
          subject?: string | null
          body: string
          status?: 'pending' | 'sent' | 'failed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          scheduled_for?: string
          sent_at?: string | null
          retry_count?: number
          error_message?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'email' | 'sms' | 'in_app'
          channel?: 'transactional' | 'marketing' | 'alert'
          subject?: string | null
          body?: string
          status?: 'pending' | 'sent' | 'failed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          scheduled_for?: string
          sent_at?: string | null
          retry_count?: number
          error_message?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          email_enabled: boolean
          sms_enabled: boolean
          in_app_enabled: boolean
          marketing_enabled: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_enabled?: boolean
          sms_enabled?: boolean
          in_app_enabled?: boolean
          marketing_enabled?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_enabled?: boolean
          sms_enabled?: boolean
          in_app_enabled?: boolean
          marketing_enabled?: boolean
          updated_at?: string
        }
      }
      in_app_notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          action_url: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: 'info' | 'success' | 'warning' | 'error'
          action_url?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'info' | 'success' | 'warning' | 'error'
          action_url?: string | null
          read_at?: string | null
          created_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          event_name: string
          event_category: 'engagement' | 'conversion' | 'navigation' | 'error'
          event_data: Json
          session_id: string | null
          ip_address: string | null
          user_agent: string | null
          referrer: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_name: string
          event_category?: 'engagement' | 'conversion' | 'navigation' | 'error'
          event_data?: Json
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_name?: string
          event_category?: 'engagement' | 'conversion' | 'navigation' | 'error'
          event_data?: Json
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          created_at?: string
        }
      }
      webhook_logs: {
        Row: {
          id: string
          source: string
          event_type: string
          payload: Json
          status: 'received' | 'processed' | 'failed'
          error_message: string | null
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          source: string
          event_type: string
          payload: Json
          status?: 'received' | 'processed' | 'failed'
          error_message?: string | null
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          source?: string
          event_type?: string
          payload?: Json
          status?: 'received' | 'processed' | 'failed'
          error_message?: string | null
          processed_at?: string | null
          created_at?: string
        }
      }
      admin_audit_logs: {
        Row: {
          id: string
          admin_id: string
          action: string
          resource_type: string
          resource_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          resource_type: string
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          resource_type?: string
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          created_at?: string
        }
      }
      session_recordings: {
        Row: {
          id: string
          event_id: string
          title: string
          description: string | null
          video_url: string
          duration_minutes: number | null
          file_size_mb: number | null
          thumbnail_url: string | null
          processing_status: 'uploading' | 'processing' | 'ready' | 'failed'
          uploaded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          title: string
          description?: string | null
          video_url: string
          duration_minutes?: number | null
          file_size_mb?: number | null
          thumbnail_url?: string | null
          processing_status?: 'uploading' | 'processing' | 'ready' | 'failed'
          uploaded_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          title?: string
          description?: string | null
          video_url?: string
          duration_minutes?: number | null
          file_size_mb?: number | null
          thumbnail_url?: string | null
          processing_status?: 'uploading' | 'processing' | 'ready' | 'failed'
          uploaded_at?: string
          created_at?: string
        }
      }
      event_waitlist: {
        Row: {
          id: string
          user_id: string
          event_id: string
          position: number
          notified_at: string | null
          expires_at: string | null
          status: 'waiting' | 'notified' | 'registered' | 'expired'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          position: number
          notified_at?: string | null
          expires_at?: string | null
          status?: 'waiting' | 'notified' | 'registered' | 'expired'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          position?: number
          notified_at?: string | null
          expires_at?: string | null
          status?: 'waiting' | 'notified' | 'registered' | 'expired'
          created_at?: string
        }
      }
    }
  }
}
