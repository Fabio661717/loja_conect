// components/client/ProductsList.tsx - VERSÃO CORRIGIDA
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../hooks/useAuth";
import { useReservation } from "../../hooks/useReservation";
import { supabase } from "../../services/supabase";
import { Employee } from "../../types/Employee";
import { Product } from "../../types/ProductData";
import GlobalImageGallery from "./GlobalImageGallery";
import ProductCard from "./ProductCard";
import ReserveModal from "./ReserveModal";
import SettingsModal from "./SettingsModal";

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGlobalGalleryOpen, setIsGlobalGalleryOpen] = useState(false);
  const [allProductImages, setAllProductImages] = useState<Array<{
    url: string,
    productName: string,
    productPrice?: number,
    productId: string,
    productStock: number
  }>>([]);
  const [initialImageIndex, setInitialImageIndex] = useState(0);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [selectedProductForReserve, setSelectedProductForReserve] = useState<Product | null>(null);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);

  const { selectedCategories, theme } = useSettings();
  const { user } = useAuth();
  const { createReservation, loading: reservationLoading } = useReservation();
  const navigate = useNavigate();

  // ✅ FUNÇÃO: Coletar TODAS as imagens de TODOS os produtos
  const getAllProductImages = useCallback(() => {
    const images: Array<{
      url: string,
      productName: string,
      productPrice?: number,
      productId: string,
      productStock: number
    }> = [];

    products.forEach(product => {
      const mainImage = product.foto_url || product.image;
      if (mainImage && mainImage !== '/placeholder-product.jpg') {
        images.push({
          url: mainImage,
          productName: product.nome || product.nome,
          productPrice: product.preco,
          productId: product.id,
          productStock: product.estoque
        });
      }

      // Adicionar imagens adicionais se existirem
      if (product.imagens && product.imagens.length > 0) {
        product.imagens.forEach(img => {
          if (img && img !== '/placeholder-product.jpg') {
            images.push({
              url: img,
              productName: product.name || product.nome,
              productPrice: product.preco,
              productId: product.id,
              productStock: product.estoque
            });
          }
        });
      }
    });

    return images;
  }, [products]);

  // ✅ FUNÇÃO: Abrir galeria global começando na imagem específica
  const handleOpenGlobalGallery = useCallback((clickedImageUrl?: string) => {
    const images = getAllProductImages();
    if (images.length > 0) {
      let startIndex = 0;

      // Encontrar o índice da imagem clicada
      if (clickedImageUrl) {
        const foundIndex = images.findIndex(img => img.url === clickedImageUrl);
        if (foundIndex !== -1) {
          startIndex = foundIndex;
        }
      }

      setInitialImageIndex(startIndex);
      setAllProductImages(images);
      setIsGlobalGalleryOpen(true);
    }
  }, [getAllProductImages]);

  // ✅ FUNÇÃO: Reserva direta da galeria - ABRE MODAL DE RESERVA
  const handleReserveFromGallery = useCallback((productId: string) => {
    if (!storeId || !user) {
      alert("Erro: Loja ou usuário não identificado");
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) {
      alert("Erro: Produto não encontrado");
      return;
    }

    // Fechar galeria primeiro
    setIsGlobalGalleryOpen(false);

    // Configurar produto selecionado e abrir modal de reserva
    setSelectedProductForReserve(product);
    setCurrentProductId(productId);
    setIsReserveModalOpen(true);
  }, [storeId, user, products]);

  // ✅ FUNÇÃO: Fechar modal de reserva
  const handleCloseReserveModal = useCallback(() => {
    setIsReserveModalOpen(false);
    setSelectedProductForReserve(null);
    setCurrentProductId(null);
  }, []);

  // ✅ ✅ ✅ CORREÇÃO PRINCIPAL: Função handleReserve compatível com ReserveModal
  const handleReserve = useCallback(async (
    employeeId: string,
    quantidade: number = 1,
    tamanho?: string
  ) => {
    if (!storeId || !currentProductId) {
      alert("Erro: Loja ou produto não identificado");
      return;
    }

    if (!user) {
      alert("Erro: Usuário não autenticado");
      return;
    }

    const product = products.find((p) => p.id === currentProductId);
    const employee = employees.find((e) => e.id === employeeId);

    if (!product) {
      alert("Erro: Produto não encontrado");
      return;
    }

    if (!employee) {
      alert("Erro: Funcionário não encontrado");
      return;
    }

    try {
      const reserva = await createReservation(
        currentProductId,
        storeId,
        quantidade,
        tamanho,
        employeeId
      );

      // Atualizar estoque localmente
      setProducts(prev => prev.map(p =>
        p.id === currentProductId
          ? { ...p, estoque: p.estoque - quantidade }
          : p
      ));

      // Enviar mensagem WhatsApp
      const message = `Olá ${employee.nome}! 👋

📋 *NOVA RESERVA - ${storeName}*

👤 *Cliente:* ${user.nome || user.email}
🛍️ *Produto:* ${product.nome}
${tamanho ? `📏 *Tamanho:* ${tamanho}\n` : ''}🔢 *Quantidade:* ${quantidade}x
⏰ *Retirada até:* ${new Date(reserva.fim_reserva).toLocaleString('pt-BR')}
🆔 *ID da Reserva:* ${reserva.id.slice(-8)}

${product.foto_url ? `📸 *Foto do produto disponível:* ${product.foto_url}` : ''}

💡 *Por favor, prepare o produto para retirada!*

_Atenciosamente,_
_Sistema Loja Connect_`;

      const whatsappUrl = `https://wa.me/${employee.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");

      alert(`✅ Reserva realizada com sucesso!\nID: ${reserva.id.slice(-8)}\nProduto: ${product.nome}`);

      // Fechar modal após reserva bem-sucedida
      handleCloseReserveModal();

    } catch (error: any) {
      console.error('❌ Erro ao criar reserva:', error);

      if (error.message?.includes('Estoque insuficiente')) {
        alert('❌ Estoque insuficiente para realizar a reserva. O estoque pode ter sido atualizado recentemente.');
      } else if (error.message?.includes('Produto não encontrado')) {
        alert('❌ Produto não encontrado. Ele pode ter sido removido.');
      } else {
        alert('❌ Erro ao realizar reserva. Tente novamente.');
      }
    }
  }, [storeId, user, products, employees, storeName, createReservation, handleCloseReserveModal, currentProductId]);

  // ✅ FUNÇÃO: Para uso no ProductCard (mantém a assinatura original)
  const handleReserveForCard = useCallback(async (
    productId: string,
    employeeId: string,
    quantidade: number = 1,
    tamanho?: string
  ) => {
    setCurrentProductId(productId);

    // Chama a função handleReserve com os parâmetros corretos para o ReserveModal
    await handleReserve(employeeId, quantidade, tamanho);
  }, [handleReserve]);

  // ✅ FUNÇÃO OTIMIZADA: Obter URL da foto do funcionário
  const getEmployeePhotoUrl = (employee: any): string => {
    const hasCustomPhoto = !!(employee.foto_url || employee.foto);

    if (!hasCustomPhoto) {
      return "/default-avatar.png";
    }

    if (employee.foto_url) {
      if (employee.foto_url.startsWith("http")) {
        return `${employee.foto_url}?t=${new Date().getTime()}`;
      }

      try {
        const { data } = supabase.storage
          .from("funcionarios-fotos")
          .getPublicUrl(employee.foto_url);
        return `${data.publicUrl}?t=${new Date().getTime()}`;
      } catch (error) {
        console.error("❌ Erro ao gerar URL do storage:", error);
      }
    }

    if (employee.foto) {
      if (employee.foto.startsWith("http")) {
        return `${employee.foto}?t=${new Date().getTime()}`;
      }

      try {
        const { data } = supabase.storage
          .from("funcionarios-fotos")
          .getPublicUrl(employee.foto);
        return `${data.publicUrl}?t=${new Date().getTime()}`;
      } catch (error) {
        console.error("❌ Erro ao gerar URL do storage (fallback):", error);
      }
    }

    return "/default-avatar.png";
  };

  useEffect(() => {
    const storedId = localStorage.getItem("storeId");
    if (!storedId) {
      setLoading(false);
      return;
    }
    setStoreId(storedId);

    const fetchData = async () => {
      setLoading(true);

      try {
        // Buscar dados da loja
        const { data: storeData } = await supabase
          .from("lojas")
          .select("nome")
          .eq("id", storedId)
          .single();

        if (storeData) {
          setStoreName(storeData.nome);
        }

        // Buscar produtos
        const { data: produtosData, error: produtosError } = await supabase
          .from("produtos")
          .select("*")
          .eq("loja_id", storedId)
          .eq("ativo", true)
          .order("nome");

        if (produtosError) {
          console.error("Erro ao buscar produtos:", produtosError);
        } else {
          const mappedProducts: Product[] = (produtosData || []).map((item: any) => ({
            id: item.id,
            nome: item.nome,
            name: item.nome,
            image: item.foto_url || "/placeholder-product.jpg",
            foto_url: item.foto_url || "/placeholder-product.jpg",
            estoque: item.estoque || 0,
            descricao: item.descricao || '',
            preco: item.preco || 0,
            categoria: item.categoria || '',
            categoria_id: item.categoria_id || '',
            tamanhos: item.tamanhos || [],
            loja_id: item.loja_id,
            ativo: item.ativo !== undefined ? item.ativo : true,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString()
          }));
          setProducts(mappedProducts);
        }

        // Buscar funcionários COMPLETOS
        const { data: employeesData, error: employeesError } = await supabase
          .from("funcionarios")
          .select(`
            id,
            nome,
            whatsapp,
            email,
            cargo,
            loja_id,
            foto_url,
            foto,
            ativo,
            created_at,
            updated_at
          `)
          .eq("loja_id", storedId)
          .eq("ativo", true)
          .order("nome");

        if (employeesError) {
          console.error("Erro ao buscar funcionários:", employeesError);
        } else {
          const mappedEmployees: Employee[] = (employeesData || []).map((item: any) => {
            const hasCustomPhoto = !!(item.foto_url || item.foto);
            const photoUrl = getEmployeePhotoUrl(item);

            return {
              id: item.id,
              nome: item.nome || "Funcionário Sem Nome",
              name: item.nome || "Funcionário Sem Nome",
              whatsapp: item.whatsapp || "N/A",
              email: item.email,
              cargo: item.cargo || "Atendente",
              loja_id: item.loja_id,
              foto_url: item.foto_url,
              foto: item.foto,
              photoUrl: photoUrl,
              ativo: item.ativo !== undefined ? item.ativo : true,
              created_at: item.created_at,
              updated_at: item.updated_at,
              hasCustomPhoto: hasCustomPhoto
            };
          });

          setEmployees(mappedEmployees || []);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Configurar realtime para produtos
    const channel = supabase
      .channel("public:produtos")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "produtos",
          filter: `loja_id=eq.${storedId}`
        },
        (payload: any) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            setProducts((prev) =>
              prev.map((p) =>
                p.id === payload.new.id
                  ? {
                      ...p,
                      estoque: payload.new.estoque,
                      nome: payload.new.nome || p.nome,
                      name: payload.new.nome || p.name,
                      image: payload.new.foto_url || p.image,
                      foto_url: payload.new.foto_url || p.foto_url,
                      preco: payload.new.preco,
                      descricao: payload.new.descricao || p.descricao,
                      categoria: payload.new.categoria || p.categoria,
                      ativo: payload.new.ativo !== undefined ? payload.new.ativo : p.ativo
                    }
                  : p
              )
            );
          } else if (payload.eventType === 'INSERT') {
            setProducts((prev) => [...prev, {
              id: payload.new.id,
              nome: payload.new.nome,
              name: payload.new.nome,
              image: payload.new.foto_url || "/placeholder-product.jpg",
              foto_url: payload.new.foto_url || "/placeholder-product.jpg",
              estoque: payload.new.estoque || 0,
              descricao: payload.new.descricao || '',
              preco: payload.new.preco || 0,
              categoria: payload.new.categoria || '',
              categoria_id: payload.new.categoria_id || '',
              tamanhos: payload.new.tamanhos || [],
              loja_id: payload.new.loja_id,
              ativo: payload.new.ativo !== undefined ? payload.new.ativo : true,
              created_at: payload.new.created_at || new Date().toISOString(),
              updated_at: payload.new.updated_at || new Date().toISOString()
            }]);
          } else if (payload.eventType === 'DELETE') {
            setProducts((prev) => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredProducts = selectedCategories.length > 0
    ? products.filter((p) => p.categoria && selectedCategories.includes(p.categoria))
    : products;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-50"
      }`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
            theme === "dark" ? "border-blue-400" : "border-blue-600"
          } mx-auto`}></div>
          <p className={`mt-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
            Carregando produtos...
          </p>
        </div>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-50"
      }`}>
        <div className="text-center max-w-md p-6">
          <div className="text-6xl mb-4">📱</div>
          <h2 className={`text-2xl font-bold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            Escaneie o QR Code da Loja
          </h2>
          <p className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
            Para ver os produtos disponíveis, primeiro escaneie o QR Code da loja.
          </p>
          <button
            onClick={() => navigate("/cliente/qr-scanner")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Escanear QR Code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
    }`}>
      {/* Header */}
      <header className={`shadow-sm border-b ${
        theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/cliente")}
                className={`p-2 rounded-lg ${
                  theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                ← Voltar
              </button>
              <div>
                <h1 className="text-xl font-bold">{storeName || "Produtos da Loja"}</h1>
                <p className={`text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}>
                  {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} disponível{filteredProducts.length !== 1 ? 's' : ''}
                  {selectedCategories.length > 0 &&
                    ` (${selectedCategories.length} categoria(s) selecionada(s))`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Botão para ver todas as fotos */}
              {products.length > 0 && (
                <button
                  onClick={() => handleOpenGlobalGallery()}
                  className={`p-2 rounded-lg ${
                    theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                  title="Ver todas as fotos"
                >
                  📷 Galeria
                </button>
              )}

              {reservationLoading && (
                <div className="flex items-center text-sm text-blue-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                  Processando...
                </div>
              )}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className={`p-2 rounded-lg ${
                  theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
                title="Configurações"
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className={`text-xl font-semibold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              {selectedCategories.length > 0
                ? "Nenhum produto nas categorias selecionadas"
                : "Nenhum produto disponível"
              }
            </h3>
            <p className={`mb-6 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}>
              {selectedCategories.length > 0
                ? "Tente alterar as categorias selecionadas nas configurações."
                : "Esta loja ainda não possui produtos cadastrados."
              }
            </p>
            {selectedCategories.length > 0 && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Alterar Categorias
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                employees={employees}
                onReserve={handleReserveForCard}  //✅ Usando função compatível
                onOpenGlobalGallery={handleOpenGlobalGallery}
              />
            ))}
          </div>
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Galeria Global com TODAS as imagens */}
      <GlobalImageGallery
        isOpen={isGlobalGalleryOpen}
        onClose={() => setIsGlobalGalleryOpen(false)}
        images={allProductImages}
        storeName={storeName}
        initialIndex={initialImageIndex}
        onReserve={handleReserveFromGallery}
      />

      {/* Modal de Reserva - ABRE TANTO DO CARD QUANTO DA GALERIA */}
      {selectedProductForReserve && (
        <ReserveModal
          isOpen={isReserveModalOpen}
          onClose={handleCloseReserveModal}
          onReserve={handleReserve}
          employees={employees}
          product={selectedProductForReserve}
          disableReserve={selectedProductForReserve.estoque === 0}
        />
      )}
    </div>
  );
}
