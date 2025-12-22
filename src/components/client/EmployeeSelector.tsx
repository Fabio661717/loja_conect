// src/components/cliente/EmployeeSelector.tsx - VERSÃO ATUALIZADA
import { useReservation } from "../../context/ReservationContext"; // ✅ IMPORT ADICIONADO
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabase";
import { Employee } from "../../types/Employee";
import { User } from "../../types/User";

interface EmployeeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (employee: Employee) => void;
  productName: string;
  employees: Employee[];
}

interface UserWithPhoto extends User {
  foto_url?: string;
}

export default function EmployeeSelector({
  isOpen,
  onClose,
  onSelect,
  productName,
  employees
}: EmployeeSelectorProps) {
  const { user } = useAuth();
  const { selectedEmployee } = useReservation(); // ✅ HOOK ADICIONADO
  const userWithPhoto = user as UserWithPhoto;

  // ✅ DEBUG DETALHADO
  console.log('🔍 DEBUG Employees no Selector:', employees);
  console.log('🔍 DEBUG Funcionário Preferido:', selectedEmployee);

  employees.forEach((emp, index) => {
    console.log(`🔍 Employee ${index + 1} - ${emp.nome}:`, {
      id: emp.id,
      isPreferred: selectedEmployee?.id === emp.id,
      foto_url: emp.foto_url,
      foto: emp.foto,
      photoUrl: emp.photoUrl,
      hasCustomPhoto: emp.hasCustomPhoto
    });
  });

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    console.log('❌ Erro ao carregar imagem:', target.src);
    target.src = "/default-avatar.png";
  };

  // ✅ FUNÇÃO CORRIGIDA: Obter URL da foto do funcionário
  const getEmployeePhotoUrl = (employee: Employee): string => {
    console.log(`🖼️ Buscando foto para ${employee.nome}:`, {
      foto_url: employee.foto_url,
      foto: employee.foto,
      photoUrl: employee.photoUrl,
      hasCustomPhoto: employee.hasCustomPhoto
    });

    if (employee.photoUrl && employee.photoUrl !== "/default-avatar.png") {
      console.log(`✅ ${employee.nome}: Usando photoUrl - ${employee.photoUrl}`);
      return employee.photoUrl;
    }

    const hasCustomPhoto = employee.hasCustomPhoto || !!(employee.foto_url || employee.foto);

    if (!hasCustomPhoto) {
      console.log(`📸 ${employee.nome}: Sem foto customizada`);
      return "/default-avatar.png";
    }

    if (employee.foto_url) {
      console.log(`🔗 ${employee.nome}: Tentando foto_url - ${employee.foto_url}`);

      if (employee.foto_url.startsWith("http")) {
        const url = `${employee.foto_url}?t=${new Date().getTime()}`;
        console.log(`✅ ${employee.nome}: URL HTTP - ${url}`);
        return url;
      }

      try {
        const { data } = supabase.storage
          .from("funcionarios-fotos")
          .getPublicUrl(employee.foto_url);
        const fullUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
        console.log(`✅ ${employee.nome}: URL Supabase - ${fullUrl}`);
        return fullUrl;
      } catch (error) {
        console.error(`❌ ${employee.nome}: Erro ao gerar URL Supabase:`, error);
      }
    }

    if (employee.foto) {
      console.log(`🔗 ${employee.nome}: Tentando foto - ${employee.foto}`);

      if (employee.foto.startsWith("http")) {
        const url = `${employee.foto}?t=${new Date().getTime()}`;
        console.log(`✅ ${employee.nome}: URL HTTP (foto) - ${url}`);
        return url;
      }

      try {
        const { data } = supabase.storage
          .from("funcionarios-fotos")
          .getPublicUrl(employee.foto);
        const fullUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
        console.log(`✅ ${employee.nome}: URL Supabase (foto) - ${fullUrl}`);
        return fullUrl;
      } catch (error) {
        console.error(`❌ ${employee.nome}: Erro ao gerar URL Supabase (foto):`, error);
      }
    }

    console.log(`❌ ${employee.nome}: Nenhuma URL válida encontrada`);
    return "/default-avatar.png";
  };

  // ✅ FUNÇÃO: Obter foto do usuário/cliente
  const getUserPhotoUrl = (user: UserWithPhoto): string => {
    if (!user?.foto_url) {
      return "/default-avatar.png";
    }

    if (user.foto_url.startsWith("http")) {
      return `${user.foto_url}?t=${new Date().getTime()}`;
    }

    try {
      const { data } = supabase.storage
        .from("funcionarios-fotos")
        .getPublicUrl(user.foto_url);
      return `${data.publicUrl}?t=${new Date().getTime()}`;
    } catch (error) {
      return "/default-avatar.png";
    }
  };

  // ✅ FUNÇÃO AUXILIAR: Formatar número de telefone
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 11) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    } else if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)} ${cleaned.slice(9)}`;
    }

    return phone;
  };

  // ✅ FUNÇÃO: Obter cargo do funcionário
  const getEmployeeRole = (employee: Employee): string => {
    return employee.cargo || "Atendente";
  };

  // ✅ FUNÇÃO: Obter nome do funcionário
  const getEmployeeName = (employee: Employee): string => {
    return employee.name || employee.nome || "Funcionário";
  };

  // ✅ FUNÇÃO: Verificar se tem foto customizada
  const hasCustomPhoto = (employee: Employee): boolean => {
    return employee.hasCustomPhoto || !!(employee.foto_url || employee.foto || employee.photoUrl);
  };

  // ✅ FUNÇÃO: Verificar se é o funcionário preferido
  const isPreferredEmployee = (employee: Employee): boolean => {
    return selectedEmployee?.id === employee.id;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">

        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Escolha seu atendente
              </h3>
              <p className="text-sm text-gray-600">
                Para: {productName}
              </p>
              {selectedEmployee && (
                <p className="text-xs text-green-600 mt-1">
                  ⭐ Seu preferido: {selectedEmployee.nome}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-xl hover:bg-gray-100 text-gray-700 transition-all"
            >
              ×
            </button>
          </div>

          {/* Informações do cliente */}
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex-shrink-0">
              <img
                src={getUserPhotoUrl(userWithPhoto)}
                alt={userWithPhoto?.nome || "Cliente"}
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-400"
                onError={handleImageError}
              />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">
                {userWithPhoto?.nome || "Cliente"}
              </p>
              <p className="text-xs text-gray-600">
                Você está reservando este produto
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Funcionários */}
        <div className="p-4 space-y-3">
          {employees.map((employee) => {
            const employeeImage = getEmployeePhotoUrl(employee);
            const customPhoto = hasCustomPhoto(employee);
            const isPreferred = isPreferredEmployee(employee);

            console.log(`🎯 Renderizando ${employee.nome}:`, {
              imageUrl: employeeImage,
              customPhoto,
              isPreferred,
              finalUrl: employeeImage
            });

            return (
              <button
                key={employee.id}
                onClick={() => onSelect(employee)}
                className={`w-full p-4 rounded-lg border transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                  isPreferred
                    ? "border-green-500 bg-green-50 hover:bg-green-100 focus:ring-green-500"
                    : "border-gray-200 hover:border-green-500 hover:bg-green-50 focus:ring-green-500"
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Foto do Funcionário */}
                  <div className="flex-shrink-0 relative">
                    <img
                      src={employeeImage}
                      alt={getEmployeeName(employee)}
                      className="w-14 h-14 rounded-full object-cover border-2 border-green-400"
                      onError={handleImageError}
                      onLoad={() => console.log(`✅ Foto carregada para ${getEmployeeName(employee)}: ${employeeImage}`)}
                      onErrorCapture={() => console.log(`❌ Erro ao carregar foto para ${getEmployeeName(employee)}: ${employeeImage}`)}
                    />
                    {/* ✅ BADGE DE PREFERIDO */}
                    {isPreferred && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                        <span className="text-xs text-white">⭐</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-gray-900 text-lg truncate">
                        {getEmployeeName(employee)}
                      </p>
                      {isPreferred && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                          Preferido
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {getEmployeeRole(employee)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatPhoneNumber(employee.whatsapp)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Clique para enviar mensagem
                    </p>
                    {/* Debug info */}
                    <p className="text-xs text-gray-400 mt-1">
                      Foto: {customPhoto ? 'Real' : 'Padrão'} |
                      Preferido: {isPreferred ? 'Sim' : 'Não'}
                    </p>
                  </div>

                  <div className="text-2xl text-gray-400">→</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
