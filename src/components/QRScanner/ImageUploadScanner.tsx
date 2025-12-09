import { useState } from "react";

interface ImageUploadScannerProps {
  onImageProcess: (file: File) => Promise<void>;
  scanningImage: boolean;
  uploadedImage: File | null;
}

export default function ImageUploadScanner({
  onImageProcess,
  scanningImage,
  uploadedImage
}: ImageUploadScannerProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    onImageProcess(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleAreaClick = () => {
    if (scanningImage) return;

    const fileInput = document.getElementById('image-upload-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  return (
    <div className="image-upload-scanner">
      <div
        className={`border-2 border-dashed rounded-lg p-8 mb-4 transition-all ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400'
        } ${
          scanningImage ? 'pointer-events-none opacity-70' : 'cursor-pointer'
        }`}
        onClick={handleAreaClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {scanningImage ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Processando imagem...</p>
          </div>
        ) : uploadedImage ? (
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-gray-600 font-medium truncate max-w-full">{uploadedImage.name}</p>
            <p className="text-sm text-gray-500">Imagem carregada com sucesso</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAreaClick();
              }}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Trocar imagem
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-4xl mb-2">📁</div>
            <p className="text-gray-600 font-medium">
              {dragOver ? 'Solte a imagem aqui' : 'Clique ou arraste uma imagem'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              PNG, JPG, JPEG até 5MB
            </p>
          </div>
        )}
      </div>

      {!uploadedImage && !scanningImage && (
        <button
          onClick={handleAreaClick}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition w-full font-medium"
        >
          Selecionar Imagem do QR Code
        </button>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        id="image-upload-input"
      />
    </div>
  );
}
