// ✅ IMPORTAR A INTERFACE PRODUCT DO ARQUIVO CORRETO
import { Product } from '../types/ProductData';

// Interfaces
export interface ReservationDetails {
  clientName: string;
  product: Product; // ✅ Já inclui nome, estoque, etc.
  size: string;
  quantity: number;
  pickupTime: string;
  reservationId: string;
  storeName?: string;
  additionalNotes?: string;
  employeeName?: string;
  // ❌ REMOVIDO: nome e estoque duplicados (já estão no Product)
}

// Funções de utilidade
export const isValidWhatsAppNumber = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, "");
  return cleanPhone.length >= 10 && cleanPhone.length <= 13;
};

export const formatPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length === 11) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
  }
  if (cleanPhone.length === 10) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
  }
  return phone;
};

// ✅ FUNÇÃO PRINCIPAL: UMA MENSAGEM COMPLETA COM FOTO
export const generatePremiumReservationMessage = (
  details: ReservationDetails
): string => {
  const productPrice = details.product.preco || 0;
  const productDescription = details.product.descricao || '';
  const productCategory = details.product.categoria || '';

  // ✅ OBTER IMAGEM DE TODAS AS FONTES POSSÍVEIS
  const productImage = details.product.foto_url || details.product.image_url || details.product.image || details.product.imagem || '';

  const totalValue = productPrice * details.quantity;

  const unitPriceFormatted = productPrice.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const totalValueFormatted = totalValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  // ✅ MENSAGEM COM DESTAQUE PARA A FOTO
  let message = `🛍️ *RESERVA CONFIRMADA - ${details.storeName || 'Loja Connect'}* 🛍️\n\n`;

  message += `👤 *Cliente:* ${details.clientName}\n`;
  message += `🆔 *Código:* ${details.reservationId}\n`;
  message += `👨‍💼 *Atendente:* ${details.employeeName || 'Não informado'}\n\n`;

  message += `📦 *PRODUTO RESERVADO*\n`;
  message += `├─ 🏷️ *Nome:* ${details.product.nome}\n`;

  if (productPrice > 0) {
    message += `├─ 💰 *Preço Unitário:* ${unitPriceFormatted}\n`;
    message += `├─ 📊 *Quantidade:* ${details.quantity}x\n`;
    message += `└─ 💵 *Valor Total:* ${totalValueFormatted}\n\n`;
  } else {
    message += `├─ 💰 *Preço:* A combinar\n`;
    message += `├─ 📊 *Quantidade:* ${details.quantity}x\n`;
    message += `└─ 💵 *Valor Total:* A combinar\n\n`;
  }

  message += `📐 *Tamanho:* ${details.size}\n`;

  if (productCategory) {
    message += `📂 *Categoria:* ${productCategory}\n`;
  }

  // ✅ SEÇÃO DESTACADA PARA A FOTO DO PRODUTO
  if (productImage) {
    message += `\n📸 *FOTO DO PRODUTO PARA IDENTIFICAÇÃO* 📸\n`;
    message += `🖼️ ${productImage}\n\n`;

    message += `👉 *Clique no link acima para visualizar a foto do produto* 👈\n\n`;
  } else {
    message += `\n📸 *Produto sem foto disponível*\n\n`;
  }

  message += `⏰ *INFORMAÇÕES DE RETIRADA*\n`;
  message += `├─ 📅 *Prazo:* ${details.pickupTime}\n`;
  message += `└─ 🆔 *Código:* ${details.reservationId}\n\n`;

  message += `📋 *DETALHES ADICIONAIS*\n`;

  if (productDescription) {
    message += `├─ 📄 *Descrição:* ${productDescription}\n`;
  }

  if (details.additionalNotes) {
    message += `└─ 💬 *Observações:* ${details.additionalNotes}\n\n`;
  } else {
    message += `└─ 💬 *Observações:* Nenhuma observação\n\n`;
  }

  message += `✅ *Reserva confirmada com sucesso!*\n`;
  message += `🙏 *Obrigado pela preferência!*\n\n`;

  message += `---\n`;
  message += `🏪 *Equipe ${details.storeName || 'Loja Connect'}*\n`;
  message += `🕒 ${new Date().toLocaleDateString('pt-BR')} • ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  console.log('🖼️ DEBUG - Foto na mensagem:', {
    url: productImage,
    incluida: !!productImage
  });

  return message;
};

// ✅ FUNÇÃO PARA GERAR LINK DO WHATSAPP
export const generateWhatsAppLink = (
  phone: string,
  details: ReservationDetails
): string => {
  // Validações
  if (!phone?.trim()) {
    throw new Error("Número de telefone é obrigatório");
  }

  if (!details.clientName?.trim()) {
    throw new Error("Nome do cliente é obrigatório");
  }

  if (!details.product?.nome?.trim()) {
    throw new Error("Nome do produto é obrigatório");
  }

  const cleanPhone = phone.replace(/\D/g, "");

  if (cleanPhone.length < 10) {
    throw new Error("Número de telefone inválido");
  }

  const message = generatePremiumReservationMessage(details);

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

// ✅ FUNÇÃO PARA COMPARTILHAR PRODUTO
export const shareProductViaWhatsApp = (
  phone: string,
  product: Product,
  clientName: string
): string => {
  const cleanPhone = phone.replace(/\D/g, "");

  const productPrice = product.preco || 0;
  const productDescription = product.descricao || '';
  const productCategory = product.categoria || '';
  const productImage = product.foto_url || product.image_url || product.image || product.imagem || '';

  let message = `🌟 *INDICAÇÃO DE PRODUTO*\n\n`;

  if (productImage) {
    message += `📸 *Foto do produto:*\n`;
    message += `${productImage}\n\n`;
  }

  message += `🛍️ *${product.nome}*\n`;

  if (productPrice > 0) {
    message += `💰 Preço: R$ ${productPrice.toFixed(2).replace('.', ',')}\n`;
  } else {
    message += `💰 Preço: A combinar\n`;
  }

  if (productCategory) {
    message += `📂 Categoria: ${productCategory}\n`;
  }

  if (productDescription) {
    message += `📄 Descrição: ${productDescription}\n`;
  }

  message += `\n👤 *Indicado por:* ${clientName}\n\n`;
  message += `💎 *Disponível para reserva imediata*\n\n`;
  message += `🏪 *Loja Connect*\n`;
  message += `_Produto selecionado especialmente para você_`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

// ✅ FUNÇÃO PARA MENSAGEM RÁPIDA
export const generateQuickReservationMessage = (
  phone: string,
  details: {
    clientName: string;
    productName: string;
    productImage?: string;
    size: string;
    quantity: number;
    price?: number;
    reservationId: string;
    employeeName?: string;
    storeName?: string;
  }
): string => {
  const cleanPhone = phone.replace(/\D/g, "");

  let message = `🛍️ *NOVA RESERVA - ${details.storeName || 'Loja Connect'}*\n\n`;

  if (details.productImage) {
    message += `📸 *Foto do produto:*\n`;
    message += `${details.productImage}\n\n`;
  }

  message += `📋 *Detalhes do Pedido:*\n`;
  message += `👤 Cliente: ${details.clientName}\n`;
  message += `📦 Produto: ${details.productName}\n`;

  if (details.price) {
    message += `💰 Preço: R$ ${details.price.toFixed(2).replace('.', ',')}\n`;
  }

  message += `📏 Tamanho: ${details.size}\n`;
  message += `🔢 Quantidade: ${details.quantity}x\n`;
  message += `🆔 Código: ${details.reservationId}\n`;

  if (details.employeeName) {
    message += `👨‍💼 Atendente: ${details.employeeName}\n`;
  }

  message += `\n💎 *Reserva realizada via Loja Connect*\n`;
  message += `⏰ ${new Date().toLocaleString('pt-BR')}`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

// ✅ FUNÇÃO SIMPLES DE ABRIR WHATSAPP
export const openWhatsApp = (link: string): void => {
  window.open(link, "_blank", "noopener,noreferrer");
};

// ✅ FUNÇÃO PARA MENSAGEM DE CONFIRMAÇÃO
export const sendReservationConfirmation = (
  phone: string,
  details: ReservationDetails
): string => {
  const cleanPhone = phone.replace(/\D/g, "");

  const productPrice = details.product.preco || 0;
  const productImage = details.product.foto_url || details.product.image_url || details.product.image || details.product.imagem || '';

  const priceSection = productPrice > 0
    ? `💰 *Valor:* R$ ${productPrice.toFixed(2).replace('.', ',')}`
    : '💰 *Valor:* A combinar';

  let message = `✅ *RESERVA CONFIRMADA!*\n\n`;

  message += `🛍️ *${details.storeName || 'Loja Connect'}*\n\n`;

  if (productImage) {
    message += `📸 *Foto do produto:*\n`;
    message += `${productImage}\n\n`;
  }

  message += `📋 *Resumo do Pedido:*\n`;
  message += `👤 Cliente: ${details.clientName}\n`;
  message += `📦 Produto: ${details.product.nome}\n`;
  message += `${priceSection}\n`;
  message += `📏 Tamanho: ${details.size}\n`;
  message += `🔢 Quantidade: ${details.quantity}x\n`;
  message += `⏰ Retirar até: ${details.pickupTime}\n`;
  message += `🆔 Código: ${details.reservationId}\n\n`;

  message += `📞 *Informações Importantes:*\n`;
  message += `• Apresente este código na retirada\n`;
  message += `• O prazo de retirada é de até ${details.pickupTime}\n`;
  message += `• Em caso de dúvidas, entre em contato\n\n`;

  message += `🏪 Agradecemos pela preferência!\n`;
  message += `_Equipe ${details.storeName || 'Loja Connect'}_`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

// ✅ FUNÇÃO PARA MENSAGEM PROFISSIONAL
export const generateProfessionalReservationMessage = (
  details: ReservationDetails
): string => {
  const productPrice = details.product.preco || 0;
  const productDescription = details.product.descricao || '';
  const productCategory = details.product.categoria || '';
  const productImage = details.product.foto_url || details.product.image_url || details.product.image || details.product.imagem || '';

  const priceSection = productPrice > 0
    ? `💰 *Preço Unitário:* R$ ${productPrice.toFixed(2).replace('.', ',')}`
    : '💰 *Preço:* A combinar';

  const totalValue = productPrice > 0
    ? `💵 *Valor Total:* R$ ${(productPrice * details.quantity).toFixed(2).replace('.', ',')}`
    : '';

  let message = `🛍️ *PEDIDO DE RESERVA - ${details.storeName || 'Loja Connect'}*\n\n`;

  message += `📋 **DADOS DO CLIENTE**\n`;
  message += `👤 Nome: ${details.clientName}\n`;
  if (details.employeeName) {
    message += `👨‍💼 Atendente: ${details.employeeName}\n`;
  }
  message += `\n`;

  message += `🛒 **PRODUTO SOLICITADO**\n`;
  message += `📦 Descrição: ${details.product.nome}\n`;
  message += `${priceSection}\n`;
  if (totalValue) {
    message += `${totalValue}\n`;
  }
  message += `📏 Tamanho: ${details.size}\n`;
  message += `🔢 Quantidade: ${details.quantity} unidade(s)\n`;
  if (productCategory) {
    message += `📂 Categoria: ${productCategory}\n`;
  }
  message += `\n`;

  message += `⏰ **PRAZOS**\n`;
  message += `📅 Data da Reserva: ${new Date().toLocaleDateString('pt-BR')}\n`;
  message += `🕒 Retirada até: ${details.pickupTime}\n`;
  message += `🆔 Código: ${details.reservationId}\n\n`;

  message += `📝 **OBSERVAÇÕES**\n`;
  if (productDescription) {
    message += `📄 ${productDescription}\n`;
  } else {
    message += `📄 Sem observações adicionais\n`;
  }
  if (details.additionalNotes) {
    message += `💬 ${details.additionalNotes}\n`;
  }
  message += `\n`;

  if (productImage) {
    message += `📸 *Imagem do produto disponível*\n\n`;
  }

  message += `🏪 **ATENDIMENTO**\n`;
  message += `_Reserva processada via Loja Connect_\n`;
  message += `_Data: ${new Date().toLocaleString('pt-BR')}_`;

  return message;
};
