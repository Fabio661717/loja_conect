import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { scanQRCodeFromImage } from "../../utils/qrScanner";
import { extractUUIDFromString, isValidUUID } from "../../utils/validation";
import CameraScanner from "./CameraScanner";
import ImageUploadScanner from "./ImageUploadScanner";
import "./Scanner.css";
import ScannerConfigModal from "./ScannerConfigModal";

export default function QRScanner() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanMethod, setScanMethod] = useState<'camera' | 'upload'>('camera');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [isConfigMenuOpen, setIsConfigMenuOpen] = useState(false);
  const [scanningImage, setScanningImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleScanResult = (result: string) => {
    setScanResult(result);

    let storeUUID: string | null = null;

    if (isValidUUID(result)) {
      storeUUID = result;
    } else {
      storeUUID = extractUUIDFromString(result);
    }

    if (storeUUID) {
      localStorage.setItem("storeId", storeUUID);
      setTimeout(() => {
        const user = localStorage.getItem('user');
        if (user) {
          navigate("/cliente/produtos");
        } else {
          navigate("/login-cliente");
        }
      }, 1500);
    } else {
      alert("QR Code inválido. Escaneie um QR Code válido da loja.");
    }
  };

  const handleImageProcess = async (file: File) => {
    setUploadedImage(file);
    setScanningImage(true);
    setUploadError(null);
    setScanResult(null);

    try {
      const qrCodeData = await scanQRCodeFromImage(file);

      if (qrCodeData) {
        handleScanResult(qrCodeData);
      } else {
        setUploadError('Nenhum QR Code encontrado na imagem. Tente com outra imagem.');
        setScanningImage(false);
      }
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      setUploadError("Erro ao processar a imagem. Tente novamente.");
      setScanningImage(false);
    }
  };

  const handleFileInputClick = () => {
    const fileInput = document.getElementById('qr-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Resetar estados anteriores
      setScanResult(null);
      setUploadError(null);
      setScanMethod('upload');
      handleImageProcess(file);
    }
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    event.target.value = '';
  };

  const handleRetryUpload = () => {
    setUploadError(null);
    setScanningImage(false);
    handleFileInputClick();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Botão Voltar */}
        <button
          onClick={() => navigate("/cliente")}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center font-medium"
        >
          ← Voltar ao Dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Escanear QR Code da Loja</h1>
          <p className="text-gray-600">
            Escolha como deseja escanear o QR Code
          </p>
        </div>

        {/* Seletor de Método */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setScanMethod('camera');
                setUploadError(null);
                setScanResult(null);
              }}
              className={`flex-1 py-3 rounded-lg border-2 transition-all font-medium ${
                scanMethod === 'camera'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              📷 Usar Câmera
            </button>
            <button
              onClick={() => {
                setScanMethod('upload');
                handleFileInputClick();
              }}
              className={`flex-1 py-3 rounded-lg border-2 transition-all font-medium ${
                scanMethod === 'upload'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              📁 Fazer Upload
            </button>
          </div>

          {/* Botão de Configurações */}
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setIsConfigMenuOpen(true)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition py-2 px-4 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configurações
            </button>
          </div>

          {/* Área do Scanner/Upload */}
          {scanMethod === 'camera' ? (
            <CameraScanner
              onScanSuccess={handleScanResult}
              onScanError={(error) => console.warn('Erro do scanner:', error)}
            />
          ) : (
            <ImageUploadScanner
              onImageProcess={handleImageProcess}
              scanningImage={scanningImage}
              uploadedImage={uploadedImage}
            />
          )}

          {/* Input de Arquivo Oculto */}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            id="qr-upload"
          />
        </div>

        {/* Erro no Upload */}
        {uploadError && (
          <div className="mt-4 p-4 bg-red-100 border border-red-200 rounded-lg text-red-700 text-center">
            <p className="font-medium">❌ {uploadError}</p>
            <button
              onClick={handleRetryUpload}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Tentar outra imagem
            </button>
          </div>
        )}

        {/* Resultado do Scan */}
        {scanResult && (
          <div className="mt-4 p-4 bg-green-100 border border-green-200 rounded-lg text-green-700 text-center animate-in">
            <p className="font-medium">✅ Loja identificada com sucesso!</p>
            <p className="text-sm mt-1">Redirecionando para produtos...</p>
          </div>
        )}

        {/* Informações de Ajuda */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-blue-800">Como escanear:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Câmera:</strong> Aponte diretamente para o QR Code</li>
            <li>• <strong>Upload:</strong> Selecione uma imagem com o QR Code</li>
            <li>• Ambos os métodos funcionam igualmente bem</li>
          </ul>
        </div>
      </div>

      {/* Modal de Configurações */}
      <ScannerConfigModal
        isOpen={isConfigMenuOpen}
        onClose={() => setIsConfigMenuOpen(false)}
        onMethodSelect={setScanMethod}
        currentMethod={scanMethod}
      />

      {/* Container oculto para o scanner de imagem */}
      <div id="qr-reader-container" className="hidden"></div>
    </div>
  );
}
