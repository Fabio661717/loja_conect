// src/pages/ConfigPage.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function ConfigPage({ employees }) {
  const { getSelectedEmployee, setSelectedEmployee } = useAuth();
  const [selectedEmployee, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      const saved = await getSelectedEmployee();
      setSelected(saved);
    })();
  }, []);

  const handleChangeEmployee = async () => {
    await setSelectedEmployee(null);
    setSelected(null);
    alert("Agora você pode selecionar um novo funcionário ao reservar.");
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <div>
        <p>Funcionário atual: {selectedEmployee ? selectedEmployee : "Nenhum"}</p>
        <button
          onClick={handleChangeEmployee}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Trocar funcionário
        </button>
      </div>
    </div>
  );
}
