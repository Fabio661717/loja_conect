import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  try {
    const {
      title,
      message,
      url,
      category_id,
      store_id,
      product_id
    } = await req.json();

    if (!category_id || !store_id) {
      return new Response("Categoria ou loja ausente", { status: 400 });
    }

    // 🔍 Buscar usuários inscritos nessa categoria
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("category", category_id)
      .eq("is_active", true);

    if (error) throw error;

    for (const sub of subscriptions) {
      // 🔔 Enviar push
      await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/sendPushNotification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
          },
          body: JSON.stringify({
            subscription: {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
              }
            },
            payload: {
              title,
              body: message,
              data: { url }
            }
          })
        }
      );

      // 💾 Salvar no banco
      await supabase.from("notifications").insert({
        user_id: sub.user_id,
        title,
        message,
        category_id,
        loja_id: store_id,
        product_id,
        url,
        source: "push"
      });
    }

    return new Response(
      JSON.stringify({ success: true, sent: subscriptions.length }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ Push error:", err);
    return new Response("Erro ao enviar push", { status: 500 });
  }
});
