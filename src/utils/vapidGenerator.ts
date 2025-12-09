// Utilitário para gerar e validar chaves VAPID
export class VAPIDKeyGenerator {
  // Gerar par de chaves VAPID (para uso no servidor)
  static async generateVAPIDKeys(): Promise<{ publicKey: string; privateKey: string }> {
    try {
      // Em produção, use: npm install web-push
      // Para desenvolvimento, podemos gerar uma chave base64 simples
      const keyPair = {
        publicKey: this.generateRandomBase64(65),
        privateKey: this.generateRandomBase64(65)
      };

      console.log('🔑 Chaves VAPID geradas:');
      console.log('   Public Key:', keyPair.publicKey);
      console.log('   Private Key:', keyPair.privateKey);

      return keyPair;
    } catch (error) {
      console.error('❌ Erro ao gerar chaves VAPID:', error);
      throw error;
    }
  }

  private static generateRandomBase64(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Validar formato da chave VAPID pública
  static isValidVAPIDPublicKey(key: string): boolean {
    if (!key || typeof key !== 'string') {
      return false;
    }

    // Verificar comprimento (chaves VAPID geralmente têm ~87 caracteres)
    if (key.length < 20 || key.length > 200) {
      console.warn(`⚠️ Chave VAPID com comprimento inválido: ${key.length}`);
      return false;
    }

    // Verificar se é Base64 URL safe
    const base64Regex = /^[A-Za-z0-9_-]+$/;
    if (!base64Regex.test(key)) {
      console.warn('⚠️ Chave VAPID contém caracteres inválidos');
      return false;
    }

    return true;
  }

  // Obter chave VAPID do ambiente com fallback
  static getVAPIDPublicKey(): string {
    const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

    if (this.isValidVAPIDPublicKey(envKey)) {
      console.log('✅ Usando chave VAPID do ambiente');
      return envKey;
    }

    // Fallback para desenvolvimento
    console.warn('⚠️ Chave VAPID do ambiente inválida, usando fallback...');
    const fallbackKey = 'BGzpPeDhII5ew2RKtxOz6FPFbJLK3DN94vPaz5UcbS9nhKux5pEgfS7_iqBsQg_zNSt8cjSGP0-kQgW-dKffGR0';

    if (this.isValidVAPIDPublicKey(fallbackKey)) {
      console.log('✅ Usando chave VAPID de fallback');
      return fallbackKey;
    }

    throw new Error('Nenhuma chave VAPID válida disponível');
  }
}
