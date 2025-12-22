import { notificationService } from '../services/notificationService';
import { supabase } from '../services/supabase';


export const notificationController = {
  // Enviar notificação filtrada por categoria
  async sendCategorizedNotification(
    productData: {
      title: string;
      message: string;
      category: string;
      storeId?: string;
    }
  ) {
    try {
      // Buscar todos os usuários que têm a categoria específica nas preferências
      const { data: users, error } = await supabase
        .from('users')
        .select('id, preferred_categories')
        .eq('lojaId', productData.storeId)
        .or(`preferred_categories.cs.{${productData.category}},preferred_categories.is.null`);

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        return { success: false, error: error.message };
      }

      let sentCount = 0;
      let filteredCount = 0;

      // Enviar notificação apenas para usuários com a categoria preferida
      for (const user of users || []) {
        // Se o usuário não tem preferências definidas, envia para todos (comportamento antigo)
        if (!user.preferred_categories || user.preferred_categories.length === 0) {
          await notificationService.sendCategorizedNotification(
            productData.category,
            productData.title,
            productData.message,
            user.id
          );
          sentCount++;
        }
        // Se o usuário tem a categoria específica nas preferências
        else if (user.preferred_categories.includes(productData.category)) {
          await notificationService.sendCategorizedNotification(
            productData.category,
            productData.title,
            productData.message,
            user.id
          );
          sentCount++;
        } else {
          filteredCount++;
          console.log(`🔕 Notificação filtrada para usuário ${user.id} - Categoria "${productData.category}" não está nas preferências`);
        }
      }

      return {
        success: true,
        sentCount,
        filteredCount,
        totalUsers: users?.length || 0,
        message: `Notificação enviada para ${sentCount} usuários, filtrada para ${filteredCount}`,
        data: { sentCount, filteredCount, totalUsers: users?.length || 0 }
      };

    } catch (error) {
      console.error('Erro ao enviar notificação categorizada:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  },

  // Método para lojistas - enviar notificação para categoria específica
  async sendStoreNotification(storeId: string, notificationData: {
    title: string;
    message: string;
    category: string;
  }) {
    return await this.sendCategorizedNotification({
      ...notificationData,
      storeId
    });
  }
};
