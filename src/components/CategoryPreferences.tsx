// CategoryPreferences.tsx - VERSÃO UNIFICADA E COMPLETA COM ATUALIZAÇÃO DE PERFORMANCE
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReserveModal from '../components/client/ReserveModal';
import { useNotification } from '../context/NotificationContext';
import { useReservation } from '../context/ReservationContext';
import { useAuth } from '../hooks/useAuth';
import { notificationService } from '../services/notificationService';
import { supabase } from '../services/supabase';
import { Employee } from '../types/Employee';
import { Product } from '../types/ProductData';

// ✅ IMPORTS DA ATUALIZAÇÃO ADICIONADOS
import { apiService } from '../services/api';
import { checkBrowserCompatibility } from '../utils/browserCompatibility';

// ✅ CORREÇÃO: Função debounce helper
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

// ✅ INTERFACE CATEGORY CORRIGIDA - ADICIONADAS TODAS AS PROPRIEDADES NECESSÁRIAS
interface Category {
  id: string;
  name: string;
  description?: string;
  store_id?: string;
  store_name?: string;
  source?: 'store' | 'global';
  // ✅ PROPRIEDADES ADICIONAIS PARA COMPATIBILIDADE
  loja_id?: string; // alternativa para store_id
  nome?: string; // alternativa para name
  descricao?: string; // alternativa para description
}

interface CategoryPreferencesProps {
  // ✅ PROPS PARA DIFERENTES CONTEXTOS
  context?: 'cliente' | 'funcionario' | 'loja';
  mode?: 'standalone' | 'screen';

  // ✅ PROPS EXISTENTES DO COMPONENTE ORIGINAL
  categories?: Category[];
  userPreferences?: string[];
  onPreferencesChange?: (categoryIds: string[]) => void;
  loading?: boolean;
  title?: string;
  description?: string;
  storeId?: string;
  userId?: string;

  // ✅ PROPS DA SCREEN (PARA MODO COMPLETO)
  showHeader?: boolean;
  showBackButton?: boolean;
}

// ✅ INTERFACE PARA CACHE DE CATEGORIAS
interface CategoriesCache {
  data: Category[];
  timestamp: number;
  storeId: string;
}

