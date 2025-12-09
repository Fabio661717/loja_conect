// CameraScanner.tsx
import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useState } from "react";

interface CameraScannerProps {
  onScanSuccess: (result: string) => void;
  onScanError: (error: string) => void;
}

export default function CameraScanner({ onScanSuccess, onScanError }: CameraScannerProps) {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);

  useEffect(() => {
    let scanner: Html5QrcodeScanner;
    let isComponentMounted = true;

    const initializeScanner = async () => {
      try {
        setIsInitializing(true);
        setCameraError(null);

        // Tentar detectar câmeras disponíveis
        let cameras: any[] = [];
        try {
          cameras = await Html5Qrcode.getCameras();
        } catch (cameraError) {
          console.warn('Erro ao obter lista de câmeras:', cameraError);
          // Continua mesmo com erro na lista de câmeras
        }

        if (cameras.length === 0) {
          console.log('Nenhuma câmera listada, tentando iniciar com câmera padrão...');
        }

        // Configurações do scanner
        const config = {
          qrbox: {
            width: 250,
            height: 250,
          },
          fps: 5,
          aspectRatio: 1.333, // Melhor compatibilidade
        };

        scanner = new Html5QrcodeScanner("camera-scanner", config, false);

        // Função de sucesso
        const onSuccess = (result: string) => {
          if (isComponentMounted) {
            scanner.clear();
            onScanSuccess(result);
          }
        };

        // Função de erro
        const onFailure = (error: string) => {
          if (isComponentMounted && !error.includes("No MultiFormat Readers were able to detect the code")) {
            console.warn('Erro do scanner:', error);
          }
        };

        // Tentar iniciar o scanner
        try {
          scanner.render(onSuccess, onFailure);

          if (isComponentMounted) {
            setIsInitializing(false);
            setHasCamera(true);
          }
        } catch (renderError) {
          throw new Error(`Falha ao iniciar scanner: ${renderError}`);
        }

      } catch (error) {
        if (isComponentMounted) {
          console.error('Erro ao inicializar scanner:', error);

          let errorMessage = 'Não foi possível acessar a câmera';
          let showRetryButton = true;

          if (error instanceof Error) {
            const errorStr = error.message.toLowerCase();

            if (errorStr.includes('notreadableerror') || errorStr.includes('could not start video source')) {
              errorMessage = '❌ Erro ao acessar a câmera\n\nA câmera pode estar sendo usada por outro aplicativo ou há um problema de permissão.';
            } else if (errorStr.includes('permission') || errorStr.includes('permissão')) {
              errorMessage = '📵 Permissão da câmera negada\n\nPor favor, permita o acesso à câmera nas configurações do seu navegador.';
              showRetryButton = false;
            } else if (errorStr.includes('nenhuma câmera') || errorStr.includes('no camera')) {
              errorMessage = '📵 Câmera não detectada\n\nSeu dispositivo não possui câmera ou não foi possível acessá-la.';
              setHasCamera(false);
              showRetryButton = false;
            }
          }

          setCameraError(errorMessage);
          setIsInitializing(false);
          onScanError(error instanceof Error ? error.message : 'Erro desconhecido');

          // Mostrar botão de tentar novamente apenas se for relevante
          if (!showRetryButton) {
            setCameraError(prev => prev + '\n\nUse a opção "Fazer Upload" para escanear uma imagem.');
          }
        }
      }
    };

    // Inicializar scanner
    initializeScanner();

    return () => {
      isComponentMounted = false;
      if (scanner) {
        try {
          scanner.clear();
        } catch (error) {
          console.warn('Erro ao limpar scanner:', error);
        }
      }
    };
  }, [onScanSuccess, onScanError]);

  // Função para tentar novamente
  const handleRetry = () => {
    setCameraError(null);
    setIsInitializing(true);
    setHasCamera(null);

    // Recarregar o componente após um breve delay
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Se não há câmera, mostrar mensagem
  if (hasCamera === false) {
    return (
      <div className="camera-scanner-container">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">📵</div>
          <p className="text-yellow-700 font-medium mb-2">Câmera não detectada</p>
          <p className="text-yellow-600 text-sm mb-4">
            Seu dispositivo não possui câmera ou não foi possível acessá-la.
          </p>
          <p className="text-yellow-600 text-sm">
            Use a opção "Fazer Upload" para escanear uma imagem.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="camera-scanner-container">
      {/* Loading durante inicialização */}
      {isInitializing && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-sm text-gray-500">Iniciando câmera...</p>
          <p className="text-xs text-gray-400 mt-1">Solicitando permissões</p>
        </div>
      )}

      {/* Erro de câmera */}
      {cameraError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center whitespace-pre-line">
          <div className="text-4xl mb-3">❌</div>
          <p className="text-red-700 font-medium mb-4">{cameraError}</p>

          {/* Soluções sugeridas */}
          <div className="text-left bg-red-100 p-3 rounded-lg mb-4">
            <p className="text-red-800 text-sm font-medium mb-2">📋 Tente estas soluções:</p>
            <ul className="text-red-700 text-sm space-y-1">
              <li>• Feche outros apps que possam estar usando a câmera</li>
              <li>• Reinicie o navegador</li>
              <li>• Verifique as permissões da câmera</li>
              <li>• Use a opção "Fazer Upload" como alternativa</li>
            </ul>
          </div>

          <button
            onClick={handleRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors mb-2"
          >
            🔄 Tentar Novamente
          </button>

          <p className="text-gray-500 text-xs mt-2">
            Se o problema persistir, use o upload de imagem
          </p>
        </div>
      )}

      {/* Container do scanner */}
      <div
        id="camera-scanner"
        className={`w-full ${isInitializing || cameraError ? 'hidden' : ''}`}
      />

      {/* Instruções quando o scanner está ativo */}
      {!isInitializing && !cameraError && (
        <div className="text-center mt-4 space-y-2">
          <p className="text-sm text-gray-600">
            📱 <strong>Câmera ativa</strong>
          </p>
          <p className="text-xs text-gray-500">
            Aponte para o QR Code da loja para escanear
          </p>
        </div>
      )}
    </div>
  );
}
