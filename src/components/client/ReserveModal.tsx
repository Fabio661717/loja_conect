// src/components/cliente/ReserveModal.tsx - VERSÃO COM MENSAGEM SIMPLIFICADA
import { useEffect, useState } from "react";
import { useReservation } from "../../context/ReservationContext";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabase";
import { Employee } from "../../types/Employee";
import { Product } from "../../types/ProductData";
import EmployeeSelector from "./EmployeeSelector";

interface ReserveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReserve: (employeeId: string, quantidade: number, tamanho?: string) => void;
  employees: Employee[];
  product: Product;
  disableReserve?: boolean;
  storeName?: string;
}

export default function ReserveModal({
  isOpen,
  onClose,
  onReserve,
  employees,
  product,
  disableReserve = false,
  storeName: _storeName = "Loja Connect"
}: ReserveModalProps) {
  const { theme } = useSettings();
  const { selectedEmployee, isFirstReservation, completeReservation, setSelectedEmployee } = useReservation();
  const { user } = useAuth();

  const [quantidade, setQuantidade] = useState(1);
  const [selectedTamanho, setSelectedTamanho] = useState<string>("");
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedEmployees, setProcessedEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees] = useState(false);
  const [dynamicStoreName, setDynamicStoreName] = useState("Loja Connect");

  // ✅ EFFECT: Buscar nome da loja dinamicamente
  useEffect(() => {
    const fetchStoreName = async () => {
      const storeId = product?.loja_id || localStorage.getItem("storeId");
      if (storeId) {
        try {
          const { data: storeData, error } = await supabase
            .from("lojas")
            .select("nome")
            .eq("id", storeId)
            .single();

          if (!error && storeData) {
            setDynamicStoreName(storeData.nome);
            console.log('🏪 Nome da loja carregado:', storeData.nome);
          } else {
            console.log('⚠️ Usando nome padrão da loja');
          }
        } catch (error) {
          console.error("❌ Erro ao buscar nome da loja:", error);
        }
      }
    };

    if (isOpen) {
      fetchStoreName();
    }
  }, [isOpen, product?.loja_id]);

  // ✅ FUNÇÃO COM PREFIXO _: Indicando que será usada futuramente
  const _getEmployeePhotoUrl = (employee: any): string => {
    const hasCustomPhoto = !!(employee.foto_url || employee.foto);
    if (hasCustomPhoto) {
      return employee.foto_url || employee.foto;
    }
    // Default avatar
    return "/default-avatar.png";
  };

  // ✅ EFFECT SIMPLIFICADO: Agora os employees já vêm completos do ProductsList
  useEffect(() => {
    if (isOpen) {
      setQuantidade(1);
      setSelectedTamanho(product.tamanhos?.[0] || "");
      setIsProcessing(false);
      setShowEmployeeSelector(false);

      console.log('🔍 Employees recebidos no ReserveModal:', employees);

      // ✅ AGORA OS EMPLOYEES JÁ VÊM COMPLETOS DO PRODUCTSLIST
      setProcessedEmployees(employees);

      if (isFirstReservation && !selectedEmployee && employees.length > 0) {
        console.log('👥 Primeira reserva - mostrando seletor');
        setShowEmployeeSelector(true);
      }
    }
  }, [isOpen, isFirstReservation, selectedEmployee, employees.length, user, product]);

  // ✅ FUNÇÃO PARA GERAR MENSAGEM SIMPLIFICADA DO WHATSAPP
  const generateSimpleWhatsAppMessage = (
    employee: Employee,
    quantidade: number,
    tamanho: string
  ): string => {
    const actualProductName = product.nome || product.name || "Produto";
    const actualProductPrice = product.preco || 0;
    const actualProductImage = product.foto_url || product.image || product.imagem || '';

    // ✅ PRAZO DE 24 HORAS
    const pickupTime = new Date();
    pickupTime.setHours(pickupTime.getHours() + 24);

    // ✅ FORMATAR DATA (sem segundos)
    const formattedPickupTime = pickupTime.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // ✅ GERAR ID DE RESERVA
    const reservationId = `RES${Date.now().toString().slice(-6)}`;

    // ✅ MENSAGEM SIMPLIFICADA E PROFISSIONAL
    let message = `🛍️ *RESERVA CONFIRMADA - ${dynamicStoreName}* 🛍️\n\n`;

    message += `Olá ${employee.nome}! 👋\n\n`;
    message += `${user?.nome || user?.email || 'Cliente'} Solicito a reserva deste produto para meu cliente preferencial.\n\n`;

    message += `*📦 PRODUTO*\n`;
    message += `• ${actualProductName}\n`;
    message += `• Tamanho: ${tamanho || "Único"}\n`;
    message += `• Quantidade: ${quantidade} unidade${quantidade > 1 ? 's' : ''}\n`;

    if (actualProductPrice > 0) {
      message += `• Valor: R$ ${actualProductPrice.toFixed(2).replace('.', ',')}\n`;
    } else {
      message += `• Valor: A combinar\n`;
    }

    // ✅ SEÇÃO DA FOTO (se existir)
    if (actualProductImage) {
      message += `\n🖼️ *Visualize o produto:*\n`;
      message += `${actualProductImage}\n`;
    }

    message += `\n📋 *INFORMAÇÕES DA RESERVA*\n`;
    message += `• Código: ${reservationId}\n`;
    message += `• Retirar até: ${formattedPickupTime}\n\n`;

    message += `_Obrigado por usar nosso sistema!_ \n\n`;
    message += `🏪 ${dynamicStoreName}`;

    console.log('💬 Mensagem WhatsApp gerada:', {
      produto: actualProductName,
      foto: actualProductImage ? 'SIM' : 'NÃO',
      loja: dynamicStoreName,
      caracteres: message.length
    });

    return message;
  };

  // ✅ FUNÇÃO PARA ENVIAR MENSAGEM SIMPLIFICADA
  const handleSendMessage = async () => {
    if (isProcessing) return;

    console.log('📤 Tentando enviar mensagem...', {
      produto: product.nome,
      fotoProduto: product.foto_url || product.image,
      cliente: user?.nome,
      funcionario: selectedEmployee?.nome,
      loja: dynamicStoreName
    });

    if (quantidade > product.estoque) {
      alert(`❌ Quantidade indisponível. Estoque atual: ${product.estoque}`);
      return;
    }

    if (!selectedEmployee) {
      console.log('👥 Nenhum funcionario selecionado - abrindo seletor');
      setShowEmployeeSelector(true);
      return;
    }

    setIsProcessing(true);

    try {
      console.log('💬 Enviando mensagem WhatsApp simplificada:', {
        funcionario: selectedEmployee.nome,
        produto: product.nome,
        foto: product.foto_url || product.image,
        loja: dynamicStoreName
      });

      if (isFirstReservation) {
        console.log('✅ Marcando como não é mais primeira reserva');
        completeReservation();
      }

      // ✅ GERAR MENSAGEM SIMPLIFICADA
      const message = generateSimpleWhatsAppMessage(
        selectedEmployee,
        quantidade,
        selectedTamanho || "Único"
      );

      const cleanWhatsapp = selectedEmployee.whatsapp.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(message)}`;

      console.log('📞 Abrindo WhatsApp com mensagem simplificada');
      console.log('🏪 Loja:', dynamicStoreName);
      console.log('🖼️ Foto incluída:', (product.foto_url || product.image) ? 'SIM' : 'NÃO');

      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

      await onReserve(selectedEmployee.id, quantidade, selectedTamanho || undefined);

      console.log('🎉 Reserva processada com sucesso');

    } catch (error: any) {
      console.error('❌ Erro ao processar reserva:', error);
      alert('❌ Erro ao processar reserva. Tente novamente.');
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  const handleCancel = () => {
    if (isProcessing) return;
    onClose();
  };

  const handleEmployeeSelect = (employee: Employee) => {
    console.log('✅ Funcionario selecionado:', employee.nome);
    setSelectedEmployee(employee);
    setShowEmployeeSelector(false);
  };

  // ✅ FUNÇÃO: Obter foto do funcionário selecionado
  const getSelectedEmployeePhoto = (employee: Employee): string => {
    if (!employee) return "/default-avatar.png";

    const hasCustomPhoto = !!(employee.foto_url || employee.foto);
    if (!hasCustomPhoto) return "/default-avatar.png";

    if (employee.foto_url) {
      if (employee.foto_url.startsWith("http")) {
        return employee.foto_url;
      }
      try {
        const { data } = supabase.storage
          .from("funcionarios-fotos")
          .getPublicUrl(employee.foto_url);
        return data.publicUrl;
      } catch (error) {
        console.error("❌ Erro ao gerar URL do storage:", error);
      }
    }

    if (employee.foto) {
      if (employee.foto.startsWith("http")) {
        return employee.foto;
      }
      try {
        const { data } = supabase.storage
          .from("funcionarios-fotos")
          .getPublicUrl(employee.foto);
        return data.publicUrl;
      } catch (error) {
        console.error("❌ Erro ao gerar URL do storage:", error);
      }
    }

    return "/default-avatar.png";
  };

  const maxQuantidade = Math.min(product.estoque, 3);
  const availableSizes = product.tamanhos || [];

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Principal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`
          rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto
          ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"}
        `}>

          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-4">
                {(product.foto_url || product.image) && (
                  <div className="flex-shrink-0">
                    <img
                      src={product.foto_url || product.image}
                      alt={product.nome || product.name || "Produto"}
                      className="w-16 h-16 rounded-lg object-cover border-2 border-blue-400"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/default-product.png";
                      }}
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">
                    Reservar: {product.nome || product.name || "Produto"}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {isFirstReservation && !selectedEmployee
                      ? "Escolha seu atendente preferido!"
                      : "Pronto para enviar mensagem!"}
                  </p>
                  {product.estoque > 0 && (
                    <p className="text-sm mt-1 text-green-600 dark:text-green-400">
                      📦 Estoque: {product.estoque} unidades
                    </p>
                  )}
                  <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">
                    👤 Cliente: {user?.nome || 'Não identificado'}
                  </p>
                  <p className="text-xs mt-1 text-purple-600 dark:text-purple-400">
                    🏪 Loja: {dynamicStoreName}
                  </p>
                  {(product.foto_url || product.image) && (
                    <p className="text-xs mt-1 text-green-600 dark:text-green-400">
                      📸 Foto do produto será enviada no WhatsApp
                    </p>
                  )}
                  {/* ✅ STATUS DO CARREGAMENTO */}
                  {isLoadingEmployees && (
                    <p className="text-xs mt-1 text-yellow-600 dark:text-yellow-400">
                      ⏳ Carregando funcionários...
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isProcessing || isLoadingEmployees}
                className="p-2 rounded-lg text-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Tamanho */}
            {availableSizes.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">📐 Tamanho:</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableSizes.map((tamanho) => (
                    <button
                      key={tamanho}
                      onClick={() => !isProcessing && setSelectedTamanho(tamanho)}
                      disabled={isProcessing || isLoadingEmployees}
                      className={`
                        p-3 rounded-lg border text-center transition-all font-medium
                        ${selectedTamanho === tamanho
                          ? "bg-blue-500 border-blue-400 text-white dark:bg-blue-600 dark:border-blue-500"
                          : "bg-gray-100 border-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
                        }
                        disabled:opacity-50
                      `}
                    >
                      {tamanho}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantidade */}
            <div>
              <label className="block text-sm font-medium mb-2">🔢 Quantidade:</label>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => !isProcessing && setQuantidade(Math.max(1, quantidade - 1))}
                    disabled={quantidade <= 1 || isProcessing || isLoadingEmployees}
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 transition-all disabled:bg-gray-400"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold text-lg">
                    {quantidade}
                  </span>
                  <button
                    onClick={() => !isProcessing && setQuantidade(Math.min(maxQuantidade, quantidade + 1))}
                    disabled={quantidade >= maxQuantidade || isProcessing || isLoadingEmployees}
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 transition-all disabled:bg-gray-400"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Máx: {maxQuantidade}
                </span>
              </div>
            </div>

            {/* Funcionários */}
            <div>
              <label className="block text-sm font-medium mb-3">
                {selectedEmployee ? "👨‍💼 Seu atendente" : "👥 Escolha seu atendente"}:
              </label>

              {isLoadingEmployees ? (
                <div className="p-4 rounded-lg border bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Carregando funcionários...
                  </p>
                </div>
              ) : selectedEmployee ? (
                <div className="p-4 rounded-lg border bg-green-50 border-green-200 dark:bg-gray-700 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <img
                          src={getSelectedEmployeePhoto(selectedEmployee)}
                          alt={selectedEmployee.nome}
                          className="w-12 h-12 rounded-full object-cover border-2 border-green-400"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/default-avatar.png";
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{selectedEmployee.nome}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {selectedEmployee.whatsapp}
                        </p>
                        {!isFirstReservation && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            ⭐ Seu atendente preferido
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          📸 {selectedEmployee.foto_url || selectedEmployee.foto ? 'Foto customizada' : 'Avatar padrão'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowEmployeeSelector(true)}
                      disabled={isProcessing || isLoadingEmployees}
                      className="px-4 py-2 rounded-lg text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 transition-all disabled:opacity-50"
                    >
                      Trocar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowEmployeeSelector(true)}
                  disabled={isProcessing || isLoadingEmployees || processedEmployees.length === 0}
                  className="w-full p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700 transition-all text-center disabled:opacity-50"
                >
                  <div className="text-2xl mb-2">👥</div>
                  <p className="font-medium">Escolher funcionário</p>
                  <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">
                    {processedEmployees.length > 0
                      ? "Selecione seu atendente preferido"
                      : "Nenhum funcionário disponível"}
                  </p>
                </button>
              )}
            </div>

            {/* ✅ SEÇÃO DE PREVIEW DA MENSAGEM */}
            <div className="p-4 bg-blue-50 dark:bg-gray-700 rounded-lg border border-blue-200 dark:border-gray-600">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                📋 Preview da Mensagem
              </h4>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <p>🏪 <strong>Loja:</strong> {dynamicStoreName}</p>
                <p>🛍️ <strong>Produto:</strong> {product.nome}</p>
                <p>💰 <strong>Preço:</strong> R$ {product.preco?.toFixed(2) || 'A combinar'}</p>
                <p>📐 <strong>Tamanho:</strong> {selectedTamanho || 'Não selecionado'}</p>
                <p>🔢 <strong>Quantidade:</strong> {quantidade}x</p>
                {(product.foto_url || product.image) && (
                  <p className="text-green-600 dark:text-green-400">
                    📸 <strong>Foto do produto será enviada</strong>
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  💡 <em>Mensagem simplificada e profissional</em>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                disabled={isProcessing || isLoadingEmployees}
                className="flex-1 py-3 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendMessage}
                disabled={disableReserve || quantidade === 0 || isProcessing || !selectedEmployee || isLoadingEmployees}
                className="flex-1 py-3 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </>
                ) : !selectedEmployee ? (
                  "Escolher Funcionário"
                ) : (
                  "📱 Abrir WhatsApp"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ AGORA PASSANDO DADOS COMPLETOS */}
      <EmployeeSelector
        isOpen={showEmployeeSelector}
        onClose={() => setShowEmployeeSelector(false)}
        onSelect={handleEmployeeSelect}
        productName={product.nome || product.name || "Produto"}
        employees={processedEmployees}
      />
    </>
  );
}
