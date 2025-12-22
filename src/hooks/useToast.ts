// src/hooks/useToast.ts
export const useToast = () => {
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Implementação básica - você pode usar alert ou console
    if (type === 'error') {
      alert(`Erro: ${message}`);
    }
  };

  return { showToast };
};

export default useToast;
