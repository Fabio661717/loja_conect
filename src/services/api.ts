// src/services/api.ts
import axios from 'axios';

// ✅ Função para detectar baseURL
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
};

// ✅ Função para headers Supabase
const getSupabaseHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'apikey': process.env.VITE_SUPABASE_ANON_KEY || '',
  'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ''}`,
  'X-Client-Info': 'loja-conect-app'
});

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

  // ✅ Interceptores para requests e respostas
  private setupInterceptors() {
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

  // ✅ Normaliza erros
  private normalizeError(error: any) {
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

  // ✅ GET com cache
  async get<T = any>(url: string, params?: any, useCache: boolean = true): Promise<T> {
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

  // ✅ POST com headers Supabase
  async post<T = any>(url: string, data?: any, headers?: any): Promise<T> {
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

  // ✅ Buscar preferências do usuário
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

  // ✅ Requisições diretas Supabase
  private async supaRequest(endpoint: string, options: any = {}) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!supabaseUrl) throw new Error('URL do Supabase não configurada');

    const url = `${supabaseUrl}/rest/v1${endpoint}`;

    const config = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'apikey': process.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
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

  // ✅ Corrigido: limpar cache sem iteradores diretos
  clearCache(pattern?: string) {
    if (pattern) {
      Array.from(this.cache.keys()).forEach((key) => {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      });
    } else {
      this.cache.clear();
    }
    console.log('🧹 [API] Cache limpo');
  }

  // ✅ Estatísticas da API
  getStats() {
    return {
      cacheSize: this.cache.size,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries
    };
  }
}

// ✅ Exportar instância singleton
export const apiService = ApiService.getInstance();
export default apiService;
