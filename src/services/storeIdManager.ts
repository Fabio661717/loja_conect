// src/services/storeIdManager.ts - VERSÃO MELHORADA
export class StoreIdManager {
  private static readonly STORAGE_KEY = "store_id";

  static setStoreId(storeId: string) {
    try {
      if (!storeId || storeId.trim() === '') {
        console.error('❌ Tentativa de salvar storeId vazio');
        return;
      }

      localStorage.setItem(this.STORAGE_KEY, storeId);
      console.log('✅ StoreId salvo:', storeId);
    } catch (error) {
      console.error('❌ Erro ao salvar storeId:', error);
    }
  }

  static getStoreId(): string | null {
    try {
      const storeId = localStorage.getItem(this.STORAGE_KEY);

      if (!storeId || storeId.trim() === '') {
        console.warn('⚠️ StoreId não encontrado ou vazio');
        return null;
      }

      console.log('✅ StoreId recuperado:', storeId);
      return storeId;
    } catch (error) {
      console.error('❌ Erro ao recuperar storeId:', error);
      return null;
    }
  }

  static clearStoreId() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ StoreId removido do localStorage');
    } catch (error) {
      console.error('❌ Erro ao remover storeId:', error);
    }
  }

  static validateStoreId(storeId: string | null): boolean {
    if (!storeId) return false;

    // Validar formato UUID básico
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(storeId);
  }

  static getStoreIdWithValidation(): string | null {
    const storeId = this.getStoreId();

    if (!this.validateStoreId(storeId)) {
      console.error('❌ StoreId inválido:', storeId);
      this.clearStoreId();
      return null;
    }

    return storeId;
  }
}
