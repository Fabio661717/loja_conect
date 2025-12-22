// backend/sendPush.ts (versão final com Supabase)
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import express from "express";
import webpush from "web-push";

dotenv.config();

const app = express();
app.use(express.json());

// ============================================================
// 🔐 CONFIGURAÇÃO SUPABASE
// ============================================================
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // precisa da SERVICE ROLE
);

// ============================================================
// 🔐 CONFIGURAÇÃO VAPID
// ============================================================
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  throw new Error("❌ Chaves VAPID não configuradas no .env");
}

webpush.setVapidDetails(
  "Fabio:fabio661717@gmail.com",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  [key: string]: any;
}

// ============================================================
// 🚀 Função principal de envio
// ============================================================
export default async function sendPush(
  subscription: webpush.PushSubscription,
  payload: PushPayload
): Promise<{ success: boolean; error?: any }> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log("✅ Notificação enviada");
    return { success: true };
  } catch (err) {
    console.error("❌ Erro ao enviar push:", err);
    return { success: false, error: err };
  }
}

// ============================================================
// 📌 BUSCAR SUBSCRIPTION DO USUÁRIO (versão Supabase)
// ============================================================
async function getUserSubscriptionFromDatabase(
  userId: string
): Promise<webpush.PushSubscription | null> {
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("subscription")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("❌ Erro ao buscar subscription:", error);
    return null;
  }

  return data?.subscription ?? null;
}

// ============================================================
// 📌 SALVAR SUBSCRIPTION DO USUÁRIO (para o frontend usar)
// ============================================================
export async function saveUserSubscriptionToDatabase(
  userId: string,
  subscription: any
): Promise<boolean> {
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: userId,
        subscription,
        updated_at: new Date(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("❌ Erro ao salvar subscription:", error);
    return false;
  }

  return true;
}

// ============================================================
// 📌 ROTA ORIGINAL (mantida)
// ============================================================
app.post("/send-push", async (req, res) => {
  try {
    const { subscription, title, body, icon, url } = req.body;

    if (!subscription || !title || !body) {
      return res.status(400).json({
        success: false,
        error: "Subscription, title e body são obrigatórios",
      });
    }

    const result = await sendPush(subscription, { title, body, icon, url });

    return res.json(result);
  } catch (error) {
    console.error("❌ Erro no endpoint:", error);
    return res.status(500).json({ success: false, error: "Erro interno" });
  }
});

// ============================================================
// 🎯 NOVA ROTA QUE O FRONTEND USA
// ============================================================
app.post("/notifications/send", async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res
        .status(400)
        .json({ success: false, error: "Dados inválidos" });
    }

    const subscription = await getUserSubscriptionFromDatabase(userId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: "Usuário não possui subscription registrada",
      });
    }

    const result = await sendPush(subscription, { title, body, data });

    return res.json(result);
  } catch (err) {
    console.error("❌ Erro no /notifications/send:", err);
    return res.status(500).json({ success: false, error: "Erro interno" });
  }
});

// ============================================================
// 🚀 Iniciar servidor
// ============================================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de notificações rodando na porta ${PORT}`);
});

export { app };

