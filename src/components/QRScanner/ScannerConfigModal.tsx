interface ScannerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMethodSelect: (method: 'camera' | 'upload') => void;
  currentMethod: 'camera' | 'upload';
}

export default function ScannerConfigModal({
  isOpen,
  onClose,
  onMethodSelect,
  currentMethod
}: ScannerConfigModalProps) {

  const handleMethodSelect = (method: 'camera' | 'upload') => {
    onMethodSelect(method);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 animate-in fade-in-zoom-in-50">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Configurações do Scanner</h2>

        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleMethodSelect('camera')}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              currentMethod === 'camera'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📷</span>
              <div>
                <p className="font-medium text-gray-800">Usar Câmera</p>
                <p className="text-sm text-gray-500">Escaneie em tempo real</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleMethodSelect('upload')}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              currentMethod === 'upload'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📁</span>
              <div>
                <p className="font-medium text-gray-800">Upload de Imagem</p>
                <p className="text-sm text-gray-500">Envie uma imagem do QR Code</p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