export const CategoryPreferences: React.FC<CategoryPreferencesProps> = ({
  // ✅ CONTROLE DE CONTEXTO
  context = 'cliente',
  mode = 'standalone',

  // ✅ PROPS DO COMPONENTE
  categories: externalCategories,
  userPreferences: externalPreferences,
  onPreferencesChange: externalOnChange,
  loading: externalLoading = false,
  title,
  description,
  storeId: externalStoreId,

  // ✅ PROPS DA SCREEN
  showHeader = true,
  showBackButton = true
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { preferredCategories, availableCategories, categoriesLoading, updateCategoryPreferences, addNotification } = useNotification();
  const { selectedEmployee } = useReservation();

  // ✅ ESTADOS UNIFICADOS
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [recentlyEnabledCategories, setRecentlyEnabledCategories] = useState<string[]>([]);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // ✅ ESTADOS DA SCREEN
  const [localLoading, setLocalLoading] = useState(false);
  const [storeCategories, setStoreCategories] = useState<Category[]>([]);
  const [storeLoading, setStoreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStoreId, setCurrentStoreId] = useState<string>('');

  // ✅ ESTADOS DA ATUALIZAÇÃO
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // ✅ CORREÇÃO: Estados para cache e performance
  const [categoriesCache, setCategoriesCache] = useState<Map<string, CategoriesCache>>(new Map());
  const [loadAttempts, setLoadAttempts] = useState(0);
  const maxLoadAttempts = 2;
  const [browserCompatible, setBrowserCompatible] = useState(true);

  // ✅ DETERMINAR CONTEXTO ATUAL
  const isScreenMode = mode === 'screen';
  const isClienteContext = context === 'cliente';
  const hasStoreContext = !!currentStoreId;

  // ✅ INICIALIZAÇÃO DO STORE ID
  useEffect(() => {
    const storedStoreId = localStorage.getItem('storeId') || externalStoreId;
    if (storedStoreId) {
      setCurrentStoreId(storedStoreId);
    }
  }, [externalStoreId]);

  // ✅ VERIFICAR COMPATIBILIDADE
  useEffect(() => {
    const compatibility = checkBrowserCompatibility();
    setBrowserCompatible(compatibility.isCompatible);

    if (!compatibility.isCompatible) {
      console.warn('⚠️ Problemas de compatibilidade detectados:', compatibility.warnings);
    }
  }, []);

  // ✅ CORREÇÃO: Carregar categorias com cache e retry
  const loadStoreCategories = useCallback(async (forceRefresh: boolean = false) => {
    const storeIdToUse = currentStoreId || externalStoreId;

    if (!storeIdToUse) {
      console.log('⚠️ Nenhuma loja ativa encontrada');
      setStoreCategories([]);
      return;
    }

    // ✅ VERIFICAR CACHE PRIMEIRO (a menos que force refresh)
    const cacheKey = `categories-${storeIdToUse}`;
    const cached = categoriesCache.get(cacheKey);

    if (!forceRefresh && cached && (Date.now() - cached.timestamp < 5 * 60 * 1000)) {
      console.log('📦 Usando categorias do cache');
      setStoreCategories(cached.data);
      return;
    }

    try {
      setStoreLoading(true);
      setError(null);

      console.log('🔄 Carregando categorias da loja:', storeIdToUse);

      // ✅ USAR apiService COM TRATAMENTO DE ERRO MELHORADO
      let categoriesData: any[] = [];

      try {
        // Tentar via apiService primeiro (com cache interno)
        const response = await apiService.get(
          `/categorias?loja_id=eq.${storeIdToUse}&order=nome.asc`,
          undefined,
          true // usar cache
        );

        if (response && Array.isArray(response)) {
          categoriesData = response;
        }
      } catch (apiError) {
        console.warn('⚠️ apiService falhou, tentando Supabase direto...');

        // Fallback para Supabase direto
        const { data, error } = await supabase
          .from('categorias')
          .select('*')
          .eq('loja_id', storeIdToUse)
          .order('nome');

        if (error) throw error;
        categoriesData = data || [];
      }

      if (!categoriesData || categoriesData.length === 0) {
        console.log('ℹ️ Nenhuma categoria encontrada para esta loja');
        setStoreCategories([]);

        // ✅ SALVAR CACHE VAZIO TAMBÉM
        setCategoriesCache(prev => new Map(prev.set(cacheKey, {
          data: [],
          timestamp: Date.now(),
          storeId: storeIdToUse
        })));

        return;
      }

      console.log('✅ Categorias da loja carregadas:', categoriesData.length);

      // ✅ CONVERSÃO CORRIGIDA
      const formattedCategories: Category[] = categoriesData.map(cat => ({
        id: cat.id,
        name: cat.nome || cat.name || '',
        description: cat.descricao || cat.description || `Categoria ${cat.nome || cat.name || ''}`,
        store_id: cat.loja_id || cat.store_id,
        store_name: cat.store_name,
        source: 'store' as const,
        loja_id: cat.loja_id,
        nome: cat.nome,
        descricao: cat.descricao
      }));

      setStoreCategories(formattedCategories);

      // ✅ ATUALIZAR CACHE
      setCategoriesCache(prev => new Map(prev.set(cacheKey, {
        data: formattedCategories,
        timestamp: Date.now(),
        storeId: storeIdToUse
      })));

      // ✅ RESETAR CONTADOR DE TENTATIVAS EM SUCESSO
      setLoadAttempts(0);

    } catch (error) {
      console.error('❌ Erro ao carregar categorias da loja:', error);

      // ✅ TENTAR NOVAMENTE SE AINDA HÁ TENTATIVAS
      if (loadAttempts < maxLoadAttempts) {
        console.log(`🔄 Tentativa ${loadAttempts + 1}/${maxLoadAttempts} em 3s...`);
        setLoadAttempts(prev => prev + 1);

        setTimeout(() => {
          loadStoreCategories();
        }, 3000);
      } else {
        setError('Erro interno ao carregar categorias');
        addNotification('Erro ao carregar categorias', 'error');

        // ✅ USAR CACHE MESMO QUE ANTIGO EM CASO DE ERRO
        if (cached) {
          console.log('🔄 Usando cache antigo devido a erro');
          setStoreCategories(cached.data);
        }
      }
    } finally {
      setStoreLoading(false);
    }
  }, [currentStoreId, externalStoreId, addNotification, categoriesCache, loadAttempts]);

  // ✅ CORREÇÃO: Carregar categorias quando em modo screen
  useEffect(() => {
    if (isScreenMode) {
      loadStoreCategories();
    }
  }, [isScreenMode, loadStoreCategories]);

  // ✅ CORREÇÃO: Função para forçar atualização - CORRIGIDO O ERRO DO onClick
  const forceRefreshCategories = useCallback(() => {
    console.log('🔄 Forçando atualização de categorias...');
    setLoadAttempts(0);
    loadStoreCategories(true);
  }, [loadStoreCategories]);

  // ✅ CORREÇÃO: Handler para o botão de refresh que funciona com onClick
  const handleForceRefreshClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    forceRefreshCategories();
  }, [forceRefreshCategories]);

  // ✅ DETERMINAR CATEGORIAS A SEREM EXIBIDAS
  const displayCategories = React.useMemo(() => {
    // Se categories foram passadas via props, usar elas
    if (externalCategories && externalCategories.length > 0) {
      return externalCategories;
    }

    // Se em modo screen e tem categorias da loja, usar elas
    if (isScreenMode && storeCategories.length > 0) {
      return storeCategories;
    }

    // ✅ FALLBACK CORRIGIDO - CONVERSÃO EXPLÍCITA PARA CATEGORY
    const contextCategories: Category[] = availableCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      source: 'global' as const
    }));

    console.log('🌐 Usando categorias disponíveis do contexto:', contextCategories.length);
    return contextCategories;
  }, [externalCategories, isScreenMode, storeCategories, availableCategories]);

  // ✅ DETERMINAR PREFERÊNCIAS DO USUÁRIO
  const userPreferences = React.useMemo(() => {
    if (externalPreferences) {
      return externalPreferences;
    }
    return preferredCategories;
  }, [externalPreferences, preferredCategories]);

  // ✅ INICIALIZAR PREFERÊNCIAS SELECIONADAS
  useEffect(() => {
    setSelectedCategories(userPreferences);
  }, [userPreferences]);

  // ✅ MONITORAR MUDANÇAS NAS CATEGORIAS PARA NOTIFICAÇÕES
  useEffect(() => {
    if (userPreferences.length > selectedCategories.length) {
      const newlyEnabled = userPreferences.filter(
        catId => !selectedCategories.includes(catId)
      );

      if (newlyEnabled.length > 0) {
        setRecentlyEnabledCategories(newlyEnabled);

        newlyEnabled.forEach(categoryId => {
          const category = displayCategories.find(cat => cat.id === categoryId);
          if (category) {
            sendCategoryActivationNotification(category);
          }
        });

        setTimeout(() => {
          setRecentlyEnabledCategories([]);
        }, 3000);
      }
    }
  }, [userPreferences, selectedCategories, displayCategories]);

  // ✅ ATUALIZAÇÃO: Função para salvar preferências que sincroniza com todas as tabelas
  const savePreferencesToAllSources = useCallback(async (categoryIds: string[]) => {
    if (!user) return;

    try {
      // ✅ 1. Salvar no contexto/local state
      await updateCategoryPreferences(categoryIds);

      // ✅ 2. Salvar na tabela users (principal)
      const { error: usersError } = await supabase
        .from('users')
        .update({
          preferred_categories: categoryIds,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (usersError) {
        console.error('❌ Erro ao salvar em users:', usersError);
        throw usersError;
      }

      // ✅ 3. Salvar na tabela clientes (fallback)
      try {
        const { error: clientesError } = await supabase
          .from('clientes')
          .update({
            preferred_categories: categoryIds,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (clientesError) {
          console.warn('⚠️ Não foi possível salvar em clientes:', clientesError);
        }
      } catch (clientesError) {
        console.warn('⚠️ Tabela clientes não disponível');
      }

      // ✅ 4. Salvar no localStorage
      localStorage.setItem('user_category_preferences', JSON.stringify(categoryIds));

      console.log('✅ Preferências salvas em todas as fontes:', categoryIds);
      addNotification('Preferências salvas com sucesso! ✅', 'success');

    } catch (error) {
      console.error('❌ Erro ao salvar preferências:', error);

      // ✅ FALLBACK: Salvar apenas localmente
      localStorage.setItem('user_category_preferences', JSON.stringify(categoryIds));
      addNotification('Preferências salvas localmente (offline)', 'warning');
    }
  }, [user, updateCategoryPreferences, addNotification]);

  // ✅ HANDLER PARA ALTERAÇÃO DE PREFERÊNCIAS
  const handleCategoryToggle = (categoryId: string) => {
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];

    setSelectedCategories(newSelected);

    // Chamar callback externo se fornecido
    if (externalOnChange) {
      externalOnChange(newSelected);
    } else {
      // Usar contexto de notificação
      handlePreferencesChange(newSelected);
    }
  };

  // ✅ CORREÇÃO: Handler para alteração de preferências com debounce
  const handlePreferencesChange = useCallback(
    debounce(async (categoryIds: string[]) => {
      setLocalLoading(true);
      try {
        // ✅ USAR A NOVA FUNÇÃO DE SALVAMENTO
        await savePreferencesToAllSources(categoryIds);
      } catch (error) {
        console.error('❌ Erro ao salvar preferências:', error);
      } finally {
        setLocalLoading(false);
      }
    }, 500), // Debounce de 500ms
    [savePreferencesToAllSources]
  );

  // ✅ ATUALIZAÇÃO: TESTAR NOTIFICAÇÃO
  const testNotification = async (categoryId: string) => {
    if (!user) return;

    setTesting(categoryId);
    setTestResult(null);

    try {
      const storeId = localStorage.getItem('storeId') || currentStoreId;
      if (!storeId) {
        setTestResult({ success: false, message: 'Nenhuma loja ativa encontrada' });
        return;
      }

      const result = await notificationService.testNotification(categoryId, storeId);
      setTestResult(result);

      // Limpar resultado após 5 segundos
      setTimeout(() => setTestResult(null), 5000);

    } catch (error) {
      console.error('❌ Erro no teste:', error);
      setTestResult({ success: false, message: 'Erro interno no teste' });
    } finally {
      setTesting(null);
    }
  };

  const handleSelectAll = () => {
    const allIds = displayCategories.map(cat => cat.id);
    setSelectedCategories(allIds);

    if (externalOnChange) {
      externalOnChange(allIds);
    } else {
      handlePreferencesChange(allIds);
    }
  };

  const handleSelectNone = () => {
    setSelectedCategories([]);

    if (externalOnChange) {
      externalOnChange([]);
    } else {
      handlePreferencesChange([]);
    }
  };

  // ✅ FUNÇÃO PARA ENVIAR NOTIFICAÇÃO QUANDO CATEGORIA É ATIVADA
  const sendCategoryActivationNotification = async (category: Category) => {
    try {
      // ✅ USAR PROPRIEDADES CORRETAS COM FALLBACKS
      const categoryName = category.name || category.nome || 'Categoria';
      const storeName = category.store_name || '';

      const message = `🔔 Agora você receberá notificações sobre novos produtos na categoria "${categoryName}"${
        storeName ? ` da loja ${storeName}` : ''
      }!`;

      await notificationService.sendPushNotification(
        '📋 Categoria Ativada!',
        message,
        {
          category: 'preferencias',
          type: 'category_activated',
          categoryId: category.id,
          categoryName: categoryName,
          storeId: category.store_id || category.loja_id,
          storeName: storeName,
          url: '/cliente/produtos',
          action: 'view_products',
          timestamp: new Date().toISOString()
        }
      );

      console.log('✅ Notificação de ativação de categoria enviada');
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de ativação:', error);
    }
  };

  // ✅ FUNÇÃO PARA SIMULAR ADIÇÃO DE PRODUTO PELO LOJISTA (para teste)
  const simulateProductAdded = (categoryId: string) => {
    const category = displayCategories.find(cat => cat.id === categoryId);
    if (!category) return;

    const mockProduct: Product = {
      id: `prod-${Date.now()}`,
      nome: `Novo Produto em ${category.name || category.nome}`,
      descricao: `Produto recém-adicionado na categoria ${category.name || category.nome}`,
      preco: Math.random() * 100 + 10,
      estoque: Math.floor(Math.random() * 10) + 1,
      loja_id: category.store_id || category.loja_id || currentStoreId || 'default-store',
      categoria_id: categoryId,
      foto_url: '/default-product.png',
      tamanhos: ['P', 'M', 'G'],
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Envia notificação para o cliente
    sendNewProductNotification(mockProduct, category);

    // Abre o modal de reserva automaticamente
    handleOpenReservationModal(mockProduct);
  };

  // ✅ FUNÇÃO PARA ENVIAR NOTIFICAÇÃO DE NOVO PRODUTO
  const sendNewProductNotification = async (product: Product, category: Category) => {
    try {
      const price = product.preco || 0;
      const categoryName = category.name || category.nome || 'Categoria';
      const message = `🆕 Novo produto em ${categoryName}: ${product.nome} por R$ ${price.toFixed(2)}`;

      await notificationService.sendPushNotification(
        '🛍️ Novo Produto na Sua Categoria!',
        message,
        {
          category: 'novo_produto',
          type: 'new_product_in_preferred_category',
          productId: product.id,
          productName: product.nome,
          categoryId: category.id,
          categoryName: categoryName,
          price: price,
          storeId: product.loja_id,
          storeName: category.store_name,
          url: `/cliente/produto/${product.id}`,
          action: 'open_reserve_modal',
          timestamp: new Date().toISOString()
        }
      );

      console.log('✅ Notificação de novo produto enviada');
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de novo produto:', error);
    }
  };

  // ✅ FUNÇÃO PARA BUSCAR FUNCIONÁRIOS DO SUPABASE REAL
  const fetchEmployees = async (storeId: string): Promise<Employee[]> => {
    try {
      console.log('🔍 Buscando funcionários do Supabase para loja:', storeId);

      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('loja_id', storeId)
        .eq('ativo', true);

      if (error) {
        console.error('❌ Erro ao buscar funcionários no Supabase:', error);
        throw error;
      }

      console.log('✅ Funcionários encontrados:', data?.length || 0);

      const employees: Employee[] = (data || []).map((funcionario: any) => ({
        id: funcionario.id,
        nome: funcionario.nome,
        name: funcionario.nome,
        whatsapp: funcionario.whatsapp,
        email: funcionario.email,
        cargo: funcionario.cargo,
        loja_id: funcionario.loja_id,
        foto_url: funcionario.foto_url,
        foto: funcionario.foto,
        photoUrl: funcionario.foto_url,
        ativo: funcionario.ativo,
        created_at: funcionario.created_at,
        updated_at: funcionario.updated_at,
        hasCustomPhoto: !!funcionario.foto_url,
        productPreco: 0
      }));

      return employees;

    } catch (error) {
      console.error('❌ Erro ao buscar funcionários:', error);
      return [];
    }
  };

  // ✅ FUNÇÃO PARA ABRIR MODAL DE RESERVA
  const handleOpenReservationModal = async (product: Product) => {
    try {
      if (!product.loja_id) {
        console.error('❌ Loja ID não definido no produto');
        return;
      }

      const fetchedEmployees = await fetchEmployees(product.loja_id);

      setSelectedProduct(product);
      setEmployees(fetchedEmployees);
      setReservationModalOpen(true);

      console.log('📱 Abrindo modal de reserva para:', product.nome);
      console.log('👥 Funcionários disponíveis:', fetchedEmployees.length);
    } catch (error) {
      console.error('❌ Erro ao abrir modal de reserva:', error);
    }
  };

  // ✅ FUNÇÃO PARA PROCESSAR RESERVA
  const handleReserve = async (employeeId: string, quantidade: number, tamanho?: string) => {
    try {
      console.log('✅ Reserva processada:', {
        product: selectedProduct?.nome,
        employeeId,
        quantidade,
        tamanho,
        category: selectedProduct?.categoria_id
      });

      await notificationService.sendPushNotification(
        '✅ Reserva Solicitada!',
        `Sua reserva de ${selectedProduct?.nome} foi enviada para o funcionário.`,
        {
          category: 'reserva',
          type: 'reservation_requested',
          productId: selectedProduct?.id,
          productName: selectedProduct?.nome,
          employeeId: employeeId,
          timestamp: new Date().toISOString()
        }
      );

    } catch (error) {
      console.error('❌ Erro ao processar reserva:', error);
      throw error;
    }
  };

  // ✅ ESCUTAR EVENTOS DE NOTIFICAÇÃO EXTERNOS
  useEffect(() => {
    const handleExternalNotification = (event: CustomEvent) => {
      const { action, productId, productName, price, storeId, categoryId, categoryName } = event.detail;

      if (action === 'open_reserve_modal') {
        const validStoreId = storeId || 'default-store';

        const product: Product = {
          id: productId,
          nome: productName,
          preco: price || 0,
          loja_id: validStoreId,
          categoria_id: categoryId,
          estoque: 5,
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          descricao: `Produto notificado da categoria ${categoryName}`,
          foto_url: '/default-product.png',
          tamanhos: ['Único']
        };

        handleOpenReservationModal(product);
      }
    };

    window.addEventListener('notificationProductClick', handleExternalNotification as EventListener);

    return () => {
      window.removeEventListener('notificationProductClick', handleExternalNotification as EventListener);
    };
  }, []);

  // ✅ CORREÇÃO: Função para limpar cache
  const clearCategoriesCache = useCallback(() => {
    setCategoriesCache(new Map());
    console.log('🧹 Cache de categorias limpo');
    addNotification('Cache limpo com sucesso', 'success');
  }, [addNotification]);

  // ✅ CORREÇÃO: Handler para o botão de limpar cache que funciona com onClick
  const handleClearCacheClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    clearCategoriesCache();
  }, [clearCategoriesCache]);

  // ✅ DETERMINAR LOADING STATUS
  const isLoading = externalLoading || localLoading || categoriesLoading || storeLoading;

  // ✅ CORREÇÃO: Renderizar informações de performance
  const renderPerformanceInfo = () => (
    <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>⚡</span>
          <span>Performance:</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Cache: {categoriesCache.size} lojas</span>
          <span>Tentativas: {loadAttempts}/{maxLoadAttempts}</span>
          <button
            onClick={handleClearCacheClick}
            className="text-blue-600 hover:text-blue-800 text-xs"
          >
            Limpar Cache
          </button>
          <button
            onClick={handleForceRefreshClick}
            className="text-green-600 hover:text-green-800 text-xs"
            disabled={storeLoading}
          >
            {storeLoading ? '🔄' : '↻'} Atualizar
          </button>
        </div>
      </div>

      {!browserCompatible && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          ⚠️ Compatibilidade limitada - algumas funcionalidades podem não estar disponíveis
        </div>
      )}
    </div>
  );

  // ✅ RENDERIZAÇÃO DO COMPONENTE
  const renderContent = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* HEADER DO COMPONENTE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {title || (isScreenMode && hasStoreContext && storeCategories.length > 0
              ? "Categorias da Loja"
              : "Categorias Preferidas")}
          </h2>
          <p className="text-gray-600 mt-1">
            {description || (isScreenMode && hasStoreContext && storeCategories.length > 0
              ? `Selecione as categorias específicas desta loja que você tem interesse. Você receberá notificações apenas quando houver novidades nestas categorias.`
              : `Selecione as categorias que você tem interesse. Você receberá notificações apenas quando houver novidades nestas categorias.`)}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            disabled={displayCategories.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center"
          >
            ✅ Selecionar Todas
          </button>
          <button
            onClick={handleSelectNone}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center"
          >
            🗑️ Limpar
          </button>
        </div>
      </div>

      {/* ✅ ATUALIZAÇÃO: RESULTADO DO TESTE */}
      {testResult && (
        <div className={`mb-4 p-3 rounded-lg ${
          testResult.success
            ? 'bg-green-100 border border-green-400 text-green-700'
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <div className="flex items-center">
            <span className="text-lg mr-2">{testResult.success ? '✅' : '❌'}</span>
            {testResult.message}
          </div>
        </div>
      )}

      {/* LISTA DE CATEGORIAS */}
      <div className="space-y-3">
        {displayCategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>Nenhuma categoria disponível</p>
            <p className="text-sm mt-1">Escaneie uma loja para ver categorias específicas</p>
          </div>
        ) : (
          displayCategories.map(category => {
            const isSelected = selectedCategories.includes(category.id);
            const isRecentlyEnabled = recentlyEnabledCategories.includes(category.id);
            const isTesting = testing === category.id;

            return (
              <div
                key={category.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-300 ${
                  isSelected
                    ? isRecentlyEnabled
                      ? 'border-blue-300 bg-blue-50 shadow-sm animate-pulse'
                      : 'border-green-300 bg-green-50 shadow-sm'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xl ${
                      isSelected ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {isSelected ? '✅' : '⚪'}
                    </span>
                    <h3 className={`font-medium transition-colors duration-300 ${
                      isSelected
                        ? isRecentlyEnabled
                          ? 'text-blue-800'
                          : 'text-green-800'
                        : 'text-gray-900'
                    }`}>
                      {category.name || category.nome}
                    </h3>
                    {/* ✅ VERIFICAÇÃO CORRETA DE store_id */}
                    {(category.store_id || category.loja_id) && (
                      <span className={`text-xs px-2 py-1 rounded transition-colors duration-300 ${
                        isSelected
                          ? isRecentlyEnabled
                            ? 'bg-blue-200 text-blue-800'
                            : 'bg-green-200 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        🏪 Loja
                      </span>
                    )}
                    {isRecentlyEnabled && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded animate-bounce">
                        Novo!
                      </span>
                    )}
                  </div>
                  {category.description && (
                    <p className={`text-sm mt-1 transition-colors duration-300 ${
                      isSelected
                        ? isRecentlyEnabled
                          ? 'text-blue-700'
                          : 'text-green-700'
                        : 'text-gray-600'
                    }`}>
                      {category.description}
                    </p>
                  )}
                  {isSelected && (
                    <div className="flex items-center mt-2 text-xs text-green-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                      Notificações ativas
                    </div>
                  )}
                  {/* ✅ VERIFICAÇÃO CORRETA DE store_name */}
                  {category.store_name && (
                    <p className="text-xs text-gray-500 mt-1">
                      Loja: {category.store_name}
                    </p>
                  )}

                  {/* BOTÃO DE TESTE - SIMULAR PRODUTO NOVO */}
                  {isSelected && isClienteContext && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => simulateProductAdded(category.id)}
                        className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded transition-colors"
                      >
                        🧪 Testar Notificação
                      </button>
                      <span className="text-xs text-gray-500">
                        Simula produto novo nesta categoria
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {/* ✅ ATUALIZAÇÃO: BOTÃO DE TESTE SIMPLES */}
                  <button
                    onClick={() => testNotification(category.id)}
                    disabled={isTesting || !isSelected}
                    className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    } ${isTesting ? 'opacity-50' : ''}`}
                  >
                    {isTesting ? '🧪...' : 'Testar'}
                  </button>

                  {/* TOGGLE BUTTON */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="sr-only peer"
                      disabled={isTesting}
                    />
                    <div className={`
                      w-11 h-6 rounded-full peer
                      transition-all duration-300 ease-in-out
                      ${isSelected
                        ? isRecentlyEnabled
                          ? 'bg-blue-500 shadow-lg shadow-blue-200'
                          : 'bg-green-500 shadow-lg shadow-green-200'
                        : 'bg-gray-300 hover:bg-gray-400'
                      }
                      ${isTesting ? 'opacity-50' : ''}
                    `}>
                      <div className={`
                        absolute top-0.5 left-0.5
                        bg-white rounded-full
                        h-5 w-5
                        transition-all duration-300 ease-in-out
                        transform
                        ${isSelected
                          ? 'translate-x-5 shadow-md'
                          : 'translate-x-0 shadow-sm'
                        }
                        ${isSelected
                          ? isRecentlyEnabled
                            ? 'shadow-blue-300'
                            : 'shadow-green-300'
                          : 'shadow-gray-400'
                        }
                      `} />
                    </div>
                  </label>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ✅ ATUALIZAÇÃO: INFORMAÇÕES DE PERFORMANCE */}
      {renderPerformanceInfo()}

      {/* ✅ ATUALIZAÇÃO: INFORMAÇÕES DO SISTEMA */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-3 flex items-center">
          <span className="mr-2">🎯</span>
          Sistema de Notificações Ativo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
          <div className="flex items-center">
            <span className="mr-2">🔔</span>
            Notificações em tempo real
          </div>
          <div className="flex items-center">
            <span className="mr-2">🎵</span>
            Som de alerta personalizado
          </div>
          <div className="flex items-center">
            <span className="mr-2">📱</span>
            Push notifications no celular
          </div>
          <div className="flex items-center">
            <span className="mr-2">⚡</span>
            Entrega instantânea
          </div>
        </div>
      </div>

      {/* ESTATÍSTICAS E INFORMAÇÕES */}
      <div className={`
        mt-6 p-4 rounded-lg transition-all duration-300
        ${selectedCategories.length > 0
          ? recentlyEnabledCategories.length > 0
            ? 'bg-blue-50 border border-blue-200'
            : 'bg-green-50 border border-green-200'
          : 'bg-gray-50 border border-gray-200'
        }
      `}>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className={`
              text-2xl font-bold transition-colors duration-300
              ${selectedCategories.length > 0
                ? recentlyEnabledCategories.length > 0
                  ? 'text-blue-600'
                  : 'text-green-600'
                : 'text-blue-600'
              }
            `}>
              {selectedCategories.length}
            </div>
            <div className={`
              text-sm transition-colors duration-300
              ${selectedCategories.length > 0
                ? recentlyEnabledCategories.length > 0
                  ? 'text-blue-700'
                  : 'text-green-700'
                : 'text-gray-600'
              }
            `}>
              Categorias Selecionadas
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">
              {displayCategories.length}
            </div>
            <div className="text-sm text-gray-600">
              Total Disponível
            </div>
          </div>
        </div>

        {/* BARRA DE PROGRESSO VISUAL */}
        {displayCategories.length > 0 && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`
                  h-2 rounded-full transition-all duration-500 ease-out
                  ${selectedCategories.length > 0
                    ? recentlyEnabledCategories.length > 0
                      ? 'bg-blue-500'
                      : 'bg-green-500'
                    : 'bg-blue-500'
                  }
                `}
                style={{
                  width: `${(selectedCategories.length / displayCategories.length) * 100}%`
                }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1 text-center">
              {Math.round((selectedCategories.length / displayCategories.length) * 100)}% selecionado
            </div>
          </div>
        )}

        {/* ALERTA DE NOVAS CATEGORIAS ATIVADAS */}
        {recentlyEnabledCategories.length > 0 && (
          <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <span className="text-lg">🔔</span>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Novas categorias ativadas!
                </p>
                <p className="text-xs">
                  Você receberá notificações de novos produtos nestas categorias.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STATUS DO FUNCIONÁRIO SELECIONADO */}
        {selectedEmployee && isClienteContext && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <span className="text-lg">👨‍💼</span>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Funcionário selecionado: {selectedEmployee.nome}
                </p>
                <p className="text-xs">
                  Suas reservas serão enviadas diretamente para {selectedEmployee.nome}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* INSTRUÇÕES DE USO */}
        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 text-purple-800">
            <span className="text-lg">💡</span>
            <div className="flex-1">
              <p className="text-sm font-medium">
                Como funciona:
              </p>
              <p className="text-xs">
                • Ative categorias para receber notificações de novos produtos
                <br/>
                {isClienteContext && "• Clique em \"Testar\" para simular uma notificação"}
                <br/>
                {isClienteContext && "• Ao receber a notificação, clique para abrir direto a reserva"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ✅ RENDERIZAÇÃO DO LOADING
  if (isLoading && !externalLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="w-11 h-6 bg-gray-300 rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }

  // ✅ RENDERIZAÇÃO COMPLETA (MODO SCREEN)
  if (isScreenMode) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* HEADER DA SCREEN */}
          {showHeader && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div className="flex-1">
                {showBackButton && (
                  <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-600 hover:text-gray-800 mb-4 text-sm font-medium transition-colors"
                  >
                    ← Voltar
                  </button>
                )}
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">
                    🎯 Categorias Preferidas
                  </h1>
                  {isLoading && (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  )}
                </div>
                <p className="text-gray-600 mt-2">
                  Escolha as categorias específicas que você deseja receber notificações
                </p>

                {/* STATUS */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {hasStoreContext ? (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      ✅ Loja Ativa
                    </span>
                  ) : (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                      ⚠️ Sem Loja Ativa
                    </span>
                  )}

                  {storeLoading && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      🔄 Carregando categorias...
                    </span>
                  )}

                  {!storeLoading && storeCategories.length > 0 && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                      🏪 {storeCategories.length} categorias da loja
                    </span>
                  )}

                  {!storeLoading && hasStoreContext && storeCategories.length === 0 && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                      ℹ️ Loja sem categorias
                    </span>
                  )}

                  {error && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                      ❌ Erro
                    </span>
                  )}

                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                    {selectedCategories.length} selecionadas
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* AVISOS DA SCREEN */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="text-red-600 text-lg">❌</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800">Erro ao carregar categorias</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                  <p className="text-red-600 text-xs mt-2">
                    StoreId: {currentStoreId}
                  </p>
                </div>
                <button
                  onClick={handleForceRefreshClick}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            </div>
          )}

          {!hasStoreContext && !error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="text-yellow-600 text-lg">📱</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800">Escaneie uma Loja</h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    Para ver categorias específicas desta loja e receber notificações personalizadas.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/cliente/scanear')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                  Escanear QR Code
                </button>
              </div>
            </div>
          )}

          {hasStoreContext && storeCategories.length > 0 && !error && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="text-purple-600 text-lg">🏪</div>
                <div>
                  <h3 className="font-semibold text-purple-800">Categorias da Loja</h3>
                  <p className="text-purple-700 text-sm mt-1">
                    Esta loja tem {storeCategories.length} categorias específicas disponíveis.
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasStoreContext && !storeLoading && storeCategories.length === 0 && !error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="text-yellow-600 text-lg">ℹ️</div>
                <div>
                  <h3 className="font-semibold text-yellow-800">Loja sem Categorias Específicas</h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    Esta loja ainda não tem categorias específicas cadastradas.
                    Você pode usar as categorias globais disponíveis.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CONTEÚDO PRINCIPAL */}
          {renderContent()}

          {/* INFORMAÇÕES ADICIONAIS DA SCREEN */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">🎯 Como Funciona?</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Você só recebe notificações das categorias selecionadas</li>
                <li>• Notificações de outras categorias são filtradas automaticamente</li>
                <li>• Pode alterar suas preferências a qualquer momento</li>
                {hasStoreContext && storeCategories.length > 0 && (
                  <li>• Categorias específicas desta loja estão marcadas com 🏪</li>
                )}
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">💡 Dica</h3>
              <p className="text-sm text-green-700">
                Selecione apenas as categorias que realmente te interessam para receber
                notificações mais relevantes e evitar spam.
              </p>
            </div>
          </div>
        </div>

        {/* MODAL DE RESERVA */}
        {selectedProduct && (
          <ReserveModal
            isOpen={reservationModalOpen}
            onClose={() => setReservationModalOpen(false)}
            onReserve={handleReserve}
            employees={employees}
            product={selectedProduct}
            // ✅ CORREÇÃO: USAR PROPRIEDADES CORRETAS COM FALLBACK
            storeName={displayCategories.find(cat => cat.id === selectedProduct.categoria_id)?.store_name || "Loja Connect"}
          />
        )}
      </div>
    );
  }

  // ✅ RENDERIZAÇÃO STANDALONE (COMPONENTE PURA)
  return (
    <>
      {renderContent()}

      {/* MODAL DE RESERVA */}
      {selectedProduct && (
        <ReserveModal
          isOpen={reservationModalOpen}
          onClose={() => setReservationModalOpen(false)}
          onReserve={handleReserve}
          employees={employees}
          product={selectedProduct}
          // ✅ CORREÇÃO: USAR PROPRIEDADES CORRETAS COM FALLBACK
          storeName={displayCategories.find(cat => cat.id === selectedProduct.categoria_id)?.store_name || "Loja Connect"}
        />
      )}
    </>
  );
};

// ✅ HOOK PERSONALIZADO PARA INTEGRAÇÃO COM NOTIFICAÇÕES (MANTIDO)
export const useCategoryNotifications = () => {
  const sendNewProductNotification = async (productData: {
    product_id: string;
    product_name: string;
    category_id: string;
    category_name: string;
    price: number;
    store_id: string;
    store_name: string;
  }) => {
    try {
      await notificationService.sendPushNotification(
        '🆕 Novo Produto na Sua Categoria!',
        `Novo ${productData.product_name} por R$ ${productData.price.toFixed(2)} em ${productData.category_name}`,
        {
          category: 'novo_produto',
          type: 'new_product_in_preferred_category',
          productId: productData.product_id,
          productName: productData.product_name,
          categoryId: productData.category_id,
          categoryName: productData.category_name,
          price: productData.price,
          storeId: productData.store_id,
          storeName: productData.store_name,
          url: `/cliente/produto/${productData.product_id}`,
          action: 'open_reserve_modal',
          timestamp: new Date().toISOString()
        }
      );
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de novo produto:', error);
      return false;
    }
  };

  const sendCategoryActivationNotification = async (category: Category) => {
    try {
      await notificationService.sendPushNotification(
        '📋 Categoria Ativada!',
        `Agora você receberá notificações sobre novos produtos em "${category.name || category.nome}"`,
        {
          category: 'preferencias',
          type: 'category_activated',
          categoryId: category.id,
          categoryName: category.name || category.nome || 'Categoria',
          storeId: category.store_id || category.loja_id,
          storeName: category.store_name,
          url: '/cliente/produtos',
          action: 'view_products',
          timestamp: new Date().toISOString()
        }
      );
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de ativação:', error);
      return false;
    }
  };

  return {
    sendNewProductNotification,
    sendCategoryActivationNotification
  };
};

export default CategoryPreferences;
