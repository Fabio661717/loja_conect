// src/components/store/EmployeesList.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useSupabase } from "../../hooks/useSupabase";
import { useToast } from "../../hooks/useToast";


interface Funcionario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  telefone?: string;
  loja_id: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export default function EmployeesList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { supabase } = useSupabase();

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentFuncionario, setCurrentFuncionario] = useState<Funcionario | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string>("");

  // Formulário
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cargo: "funcionario",
    telefone: "",
    ativo: true
  });

  // Obter ID da loja
  useEffect(() => {
    if (user?.lojaId) {
      setStoreId(user.lojaId);
      loadFuncionarios(user.lojaId);
    }
  }, [user]);

  // Carregar funcionários
  const loadFuncionarios = async (lojaId: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("funcionarios")
        .select("*")
        .eq("loja_id", lojaId)
        .order("nome");

      if (error) throw error;

      setFuncionarios(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar funcionários:", error);
      showToast("Erro ao carregar funcionários", "error");
    } finally {
      setLoading(false);
    }
  };

  // Adicionar funcionário
  const handleAddFuncionario = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeId) {
      showToast("Loja não identificada", "error");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("funcionarios")
        .insert([{
          ...formData,
          loja_id: storeId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      showToast("Funcionário adicionado com sucesso!", "success");
      setFuncionarios(prev => [...prev, data]);
      setShowAddModal(false);
      resetForm();
    } catch (error: any) {
      console.error("Erro ao adicionar funcionário:", error);
      showToast(error.message || "Erro ao adicionar funcionário", "error");
    }
  };

  // Editar funcionário
  const handleEditFuncionario = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentFuncionario) return;

    try {
      const { error } = await supabase
        .from("funcionarios")
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq("id", currentFuncionario.id);

      if (error) throw error;

      showToast("Funcionário atualizado com sucesso!", "success");

      // Atualizar lista
      setFuncionarios(prev => prev.map(f =>
        f.id === currentFuncionario.id
          ? { ...f, ...formData, updated_at: new Date().toISOString() }
          : f
      ));

      setShowEditModal(false);
      setCurrentFuncionario(null);
      resetForm();
    } catch (error: any) {
      console.error("Erro ao editar funcionário:", error);
      showToast(error.message || "Erro ao editar funcionário", "error");
    }
  };

  // Excluir funcionário
  const handleDeleteFuncionario = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este funcionário?")) return;

    try {
      setDeletingId(id);

      const { error } = await supabase
        .from("funcionarios")
        .delete()
        .eq("id", id);

      if (error) throw error;

      showToast("Funcionário excluído com sucesso!", "success");
      setFuncionarios(prev => prev.filter(f => f.id !== id));
    } catch (error: any) {
      console.error("Erro ao excluir funcionário:", error);
      showToast(error.message || "Erro ao excluir funcionário", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // Alternar status ativo/inativo
  const toggleStatus = async (funcionario: Funcionario) => {
    try {
      const novoStatus = !funcionario.ativo;

      const { error } = await supabase
        .from("funcionarios")
        .update({
          ativo: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", funcionario.id);

      if (error) throw error;

      showToast(`Funcionário ${novoStatus ? "ativado" : "desativado"} com sucesso!`, "success");

      // Atualizar lista
      setFuncionarios(prev => prev.map(f =>
        f.id === funcionario.id
          ? { ...f, ativo: novoStatus, updated_at: new Date().toISOString() }
          : f
      ));
    } catch (error: any) {
      console.error("Erro ao alterar status:", error);
      showToast(error.message || "Erro ao alterar status", "error");
    }
  };

  // Abrir modal de edição
  const openEditModal = (funcionario: Funcionario) => {
    setCurrentFuncionario(funcionario);
    setFormData({
      nome: funcionario.nome,
      email: funcionario.email,
      cargo: funcionario.cargo,
      telefone: funcionario.telefone || "",
      ativo: funcionario.ativo
    });
    setShowEditModal(true);
  };

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      nome: "",
      email: "",
      cargo: "funcionario",
      telefone: "",
      ativo: true
    });
  };

  // Opções de cargo
  const cargos = [
    { value: "gerente", label: "Gerente" },
    { value: "supervisor", label: "Supervisor" },
    { value: "vendedor", label: "Vendedor" },
    { value: "caixa", label: "Caixa" },
    { value: "estoque", label: "Estoque" },
    { value: "atendimento", label: "Atendimento" },
    { value: "funcionario", label: "Funcionário" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Funcionários da Loja</h1>
            <button
              onClick={() => navigate("/loja/dashboard")}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Voltar
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Gerenciar Funcionários</h2>
                <p className="text-sm text-gray-600">
                  Total: {funcionarios.length} funcionário(s) cadastrado(s)
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <span>+</span>
                Adicionar Funcionário
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Funcionários */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Carregando funcionários...</span>
            </div>
          ) : funcionarios.length === 0 ? (
            <div className="text-center p-12">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum funcionário cadastrado</h3>
              <p className="text-gray-600 mb-4">
                Adicione funcionários para gerenciar sua equipe.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Adicionar Primeiro Funcionário
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cargo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {funcionarios.map((funcionario) => (
                    <tr key={funcionario.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {funcionario.nome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {funcionario.nome}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {funcionario.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          funcionario.cargo === "gerente"
                            ? "bg-purple-100 text-purple-800"
                            : funcionario.cargo === "supervisor"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {cargos.find(c => c.value === funcionario.cargo)?.label || funcionario.cargo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {funcionario.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {funcionario.telefone || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleStatus(funcionario)}
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            funcionario.ativo
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {funcionario.ativo ? "Ativo" : "Inativo"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(funcionario)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteFuncionario(funcionario.id)}
                            disabled={deletingId === funcionario.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {deletingId === funcionario.id ? "Excluindo..." : "Excluir"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Adicionar Funcionário */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Adicionar Funcionário</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddFuncionario} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo *
                  </label>
                  <select
                    required
                    value={formData.cargo}
                    onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {cargos.map((cargo) => (
                      <option key={cargo.value} value={cargo.value}>
                        {cargo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Ativo
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Funcionário */}
      {showEditModal && currentFuncionario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Editar Funcionário</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setCurrentFuncionario(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditFuncionario} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo *
                  </label>
                  <select
                    required
                    value={formData.cargo}
                    onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {cargos.map((cargo) => (
                      <option key={cargo.value} value={cargo.value}>
                        {cargo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Ativo
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setCurrentFuncionario(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
