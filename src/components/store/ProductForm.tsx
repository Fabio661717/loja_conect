// src/components/store/ProductForm.tsx - VERSÃO COMPLETAMENTE CORRIGIDA COM PRODUCTCARD
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCategories } from "../../hooks/useCategorias";
import { useSupabase } from "../../hooks/useSupabase";
import { notificationSystem } from "../../services/notificationSystem";
import { supabase } from "../../services/supabase"; // ✅ Importação direta do supabase
import { Category } from "../../types/Category";
import { ParcelamentoOptions, Product, ProductData } from "../../types/ProductData";

// ✅ PRODUCT CARD INTEGRADO
import { useNotifications } from "../../context/NotificationContext";

interface ProductFormState extends Omit<ProductData, 'parcelamento'> {
  sizes: string[];
  images: string[];
  parcelamento: ParcelamentoOptions;
  preco: number;
}

// ✅ COMPONENTE PRODUCT CARD INTEGRADO
function ProductCard({ product, userId }: { product: any; userId: string }) {
  const { sendNotification, sendPushNotification } = useNotifications();

  const handleAddToCart = async () => {
    try {
      // Adicionar ao carrinho...
      console.log('🛒 Adicionando produto ao carrinho:', product.nome);

      // Enviar notificação
      await sendNotification(
        userId,
        'Produto Adicionado',
        `${product.nome} foi adicionado ao carrinho!`,
        'success'
      );
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleNotifyPromotion = async () => {
    await sendPushNotification(
      userId,
      'Promoção Especial!',
      `🎉 ${product.nome} com desconto especial para você!`,
      { productId: product.id, discount: 15 }
    );
  };

  return (
    <div className="product-card bg-white rounded-lg shadow-md p-4 border border-gray-200 transition-all duration-300 hover:shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{product.nome}</h3>
      {product.foto_url && (
        <img
          src={product.foto_url}
          alt={product.nome}
          className="w-full h-48 object-cover rounded-md mb-3"
        />
      )}
      <p className="text-gray-600 text-sm mb-3">{product.descricao}</p>
      <div className="flex justify-between items-center mb-3">
        <span className="text-xl font-bold text-green-600">R$ {product.preco?.toFixed(2)}</span>
        <span className="text-sm text-gray-500">Estoque: {product.estoque}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleAddToCart}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200 text-sm font-medium"
        >
          Adicionar ao Carrinho
        </button>
        <button
          onClick={handleNotifyPromotion}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-md transition duration-200 text-sm font-medium"
          title="Notificar sobre promoção"
        >
          🔔
        </button>
      </div>
    </div>
  );
}

export default function ProductForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { uploadImage } = useSupabase();
  const { categories, loading: categoriesLoading } = useCategories();

  const [formData, setFormData] = useState<ProductFormState>({
    id: "",
    nome: "",
    descricao: "",
    categoria_id: "",
    preco: 0,
    estoque: 0,
    sizes: [],
    images: [],
    parcelamento: {
      habilitado: false,
      max_parcelas: 1,
      juros: 0,
      product: ""
    }
  });

  const [foto, setFoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sizeInput, setSizeInput] = useState("");
  const [storeId, setStoreId] = useState<string>("");
  const [previewProduct, setPreviewProduct] = useState<any>(null); // ✅ Estado para preview do produto

  // ✅ OPÇÕES DE PARCELAMENTO DISPONÍVEIS
  const opcoesParcelas = [1, 2, 3, 4, 5, 6, 10, 12];

  useEffect(() => {
    if (user?.lojaId) {
      setStoreId(user.lojaId);
    }
  }, [user]);

  // ✅ ATUALIZAR PREVIEW DO PRODUTO QUANDO FORM MUDAR
  useEffect(() => {
    if (formData.nome || formData.descricao || formData.preco > 0) {
      setPreviewProduct({
        id: 'preview',
        nome: formData.nome || 'Nome do Produto',
        descricao: formData.descricao || 'Descrição do produto...',
        preco: formData.preco,
        estoque: formData.estoque,
        foto_url: formData.images[0] || null,
        categoria_id: formData.categoria_id
      });
    } else {
      setPreviewProduct(null);
    }
  }, [formData]);

  // ✅ FUNÇÃO DE CONVERSÃO: Converte Categoria (com propriedade 'nome') para Category (com propriedade 'name')
  const convertCategoriaToCategory = (categoria: any): Category => {
    return {
      id: categoria.id,
      name: categoria.nome || categoria.name || 'Categoria',
      description: categoria.descricao || categoria.description,
      store_id: categoria.loja_id || categoria.store_id,
      store_name: categoria.store_name,
      source: categoria.source || 'store',
      loja_id: categoria.loja_id,
      nome: categoria.nome,
      descricao: categoria.descricao,
      is_active: categoria.is_active,
      created_at: categoria.created_at,
      updated_at: categoria.updated_at
    };
  };

  // ✅ FUNÇÕES DE TAMANHO
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

  // ✅ HANDLERS PARA PARCELAMENTO
  const handleParcelamentoToggle = (habilitado: boolean) => {
    setFormData(prev => ({
      ...prev,
      parcelamento: {
        ...prev.parcelamento,
        habilitado,
        max_parcelas: habilitado ? prev.parcelamento.max_parcelas : 1,
        product: prev.parcelamento.product || ""
      }
    }));
  };

  const handleMaxParcelasChange = (max_parcelas: number) => {
    setFormData(prev => ({
      ...prev,
      parcelamento: {
        ...prev.parcelamento,
        max_parcelas,
        product: prev.parcelamento.product || ""
      }
    }));
  };

  const handleJurosChange = (juros: number) => {
    setFormData(prev => ({
      ...prev,
      parcelamento: {
        ...prev.parcelamento,
        juros,
        product: prev.parcelamento.product || ""
      }
    }));
  };

  // ✅ UPLOAD DE IMAGEM UNIFICADO
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

  const handleFotoUpload = async (): Promise<string | null> => {
    if (!foto) return null;

    try {
      const publicUrl = await uploadImage(foto);
      return publicUrl;
    } catch (error) {
      console.error("Erro no upload da imagem:", error);
      throw new Error("Falha no upload da imagem");
    }
  };

  // ✅ FUNÇÃO ATUALIZADA: Cadastrar produto com notificação (VERSÃO CORRIGIDA)
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
      console.log("🚀 Iniciando cadastro de produto...");

      // ✅ CORREÇÃO: fotoUrl como string | null
      let fotoUrl: string | null = null;
      if (formData.images.length > 0) {
        fotoUrl = formData.images[0];
      } else if (foto) {
        fotoUrl = await handleFotoUpload();
      }

      console.log("✅ Imagem processada:", fotoUrl);

      // ✅ CORREÇÃO: Payload compatível com banco (usar null)
      const productData = {
        nome: formData.nome,
        descricao: formData.descricao || null,
        categoria_id: formData.categoria_id,
        preco: formData.preco,
        estoque: formData.estoque,
        foto_url: fotoUrl,
        tamanhos: formData.sizes.length > 0 ? formData.sizes : null,
        parcelamento: formData.parcelamento.habilitado ? formData.parcelamento : null,
        ativo: true,
        loja_id: storeId
      };

      console.log("📦 Payload enviado:", productData);

      // ✅ CORREÇÃO: Usar supabase diretamente
      const { data, error } = await supabase
        .from("produtos")
        .insert([productData])
        .select()
        .single();

      if (error) {
        console.error("❌ Erro do Supabase:", error);
        throw error;
      }

      console.log("✅ Produto criado no banco:", data);

      // ✅ CORREÇÃO: Mock product compatível com tipo Product
      const categoria = categories.find(c => c.id === formData.categoria_id);
      if (categoria) {
        // ✅ ATUALIZAÇÃO ADICIONADA: Log detalhado da notificação
        console.log("🔔 Notificando sobre produto:", {
          productId: data?.id,
          productName: productData.nome,
          categoryId: formData.categoria_id,
          categoryName: categoria?.nome,
          storeId: storeId
        });

        const mockProduct: Product = {
          id: data?.id || `temp-${Date.now()}`,
          nome: productData.nome,
          descricao: productData.descricao || undefined,
          categoria_id: productData.categoria_id,
          preco: productData.preco,
          estoque: productData.estoque,
          foto_url: productData.foto_url || undefined,
          tamanhos: productData.tamanhos || undefined,
          parcelamento: productData.parcelamento || undefined,
          loja_id: productData.loja_id,
          ativo: true,
          created_at: data?.created_at || new Date().toISOString(),
          updated_at: data?.updated_at || new Date().toISOString()
        };

        const categoryConverted = convertCategoriaToCategory(categoria);

        // ✅ ATUALIZAÇÃO CRÍTICA: Chamada simplificada - SEM BLOQUEIO
        notificationSystem.notifyNewProduct(mockProduct, categoryConverted)
          .then(success => {
            if (success) {
              console.log("✅ Notificação processada com sucesso");
            } else {
              console.log("⚠️ Notificação usando fallback local");
            }
          })
          .catch(error => {
            console.error("❌ Erro na notificação (não crítico):", error);
            // Não bloquear o fluxo principal - apenas logar o erro
          });
      }

      alert("✅ Produto cadastrado com sucesso!");
      navigate("/loja/produtos");

    } catch (error: any) {
      console.error("❌ Erro completo ao cadastrar produto:", error);
      alert(error.message || "Erro ao cadastrar produto");
    } finally {
      setLoading(false);
    }
  };

  // ✅ CALCULAR PREVISÃO DAS PARCELAS
  const calcularPrevisaoParcelas = () => {
    const preco = formData.preco || 0;
    if (!formData.parcelamento.habilitado || preco <= 0) return [];

    const parcelas = [];
    const { max_parcelas, juros } = formData.parcelamento;

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
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ✅ COLUNA DO FORMULÁRIO */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Cadastrar Produto</h1>
              <button
                onClick={() => navigate("/loja/produtos")}
                className="text-gray-600 hover:text-gray-800 transition duration-200"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
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
                      value={formData.categoria_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, categoria_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    >
                      <option value="">Selecione uma categoria</option>
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
                          Você precisa criar categorias antes de cadastrar produtos.
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate("/loja/categorias")}
                          className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition duration-200"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* ✅ SEÇÃO DE PARCELAMENTO */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Opções de Parcelamento
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.parcelamento.habilitado}
                      onChange={(e) => handleParcelamentoToggle(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition duration-200"
                    />
                    <span className="ml-2 text-sm text-gray-700">Habilitar parcelamento</span>
                  </div>
                </div>

                {formData.parcelamento.habilitado && (
                  <div className="space-y-4">
                    {/* Número de Parcelas */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número máximo de parcelas:
                      </label>
                      <select
                        value={formData.parcelamento.max_parcelas}
                        onChange={(e) => handleMaxParcelasChange(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
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
                        value={formData.parcelamento.juros}
                        onChange={(e) => handleJurosChange(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
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

              {/* ✅ TAMANHOS UNIFICADO */}
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="Ex: P, M, G, 42, 44..."
                  />
                  <button
                    type="button"
                    onClick={addSize}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                  >
                    Add
                  </button>
                </div>

                {/* Lista de tamanhos com melhor visual */}
                {formData.sizes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.sizes.map((size, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm transition duration-200"
                      >
                        {size}
                        <button
                          type="button"
                          onClick={() => removeSize(size)}
                          className="ml-2 text-blue-600 hover:text-blue-800 transition duration-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ✅ UPLOAD DE IMAGENS MULTIPLAS */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagens do Produto
                </label>

                {/* Upload múltiplo */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                />

                {uploading && (
                  <p className="text-sm text-gray-500 mt-1">Fazendo upload...</p>
                )}

                {/* Preview das imagens */}
                {formData.images.length > 0 && (
                  <div className="flex space-x-2 mt-2">
                    {formData.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg shadow transition duration-200"
                      />
                    ))}
                  </div>
                )}

                {/* Upload único (fallback) */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ou selecione uma imagem principal:
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFoto(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  />
                  {foto && (
                    <div className="mt-2">
                      <p className="text-sm text-green-600">Imagem selecionada: {foto.name}</p>
                      <div className="mt-2 max-w-xs">
                        <img
                          src={URL.createObjectURL(foto)}
                          alt="Preview"
                          className="rounded-lg shadow-md transition duration-200"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Informação sobre Notificações */}
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
                  disabled={loading || categories.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                >
                  {loading ? "Cadastrando..." : "Cadastrar Produto"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* ✅ COLUNA DE PREVIEW COM PRODUCT CARD */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6 sticky top-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Preview do Produto</h2>

            {previewProduct ? (
              <>
                <ProductCard
                  product={previewProduct}
                  userId={user?.id || "current-user"}
                />

                {/* ✅ BOTÕES DE TESTE DE NOTIFICAÇÃO */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Testar Notificações</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Teste as notificações do produto antes de cadastrar
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (user?.id) {
                          const { sendNotification } = useNotifications();
                          await sendNotification(
                            user.id,
                            'Preview de Notificação',
                            `Produto "${previewProduct.nome}" - Teste de notificação!`,
                            'info'
                          );
                        } else {
                          alert('Usuário não identificado para teste');
                        }
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm transition duration-200"
                    >
                      Testar Notificação
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📱</div>
                <p>Preencha o formulário para ver o preview do produto</p>
              </div>
            )}

            {/* ✅ INFORMAÇÕES ADICIONAIS */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Como funciona?</h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Clientes recebem notificações push no celular</li>
                <li>• Alertas sonoros para produtos novos</li>
                <li>• Notificações baseadas nas categorias preferidas</li>
                <li>• Funciona mesmo quando o app está fechado</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
