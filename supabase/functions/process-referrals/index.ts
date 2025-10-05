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

    const { data: pendingReferrals, error: referralError } = await supabase
      .from("referrals")
      .select("*, registrations(*), events(*)")
      .eq("status", "pending");

    if (referralError) throw referralError;

    const processedReferrals = [];

    for (const referral of pendingReferrals || []) {
      const registration = referral.registrations;

      if (registration && registration.payment_status === "completed") {
        await supabase
          .from("referrals")
          .update({ status: "completed" })
          .eq("id", referral.id);

        await supabase.from("in_app_notifications").insert({
          user_id: referral.referrer_id,
          title: "Referral Completed",
          message: `Your referral has completed their registration! Keep sharing your code.`,
          type: "success",
        });

        processedReferrals.push(referral.id);
      }
    }

    const { data: referrers, error: referrerError } = await supabase
      .from("referrals")
      .select("referrer_id, event_id")
      .eq("status", "completed");

    if (referrerError) throw referrerError;

    const referrerMap = new Map<string, Map<string, number>>();

    for (const ref of referrers || []) {
      if (!referrerMap.has(ref.referrer_id)) {
        referrerMap.set(ref.referrer_id, new Map());
      }
      const eventMap = referrerMap.get(ref.referrer_id)!;
      const count = eventMap.get(ref.event_id) || 0;
      eventMap.set(ref.event_id, count + 1);
    }

    const rewardsGranted = [];

    for (const [referrerId, eventMap] of referrerMap.entries()) {
      for (const [eventId, count] of eventMap.entries()) {
        if (count >= 2) {
          const { data: event } = await supabase
            .from("events")
            .select("category")
            .eq("id", eventId)
            .maybeSingle();

          if (event?.category === "technical") {
            const { data: existingReward } = await supabase
              .from("referral_rewards")
              .select("*")
              .eq("referrer_id", referrerId)
              .eq("event_id", eventId)
              .eq("reward_status", "granted")
              .maybeSingle();

            if (!existingReward) {
              const { data: existingRegistration } = await supabase
                .from("registrations")
                .select("*")
                .eq("user_id", referrerId)
                .eq("event_id", eventId)
                .maybeSingle();

              if (existingRegistration && existingRegistration.payment_status === "pending") {
                await supabase
                  .from("registrations")
                  .update({
                    payment_status: "free",
                    amount_paid: 0,
                  })
                  .eq("id", existingRegistration.id);
              } else if (!existingRegistration) {
                await supabase.from("registrations").insert({
                  user_id: referrerId,
                  event_id: eventId,
                  payment_status: "free",
                  amount_paid: 0,
                });
              }

              await supabase.from("referral_rewards").insert({
                referrer_id: referrerId,
                event_id: eventId,
                referral_count: count,
                reward_status: "granted",
                granted_at: new Date().toISOString(),
              });

              await supabase
                .from("referrals")
                .update({ status: "rewarded" })
                .eq("referrer_id", referrerId)
                .eq("event_id", eventId)
                .eq("status", "completed");

              await supabase.from("in_app_notifications").insert({
                user_id: referrerId,
                title: "Free Course Unlocked!",
                message: `Congratulations! You've earned free access to this event by referring 2 friends.`,
                type: "success",
                action_url: `/events/${eventId}`,
              });

              await supabase.from("notifications_queue").insert({
                user_id: referrerId,
                type: "email",
                channel: "transactional",
                subject: "You've Earned a Free Course!",
                body: `Amazing! You've successfully referred 2 friends and earned free access to a technical course.`,
                priority: "high",
                metadata: { event_id: eventId },
              });

              rewardsGranted.push({ referrerId, eventId, count });
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processedReferrals: processedReferrals.length,
        rewardsGranted: rewardsGranted.length,
        details: {
          referrals: processedReferrals,
          rewards: rewardsGranted,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Referral processing error:", error);

    return new Response(
      JSON.stringify({ error: "Referral processing failed", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
