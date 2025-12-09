// src/components/MenuOpcoes.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MenuOpcoes() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Botão dos 3 pontinhos */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        ⋮
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50">
          <ul>
            <li>
              <button
                onClick={() => {
                  navigate("/categorias");
                  setOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Categorias
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  navigate("/configuracoes");
                  setOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Configurações
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
