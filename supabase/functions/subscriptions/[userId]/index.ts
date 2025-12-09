import { serve } from "https://deno.land/std/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const userId = url.pathname.split("/").pop();

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const res = await fetch(
    `${supabaseUrl}/rest/v1/push_subscriptions?user_id=eq.${userId}&is_active=eq.true`,
    {
      headers: {
        "apikey": serviceRoleKey!,
        "Authorization": `Bearer ${serviceRoleKey!}`,
      },
    }
  );

  const data = await res.json();

  return new Response(
    JSON.stringify({
      userId,
      active: data.length > 0,
      devices: data.length
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
