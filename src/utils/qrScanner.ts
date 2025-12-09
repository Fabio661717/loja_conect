import { Html5Qrcode } from "html5-qrcode";

/**
 * Escaneia um QR Code a partir de um arquivo de imagem
 */
export const scanQRCodeFromImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Criar uma instância do Html5Qrcode
    const html5QrCode = new Html5Qrcode("qr-reader-container");

    // Usar scanFile para processar a imagem
    html5QrCode.scanFile(file, true)
      .then((decodedText) => {
        // Limpar a instância após o scan
        html5QrCode.clear();
        resolve(decodedText);
      })
      .catch((scanError) => {
        html5QrCode.clear();

        // Tentar método alternativo com FileReader
        const reader = new FileReader();

        reader.onload = (e) => {
          const image = new Image();
          image.src = e.target?.result as string;

          image.onload = () => {
            // Tentar novamente com a imagem carregada
            const html5QrCodeRetry = new Html5Qrcode("qr-reader-container");
            html5QrCodeRetry.scanFile(file, true)
              .then(resolve)
              .catch((retryError) => {
                html5QrCodeRetry.clear();
                reject(new Error('Não foi possível ler o QR Code da imagem'));
              });
          };
        };

        reader.onerror = () => {
          reject(new Error('Erro ao ler o arquivo'));
        };

        reader.readAsDataURL(file);
      });
  });
};

/**
 * Verifica se a câmera está disponível
 */
export const isCameraAvailable = async (): Promise<boolean> => {
  try {
    const devices = await Html5Qrcode.getCameras();
    return devices.length > 0;
  } catch (error) {
    console.warn('Câmera não disponível:', error);
    return false;
  }
};

/**
 * Obtém a lista de câmeras disponíveis
 */
export const getAvailableCameras = async (): Promise<{ id: string; label: string }[]> => {
  try {
    const devices = await Html5Qrcode.getCameras();
    return devices.map(device => ({
      id: device.id,
      label: device.label || `Câmera ${device.id}`
    }));
  } catch (error) {
    console.error('Erro ao obter câmeras:', error);
    return [];
  }
};
