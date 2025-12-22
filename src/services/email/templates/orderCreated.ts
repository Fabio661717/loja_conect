// src/services/email/templates/orderCreated.ts
export function orderCreatedEmail(clienteNome: string, pedidoId: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pedido Confirmado</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-id { font-size: 24px; font-weight: bold; color: #4CAF50; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Pedido Confirmado!</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${clienteNome}</strong>,</p>
          <p>Seu pedido foi confirmado e já está sendo processado!</p>
          <p style="text-align: center;">
            <span class="order-id">#${pedidoId.slice(-8)}</span>
          </p>
          <p>Você pode acompanhar o status do seu pedido através do nosso site.</p>
          <p>Obrigado por escolher nossa loja! 🛍️</p>
        </div>
        <div class="footer">
          <p>Loja Conect - Todos os direitos reservados</p>
          <p>Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
