import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateCertificateRequest {
  registrationId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "POST") {
      const body: GenerateCertificateRequest = await req.json();

      const { data: registration, error: regError } = await supabase
        .from("registrations")
        .select("*, events(*), profiles(*)")
        .eq("id", body.registrationId)
        .maybeSingle();

      if (regError || !registration) {
        return new Response(
          JSON.stringify({ error: "Registration not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (registration.events.status !== "completed") {
        return new Response(
          JSON.stringify({ error: "Event not yet completed" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (registration.payment_status !== "completed" && registration.payment_status !== "free") {
        return new Response(
          JSON.stringify({ error: "Payment not completed" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: existingCertificate } = await supabase
        .from("certificates")
        .select("*")
        .eq("registration_id", body.registrationId)
        .maybeSingle();

      if (existingCertificate) {
        return new Response(
          JSON.stringify({
            success: true,
            certificate: existingCertificate,
            message: "Certificate already exists",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const certificateNumber = `CERT-${Date.now()}-${registration.user_id.substring(0, 8).toUpperCase()}`;

      const certificateData = {
        user_id: registration.user_id,
        event_id: registration.event_id,
        registration_id: body.registrationId,
        certificate_number: certificateNumber,
        metadata: {
          student_name: registration.profiles.full_name,
          event_title: registration.events.title,
          completion_date: registration.events.end_date,
          category: registration.events.category,
        },
      };

      const { data: certificate, error: certError } = await supabase
        .from("certificates")
        .insert(certificateData)
        .select()
        .single();

      if (certError) {
        return new Response(
          JSON.stringify({ error: "Failed to generate certificate", details: certError }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      await supabase.from("in_app_notifications").insert({
        user_id: registration.user_id,
        title: "Certificate Generated",
        message: `Your certificate for ${registration.events.title} is ready!`,
        type: "success",
        action_url: `/profile?tab=certificates`,
      });

      await supabase.from("notifications_queue").insert({
        user_id: registration.user_id,
        type: "email",
        channel: "transactional",
        subject: "Your Course Completion Certificate",
        body: `Congratulations! Your certificate for ${registration.events.title} has been generated.`,
        priority: "high",
        metadata: {
          certificate_id: certificate.id,
          certificate_number: certificateNumber,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          certificate,
        }),
        {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (req.method === "GET") {
      const url = new URL(req.url);
      const verificationToken = url.searchParams.get("token");

      if (verificationToken) {
        const { data: certificate, error } = await supabase
          .from("certificates")
          .select("*, profiles(full_name), events(title, category)")
          .eq("verification_token", verificationToken)
          .maybeSingle();

        if (error || !certificate) {
          return new Response(
            JSON.stringify({ error: "Certificate not found" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const isValid = certificate.revoked_at === null;

        return new Response(
          JSON.stringify({
            success: true,
            valid: isValid,
            certificate: {
              certificate_number: certificate.certificate_number,
              student_name: certificate.profiles.full_name,
              event_title: certificate.events.title,
              issued_at: certificate.issued_at,
              revoked_at: certificate.revoked_at,
              revoke_reason: certificate.revoke_reason,
            },
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: certificates, error } = await supabase
        .from("certificates")
        .select("*, events(title)")
        .eq("user_id", user.id)
        .order("issued_at", { ascending: false });

      if (error) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch certificates" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, certificates }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Certificate generation error:", error);

    return new Response(
      JSON.stringify({ error: "Certificate generation failed", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
