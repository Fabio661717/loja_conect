// ImageGallery.tsx
import { useCallback, useEffect, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

interface ImageGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  productName: string;
}

export default function ImageGallery({ isOpen, onClose, images, productName }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index quando modal abre
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

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

  // Configuração do swipe
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => goToNext(),
    onSwipedRight: () => goToPrevious(),
    trackMouse: true
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black to-transparent p-4">
        <div className="flex justify-between items-center text-white">
          <button
            onClick={onClose}
            className="bg-black bg-opacity-50 hover:bg-opacity-70 p-2 rounded-full transition-all"
          >
            ← Voltar
          </button>

          <div className="text-center flex-1 mx-4">
            <h2 className="text-lg font-semibold truncate">{productName}</h2>
            <p className="text-sm opacity-80">
              {currentIndex + 1} / {images.length}
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

      {/* Imagem principal */}
      <div
        {...swipeHandlers}
        className="flex items-center justify-center w-full h-full p-4"
      >
        <div className="relative max-w-full max-h-full">
          <img
            src={images[currentIndex]}
            alt={`${productName} - Imagem ${currentIndex + 1}`}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
            }}
          />
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
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
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
      <div className="absolute bottom-8 left-0 right-0 text-center text-white text-sm opacity-70">
        ← Deslize para navegar →
      </div>
    </div>
  );
}
