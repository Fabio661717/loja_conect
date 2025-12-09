// supabase/functions/sendPushNotification/index.ts - HEADERS CORS ATUALIZADOS
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.1';

interface NotificationPayload {
    categoryId: string;
    productId: string;
    productName: string;
    productDescription?: string;
    productImage?: string;
    merchantName: string;
    price: number;
}

interface PushSubscription {
    id: string;
    user_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    platform?: string;
    category?: string;
}

serve(async (req: Request) => {
    // Obter origem dinâmica para CORS
    const origin = req.headers.get("origin") ?? "*";

    // ✅ HEADERS CORS ATUALIZADOS COM NOVAS CONFIGURAÇÕES
    const corsHeaders = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-requested-with, accept",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin",
        "Content-Type": "application/json",
    };

    // ✅ PREFLIGHT MANTIDO COM HEADERS ATUALIZADOS
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            status: 200,
            headers: corsHeaders,
        });
    }

    try {
        // Validar método
        if (req.method !== 'POST') {
            return new Response(
                JSON.stringify({ error: 'Método não permitido' }),
                {
                    status: 405,
                    headers: corsHeaders
                }
            );
        }

        // Validar payload
        const payload: NotificationPayload = await req.json().catch(() => {
            throw new Error('Payload JSON inválido');
        });

        if (!payload.categoryId || !payload.productId || !payload.productName || !payload.merchantName) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Payload incompleto. São necessários: categoryId, productId, productName, merchantName'
                }),
                {
                    status: 400,
                    headers: corsHeaders
                }
            );
        }

        console.log("📩 Recebido da loja:", {
            categoryId: payload.categoryId,
            productId: payload.productId,
            productName: payload.productName,
            merchantName: payload.merchantName
        });

        // Configurar cliente Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Variáveis de ambiente do Supabase não configuradas');
        }

        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        // Configurar VAPID
        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

        if (!vapidPublicKey || !vapidPrivateKey) {
            throw new Error('Chaves VAPID não configuradas');
        }

        webpush.setVapidDetails(
            'mailto:notificacoes@seuapp.com',
            vapidPublicKey,
            vapidPrivateKey
        );

        console.log(`🔔 Processando notificação para categoria: ${payload.categoryId}`);

        // 1. Buscar subscriptions ativas para esta categoria
        const { data: subscriptions, error: subsError } = await supabaseClient
            .from('push_subscriptions')
            .select('*')
            .eq('category', payload.categoryId)
            .eq('is_active', true);

        if (subsError) {
            console.error('❌ Erro ao buscar subscriptions:', subsError);
            throw subsError;
        }

        console.log(`📱 Subscriptions encontradas: ${subscriptions?.length || 0}`);

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Nenhum usuário inscrito para esta categoria',
                    categoryId: payload.categoryId
                }),
                {
                    status: 200,
                    headers: corsHeaders
                }
            );
        }

        // 2. Preparar notificação
        const notificationTitle = `🎉 Novo produto em ${payload.merchantName}`;
        const notificationBody = `${payload.productName} - R$ ${payload.price.toFixed(2)}${payload.productDescription ? `\n${payload.productDescription}` : ''}`;

        // 3. Enviar notificações
        const sendPromises = subscriptions.map(async (subscription: PushSubscription) => {
            try {
                const pushSubscription = {
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: subscription.p256dh,
                        auth: subscription.auth
                    }
                };

                const notificationPayload = {
                    title: notificationTitle,
                    body: notificationBody,
                    icon: payload.productImage || '/icon-192x192.png',
                    image: payload.productImage,
                    url: `/produto/${payload.productId}`,
                    tag: `product-${payload.productId}`,
                    timestamp: Date.now(),
                    data: {
                        productId: payload.productId,
                        categoryId: payload.categoryId,
                        merchantName: payload.merchantName,
                        price: payload.price
                    }
                };

                console.log(`📤 Enviando para usuário: ${subscription.user_id.substring(0, 8)}...`);

                await webpush.sendNotification(
                    pushSubscription,
                    JSON.stringify(notificationPayload)
                );

                // Log do envio bem-sucedido
                const { error: logError } = await supabaseClient
                    .from('sent_notifications')
                    .insert({
                        user_id: subscription.user_id,
                        subscription_id: subscription.id,
                        product_id: payload.productId,
                        category_id: payload.categoryId,
                        title: notificationTitle,
                        body: notificationBody,
                        icon: payload.productImage || '/icon-192x192.png',
                        image: payload.productImage,
                        url: `/produto/${payload.productId}`,
                        platform: subscription.platform || 'web',
                        status: 'sent',
                        created_at: new Date().toISOString()
                    });

                if (logError) {
                    console.error('⚠️ Erro ao logar notificação:', logError);
                }

                return {
                    success: true,
                    userId: subscription.user_id,
                    subscriptionId: subscription.id
                };
            } catch (error: any) {
                console.error(`❌ Erro ao enviar para ${subscription.user_id}:`, error.message);

                // Log do erro
                const { error: logError } = await supabaseClient
                    .from('sent_notifications')
                    .insert({
                        user_id: subscription.user_id,
                        subscription_id: subscription.id,
                        product_id: payload.productId,
                        category_id: payload.categoryId,
                        title: 'Erro no envio',
                        body: error.message,
                        status: 'failed',
                        error_message: error.message,
                        created_at: new Date().toISOString()
                    });

                if (logError) {
                    console.error('⚠️ Erro ao logar falha:', logError);
                }

                return {
                    success: false,
                    userId: subscription.user_id,
                    error: error.message
                };
            }
        });

        // 4. Executar envios em paralelo
        const results = await Promise.allSettled(sendPromises);

        const successful = results.filter(r =>
            r.status === 'fulfilled' && r.value.success
        ).length;

        const failed = results.length - successful;

        console.log(`📊 Resultado: ${successful} sucesso, ${failed} falhas`);

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Notificações processadas',
                categoryId: payload.categoryId,
                productId: payload.productId,
                total: results.length,
                successful,
                failed,
                details: results.map(r =>
                    r.status === 'fulfilled' ? r.value : { error: 'Promise rejeitada' }
                )
            }),
            {
                status: 200,
                headers: corsHeaders
            }
        );

    } catch (error: any) {
        console.error('❌ Erro na função:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Erro interno',
                stack: Deno.env.get('DENO_ENV') === 'development' ? error.stack : undefined
            }),
            {
                status: 500,
                headers: corsHeaders
            }
        );
    }
});
