import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CheckInRequest {
  registrationId: string;
  eventId: string;
}

interface CheckOutRequest {
  attendanceId: string;
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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (req.method === "POST" && action === "checkin") {
      const body: CheckInRequest = await req.json();

      const { data: registration, error: regError } = await supabase
        .from("registrations")
        .select("*")
        .eq("id", body.registrationId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (regError || !registration) {
        return new Response(
          JSON.stringify({ error: "Registration not found or unauthorized" }),
          {
            status: 404,
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

      const ipAddress = req.headers.get("x-forwarded-for") || "unknown";
      const userAgent = req.headers.get("user-agent") || "unknown";

      const { data: attendance, error: attendanceError } = await supabase
        .from("session_attendance")
        .insert({
          registration_id: body.registrationId,
          user_id: user.id,
          event_id: body.eventId,
          check_in_time: new Date().toISOString(),
          ip_address: ipAddress,
          user_agent: userAgent,
        })
        .select()
        .single();

      if (attendanceError) {
        return new Response(
          JSON.stringify({ error: "Failed to record attendance", details: attendanceError }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      await supabase.from("analytics_events").insert({
        user_id: user.id,
        event_name: "session_checkin",
        event_category: "engagement",
        event_data: {
          event_id: body.eventId,
          attendance_id: attendance.id,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          attendanceId: attendance.id,
          checkInTime: attendance.check_in_time,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (req.method === "POST" && action === "checkout") {
      const body: CheckOutRequest = await req.json();

      const { data: attendance, error: fetchError } = await supabase
        .from("session_attendance")
        .select("*")
        .eq("id", body.attendanceId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError || !attendance) {
        return new Response(
          JSON.stringify({ error: "Attendance record not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const checkInTime = new Date(attendance.check_in_time);
      const checkOutTime = new Date();
      const durationMinutes = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60));

      const { error: updateError } = await supabase
        .from("session_attendance")
        .update({
          check_out_time: checkOutTime.toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq("id", body.attendanceId);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to update attendance", details: updateError }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      await supabase.from("analytics_events").insert({
        user_id: user.id,
        event_name: "session_checkout",
        event_category: "engagement",
        event_data: {
          event_id: attendance.event_id,
          attendance_id: body.attendanceId,
          duration_minutes: durationMinutes,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          checkOutTime: checkOutTime.toISOString(),
          durationMinutes,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (req.method === "GET" && action === "history") {
      const { data: attendanceHistory, error } = await supabase
        .from("session_attendance")
        .select("*, events(title)")
        .eq("user_id", user.id)
        .order("check_in_time", { ascending: false });

      if (error) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch attendance history" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, attendance: attendanceHistory }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Session management error:", error);

    return new Response(
      JSON.stringify({ error: "Session management failed", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
