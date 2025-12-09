 //ReservationsList.tsx
 import { useEffect, useState } from "react";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../hooks/useAuth";
import { Employee } from "../../types/Employee";
import { Product } from "../../types/ProductData";

interface ReserveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReserve: (employeeId: string, quantidade: number, tamanho?: string) => void;
  employees: Employee[];
  product: Product;
  disableReserve?: boolean;
}

export default function ReserveModal({
  isOpen,
  onClose,
  onReserve,
  employees,
  product,
  disableReserve = false,
}: ReserveModalProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [quantidade, setQuantidade] = useState<number>(1);
  const [selectedTamanho, setSelectedTamanho] = useState<string>("");
  const [isReserving, setIsReserving] = useState<boolean>(false);
  const { getSelectedEmployee, setSelectedEmployee: saveEmployeePreference } = useAuth();
  const { theme } = useSettings();

  useEffect(() => {
    if (isOpen) {
      // Carregar funcionário preferido
      const loadPreferredEmployee = async () => {
        const preferred = await getSelectedEmployee();
        if (preferred && employees.find(e => e.id === preferred)) {
          setSelectedEmployee(preferred);
        } else if (employees.length > 0) {
          setSelectedEmployee(employees[0].id);
        }
      };
      loadPreferredEmployee();

      // Reset quantidade e tamanho
      setQuantidade(1);
      setSelectedTamanho(product.tamanhos?.[0] || "");
      setIsReserving(false);
    }
  }, [isOpen, employees, product.tamanhos]);

  // ✅ CORREÇÃO: Função handleConfirm com tratamento de erro melhorado
  const handleConfirm = async () => {
    if (!selectedEmployee) {
      alert("Selecione um funcionário para continuar");
      return;
    }

    if (quantidade > product.estoque) {
      alert(`Quantidade indisponível. Estoque atual: ${product.estoque}`);
      return;
    }

    if (quantidade <= 0) {
      alert("Quantidade deve ser maior que zero");
      return;
    }

    setIsReserving(true);

    try {
      // Salvar preferência do funcionário
      await saveEmployeePreference(selectedEmployee);

      console.log('✅ Confirmando reserva:', {
        employeeId: selectedEmployee,
        quantidade,
        tamanho: selectedTamanho || undefined
      });

      // ✅ CORREÇÃO: Chamar onReserve com tratamento de erro
      await onReserve(selectedEmployee, quantidade, selectedTamanho || undefined);

      // Fechar modal apenas se a reserva for bem-sucedida
      onClose();

    } catch (error: any) {
      console.error('❌ Erro na reserva:', error);
      alert(error.message || 'Erro ao realizar reserva. Tente novamente.');
    } finally {
      setIsReserving(false);
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployee(employeeId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`
        rounded-xl shadow-2xl w-full max-w-md transform transition-all
        ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"}
      `}>
        {/* Header */}
        <div className={`
          p-6 border-b
          ${theme === "dark" ? "border-gray-700" : "border-gray-200"}
        `}>
          <h3 className="text-xl font-bold mb-2">
            Reservar: {product.name}
          </h3>
          <p className={`
            text-sm
            ${theme === "dark" ? "text-gray-300" : "text-gray-600"}
          `}>
            Escolha o funcionário e detalhes da reserva
          </p>
          {product.estoque > 0 && (
            <p className={`text-sm mt-1 ${theme === "dark" ? "text-green-400" : "text-green-600"}`}>
              Estoque disponível: {product.estoque} unidades
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Tamanho (se disponível) */}
          {product.tamanhos && product.tamanhos.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Tamanho:</label>
              <select
                value={selectedTamanho}
                onChange={(e) => setSelectedTamanho(e.target.value)}
                className={`
                  w-full p-3 rounded-lg border
                  ${theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                  }
                `}
              >
                {product.tamanhos.map((tamanho) => (
                  <option key={tamanho} value={tamanho}>
                    {tamanho}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantidade */}
          <div>
            <label className="block text-sm font-medium mb-2">Quantidade:</label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                disabled={quantidade <= 1 || isReserving}
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all
                  ${quantidade <= 1 || isReserving
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
                w-12 text-center font-semibold
                ${theme === "dark" ? "text-white" : "text-gray-900"}
              `}>
                {quantidade}
              </span>

              <button
                onClick={() => setQuantidade(Math.min(product.estoque, quantidade + 1))}
                disabled={quantidade >= product.estoque || isReserving}
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all
                  ${quantidade >= product.estoque || isReserving
                    ? "bg-gray-400 cursor-not-allowed"
                    : theme === "dark"
                      ? "bg-gray-600 hover:bg-gray-500"
                      : "bg-gray-200 hover:bg-gray-300"
                  }
                `}
              >
                +
              </button>

              <span className={`
                text-sm ml-2
                ${theme === "dark" ? "text-gray-400" : "text-gray-600"}
              `}>
                Máx: {product.estoque}
              </span>
            </div>
          </div>

          {/* Funcionários */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Escolha o funcionário:
            </label>

            {employees.length === 0 ? (
              <p className={`
                text-center py-4
                ${theme === "dark" ? "text-gray-400" : "text-gray-500"}
              `}>
                Nenhum funcionário disponível
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {employees.map((employee) => (
                  <label
                    key={employee.id}
                    className={`
                      flex items-center p-3 rounded-lg cursor-pointer transition-all
                      ${selectedEmployee === employee.id
                        ? theme === "dark"
                          ? "bg-blue-900 border border-blue-700"
                          : "bg-blue-100 border border-blue-300"
                        : theme === "dark"
                          ? "bg-gray-700 border border-gray-600 hover:bg-gray-600"
                          : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                      }
                      ${isReserving ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <input
                      type="radio"
                      name="employee"
                      value={employee.id}
                      checked={selectedEmployee === employee.id}
                      onChange={() => !isReserving && handleEmployeeSelect(employee.id)}
                      disabled={isReserving}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{employee.name}</div>
                      <div className={`
                        text-sm
                        ${theme === "dark" ? "text-gray-300" : "text-gray-600"}
                      `}>
                        {employee.whatsapp}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`
          p-6 border-t
          ${theme === "dark" ? "border-gray-700" : "border-gray-200"}
        `}>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isReserving}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all
                ${theme === "dark"
                  ? "bg-gray-600 hover:bg-gray-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }
                ${isReserving ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={disableReserve || !selectedEmployee || quantidade === 0 || isReserving}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center min-w-20
                ${disableReserve || !selectedEmployee || quantidade === 0 || isReserving
                  ? "bg-gray-400 cursor-not-allowed text-gray-200"
                  : theme === "dark"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }
              `}
            >
              {isReserving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Reservando...
                </>
              ) : (
                'Confirmar Reserva'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
