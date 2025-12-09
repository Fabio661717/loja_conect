// src/hooks/useReservationFlow.ts - VERSÃO CORRIGIDA
import { generatePremiumReservationMessage } from '../services/whatsapp';
import { Employee } from '../types/Employee';
import { Product } from '../types/ProductData';
import { useAuth } from './useAuth';

interface UseReservationFlowProps {
  product?: Product;
  productName?: string;
  storeId: string;
  clientName?: string;
  storeName?: string; // ✅ NOVO PARÂMETRO PARA NOME DA LOJA
}

// ✅ INTERFACE PARA DETALHES DA RESERVA
interface ReservationDetails {
  employee: string;
  product: string;
  storeName: string;
  details: string;
  timestamp: string;
  parsedInfo?: {
    hasUrgency?: boolean;
    quantity?: number;
    size?: string;
    notes?: string;
  };
}

export function useReservationFlow({
  product,
  productName,
  storeId,
  clientName,
  storeName = "Loja Connect" // ✅ VALOR PADRÃO
}: UseReservationFlowProps) {
  const { user } = useAuth();

  // ✅ CORREÇÃO: AGORA USANDO A VARIÁVEL 'details'
  const startReservation = (employee: Employee, details: string) => {
    const actualProductName = product?.nome || product?.name || productName || "Produto";

    console.log('🎯 Iniciando fluxo de reserva:', {
      employee: employee.nome,
      product: actualProductName,
      storeName: storeName,
      // ✅ AGORA USANDO O PARÂMETRO 'details'
      details: details
    });

    // ✅ IMPLEMENTAÇÃO: PROCESSAR OS DETALHES DA RESERVA
    const processedDetails = processReservationDetails(details, {
      employeeName: employee.nome,
      productName: actualProductName,
      storeName: storeName
    });

    // ✅ SALVAR OS DETALHES NO LOCALSTORAGE PARA HISTÓRICO
    saveReservationDetails({
      employee: employee.nome,
      product: actualProductName,
      storeName: storeName,
      details: details,
      timestamp: new Date().toISOString(),
      parsedInfo: processedDetails
    });

    // ✅ NOTIFICAR SISTEMA SOBRE INÍCIO DA RESERVA
    notifyReservationStart(employee, actualProductName, details);
  };

  // ✅ FUNÇÃO PARA PROCESSAR DETALHES DA RESERVA
  const processReservationDetails = (details: string, context: {
    employeeName: string;
    productName: string;
    storeName: string;
  }) => {
    console.log('🔍 Processando detalhes da reserva:', details);

    // Extrair informações específicas dos detalhes
    const hasUrgency = details.toLowerCase().includes('urgent') ||
                      details.toLowerCase().includes('urgente') ||
                      details.toLowerCase().includes('prioridade');

    // Tentar extrair quantidade do texto
    const quantityMatch = details.match(/quantidade:\s*(\d+)/i) ||
                         details.match(/qtd:\s*(\d+)/i) ||
                         details.match(/\b(\d+)\s*unidade/i) ||
                         details.match(/\b(\d+)\s*peça/i);

    // Tentar extrair tamanho do texto
    const sizeMatch = details.match(/tamanho:\s*(\w+)/i) ||
                     details.match(/size:\s*(\w+)/i) ||
                     details.match(/\btamanho\s*(\w+)/i);

    // Tentar extrair notas adicionais
    const notesMatch = details.match(/notas?:\s*(.+)/i) ||
                      details.match(/observa[çc][aã]o:\s*(.+)/i);

    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
    const size = sizeMatch ? sizeMatch[1] : 'Não especificado';
    const notes = notesMatch ? notesMatch[1] : '';

    const processedInfo = {
      hasUrgency,
      quantity,
      size,
      notes,
      context
    };

    console.log('📊 Detalhes processados:', processedInfo);
    return processedInfo;
  };

  // ✅ FUNÇÃO PARA SALVAR DETALHES DA RESERVA
  const saveReservationDetails = (reservationDetails: ReservationDetails) => {
    try {
      // Obter histórico existente do localStorage
      const historyKey = 'reservationHistory';
      const existingHistory = localStorage.getItem(historyKey);
      const history = existingHistory ? JSON.parse(existingHistory) : [];

      // Adicionar nova reserva ao histórico
      const newHistory = [
        {
          id: `reservation-${Date.now()}`,
          ...reservationDetails,
          status: 'iniciada'
        },
        ...history
      ].slice(0, 50); // Manter apenas as últimas 50 reservas

      // Salvar no localStorage
      localStorage.setItem(historyKey, JSON.stringify(newHistory));

      console.log('💾 Detalhes da reserva salvos:', {
        id: `reservation-${Date.now()}`,
        employee: reservationDetails.employee,
        product: reservationDetails.product,
        timestamp: reservationDetails.timestamp
      });

      // Disparar evento para atualização em tempo real
      window.dispatchEvent(new CustomEvent('reservationStarted', {
        detail: reservationDetails
      }));

    } catch (error) {
      console.warn('⚠️ Não foi possível salvar detalhes da reserva:', error);
    }
  };

  // ✅ FUNÇÃO PARA NOTIFICAR INÍCIO DA RESERVA
  const notifyReservationStart = (employee: Employee, productName: string, details: string) => {
    try {
      // Preparar notificação para o sistema
      const notificationData = {
        type: 'reservation_started',
        employeeId: employee.id,
        employeeName: employee.nome,
        productName: productName,
        storeId: storeId,
        storeName: storeName,
        timestamp: new Date().toISOString(),
        details: details,
        processedDetails: processReservationDetails(details, {
          employeeName: employee.nome,
          productName: productName,
          storeName: storeName
        })
      };

      // Enviar notificação via console (pode ser substituído por API real)
      console.log('🔔 Notificação de início de reserva:', notificationData);

      // Disparar evento customizado para outros componentes ouvirem
      window.dispatchEvent(new CustomEvent('reservationNotification', {
        detail: notificationData
      }));

      // ✅ OPÇÃO: Salvar no histórico de notificações
      const notificationHistoryKey = 'reservationNotifications';
      const existingNotifications = localStorage.getItem(notificationHistoryKey);
      const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];

      notifications.unshift({
        id: `notification-${Date.now()}`,
        ...notificationData,
        read: false
      });

      localStorage.setItem(notificationHistoryKey, JSON.stringify(notifications.slice(0, 100)));

    } catch (error) {
      console.warn('⚠️ Erro ao notificar início de reserva:', error);
    }
  };

  const openWhatsApp = (employee: Employee, reservationDetails: string) => {
    if (!user) {
      alert('❌ Usuário não autenticado');
      return;
    }

    try {
      // ✅ REUTILIZAR: Usar a função de processamento de detalhes
      const processedDetails = processReservationDetails(reservationDetails, {
        employeeName: employee.nome,
        productName: product?.nome || product?.name || productName || "Produto",
        storeName: storeName
      });

      // ✅ USAR QUANTIDADE E TAMANHO DO PROCESSAMENTO
      const quantidade = processedDetails.quantity;
      const tamanho = processedDetails.size !== 'Não especificado' ? processedDetails.size : 'Único';

      // ✅ PRAZO MAIS REALISTA (24 horas)
      const pickupTime = new Date();
      pickupTime.setHours(pickupTime.getHours() + 24);

      // ✅ FORMATAR DATA DE RETIRADA (sem segundos)
      const formattedPickupTime = pickupTime.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Gerar ID de reserva simples
      const reservationId = `RES${Date.now().toString().slice(-6)}`;

      // ✅ CORREÇÃO: Garantir que a foto do produto seja passada
      const actualProductName = product?.nome || product?.name || productName || "Produto";
      const actualProductPrice = product?.preco || 0;
      const actualProductDescription = product?.descricao || '';
      const actualProductCategory = product?.categoria || '';

      // ✅ OBTER TODAS AS POSSÍVEIS URLS DE IMAGEM
      const actualProductImage = product?.foto_url || product?.image || product?.imagem || '';

      console.log('📸 URLs de imagem disponíveis:', {
        foto_url: product?.foto_url,
        image: product?.image,
        imagem: product?.imagem,
        imagem_usada: actualProductImage,
        storeName: storeName, // ✅ LOG DO NOME DA LOJA
        processedDetails: processedDetails // ✅ LOG DOS DETALHES PROCESSADOS
      });

      // ✅ Criar objeto de produto compatível
      const productDetails = {
        id: product?.id || 'temp-id',
        nome: actualProductName,
        name: actualProductName,
        preco: actualProductPrice,
        price: actualProductPrice,
        descricao: actualProductDescription,
        description: actualProductDescription,
        // ✅ GARANTIR QUE TODOS OS CAMPOS DE IMAGEM ESTEJAM PREENCHIDOS
        foto_url: actualProductImage,
        image_url: actualProductImage,
        image: actualProductImage,
        imagem: actualProductImage,
        categoria: actualProductCategory,
        category: actualProductCategory,
        estoque: product?.estoque || 0,
        loja_id: product?.loja_id || storeId,
        ativo: product?.ativo !== undefined ? product.ativo : true,
        tamanhos: product?.tamanhos || [],
        created_at: product?.created_at || new Date().toISOString(),
        updated_at: product?.updated_at || new Date().toISOString(),
        categoria_id: product?.categoria_id || ''
      };

      const details = {
        clientName: clientName || user.nome || user.email || 'Cliente',
        product: productDetails,
        size: tamanho,
        quantity: quantidade,
        pickupTime: formattedPickupTime, // ✅ DATA FORMATADA
        reservationId: reservationId,
        storeName: storeName, // ✅ NOME DINÂMICO DA LOJA
        employeeName: employee.nome,
        additionalNotes: actualProductDescription,
        // ✅ ADICIONAR DETALHES PROCESSADOS
        processedDetails: processedDetails,
        originalDetails: reservationDetails
      };

      console.log('📤 Enviando para WhatsApp:', {
        produto: details.product.nome,
        foto: details.product.foto_url,
        temFoto: !!details.product.foto_url,
        storeName: storeName,
        mensagem: 'Formato simplificado e profissional',
        detalhesOriginais: reservationDetails,
        detalhesProcessados: processedDetails
      });

      // ✅ GERAR MENSAGEM SIMPLIFICADA E PROFISSIONAL
      const message = generatePremiumReservationMessage(details);

      const cleanWhatsapp = employee.whatsapp.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(message)}`;

      console.log('📞 Abrindo WhatsApp com mensagem profissional simplificada');
      console.log('🏪 Loja:', storeName);
      console.log('🖼️ Foto incluída na mensagem:', actualProductImage ? 'SIM' : 'NÃO');
      console.log('📋 Detalhes da reserva:', reservationDetails);

      // ✅ SALVAR NO HISTÓRICO DE WHATSAPP
      saveWhatsAppHistory(employee, message, details);

      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    } catch (error) {
      console.error('❌ Erro ao gerar mensagem do WhatsApp:', error);
      alert('❌ Erro ao preparar mensagem. Tente novamente.');
    }
  };

  // ✅ FUNÇÃO PARA SALVAR HISTÓRICO DE WHATSAPP
  const saveWhatsAppHistory = (employee: Employee, message: string, details: any) => {
    try {
      const whatsappHistoryKey = 'whatsappReservationHistory';
      const existingHistory = localStorage.getItem(whatsappHistoryKey);
      const history = existingHistory ? JSON.parse(existingHistory) : [];

      history.unshift({
        id: `whatsapp-${Date.now()}`,
        timestamp: new Date().toISOString(),
        employee: employee.nome,
        whatsapp: employee.whatsapp,
        productName: details.product.nome,
        storeName: storeName,
        messagePreview: message.substring(0, 100) + '...',
        details: details
      });

      localStorage.setItem(whatsappHistoryKey, JSON.stringify(history.slice(0, 50)));
    } catch (error) {
      console.warn('⚠️ Não foi possível salvar histórico do WhatsApp:', error);
    }
  };

  // ✅ FUNÇÃO PARA OBTER HISTÓRICO DE RESERVAS
  const getReservationHistory = () => {
    try {
      const historyKey = 'reservationHistory';
      const history = localStorage.getItem(historyKey);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.warn('⚠️ Erro ao obter histórico de reservas:', error);
      return [];
    }
  };

  // ✅ FUNÇÃO PARA LIMPAR HISTÓRICO
  const clearReservationHistory = () => {
    try {
      localStorage.removeItem('reservationHistory');
      localStorage.removeItem('reservationNotifications');
      localStorage.removeItem('whatsappReservationHistory');
      console.log('🧹 Histórico de reservas limpo');
    } catch (error) {
      console.warn('⚠️ Erro ao limpar histórico:', error);
    }
  };

  return {
    startReservation,
    openWhatsApp,
    // ✅ NOVAS FUNÇÕES EXPORTADAS
    getReservationHistory,
    clearReservationHistory,
    processReservationDetails
  };
}
