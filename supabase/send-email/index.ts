import { serve } from "https://deno.land/std/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // 🔥 PRE-FLIGHT (OBRIGATÓRIO)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Dados incompletos" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Loja Conect <no-reply@lojaconect.com>",
        to,
        subject,
        html
      })
    });

    if (!res.ok) {
      throw new Error("Erro ao enviar e-mail");
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
