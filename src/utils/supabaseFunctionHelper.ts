// src/utils/supabaseFunctionHelper.ts - Helper para chamadas Supabase
export class SupabaseFunctionHelper {
  private static instance: SupabaseFunctionHelper;
  private supabaseUrl: string;
  private supabaseKey: string;

  private constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }

  static getInstance(): SupabaseFunctionHelper {
    if (!SupabaseFunctionHelper.instance) {
      SupabaseFunctionHelper.instance = new SupabaseFunctionHelper();
    }
    return SupabaseFunctionHelper.instance;
  }

  // ✅ TESTAR SE FUNÇÃO ESTÁ DISPONÍVEL
  async testFunction(functionName: string): Promise<boolean> {
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('❌ Credenciais do Supabase não configuradas');
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/${functionName}`,
        {
          method: 'OPTIONS',
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      const isAvailable = response.status === 204 || response.status === 200;
      console.log(`🔍 Função ${functionName} disponível:`, isAvailable);

      return isAvailable;
    } catch (error) {
      console.warn(`⚠️ Função ${functionName} não disponível:`, error);
      return false;
    }
  }

  // ✅ CHAMAR FUNÇÃO COM FALLBACK
  async callFunction<T>(
    functionName: string,
    data: any,
    fallback: () => Promise<T>
  ): Promise<T> {
    console.log(`📤 Chamando função ${functionName}...`);

    // Primeiro testar se a função está disponível
    const isAvailable = await this.testFunction(functionName);

    if (!isAvailable) {
      console.log(`🔄 Função ${functionName} não disponível, usando fallback`);
      return await fallback();
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/${functionName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`
          },
          body: JSON.stringify(data),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ ${functionName} executada com sucesso`);

      return result as T;
    } catch (error) {
      console.warn(`⚠️ Erro na função ${functionName}:`, error);
      console.log(`🔄 Usando fallback para ${functionName}`);
      return await fallback();
    }
  }
}

export const supabaseFunctionHelper = SupabaseFunctionHelper.getInstance();
