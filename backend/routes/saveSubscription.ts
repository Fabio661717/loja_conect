// backend/routes/saveSubscription.ts
import { Router } from "express";
import { supabase } from "../supabaseClient";

const router = Router();

// ✅ ROTA ORIGINAL CORRIGIDA
router.post("/save-subscription", async (req, res) => {
  try {
    const { subscription, cliente_id } = req.body;

    // ✅ VALIDAÇÃO DOS DADOS
    if (!subscription || !cliente_id) {
      return res.status(400).json({
        success: false,
        error: "Dados incompletos. 'subscription' e 'cliente_id' são obrigatórios."
      });
    }

    // ✅ EXTRAIR DADOS DA SUBSCRIPTION
    const endpoint = subscription.endpoint || '';
    const keys = subscription.keys || {};
    const p256dh = keys.p256dh || '';
    const auth = keys.auth || '';

    // ✅ DETERMINAR PLATAFORMA
    const platform = determinePlatform(subscription);

    // ✅ CATEGORIA PADRÃO
    const category = 'general';

    const { error } = await supabase
      .from("subscriptions")
      .insert({
        cliente_id,
        subscription: subscription,
        user_id: cliente_id, // Usando cliente_id como user_id para compatibilidade
        endpoint: endpoint,
        p256dh: p256dh,
        auth: auth,
        platform: platform,
        category: category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    console.log("✅ Subscription salva para cliente:", cliente_id);
    res.json({
      success: true,
      message: "Subscription salva com sucesso",
      data: {
        cliente_id,
        endpoint,
        platform,
        category
      }
    });
  } catch (err: any) {
    console.error("❌ Erro ao salvar subscription:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Erro interno ao salvar subscription"
    });
  }
});

// ✅ NOVA ROTA: save (alternativa)
router.post("/save", async (req, res) => {
  try {
    const {
      user_id,
      endpoint,
      p256dh,
      auth,
      platform = 'web',
      category = 'general'
    } = req.body;

    // ✅ VALIDAÇÃO DOS DADOS
    if (!user_id || !endpoint) {
      return res.status(400).json({
        success: false,
        error: "Dados incompletos. 'user_id' e 'endpoint' são obrigatórios."
      });
    }

    // ✅ CRIAR OBJETO DE SUBSCRIPTION COMPLETO
    const subscription = {
      user_id,
      endpoint,
      p256dh: p256dh || '',
      auth: auth || '',
      platform,
      category,
      subscription: {
        endpoint: endpoint,
        keys: {
          p256dh: p256dh || '',
          auth: auth || ''
        }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // ✅ SALVAR NO BANCO
    const { error } = await supabase
      .from("subscriptions")
      .insert(subscription);

    if (error) throw error;

    console.log("✅ Subscription salva via rota /save para user:", user_id);
    return res.json({
      success: true,
      message: "Subscription salva com sucesso",
      data: {
        user_id,
        endpoint,
        platform,
        category
      }
    });
  } catch (error: any) {
    console.error("❌ Erro ao salvar subscription via /save:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Erro interno ao salvar subscription"
    });
  }
});

// ✅ ROTA PARA ATUALIZAR SUBSCRIPTION
router.put("/update-subscription", async (req, res) => {
  try {
    const { user_id, endpoint, updates } = req.body;

    if (!user_id || !endpoint) {
      return res.status(400).json({
        success: false,
        error: "user_id e endpoint são obrigatórios para atualização"
      });
    }

    const { error } = await supabase
      .from("subscriptions")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)
      .eq('endpoint', endpoint);

    if (error) throw error;

    console.log("✅ Subscription atualizada para user:", user_id);
    return res.json({
      success: true,
      message: "Subscription atualizada com sucesso"
    });
  } catch (error: any) {
    console.error("❌ Erro ao atualizar subscription:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Erro interno ao atualizar subscription"
    });
  }
});

// ✅ ROTA PARA REMOVER SUBSCRIPTION
router.delete("/remove-subscription", async (req, res) => {
  try {
    const { user_id, endpoint } = req.body;

    if (!user_id || !endpoint) {
      return res.status(400).json({
        success: false,
        error: "user_id e endpoint são obrigatórios para remoção"
      });
    }

    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq('user_id', user_id)
      .eq('endpoint', endpoint);

    if (error) throw error;

    console.log("✅ Subscription removida para user:", user_id);
    return res.json({
      success: true,
      message: "Subscription removida com sucesso"
    });
  } catch (error: any) {
    console.error("❌ Erro ao remover subscription:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Erro interno ao remover subscription"
    });
  }
});

// ✅ ROTA PARA VERIFICAR SE SUBSCRIPTION EXISTE
router.post("/check-subscription", async (req, res) => {
  try {
    const { user_id, endpoint } = req.body;

    if (!user_id || !endpoint) {
      return res.status(400).json({
        success: false,
        error: "user_id e endpoint são obrigatórios para verificação"
      });
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq('user_id', user_id)
      .eq('endpoint', endpoint)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = nenhum resultado
      throw error;
    }

    return res.json({
      success: true,
      exists: !!data,
      subscription: data || null
    });
  } catch (error: any) {
    console.error("❌ Erro ao verificar subscription:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Erro interno ao verificar subscription"
    });
  }
});

// ✅ FUNÇÃO AUXILIAR: Determinar plataforma baseada na subscription
function determinePlatform(subscription: any): string {
  const endpoint = subscription.endpoint || '';

  if (endpoint.includes('fcm.googleapis.com')) {
    return 'android';
  } else if (endpoint.includes('push.apple.com')) {
    return 'ios';
  } else if (endpoint.includes('safari.push.apple.com')) {
    return 'safari';
  } else if (endpoint.includes('wns.windows.com')) {
    return 'windows';
  }

  return 'web';
}

export default router;
