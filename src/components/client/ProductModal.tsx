import { useEffect, useState } from "react";
import { useReservation } from "../../context/ReservationContext";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../hooks/useAuth"; // ✅ IMPORT DO HOOK DE AUTENTICAÇÃO
import { useReservationFlow } from '../../hooks/useReservationFlow';
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
  storeName = "Loja Connect"
}: ReserveModalProps) {
  const { theme } = useSettings();
  const { selectedEmployee, isFirstReservation, completeReservation } = useReservation();
  const { user } = useAuth(); // ✅ HOOK PARA PEGAR USUÁRIO LOGADO

  const [quantidade, setQuantidade] = useState(1);
  const [selectedTamanho, setSelectedTamanho] = useState<string>("");
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localIsFirstReservation, setLocalIsFirstReservation] = useState(isFirstReservation);

  // ✅ CORREÇÃO: Passar o product completo E o nome do cliente
  const {
    openWhatsApp
  } = useReservationFlow({
    product,
    storeId: product.loja_id || '',
    clientName: user?.nome || 'Cliente' // ✅ PASSA O NOME REAL DO USUÁRIO LOGADO
  });

  // ✅ CORREÇÃO: Sincronizar estado local com o contexto
  useEffect(() => {
    setLocalIsFirstReservation(isFirstReservation);
  }, [isFirstReservation]);

  // Resetar estado quando modal abrir
  useEffect(() => {
    if (isOpen) {
      setQuantidade(1);
      setSelectedTamanho(product.tamanhos?.[0] || "");
      setIsProcessing(false);
      setShowEmployeeSelector(false);

      console.log('🔍 Estado da reserva:', {
        isFirstReservation,
        localIsFirstReservation,
        hasSelectedEmployee: !!selectedEmployee,
        employeesCount: employees.length,
        productName: product.nome || product.name,
        hasTamanhos: !!product.tamanhos,
        loja_id: product.loja_id,
        userName: user?.nome // ✅ DEBUG: Ver nome do usuário
      });

      // ✅ CORREÇÃO: Só mostrar seletor se for realmente a primeira vez E não tiver funcionário selecionado
      if (isFirstReservation && employees.length > 0 && !selectedEmployee) {
        console.log('📱 Primeira reserva - mostrando seletor...');
        setShowEmployeeSelector(true);
      }
    }
  }, [isOpen, isFirstReservation, selectedEmployee, employees.length, product.tamanhos, user]);

  // ✅ FUNÇÃO PARA ENVIAR MENSAGEM DIRETAMENTE - CORRIGIDA
  const handleSendMessage = async () => {
    if (isProcessing) return;

    console.log('✅ Enviando mensagem diretamente...');

    // Verificar estoque
    if (quantidade > product.estoque) {
      alert(`❌ Quantidade indisponível. Estoque atual: ${product.estoque}`);
      return;
    }

    // ✅ CORREÇÃO: Verificação simplificada
    if (!selectedEmployee) {
      console.log('📱 Nenhum funcionário selecionado - mostrando seletor...');
      setShowEmployeeSelector(true);
      return;
    }

    setIsProcessing(true);

    try {
      // ✅ DETALHES DA RESERVA
      const reservationDetails = `Quantidade: ${quantidade}${selectedTamanho ? `, Tamanho: ${selectedTamanho}` : ''}`;

      console.log('🎯 Enviando mensagem diretamente para:', {
        employee: selectedEmployee.nome,
        product: product.nome || product.name,
        details: reservationDetails,
        isFirstReservation,
        clientName: user?.nome // ✅ DEBUG: Ver nome do cliente
      });

      // ✅ CORREÇÃO: Completar reserva ANTES de abrir WhatsApp
      if (isFirstReservation) {
        console.log('✅ Marcando primeira reserva como concluída');
        completeReservation();
      }

      // ✅ ABRIR WHATSAPP COM MENSAGEM PRONTA
      openWhatsApp(selectedEmployee, reservationDetails);

      // ✅ CHAMAR CALLBACK DA RESERVA
      await onReserve(selectedEmployee.id, quantidade, selectedTamanho || undefined);

      console.log('✅ Reserva processada com sucesso');

    } catch (error: any) {
      console.error('❌ Erro ao processar reserva:', error);
      alert('❌ Erro ao processar reserva. Tente novamente.');
    } finally {
      setIsProcessing(false);
      // ✅ FECHAR MODAL APÓS PROCESSAMENTO
      onClose();
    }
  };

  // ✅ FUNÇÃO PARA CANCELAR
  const handleCancel = () => {
    if (isProcessing) return;
    onClose();
  };

  // ✅ CORREÇÃO: Função de seleção de funcionário simplificada
  const handleEmployeeSelect = (employee: Employee) => {
    console.log('✅ Funcionário selecionado no modal:', employee.nome);
    setShowEmployeeSelector(false);

    // ✅ CORREÇÃO: Não chamar handleSendMessage automaticamente
    // O usuário deve clicar em "Abrir WhatsApp" após selecionar
  };

  // ✅ CORREÇÃO: Função para trocar funcionário
  const handleChangeEmployee = () => {
    setShowEmployeeSelector(true);
  };

  const maxQuantidade = Math.min(product.estoque, 10);
  const availableSizes = product.tamanhos || [];

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Principal de Reserva */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`
          rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto
          ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"}
        `}>

          {/* Header */}
          <div className={`
            p-6 border-b
            ${theme === "dark" ? "border-gray-700" : "border-gray-200"}
          `}>
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-4">
                {/* Foto do Produto */}
                {product.image && (
                  <div className="flex-shrink-0">
                    <img
                      src={product.image}
                      alt={product.nome || product.name || "Produto"}
                      className="w-16 h-16 rounded-lg object-cover border"
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    Reservar: {product.nome || product.name || "Produto"}
                  </h3>
                  <p className={`
                    text-sm
                    ${theme === "dark" ? "text-gray-300" : "text-gray-600"}
                  `}>
                    {isFirstReservation
                      ? "👋 Primeira vez? Escolha seu atendente preferido!"
                      : "📞 Mensagem será enviada ao seu atendente preferido"}
                  </p>
                  {product.estoque > 0 && (
                    <p className={`text-sm mt-1 ${theme === "dark" ? "text-green-400" : "text-green-600"}`}>
                      ✅ Estoque disponível: {product.estoque} unidades
                    </p>
                  )}
                  {/* ✅ DEBUG: Mostrar nome do usuário logado */}
                  <p className={`text-xs mt-1 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
                    👤 Cliente: {user?.nome || 'Não identificado'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className={`
                  p-2 rounded-lg text-xl transition-all
                  ${theme === "dark"
                    ? "hover:bg-gray-700 text-white"
                    : "hover:bg-gray-100 text-gray-700"
                  }
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Tamanho (se disponível) */}
            {availableSizes.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">📏 Tamanho:</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableSizes.map((tamanho: string) => (
                    <button
                      key={tamanho}
                      onClick={() => !isProcessing && setSelectedTamanho(tamanho)}
                      disabled={isProcessing}
                      className={`
                        p-3 rounded-lg border text-center transition-all font-medium
                        ${selectedTamanho === tamanho
                          ? theme === "dark"
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-blue-500 border-blue-400 text-white"
                          : theme === "dark"
                            ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
                            : "bg-gray-100 border-gray-300 hover:bg-gray-200"
                        }
                        ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
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
                    disabled={quantidade <= 1 || isProcessing}
                    className={`
                      w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all
                      ${quantidade <= 1 || isProcessing
                        ? "bg-gray-400 cursor-not-allowed"
                        : theme === "dark"
                          ? "bg-gray-600 hover:bg-gray-500"
                          : "bg-gray-200 hover:bg-gray-300"
                      }
                    `}
                  >
                    -
                  </button>

                  <span className={`
                    w-12 text-center font-semibold text-lg
                    ${theme === "dark" ? "text-white" : "text-gray-900"}
                  `}>
                    {quantidade}
                  </span>

                  <button
                    onClick={() => !isProcessing && setQuantidade(Math.min(maxQuantidade, quantidade + 1))}
                    disabled={quantidade >= maxQuantidade || isProcessing}
                    className={`
                      w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all
                      ${quantidade >= maxQuantidade || isProcessing
                        ? "bg-gray-400 cursor-not-allowed"
                        : theme === "dark"
                          ? "bg-gray-600 hover:bg-gray-500"
                          : "bg-gray-200 hover:bg-gray-300"
                      }
                    `}
                  >
                    +
                  </button>
                </div>

                <span className={`
                  text-sm
                  ${theme === "dark" ? "text-gray-400" : "text-gray-600"}
                `}>
                  Máx: {maxQuantidade}
                </span>
              </div>
            </div>

            {/* Funcionários */}
            <div>
              <label className="block text-sm font-medium mb-3">
                👨‍💼 {isFirstReservation ? "Escolha seu atendente" : "Seu atendente preferido"}:
              </label>

              {selectedEmployee ? (
                <div className={`
                  p-4 rounded-lg border
                  ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-green-50 border-green-200"}
                `}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Foto do Funcionário */}
                      <div className="flex-shrink-0">
                        <img
                          src={selectedEmployee.foto_url || "/default-avatar.png"}
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
                        <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                          {selectedEmployee.whatsapp}
                        </p>
                        {!isFirstReservation && (
                          <p className={`text-xs ${theme === "dark" ? "text-green-400" : "text-green-600"}`}>
                            ✅ Seu atendente preferido
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleChangeEmployee}
                      disabled={isProcessing}
                      className={`
                        px-4 py-2 rounded-lg text-sm transition-all font-medium
                        ${theme === "dark"
                          ? "bg-gray-600 hover:bg-gray-500 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                        }
                        ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      Trocar
                    </button>
                  </div>
                </div>
              ) : employees.length === 0 ? (
                <p className={`
                  text-center py-4
                  ${theme === "dark" ? "text-gray-400" : "text-gray-500"}
                `}>
                  Nenhum funcionário disponível
                </p>
              ) : (
                <button
                  onClick={() => !isProcessing && setShowEmployeeSelector(true)}
                  disabled={isProcessing}
                  className={`
                    w-full p-4 rounded-lg border-2 border-dashed text-center
                    transition-all duration-200
                    ${theme === "dark"
                      ? "border-gray-600 hover:border-gray-500 hover:bg-gray-700 text-gray-300"
                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-600"
                    }
                    ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="text-2xl mb-2">👥</div>
                  <p className="font-medium">
                    {isFirstReservation ? "Escolher funcionário" : "Trocar funcionário"}
                  </p>
                  <p className="text-sm mt-1">
                    {isFirstReservation
                      ? "Selecione seu atendente preferido"
                      : "Escolha outro atendente"}
                  </p>
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className={`
            p-6 border-t
            ${theme === "dark" ? "border-gray-700" : "border-gray-200"}
          `}>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className={`
                  flex-1 py-3 rounded-lg font-medium transition-all
                  ${theme === "dark"
                    ? "bg-gray-600 hover:bg-gray-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                Cancelar
              </button>
              <button
                onClick={handleSendMessage}
                disabled={disableReserve || quantidade === 0 || isProcessing || !selectedEmployee}
                className={`
                  flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center
                  ${disableReserve || quantidade === 0 || isProcessing || !selectedEmployee
                    ? "bg-gray-400 cursor-not-allowed text-gray-200"
                    : theme === "dark"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }
                `}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </>
                ) : !selectedEmployee ? (
                  "Escolher Funcionário"
                ) : (
                  "📞 Abrir WhatsApp"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Seleção de Funcionário */}
      <EmployeeSelector
        isOpen={showEmployeeSelector}
        onClose={() => setShowEmployeeSelector(false)}
        onSelect={handleEmployeeSelect}
        productName={product.nome || product.name || "Produto"}
        employees={employees}
      />
    </>
  );
}
