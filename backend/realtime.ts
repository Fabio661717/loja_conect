// backend/realtime.ts
import sendPush from "./sendPush";
import { supabase } from "./supabaseClient";

supabase
  .channel("reservas-channel")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "reservas" },
    async (payload: any) => {
      console.log("📦 Nova reserva:", payload.new);

      // Buscar subscriptions do cliente
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("cliente_id", payload.new.cliente_id);

      if (!subs) return;

      for (const sub of subs) {
        await sendPush(sub.subscription, {
          title: "Reserva criada",
          body: "Seu produto foi reservado com sucesso!",
        });
      }
    }
  )
  .subscribe();
