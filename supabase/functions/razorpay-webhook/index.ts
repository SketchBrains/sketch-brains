import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Razorpay-Signature",
};

interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        method: string;
        error_code?: string;
        error_description?: string;
      };
    };
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const signature = req.headers.get("X-Razorpay-Signature");
    const webhookPayload: RazorpayWebhookPayload = await req.json();

    const { data: webhookLog, error: logError } = await supabase
      .from("webhook_logs")
      .insert({
        source: "razorpay",
        event_type: webhookPayload.event,
        payload: webhookPayload,
        status: "received",
      })
      .select()
      .single();

    if (logError) {
      console.error("Error logging webhook:", logError);
    }

    if (webhookPayload.event === "payment.authorized" || webhookPayload.event === "payment.captured") {
      const payment = webhookPayload.payload.payment.entity;

      const { data: transaction, error: txError } = await supabase
        .from("payment_transactions")
        .select("*, registrations(*)")
        .eq("razorpay_order_id", payment.order_id)
        .maybeSingle();

      if (txError || !transaction) {
        console.error("Transaction not found:", payment.order_id);

        await supabase
          .from("webhook_logs")
          .update({
            status: "failed",
            error_message: "Transaction not found",
            processed_at: new Date().toISOString(),
          })
          .eq("id", webhookLog?.id);

        return new Response(
          JSON.stringify({ error: "Transaction not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const updateData: any = {
        razorpay_payment_id: payment.id,
        status: payment.status === "captured" ? "success" : "initiated",
        payment_method: payment.method,
        completed_at: new Date().toISOString(),
      };

      await supabase
        .from("payment_transactions")
        .update(updateData)
        .eq("id", transaction.id);

      if (payment.status === "captured" && transaction.registration_id) {
        await supabase
          .from("registrations")
          .update({
            payment_status: "completed",
            payment_id: payment.id,
            payment_completed_at: new Date().toISOString(),
          })
          .eq("id", transaction.registration_id);

        const registration = transaction.registrations;
        if (registration) {
          await supabase.from("in_app_notifications").insert({
            user_id: transaction.user_id,
            title: "Payment Successful",
            message: `Your payment for the event has been confirmed. You're all set!`,
            type: "success",
            action_url: `/events/${transaction.event_id}`,
          });

          await supabase.from("notifications_queue").insert({
            user_id: transaction.user_id,
            type: "email",
            channel: "transactional",
            subject: "Payment Confirmation - Registration Complete",
            body: `Your payment of ₹${payment.amount / 100} has been successfully processed.`,
            priority: "high",
            metadata: {
              payment_id: payment.id,
              amount: payment.amount / 100,
              event_id: transaction.event_id,
            },
          });
        }
      }

      await supabase
        .from("webhook_logs")
        .update({
          status: "processed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", webhookLog?.id);

      return new Response(
        JSON.stringify({ success: true, message: "Webhook processed" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (webhookPayload.event === "payment.failed") {
      const payment = webhookPayload.payload.payment.entity;

      const { data: transaction } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("razorpay_order_id", payment.order_id)
        .maybeSingle();

      if (transaction) {
        await supabase
          .from("payment_transactions")
          .update({
            razorpay_payment_id: payment.id,
            status: "failed",
            error_code: payment.error_code,
            error_message: payment.error_description,
          })
          .eq("id", transaction.id);

        if (transaction.registration_id) {
          await supabase
            .from("registrations")
            .update({
              payment_status: "failed",
            })
            .eq("id", transaction.registration_id);
        }

        await supabase.from("in_app_notifications").insert({
          user_id: transaction.user_id,
          title: "Payment Failed",
          message: `Your payment failed. Please try again or contact support.`,
          type: "error",
          action_url: `/events/${transaction.event_id}`,
        });
      }

      await supabase
        .from("webhook_logs")
        .update({
          status: "processed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", webhookLog?.id);

      return new Response(
        JSON.stringify({ success: true, message: "Payment failure processed" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook received but not processed" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook processing error:", error);

    return new Response(
      JSON.stringify({ error: "Webhook processing failed", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
