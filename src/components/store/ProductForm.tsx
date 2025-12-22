// src/components/store/ProductForm.tsx - VERSÃO CORRIGIDA COM CAMPOS OPCIONAIS
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCategories } from "../../hooks/useCategorias";
import { useSupabase } from "../../hooks/useSupabase";
import { supabase } from "../../services/supabase";
import { ParcelamentoOptions, ProductData } from "../../types/ProductData";

interface ProductFormState extends Omit<ProductData, 'parcelamento'> {
  sizes: string[];
  images: string[];
  parcelamento?: ParcelamentoOptions;
  preco: number;
  categoria_id?: string;
}

export default function ProductForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createProduct, uploadImage } = useSupabase();
  const { categories, loading: categoriesLoading } = useCategories();

 const [formData, setFormData] = useState<ProductFormState>({
  id: "",
  nome: "",
  descricao: "",
  categoria_id: "",
  name: "",
  description: "",
  price: 0,
  store_id: "",
  created_at: "",
  updated_at: "",

  preco: 0,
  estoque: 0,
  sizes: [],
  images: [],
  parcelamento: {
    habilitado: false,
    max_parcelas: 1,
    juros: 0,
    product: "" ,

  }
});

  const [foto, setFoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sizeInput, setSizeInput] = useState("");
  const [storeId, setStoreId] = useState<string>("");

  const opcoesParcelas = [1, 2, 3, 4, 5, 6, 10, 12];

  useEffect(() => {
    if (user?.lojaId) {
      setStoreId(user.lojaId);
    }
  }, [user]);

  const addSize = () => {
    if (sizeInput.trim() && !formData.sizes.includes(sizeInput.trim())) {
      setFormData(prev => ({
        ...prev,
        sizes: [...prev.sizes, sizeInput.trim()]
      }));
      setSizeInput("");
    }
  };

  const removeSize = (size: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter(t => t !== size)
    }));
  };

  const handleParcelamentoToggle = (habilitado: boolean) => {
    if (habilitado) {
      setFormData(prev => ({
        ...prev,
        parcelamento: {
          habilitado: true,
          max_parcelas: prev.parcelamento?.max_parcelas || 1,
          juros: prev.parcelamento?.juros || 0,
          product: prev.parcelamento?.product || ""
        }
      }));
    } else {
      setFormData(prev => {
        const newData = { ...prev };
        delete newData.parcelamento;
        return newData;
      });
    }
  };

  const handleMaxParcelasChange = (max_parcelas: number) => {
    setFormData(prev => ({
      ...prev,
      parcelamento: {
        ...(prev.parcelamento || {
          habilitado: true,
          juros: 0,
          product: ""
        }),
        max_parcelas
      }
    }));
  };

  const handleJurosChange = (juros: number) => {
    setFormData(prev => ({
      ...prev,
      parcelamento: {
        ...(prev.parcelamento || {
          habilitado: true,
          max_parcelas: 1,
          product: ""
        }),
        juros
      }
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl]
      }));
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro ao fazer upload da imagem");
    } finally {
      setUploading(false);
    }
  };

  const handleFotoUpload = async (): Promise<string | undefined> => {
    if (!foto) return undefined;

    try {
      const publicUrl = await uploadImage(foto);
      return publicUrl;
    } catch (error) {
      console.error("Erro no upload da imagem:", error);
      throw new Error("Falha no upload da imagem");
    }
  };

  // ✅ FUNÇÃO CORRIGIDA: Notificar clientes interessados na categoria
  const notifyClientsByCategory = async (productName: string, categoriaId?: string) => {
    if (!categoriaId) {
      console.warn('❌ Nenhuma categoria ID fornecido');
      return;
    }

    try {
      console.log(`🔄 Buscando clientes interessados na categoria ID: ${categoriaId}`);

      // Buscar nome da categoria para a mensagem
      const categoria = categories.find(c => c.id === categoriaId);
      const categoriaNome = categoria?.nome || 'Categoria';

      // ✅ CORREÇÃO PRINCIPAL: Buscar da tabela categorias_clientes usando categoria_id
      const { data: categoriasClientes, error: categoriasError } = await supabase
        .from('categorias_clientes')
        .select(`
          cliente_id,
          clientes (
            id,
            nome,
            email,
            preferred_categories
          )
        `)
        .eq('categoria_id', categoriaId);

      if (categoriasError) {
        console.error('❌ Erro ao buscar categorias_clientes:', categoriasError);

        // Fallback: tentar buscar por nome da categoria na tabela users
        if (categoriasError.code === '42P01') {
          console.log('🔄 Tabela categorias_clientes não existe, usando fallback...');
          await notifyClientsByCategoryFallback(productName, categoriaNome);
          return;
        }
        return;
      }

      if (!categoriasClientes || categoriasClientes.length === 0) {
        console.log(`👥 Nenhum cliente encontrado interessado na categoria ${categoriaNome}`);
        return;
      }

      // Extrair clientes únicos
      const clientesInteressados = categoriasClientes
        .map(item => item.clientes)
        .filter((cliente): cliente is any => cliente !== null && typeof cliente === 'object')
        .filter((cliente, index, self) =>
          index === self.findIndex(c => c.id === cliente.id)
        );

      console.log(`👥 ${clientesInteressados.length} clientes interessados na categoria ${categoriaNome}`);

      if (clientesInteressados.length === 0) return;

      // Criar notificações para cada cliente interessado
      const notifications = clientesInteressados.map(cliente => ({
        user_id: cliente.id,
        type: 'novo_produto',
        title: '🆕 Novo Produto Disponível!',
        message: `🎉 ${productName} foi adicionado na categoria ${categoriaNome}`,
        category: categoriaNome,
        data: {
          product_name: productName,
          category_name: categoriaNome,
          category_id: categoriaId,
          store_id: storeId
        },
        read: false,
        created_at: new Date().toISOString()
      }));

      // Inserir notificações em lote
      const { error: notificationError } = await supabase
        .from('notificacoes')
        .insert(notifications);

      if (notificationError) {
        console.error('❌ Erro ao criar notificações:', notificationError);
        return;
      }

      console.log(`✅ ${notifications.length} notificações criadas para clientes interessados`);

      // Enviar notificações push
      await sendPushNotificationsToInterestedUsers(clientesInteressados, productName, categoriaNome);

    } catch (error) {
      console.error('❌ Erro no sistema de notificação:', error);
    }
  };

  // ✅ FALLBACK: Buscar por nome da categoria (para compatibilidade)
  const notifyClientsByCategoryFallback = async (productName: string, categoriaNome: string) => {
    try {
      console.log(`🔄 Usando fallback: buscando por nome da categoria "${categoriaNome}"`);

      // Buscar usuários que têm esta categoria nas preferências
      const { data: usersWithPreferences, error: usersError } = await supabase
        .from('users')
        .select('id, nome, preferred_categories')
        .contains('preferred_categories', [categoriaNome]);

      if (usersError) {
        console.error('❌ Erro ao buscar usuários com preferências:', usersError);
        return;
      }

      // Buscar também da tabela clientes
      const { data: clientesWithPreferences, error: clientesError } = await supabase
        .from('clientes')
        .select('id, nome, preferred_categories')
        .contains('preferred_categories', [categoriaNome]);

      if (clientesError) {
        console.warn('⚠️ Erro ao buscar clientes com preferências:', clientesError);
      }

      // Combinar resultados
      const allInterestedUsers = [
        ...(usersWithPreferences || []),
        ...(clientesWithPreferences || [])
      ];

      console.log(`👥 ${allInterestedUsers.length} usuários interessados na categoria ${categoriaNome} (fallback)`);

      if (allInterestedUsers.length === 0) return;

      // Criar notificações
      const notifications = allInterestedUsers.map(user => ({
        user_id: user.id,
        type: 'novo_produto',
        title: '🆕 Novo Produto Disponível!',
        message: `🎉 ${productName} foi adicionado na categoria ${categoriaNome}`,
        category: categoriaNome,
        data: {
          product_name: productName,
          category_name: categoriaNome,
          store_id: storeId
        },
        read: false,
        created_at: new Date().toISOString()
      }));

      const { error: notificationError } = await supabase
        .from('notificacoes')
        .insert(notifications);

      if (notificationError) {
        console.error('❌ Erro ao criar notificações (fallback):', notificationError);
        return;
      }

      console.log(`✅ ${notifications.length} notificações criadas via fallback`);

    } catch (error) {
      console.error('❌ Erro no sistema de notificação fallback:', error);
    }
  };

  // ✅ FUNÇÃO: Enviar notificações push para usuários com subscriptions
  const sendPushNotificationsToInterestedUsers = async (
    users: any[],
    productName: string,
    categoryName: string
  ) => {
    try {
      const usersWithSubscriptions = [];

      // Buscar subscriptions para cada usuário
      for (const user of users) {
        const { data: subscriptions, error: subError } = await supabase
          .from('push_subscriptions')
          .select('subscription')
          .eq('user_id', user.id);

        if (!subError && subscriptions && subscriptions.length > 0) {
          usersWithSubscriptions.push({
            ...user,
            push_subscriptions: subscriptions
          });
        }
      }

      console.log(`📱 ${usersWithSubscriptions.length} usuários com push subscriptions`);

      if (usersWithSubscriptions.length === 0) return;

      // Enviar notificações push
      for (const user of usersWithSubscriptions) {
        for (const subscriptionItem of user.push_subscriptions) {
          try {
            const subscription = subscriptionItem.subscription;

            // Enviar notificação push via Service Worker
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: 'SEND_PUSH_NOTIFICATION',
                data: {
                  subscription,
                  payload: {
                    title: '🆕 Novo Produto!',
                    body: `${productName} na categoria ${categoryName}`,
                    icon: '/icon-192x192.png',
                    tag: 'new-product',
                    data: {
                      url: `/produtos?categoria=${categoryName}`,
                      type: 'new_product',
                      productName,
                      categoryName
                    }
                  }
                }
              });
            }
          } catch (pushError) {
            console.error('❌ Erro ao enviar notificação push:', pushError);
          }
        }
      }

      console.log(`🚀 Notificações push enviadas para ${usersWithSubscriptions.length} usuários`);

    } catch (error) {
      console.error('❌ Erro no sistema de push notifications:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) {
      alert("Loja não identificada");
      return;
    }

    if (!formData.categoria_id) {
      alert("Por favor, selecione uma categoria");
      return;
    }

    setLoading(true);

    try {
      // Upload de fotos
      let fotoUrl = undefined;
      if (formData.images.length > 0) {
        fotoUrl = formData.images[0];
      } else if (foto) {
        fotoUrl = await handleFotoUpload();
      }

      // Preparar dados do parcelamento
      const parcelamentoData = formData.parcelamento?.habilitado ? {
        habilitado: true,
        max_parcelas: formData.parcelamento.max_parcelas,
        juros: formData.parcelamento.juros,
        product: formData.parcelamento.product || ""
      } : undefined;

      // Criar produto
      await createProduct(storeId, {
        nome: formData.nome,
        descricao: formData.descricao,
        categoria_id: formData.categoria_id,
        preco: formData.preco,
        estoque: formData.estoque,
        foto_url: fotoUrl,
        tamanhos: formData.sizes.length > 0 ? formData.sizes : undefined,
        parcelamento: parcelamentoData
      });

      // ✅ CORREÇÃO APLICADA: Notificar clientes interessados
      await notifyClientsByCategory(formData.name, formData.categoria_id);

      alert("✅ Produto cadastrado com sucesso! Clientes interessados foram notificados.");
      navigate("/loja/produtos");

    } catch (error: any) {
      console.error("❌ Erro ao cadastrar produto:", error);
      alert(error.message || "Erro ao cadastrar produto");
    } finally {
      setLoading(false);
    }
  };

  const calcularPrevisaoParcelas = () => {
    const preco = formData.preco || 0;
    if (!formData.parcelamento?.habilitado || preco <= 0) return [];

    const parcelas = [];
    const { max_parcelas = 1, juros = 0 } = formData.parcelamento;

    for (let i = 1; i <= max_parcelas; i++) {
      if (i === 1) {
        parcelas.push({ numero: 1, valor: preco, total: preco });
      } else {
        const taxaJuros = juros / 100;
        const totalComJuros = preco * Math.pow(1 + taxaJuros, i);
        const valorParcela = totalComJuros / i;

        parcelas.push({
          numero: i,
          valor: parseFloat(valorParcela.toFixed(2)),
          total: parseFloat(totalComJuros.toFixed(2))
        });
      }
    }

    return parcelas;
  };

  const previsaoParcelas = calcularPrevisaoParcelas();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Cadastrar Produto</h1>
            <button
              onClick={() => navigate("/loja/produtos")}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Voltar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome do Produto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Produto *
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Camiseta Básica"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descreva o produto..."
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              {categoriesLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm text-gray-500">Carregando categorias...</span>
                </div>
              ) : (
                <>
                  <select
                    required
                    value={formData.categoria_id || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoria_id: e.target.value || undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma categoria (opcional)</option>
                    {categories.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-yellow-800 text-sm">
                        <strong>⚠️ Nenhuma categoria cadastrada.</strong>
                      </p>
                      <p className="text-yellow-700 text-sm mt-1">
                        Você pode cadastrar produtos sem categoria ou criar categorias primeiro.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/loja/categorias")}
                        className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                      >
                        📁 Criar Categorias
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Preço e Estoque */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.preco}
                  onChange={(e) => setFormData(prev => ({ ...prev, preco: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estoque *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.estoque}
                  onChange={(e) => setFormData(prev => ({ ...prev, estoque: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Seção de Parcelamento */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Opções de Parcelamento (opcional)
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.parcelamento?.habilitado || false}
                    onChange={(e) => handleParcelamentoToggle(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Habilitar parcelamento</span>
                </div>
              </div>

              {formData.parcelamento?.habilitado && (
                <div className="space-y-4">
                  {/* Número de Parcelas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número máximo de parcelas:
                    </label>
                    <select
                      value={formData.parcelamento?.max_parcelas || 1}
                      onChange={(e) => handleMaxParcelasChange(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {opcoesParcelas.map((num) => (
                        <option key={num} value={num}>
                          {num === 1 ? "1x (À vista)" : `${num}x`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Juros */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Juros mensal (%):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      value={formData.parcelamento?.juros || 0}
                      onChange={(e) => handleJurosChange(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Juros aplicados apenas nas parcelas (à vista não tem juros)
                    </p>
                  </div>

                  {/* Pré-visualização das Parcelas */}
                  {formData.preco > 0 && previsaoParcelas.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pré-visualização:
                      </label>
                      <div className="bg-white border rounded-md p-3 max-h-32 overflow-y-auto">
                        {previsaoParcelas.map((parcela) => (
                          <div key={parcela.numero} className="flex justify-between text-sm py-1 border-b last:border-b-0">
                            <span>{parcela.numero}x</span>
                            <span className="font-medium">
                              R$ {parcela.valor?.toFixed(2) || '0.00'}
                              {parcela.numero > 1 && (parcela.total || 0) > formData.preco && (
                                <span className="text-red-500 text-xs ml-1">
                                  (Total: R$ {(parcela.total || 0).toFixed(2)})
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tamanhos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamanhos (opcional)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: P, M, G, 42, 44..."
                />
                <button
                  type="button"
                  onClick={addSize}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>

              {formData.sizes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.sizes.map((size, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm"
                    >
                      {size}
                      <button
                        type="button"
                        onClick={() => removeSize(size)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Upload de Imagens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagens do Produto (opcional)
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {uploading && (
                <p className="text-sm text-gray-500 mt-1">Fazendo upload...</p>
              )}

              {formData.images.length > 0 && (
                <div className="flex space-x-2 mt-2">
                  {formData.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg shadow"
                    />
                  ))}
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ou selecione uma imagem principal:
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFoto(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {foto && (
                  <div className="mt-2">
                    <p className="text-sm text-green-600">Imagem selecionada: {foto.name}</p>
                    <div className="mt-2 max-w-xs">
                      <img
                        src={URL.createObjectURL(foto)}
                        alt="Preview"
                        className="rounded-lg shadow-md"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Informação sobre Notificações */}
            {formData.categoria_id && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-600">🔔</span>
                  <h3 className="font-semibold text-blue-800">Sistema de Notificações</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Clientes que selecionaram esta categoria como preferida receberão uma notificação
                  automática sobre este novo produto, incluindo alerta sonoro no celular.
                </p>
              </div>
            )}

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate("/loja/produtos")}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? "Cadastrando..." : "Cadastrar Produto"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
