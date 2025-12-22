import { serve } from "https://deno.land/std/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { userId, subscription, platform } = await req.json();

  if (!userId || !subscription?.endpoint) {
    return new Response(
      JSON.stringify({ error: "Missing userId or subscription" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const res = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions`, {
    method: "POST",
    headers: {
      "apikey": serviceRoleKey!,
      "Authorization": `Bearer ${serviceRoleKey!}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      platform,
      is_active: true,
      updated_at: new Date().toISOString()
    })
  });

  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
