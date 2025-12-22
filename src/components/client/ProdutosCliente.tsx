import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkCameraAvailability } from "../../utils/cameraDetection"; // IMPORT ADICIONADO

export default function ProdutosCliente() {
  const navigate = useNavigate();
  const [showScannerOptions, setShowScannerOptions] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const checkCamera = async () => {
      const hasCamera = await checkCameraAvailability();
      setCameraAvailable(hasCamera);
    };
    checkCamera();
  }, []);

  const handleQRScanner = (method: 'camera' | 'upload' = 'camera') => {
    if (method === 'camera') {
      navigate("/cliente/gr-scanner");
    } else {
      navigate("/cliente/gr-scanner?method=upload");
    }
  };

  // Verifica se tem storeId
  const hasStoreId = localStorage.getItem("storeId");

  // Se tiver storeId, mostra os produtos normais (adicione seu código aqui)
  if (hasStoreId) {
    // return (... seu código de produtos aqui)
  }

  // Tela quando NÃO tem storeId
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">

        {/* Header com Navegação */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Loja-Conect</h1>
            <p className="text-sm text-gray-600">fabio661717@gmail.com</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/cliente")}
              className="text-blue-600 hover:text-blue-800"
            >
              Inicio
            </button>
            <button className="text-blue-600 hover:text-blue-800 font-semibold">
              Produtos
            </button>
            <button className="text-gray-600 hover:text-gray-800">
              Sair
            </button>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="text-6xl mb-4">📷</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Escaneie o QR Code da Loja
            </h2>
            <p className="text-gray-600 mb-6">
              Para ver os produtos disponíveis, primeiro escaneie o QR Code da loja.
            </p>

            {/* Alerta se câmera não disponível */}
            {cameraAvailable === false && (
              <div className="mb-4 p-4 bg-orange-100 border border-orange-300 rounded-lg">
                <p className="text-orange-800 font-medium">
                  📷 Câmera não encontrada. Use a opção de Upload.
                </p>
              </div>
            )}

            {/* Botão Principal com Menu de Opções */}
            <div className="relative">
              <button
                onClick={() => setShowScannerOptions(!showScannerOptions)}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition font-bold text-lg w-full shadow-lg"
              >
                🔍 Escanear QR Code
              </button>

              {/* Menu de Opções do Scanner */}
              {showScannerOptions && (
                <div className="absolute top-16 left-0 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10">
                  <button
                    onClick={() => {
                      handleQRScanner('camera');
                      setShowScannerOptions(false);
                    }}
                    className={`w-full text-left px-6 py-3 flex items-center gap-3 transition ${
                      cameraAvailable === false
                        ? 'opacity-50 cursor-not-allowed bg-gray-100'
                        : 'hover:bg-blue-50'
                    }`}
                    disabled={cameraAvailable === false}
                  >
                    <span className="text-2xl">📷</span>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-800">Usar Câmera</p>
                      <p className="text-sm text-gray-500">
                        {cameraAvailable === false ? 'Câmera não disponível' : 'Escaneie em tempo real'}
                      </p>
                    </div>
                  </button>

                  <div className="border-t border-gray-200 my-1"></div>

                  <button
                    onClick={() => {
                      handleQRScanner('upload');
                      setShowScannerOptions(false);
                    }}
                    className="w-full text-left px-6 py-3 hover:bg-green-50 flex items-center gap-3 transition"
                  >
                    <span className="text-2xl">📁</span>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-800">Upload de Imagem</p>
                      <p className="text-sm text-gray-500">Envie uma foto do QR Code</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Instruções */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Como escanear:</h3>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                <li>• <strong>Câmera:</strong> Aponte diretamente para o QR Code</li>
                <li>• <strong>Upload:</strong> Selecione uma imagem com o QR Code</li>
                <li>• Ambos os métodos funcionam igualmente bem</li>
              </ul>
            </div>
          </div>

          {/* Botões Rápidos Alternativos */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => handleQRScanner('camera')}
              className={`flex-1 py-3 rounded-lg transition font-medium flex items-center justify-center gap-2 ${
                cameraAvailable === false
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              disabled={cameraAvailable === false}
            >
              📷 {cameraAvailable === false ? 'Câmera Indisponível' : 'Câmera'}
            </button>
            <button
              onClick={() => handleQRScanner('upload')}
              className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition font-medium flex items-center justify-center gap-2"
            >
              📁 Upload
            </button>
          </div>
        </div>

        {/* Voltar à Seleção */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate("/cliente")}
            className="text-gray-600 hover:text-gray-800 underline"
          >
            – Voltar à Seleção
          </button>
        </div>
      </div>

      {/* Overlay para fechar o menu */}
      {showScannerOptions && (
        <div
          className="fixed inset-0 bg-black bg-opacity-10 z-0"
          onClick={() => setShowScannerOptions(false)}
        ></div>
      )}
    </div>
  );
}
