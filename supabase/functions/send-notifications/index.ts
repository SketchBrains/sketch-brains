import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    const now = new Date().toISOString();

    const { data: pendingNotifications, error: fetchError } = await supabase
      .from("notifications_queue")
      .select("*, notification_preferences!inner(email_enabled, sms_enabled)")
      .eq("status", "pending")
      .lte("scheduled_for", now)
      .lt("retry_count", 3)
      .order("priority", { ascending: false })
      .order("scheduled_for", { ascending: true })
      .limit(100);

    if (fetchError) throw fetchError;

    const processedNotifications = {
      email: 0,
      sms: 0,
      inApp: 0,
      failed: 0,
    };

    for (const notification of pendingNotifications || []) {
      try {
        const prefs = notification.notification_preferences;

        if (notification.type === "email" && prefs?.email_enabled !== false) {
          const success = await sendEmail(notification);

          if (success) {
            await supabase
              .from("notifications_queue")
              .update({
                status: "sent",
                sent_at: new Date().toISOString(),
              })
              .eq("id", notification.id);
            processedNotifications.email++;
          } else {
            throw new Error("Email sending failed");
          }
        } else if (notification.type === "sms" && prefs?.sms_enabled === true) {
          const success = await sendSMS(notification);

          if (success) {
            await supabase
              .from("notifications_queue")
              .update({
                status: "sent",
                sent_at: new Date().toISOString(),
              })
              .eq("id", notification.id);
            processedNotifications.sms++;
          } else {
            throw new Error("SMS sending failed");
          }
        } else if (notification.type === "in_app") {
          await supabase.from("in_app_notifications").insert({
            user_id: notification.user_id,
            title: notification.subject || "Notification",
            message: notification.body,
            type: "info",
          });

          await supabase
            .from("notifications_queue")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", notification.id);
          processedNotifications.inApp++;
        } else {
          await supabase
            .from("notifications_queue")
            .update({
              status: "cancelled",
              error_message: "User preferences disabled for this notification type",
            })
            .eq("id", notification.id);
        }
      } catch (error) {
        console.error(`Failed to send notification ${notification.id}:`, error);

        await supabase
          .from("notifications_queue")
          .update({
            status: notification.retry_count >= 2 ? "failed" : "pending",
            retry_count: notification.retry_count + 1,
            error_message: error.message,
            scheduled_for: new Date(Date.now() + 3600000).toISOString(),
          })
          .eq("id", notification.id);

        processedNotifications.failed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedNotifications,
        total: pendingNotifications?.length || 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Notification processing error:", error);

    return new Response(
      JSON.stringify({ error: "Notification processing failed", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function sendEmail(notification: any): Promise<boolean> {
  console.log(`Sending email to user ${notification.user_id}`);
  console.log(`Subject: ${notification.subject}`);
  console.log(`Body: ${notification.body}`);

  return true;
}

async function sendSMS(notification: any): Promise<boolean> {
  console.log(`Sending SMS to user ${notification.user_id}`);
  console.log(`Message: ${notification.body}`);

  return true;
}
