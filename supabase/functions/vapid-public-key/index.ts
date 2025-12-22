import { serve } from "https://deno.land/std/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const publicKey = Deno.env.get("VITE_VAPID_PUBLIC_KEY");

  if (!publicKey) {
    return new Response(
      JSON.stringify({ error: "VAPID public key not set" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ publicKey }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
