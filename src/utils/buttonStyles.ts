// ✅ Funções utilitárias para estilos padronizados de botões

export const getPrimaryButtonClass = (theme: string) => {
  return `px-6 py-3 rounded-lg font-medium transition-all ${
    theme === "dark"
      ? "bg-blue-600 hover:bg-blue-700 text-white"
      : "bg-blue-600 hover:bg-blue-700 text-white"
  }`;
};

export const getSecondaryButtonClass = (theme: string) => {
  return `px-4 py-2 rounded-md text-sm font-medium transition ${
    theme === "dark"
      ? "bg-gray-700 hover:bg-gray-600 text-white"
      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
  }`;
};

export const getActionButtonClass = (theme: string) => {
  return `w-full px-4 py-2 rounded text-sm transition ${
    theme === "dark"
      ? "bg-yellow-600 hover:bg-yellow-700 text-white"
      : "bg-yellow-500 hover:bg-yellow-600 text-white"
  }`;
};

export const getDangerButtonClass = (theme: string) => {
  return `px-4 py-2 rounded-md text-sm font-medium transition ${
    theme === "dark"
      ? "bg-red-700 hover:bg-red-800 text-white"
      : "bg-red-600 hover:bg-red-700 text-white"
  }`;
};

export const getOutlineButtonClass = (theme: string) => {
  return `px-4 py-2 rounded-lg font-medium transition-all border ${
    theme === "dark"
      ? "bg-gray-700 border-gray-600 hover:bg-gray-600 text-white"
      : "bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700"
  }`;
};
