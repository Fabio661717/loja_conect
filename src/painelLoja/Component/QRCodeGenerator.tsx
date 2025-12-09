import * as QRCode from 'qrcode';
import { useEffect, useState } from 'react';

type QRCodeGeneratorProps = {
  storeId: string;
};

export default function QRCodeGenerator({ storeId }: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    generateQRCode();
  }, [storeId]);

  const generateQRCode = async () => {
    try {
      const storeUrl = `${window.location.origin}/store/${storeId}`;
      const url = await QRCode.toDataURL(storeUrl);
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qrcode-loja-${storeId}.png`;
    link.click();
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">QR Code da Loja</h2>
      <p className="mb-4">Clientes podem escanear este código para acessar seus produtos</p>

      {qrCodeUrl && (
        <>
          <img src={qrCodeUrl} alt="QR Code da Loja" className="mx-auto mb-4 w-48 h-48" />
          <button
            onClick={downloadQRCode}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md"
          >
            Baixar QR Code
          </button>
        </>
      )}
    </div>
  );
}
