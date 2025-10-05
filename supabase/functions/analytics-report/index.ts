import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL(req.url);
    const reportType = url.searchParams.get("type") || "overview";
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    const supabaseService = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (reportType === "overview") {
      const [
        { count: totalUsers },
        { count: totalEvents },
        { count: totalRegistrations },
        { count: completedPayments },
        { data: revenueData },
      ] = await Promise.all([
        supabaseService.from("profiles").select("*", { count: "exact", head: true }),
        supabaseService.from("events").select("*", { count: "exact", head: true }),
        supabaseService.from("registrations").select("*", { count: "exact", head: true }),
        supabaseService
          .from("registrations")
          .select("*", { count: "exact", head: true })
          .eq("payment_status", "completed"),
        supabaseService
          .from("payment_transactions")
          .select("amount")
          .eq("status", "success"),
      ]);

      const totalRevenue = revenueData?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

      return new Response(
        JSON.stringify({
          success: true,
          overview: {
            totalUsers: totalUsers || 0,
            totalEvents: totalEvents || 0,
            totalRegistrations: totalRegistrations || 0,
            completedPayments: completedPayments || 0,
            totalRevenue: totalRevenue,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (reportType === "revenue") {
      let query = supabaseService
        .from("payment_transactions")
        .select("amount, currency, created_at, events(title, category)")
        .eq("status", "success")
        .order("created_at", { ascending: false });

      if (startDate) {
        query = query.gte("created_at", startDate);
      }
      if (endDate) {
        query = query.lte("created_at", endDate);
      }

      const { data: transactions, error } = await query;

      if (error) throw error;

      const totalRevenue = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

      const revenueByDate = transactions?.reduce((acc: any, tx) => {
        const date = tx.created_at.split("T")[0];
        if (!acc[date]) {
          acc[date] = { date, amount: 0, count: 0 };
        }
        acc[date].amount += Number(tx.amount);
        acc[date].count++;
        return acc;
      }, {});

      return new Response(
        JSON.stringify({
          success: true,
          totalRevenue,
          transactionCount: transactions?.length || 0,
          revenueByDate: Object.values(revenueByDate || {}),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (reportType === "events") {
      const { data: events, error } = await supabaseService
        .from("events")
        .select("id, title, category, price, status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const eventStats = await Promise.all(
        (events || []).map(async (event) => {
          const [{ count: registrations }, { data: revenue }, { data: feedback }] = await Promise.all([
            supabaseService
              .from("registrations")
              .select("*", { count: "exact", head: true })
              .eq("event_id", event.id),
            supabaseService
              .from("payment_transactions")
              .select("amount")
              .eq("event_id", event.id)
              .eq("status", "success"),
            supabaseService.from("feedback").select("rating").eq("event_id", event.id),
          ]);

          const totalRevenue = revenue?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
          const avgRating =
            feedback && feedback.length > 0
              ? feedback.reduce((sum, fb) => sum + fb.rating, 0) / feedback.length
              : 0;

          return {
            ...event,
            registrations: registrations || 0,
            totalRevenue,
            averageRating: avgRating,
            feedbackCount: feedback?.length || 0,
          };
        })
      );

      return new Response(
        JSON.stringify({
          success: true,
          events: eventStats,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (reportType === "referrals") {
      const { data: referrals, error } = await supabaseService
        .from("referrals")
        .select("*, profiles!referrals_referrer_id_fkey(full_name, email)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const referrerStats = referrals?.reduce((acc: any, ref) => {
        const referrerId = ref.referrer_id;
        if (!acc[referrerId]) {
          acc[referrerId] = {
            referrerId,
            referrerName: ref.profiles?.full_name || "Unknown",
            referrerEmail: ref.profiles?.email || "Unknown",
            total: 0,
            completed: 0,
            rewarded: 0,
          };
        }
        acc[referrerId].total++;
        if (ref.status === "completed") acc[referrerId].completed++;
        if (ref.status === "rewarded") acc[referrerId].rewarded++;
        return acc;
      }, {});

      return new Response(
        JSON.stringify({
          success: true,
          totalReferrals: referrals?.length || 0,
          topReferrers: Object.values(referrerStats || {})
            .sort((a: any, b: any) => b.total - a.total)
            .slice(0, 10),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid report type" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Analytics report error:", error);

    return new Response(
      JSON.stringify({ error: "Analytics report failed", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
