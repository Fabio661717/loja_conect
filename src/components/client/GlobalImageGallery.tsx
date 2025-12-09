import { useCallback, useEffect, useState } from 'react';

interface GalleryImage {
  url: string;
  productName: string;
  productPrice?: number;
  productId: string;
  productStock: number;
}

interface GlobalImageGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  images: GalleryImage[];
  storeName: string;
  initialIndex?: number;
  onReserve?: (productId: string) => void;
}

export default function GlobalImageGallery({
  isOpen,
  onClose,
  images,
  storeName,
  initialIndex = 0,
  onReserve
}: GlobalImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Reset index quando modal abre
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  // Navegação com teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Swipe manual para mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }

    // Reset
    setTouchStart(0);
    setTouchEnd(0);
  };

  const currentImage = images[currentIndex];

  if (!isOpen || images.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black to-transparent p-4">
        <div className="flex justify-between items-center text-white">
          <button
            onClick={onClose}
            className="bg-black bg-opacity-50 hover:bg-opacity-70 p-2 rounded-full transition-all flex items-center"
          >
            ← Voltar
          </button>

          <div className="text-center flex-1 mx-4">
            <h2 className="text-lg font-semibold truncate">{currentImage?.productName}</h2>
            <p className="text-sm opacity-80">
              {currentIndex + 1} / {images.length} • {storeName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="bg-black bg-opacity-50 hover:bg-opacity-70 p-2 rounded-full text-xl transition-all"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Imagem principal com suporte a touch */}
      <div
        className="flex items-center justify-center w-full h-full p-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative max-w-full max-h-full">
          <img
            src={currentImage?.url}
            alt={currentImage?.productName}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
            }}
          />
        </div>
      </div>

      {/* Footer com preço e botão de reserva */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <div className="text-2xl font-bold">
              R$ {currentImage?.productPrice?.toFixed(2) || '--'}
            </div>
            <div className="text-sm opacity-80 mt-1">
              {currentImage?.productStock === 0 ? (
                <span className="text-red-400">ESGOTADO</span>
              ) : currentImage?.productStock <= 2 ? (
                <span className="text-orange-400">Últimas {currentImage.productStock} unidades</span>
              ) : (
                <span className="text-green-400">Em estoque</span>
              )}
            </div>
          </div>

          {currentImage?.productStock > 0 && onReserve && (
            <button
              onClick={() => onReserve(currentImage.productId)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              📱 Reservar Agora
            </button>
          )}
        </div>
      </div>

      {/* Botões de navegação */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all"
          >
            ‹
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all"
          >
            ›
          </button>
        </>
      )}

      {/* Indicadores (dots) */}
      {images.length > 1 && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-70'
              }`}
            />
          ))}
        </div>
      )}

      {/* Gestos para mobile */}
      <div className="absolute bottom-32 left-0 right-0 text-center text-white text-sm opacity-70">
        ← Deslize para ver mais produtos →
      </div>
    </div>
  );
}
