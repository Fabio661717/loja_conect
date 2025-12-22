// src/services/api.ts - VERSÃO CORRIGIDA E OTIMIZADA

// ✅ APENAS IMPORTAR O NECESSÁRIO - Axios apenas, sem tipos específicos
import axios from 'axios';

// ✅ CLIENTE AXIOS PRIMÁRIO (mantido para compatibilidade)
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: (status: number) => status >= 200 && status < 500,
});

// ✅ INTERFACE PARA ERROS NORMALIZADOS
interface NormalizedError {
  status: number;
  message: string;
  code?: string;
  details?: any;
}

// ✅ FUNÇÃO AUXILIAR: Detecta baseURL
const getBaseURL = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
};

// ✅ FUNÇÃO AUXILIAR: Headers padrão Supabase
const getSupabaseHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'apikey': process.env.VITE_SUPABASE_ANON_KEY || '',
  'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ''}`,
  'X-Client-Info': 'loja-conect-app'
});

// ✅ CLASSE PRINCIPAL DO SERVIÇO DE API
class ApiService {
  private static instance: ApiService;
  private axiosInstance;
  private retryCount = 0;
  private maxRetries = 3;
  private cache: Map<string, any> = new Map();

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: getBaseURL(),
      timeout: 15000,
      headers: getSupabaseHeaders(),
      validateStatus: (status) => status >= 200 && status < 500
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // ✅ CONFIGURAÇÃO DE INTERCEPTORES
  private setupInterceptors(): void {
    // Interceptor de requisição
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('supabase.auth.token');
        if (token) {
          config.headers.Authorization = `Bearer ${JSON.parse(token).access_token}`;
        }

        if (config.url?.includes('supabase.co')) {
          config.headers['Accept'] = 'application/json';
          config.headers['Content-Type'] = 'application/json';
          config.headers['Prefer'] = 'return=representation';
        }

        console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`, config.params);
        return config;
      },
      (error) => {
        console.error('❌ [API] Erro no request:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor de resposta
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`✅ [API] ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 406) {
          console.warn('⚠️ [API] Erro 406 - Corrigindo headers...');
          originalRequest.headers['Accept'] = 'application/json';
          originalRequest.headers['Content-Type'] = 'application/json';
          originalRequest.headers['Prefer'] = 'return=representation';
          return this.axiosInstance(originalRequest);
        }

        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 5;
          console.warn(`⏳ [API] Rate limit atingido. Retry após ${retryAfter}s`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return this.axiosInstance(originalRequest);
        }

