// src/components/cliente/ClientEmployeesList.tsx - VERSÃO ATUALIZADA
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReservation } from "../../context/ReservationContext"; // ✅ IMPORT ADICIONADO
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabase";
import { Employee } from "../../types/Employee";

// ✅ URL da imagem padrão (logo)
const DEFAULT_AVATAR_URL = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150&h=150&fit=crop&crop=face";

export default function ClientEmployeesList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [storeName, setStoreName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const { theme } = useSettings();
  const { user } = useAuth();
  const { selectedEmployee, setSelectedEmployee } = useReservation(); // ✅ HOOK ADICIONADO
  const navigate = useNavigate();

  // ✅ Botão estilizado reutilizável
  const CustomButton = ({
    onClick,
    children,
    variant = "primary",
    fullWidth = false,
    disabled = false,
  }: {
    onClick?: () => void;
    children: React.ReactNode;
    variant?: "primary" | "secondary";
    fullWidth?: boolean;
    disabled?: boolean;
  }) => {
    const base = "flex items-center justify-center font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-base";
    const colors = variant === "primary"
      ? "bg-blue-600 hover:bg-blue-700 text-white"
      : "bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600";
    const width = fullWidth ? "w-full" : "";

    return (
      <button onClick={onClick} disabled={disabled} className={`${base} ${colors} ${width}`}>
        {children}
      </button>
    );
  };

  // ✅ FUNÇÃO CORRIGIDA: Obter URL da foto
  const getEmployeePhotoUrl = (employee: any): string => {
    const hasCustomPhoto = !!(employee.foto_url || employee.foto);

    if (!hasCustomPhoto) {
      return DEFAULT_AVATAR_URL;
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

    return DEFAULT_AVATAR_URL;
  };

  // ✅ FUNÇÃO CRITICAMENTE CORRIGIDA: Buscar funcionários
  const fetchEmployees = async (storeId: string): Promise<Employee[]> => {
    try {
      console.log("🔄 Buscando funcionários para loja:", storeId);

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
        .eq("loja_id", storeId)
        .eq("ativo", true)
        .order("nome");

      if (employeesError) {
        console.error("❌ Erro ao buscar funcionários:", employeesError);
        throw employeesError;
      }

      console.log("✅ Dados brutos dos funcionários:", employeesData);

      const formattedEmployees: Employee[] = (employeesData || []).map((emp) => {
        const nome = emp.nome || "Funcionário Sem Nome";
        const hasCustomPhoto = !!(emp.foto_url || emp.foto);
        const photoUrl = getEmployeePhotoUrl(emp);

        console.log(`🎯 Formatando ${nome}:`, {
          id: emp.id,
          nome: nome,
          hasCustomPhoto,
          photoUrl,
          foto_url: emp.foto_url,
          foto: emp.foto
        });

        return {
          id: emp.id,
          nome: nome,
          name: nome,
          whatsapp: emp.whatsapp || "N/A",
          email: emp.email,
          cargo: emp.cargo || "Atendente",
          loja_id: emp.loja_id,
          foto_url: emp.foto_url,
          foto: emp.foto,
          photoUrl: photoUrl,
          ativo: emp.ativo !== undefined ? emp.ativo : true,
          created_at: emp.created_at,
          updated_at: emp.updated_at,
          hasCustomPhoto: hasCustomPhoto
        };
      });

      console.log("✅ Funcionários formatados:", formattedEmployees);
      return formattedEmployees;

    } catch (error) {
      console.error("❌ Erro na busca principal:", error);
      return [];
    }
  };

  // ✅ EFFECT CORRIGIDO
  useEffect(() => {
    const storeId = localStorage.getItem("storeId");
    console.log("🔍 Store ID do localStorage:", storeId);

    if (!storeId) {
      console.log("❌ Nenhuma loja selecionada");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        // ✅ BUSCAR NOME DA LOJA
        const { data: storeData, error: storeError } = await supabase
          .from("lojas")
          .select("nome")
          .eq("id", storeId)
          .single();

        if (storeError) {
          console.error("❌ Erro ao buscar loja:", storeError);
        } else if (storeData) {
          setStoreName(storeData.nome);
          console.log("✅ Loja carregada:", storeData.nome);
        }

        // ✅ BUSCAR FUNCIONÁRIOS
        const employeesData = await fetchEmployees(storeId);
        setEmployees(employeesData);

        console.log("📊 Estatísticas finais:", {
          total: employeesData.length,
          comFotos: employeesData.filter(emp => emp.hasCustomPhoto).length,
          comAvatar: employeesData.filter(emp => !emp.hasCustomPhoto).length
        });

      } catch (error) {
        console.error("❌ Erro geral ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ✅ ✅✅✅ FUNÇÃO ATUALIZADA: Selecionar funcionário preferido
  const handleSelectEmployee = async (employee: Employee) => {
    if (!user) {
      alert("Você precisa estar logado para selecionar um funcionário.");
      navigate("/login-cliente");
      return;
    }

    try {
      console.log("🔄 Selecionando funcionário como PREFERIDO:", employee.nome);

      // ✅ AGORA USA O CONTEXT GLOBAL - isso salva automaticamente no localStorage
      setSelectedEmployee(employee);

      const message = `Olá ${employee.nome}! 👋

Sou ${user.nome || user.email}, cliente da ${storeName}.

Gostaria de ser atendido(a) por você nas minhas próximas reservas.

_Atenciosamente,_
_Sistema Loja Connect_`;

      const whatsappUrl = `https://wa.me/${employee.whatsapp}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");

      alert(`✅ ${employee.nome} selecionado como seu atendente preferido!\n\nAgora ele será selecionado automaticamente quando você for fazer reservas!`);
      navigate("/cliente");

    } catch (error) {
      console.error("❌ Erro ao selecionar funcionário:", error);
      alert("Erro ao selecionar funcionário. Tente novamente.");
    }
  };

  // ✅ Enviar mensagem direta
  const handleSendMessage = (employee: Employee) => {
    const message = `Olá ${employee.nome}! Gostaria de mais informações sobre os produtos.`;
    const whatsappUrl = `https://wa.me/${employee.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  // ✅ Formatar telefone
  const formatPhoneNumber = (phone: string) => {
    if (!phone || phone === "N/A") return "N/A";
    const cleaned = phone.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone;
  };

  // ✅ Obter iniciais
  const getInitials = (name: string): string => {
    if (!name || name === "Funcionário Sem Nome") return "👤";
    const names = name.split(' ').filter(n => n.length > 0);
    if (names.length === 0) return "👤";
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // ✅ Tratamento de erro de imagem
  const handleImageError = (employeeId: string) => {
    console.log(`❌ Erro ao carregar imagem do funcionário ${employeeId}`);
    setImageErrors(prev => new Set(prev).add(employeeId));
  };

  // ✅ LOADING
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-50"
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${
            theme === "dark" ? "text-gray-300" : "text-gray-600"
          }`}>
            Carregando funcionários...
          </p>
        </div>
      </div>
    );
  }

  // ✅ SEM LOJA SELECIONADA
  if (!localStorage.getItem("storeId")) {
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
          <p className={`mb-6 ${
            theme === "dark" ? "text-gray-300" : "text-gray-600"
          }`}>
            Para ver os funcionários disponíveis, primeiro escaneie o QR Code da loja.
          </p>
          <CustomButton
            onClick={() => navigate("/cliente/qr-scanner")}
            variant="primary"
            fullWidth
          >
            Escanear QR Code
          </CustomButton>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
    }`}>
      {/* Header */}
      <header className={`${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      } shadow-sm border-b ${
        theme === "dark" ? "border-gray-700" : "border-gray-200"
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <CustomButton
                onClick={() => navigate("/cliente")}
                variant="secondary"
              >
                ← Voltar
              </CustomButton>
              <div>
                <h1 className="text-xl font-bold">Escolha seu Atendente Preferido</h1>
                <p className={`text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}>
                  {storeName} • {employees.length} atendente{employees.length !== 1 ? "s" : ""}
                </p>
                {selectedEmployee && (
                  <p className={`text-xs mt-1 ${
                    theme === "dark" ? "text-green-400" : "text-green-600"
                  }`}>
                    ⭐ Atual: {selectedEmployee.nome}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Lista de Funcionários */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {employees.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className={`text-xl font-semibold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Nenhum atendente disponível
            </h3>
            <p className={`mb-6 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}>
              Esta loja ainda não possui atendentes cadastrados no sistema.
            </p>
            <CustomButton onClick={() => navigate("/cliente")} variant="primary">
              Voltar ao Início
            </CustomButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => {
              const hasError = imageErrors.has(employee.id);
              const initials = getInitials(employee.nome);
              const isSelected = selectedEmployee?.id === employee.id;

              return (
                <div
                  key={employee.id}
                  className={`rounded-xl shadow-lg p-6 transition-all hover:shadow-xl border-2 ${
                    isSelected
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : theme === "dark"
                        ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                        : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {/* Foto e Informações */}
                  <div className="text-center mb-4">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                      {employee.photoUrl && !hasError ? (
                        <img
                          src={employee.photoUrl}
                          alt={`Foto de ${employee.nome}`}
                          className="w-24 h-24 rounded-full object-cover border-2 border-blue-400 shadow-md"
                          onError={() => handleImageError(employee.id)}
                          loading="lazy"
                        />
                      ) : (
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold border-2 ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-gray-200 border-gray-300 text-gray-700"
                        }`}>
                          {initials}
                        </div>
                      )}

                      {/* Status Online */}
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>

                      {/* Badge do tipo de foto */}
                      <div className={`absolute -top-2 -left-2 px-2 py-1 rounded-full text-xs font-medium ${
                        employee.hasCustomPhoto
                          ? 'bg-green-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}>
                        {employee.hasCustomPhoto ? '📸' : '👤'}
                      </div>

                      {/* ✅ BADGE DE SELECIONADO */}
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                          ⭐ Preferido
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-semibold mb-1">
                      {employee.nome}
                    </h3>
                    <p className={`text-sm ${
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}>
                      {employee.cargo}
                    </p>
                  </div>

                  {/* Informações de Contato */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center">
                      <span className="w-6 text-lg">📱</span>
                      <span className={`text-sm ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}>
                        {formatPhoneNumber(employee.whatsapp)}
                      </span>
                    </div>

                    {employee.email && (
                      <div className="flex items-center">
                        <span className="w-6 text-lg">📧</span>
                        <span className={`text-sm ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}>
                          {employee.email}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="space-y-3">
                    <CustomButton
                      onClick={() => handleSelectEmployee(employee)}
                      variant={isSelected ? "primary" : "primary"}
                      fullWidth
                    >
                      {isSelected ? "✅ Preferido" : "⭐ Selecionar Preferido"}
                    </CustomButton>

                    <CustomButton
                      onClick={() => handleSendMessage(employee)}
                      variant="secondary"
                      fullWidth
                    >
                      💬 Enviar Mensagem
                    </CustomButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Informações Adicionais */}
        <div className={`mt-8 p-6 rounded-lg ${
          theme === "dark"
            ? "bg-gray-800 border border-gray-700"
            : "bg-blue-50 border border-blue-200"
        }`}>
          <h3 className="font-semibold mb-3">💡 Como funciona o sistema preferido</h3>
          <ul className={`text-sm space-y-2 ${
            theme === "dark" ? "text-gray-300" : "text-blue-700"
          }`}>
            <li><strong>⭐ Selecione um atendente preferido</strong> - Ele será lembrado automaticamente</li>
            <li><strong>🔄 Reservas futuras</strong> - Seu preferido será selecionado automaticamente</li>
            <li><strong>🔁 Trocar preferido</strong> - Clique em outro funcionário a qualquer momento</li>
            <li><strong>💬 Mensagens diretas</strong> - Entre em contato com qualquer atendente</li>
          </ul>
          {selectedEmployee && (
            <div className={`mt-4 p-3 rounded-lg ${
              theme === "dark" ? "bg-green-900/30 border border-green-700" : "bg-green-100 border border-green-200"
            }`}>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                ✅ Seu atendente preferido atual: <strong>{selectedEmployee.nome}</strong>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
