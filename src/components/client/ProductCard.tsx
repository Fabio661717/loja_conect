import { useState } from "react";
import { useSettings } from "../../context/SettingsContext";
import { Employee } from "../../types/Employee";
import { Product } from "../../types/ProductData";
import ReserveModal from "./ReserveModal";

interface ProductCardProps {
  product: Product;
  employees: Employee[];
  onReserve: (productId: string, employeeId: string, quantidade: number, tamanho?: string) => void;
  onOpenGlobalGallery: (clickedImageUrl: string) => void;
}

export default function ProductCard({
  product,
  employees,
  onReserve,
  onOpenGlobalGallery,
}: ProductCardProps) {
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const { theme } = useSettings();

  const handleReserve = (employeeId: string, quantidade: number = 1, tamanho?: string) => {
    onReserve(product.id, employeeId, quantidade, tamanho);
    setIsReserveModalOpen(false);
  };

  const mainImage = product.foto_url || product.image || '/placeholder-product.jpg';

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Abre a galeria começando na imagem clicada
    onOpenGlobalGallery(mainImage);
  };

  const getStockStatus = () => {
    if (product.estoque === 0) return {
      text: "Sem Estoque",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900"
    };
    if (product.estoque <= 2) return {
      text: `Últimas ${product.estoque} unidades`,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-900"
    };
    return {
      text: `Em estoque: ${product.estoque}`,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900"
    };
  };

  const stockStatus = getStockStatus();

  return (
    <>
      <div className={`
        rounded-xl shadow-lg overflow-hidden transform transition-all duration-300
        hover:scale-105 hover:shadow-xl
        ${theme === "dark"
          ? "bg-gray-800 border border-gray-700"
          : "bg-white border border-gray-200"
        }
      `}>
        {/* Product Image - CLICÁVEL PARA GALERIA GLOBAL */}
        <div
          className="relative h-48 bg-gray-200 overflow-hidden cursor-pointer"
          onClick={handleImageClick}
        >
          <img
            src={mainImage}
            alt={product.name || product.nome}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder-product.jpg";
            }}
          />

          {/* Overlay no hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
            <span className="text-white text-lg opacity-0 hover:opacity-100 transition-opacity">
              🔍 Ampliar
            </span>
          </div>

          {product.estoque === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                ESGOTADO
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg line-clamp-2 flex-1 mr-2">
              {product.name || product.nome}
            </h3>
            {product.preco && (
              <span className={`font-bold text-lg ${theme === "dark" ? "text-green-400" : "text-green-600"}`}>
                R$ {product.preco.toFixed(2)}
              </span>
            )}
          </div>

          {/* Status do estoque */}
          <div className={`text-xs ${stockStatus.color} ${stockStatus.bg} px-2 py-1 rounded mb-3 inline-block`}>
            {stockStatus.text}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsReserveModalOpen(true);
            }}
            disabled={product.estoque === 0}
            className={`
              w-full px-4 py-2 rounded-lg font-medium transition-all mt-2
              ${product.estoque === 0
                ? "bg-gray-400 cursor-not-allowed text-gray-200"
                : theme === "dark"
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }
            `}
          >
            Reservar
          </button>
        </div>
      </div>

      {/* Reserve Modal */}
      <ReserveModal
        isOpen={isReserveModalOpen}
        onClose={() => setIsReserveModalOpen(false)}
        onReserve={handleReserve}
        employees={employees}
        product={product}
        disableReserve={product.estoque === 0}
      />
    </>
  );
}