        if (!error.response && this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.warn(`🔄 [API] Tentativa ${this.retryCount}/${this.maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
          return this.axiosInstance(originalRequest);
        }

        console.error('❌ [API] Erro na resposta:', {
          status: error.response?.status,
          data: error.response?.data,
          url: originalRequest?.url
        });

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  // ✅ NORMALIZAÇÃO DE ERROS
  private normalizeError(error: any): NormalizedError {
    if (error.response?.data) {
      return {
        status: error.response.status,
        message: error.response.data.message || error.response.data.error || 'Erro desconhecido',
        code: error.response.data.code,
        details: error.response.data.details
      };
    }

    if (error.request) {
      return {
        status: 0,
        message: 'Erro de conexão - verifique sua internet',
        code: 'NETWORK_ERROR'
      };
    }

    return {
      status: -1,
      message: error.message || 'Erro interno',
      code: 'UNKNOWN_ERROR'
    };
  }

  // ✅ MÉTODO GET COM CACHE
  async get<T = any>(url: string, params?: Record<string, any>, useCache: boolean = true): Promise<T> {
    const cacheKey = `GET:${url}:${JSON.stringify(params)}`;

    if (useCache && this.cache.has(cacheKey)) {
      console.log('📦 [API] Retornando do cache:', url);
      return this.cache.get(cacheKey);
    }

    try {
      const response = await this.axiosInstance.get(url, { params });

      if (response.status === 200 || response.status === 201) {
        if (useCache) {
          this.cache.set(cacheKey, response.data);
          setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);
        }
        return response.data;
      }

      throw new Error(`Status HTTP inesperado: ${response.status}`);
    } catch (error) {
      console.error(`❌ [API] Erro no GET ${url}:`, error);
      throw error;
    }
  }

  // ✅ MÉTODO POST
  async post<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    try {
      const config = {
        headers: {
          ...getSupabaseHeaders(),
          ...headers,
          'Prefer': 'return=representation,resolution=merge-duplicates'
        }
      };

      const response = await this.axiosInstance.post(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`❌ [API] Erro no POST ${url}:`, error);
      throw error;
    }
  }

  // ✅ MÉTODO PUT
  async put<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    try {
      const config = {
        headers: {
          ...getSupabaseHeaders(),
          ...headers
        }
      };

      const response = await this.axiosInstance.put(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`❌ [API] Erro no PUT ${url}:`, error);
      throw error;
    }
  }

  // ✅ MÉTODO PATCH
  async patch<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    try {
      const config = {
        headers: {
          ...getSupabaseHeaders(),
          ...headers
        }
      };

      const response = await this.axiosInstance.patch(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`❌ [API] Erro no PATCH ${url}:`, error);
      throw error;
    }
  }

  // ✅ MÉTODO DELETE
  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<T> {
    try {
      const config = {
        headers: {
          ...getSupabaseHeaders(),
          ...headers
        }
      };

      const response = await this.axiosInstance.delete(url, config);
      return response.data;
    } catch (error) {
      console.error(`❌ [API] Erro no DELETE ${url}:`, error);
      throw error;
    }
  }

  // ✅ BUSCAR PREFERÊNCIAS DO USUÁRIO
  async getUserPreferences(userId: string): Promise<string[]> {
    try {
      console.log('🔍 [API] Buscando preferências do usuário:', userId);
      const tablesToTry = ['users', 'clientes', 'user_preferences'];

      for (const table of tablesToTry) {
        try {
          const { data, error } = await this.supaRequest(
            `/${table}?select=preferred_categories&id=eq.${userId}`
          );

          if (!error && data && data.length > 0 && data[0].preferred_categories) {
            console.log(`✅ [API] Preferências encontradas na tabela ${table}:`, data[0].preferred_categories);
            return data[0].preferred_categories;
          }
        } catch (tableError) {
          console.warn(`⚠️ [API] Tabela ${table} não disponível:`, tableError);
        }
      }

      const localPrefs = localStorage.getItem('user_category_preferences');
      return localPrefs ? JSON.parse(localPrefs) : [];
    } catch (error) {
      console.error('❌ [API] Erro ao buscar preferências:', error);
      const localPrefs = localStorage.getItem('user_category_preferences');
      return localPrefs ? JSON.parse(localPrefs) : [];
    }
  }

  // ✅ REQUISIÇÕES DIRETAS SUPABASE (método privado)
  private async supaRequest(endpoint: string, options: any = {}): Promise<{ data: any; error: NormalizedError | null }> {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!supabaseUrl) {
      throw new Error('URL do Supabase não configurada');
    }

    const url = `${supabaseUrl}/rest/v1${endpoint}`;

    const config = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'apikey': process.env.VITE_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ''}`,
        'Prefer': 'return=representation'
      },
      ...options
    };

    try {
      const response = await this.axiosInstance(url, config);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: this.normalizeError(error) };
    }
  }

  // ✅ LIMPAR CACHE
  clearCache(pattern?: string): void {
    if (pattern) {
      const keysToDelete: string[] = [];
      this.cache.forEach((_, key) => {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
    console.log('🧹 [API] Cache limpo');
  }

  // ✅ ESTATÍSTICAS DA API
  getStats(): { cacheSize: number; retryCount: number; maxRetries: number } {
    return {
      cacheSize: this.cache.size,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries
    };
  }

  // ✅ TESTAR CONEXÃO COM API
  async testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();

    try {
      const response = await this.axiosInstance.get('/health');
      const latency = Date.now() - startTime;

      return {
        success: response.status === 200,
        message: `API respondendo em ${latency}ms`,
        latency
      };
    } catch (error) {
      return {
        success: false,
        message: 'Falha na conexão com a API'
      };
    }
  }
}

// ✅ INSTÂNCIA SINGLETON
export const apiService = ApiService.getInstance();

// ✅ EXPORTAR FUNÇÕES ÚTEIS
export const apiUtils = {
  // Cliente axios original (mantido para compatibilidade)
  client: api,

  // Métodos HTTP simplificados
  get: <T = any>(url: string, config?: any) => apiService.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: any) => apiService.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: any) => apiService.put<T>(url, data, config),
  patch: <T = any>(url: string, data?: any, config?: any) => apiService.patch<T>(url, data, config),
  delete: <T = any>(url: string, config?: any) => apiService.delete<T>(url, config),

  // Funções específicas
  getUserPreferences: (userId: string) => apiService.getUserPreferences(userId),
  clearCache: (pattern?: string) => apiService.clearCache(pattern),
  getStats: () => apiService.getStats(),
  testConnection: () => apiService.testConnection()
};

// ✅ EXPORT DEFAULT
export default apiService;

console.log('✅ API Service inicializado com sucesso');
