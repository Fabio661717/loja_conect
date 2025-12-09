// src/components/WhatsAppButton.tsx
import React from "react";
import toast from "react-hot-toast";
import {
  formatPhoneNumber,
  generateWhatsAppLink,
  isValidWhatsAppNumber,
  openWhatsApp,
  type ReservationDetails
} from "../services/whatsapp";
import type { Product } from "../types/ProductData"; // ✅ IMPORT CORRETO

interface WhatsAppButtonProps {
  employeePhone: string;
  clientName: string;
  product: Product;
  size: string;
  quantity: number;
  pickupTime: string;
  reservationId: string;
  storeName?: string;
  additionalNotes?: string;
  showImageHint?: boolean;
  className?: string;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  employeePhone,
  clientName,
  product,
  size,
  quantity,
  pickupTime,
  reservationId,
  storeName = "Nossa Loja",
  additionalNotes,
  showImageHint = true,
  className = ""
}) => {
  const handleClick = () => {
    // Validações completas
    if (!employeePhone?.trim()) {
      toast.error("Número do funcionário não informado ❌");
      return;
    }

    if (!isValidWhatsAppNumber(employeePhone)) {
      toast.error("Número de WhatsApp inválido ❌");
      return;
    }

    if (!clientName?.trim()) {
      toast.error("Nome do cliente é obrigatório ❌");
      return;
    }

    // ✅ CORREÇÃO: Usar product.nome em vez de product.name
    if (!product?.nome?.trim()) {
      toast.error("Nome do produto é obrigatório ❌");
      return;
    }

    if (!reservationId?.trim()) {
      toast.error("ID da reserva é obrigatório ❌");
      return;
    }

    try {
      const reservationDetails: ReservationDetails = {
        clientName,
        product,
        size,
        quantity,
        pickupTime,
        reservationId,
        storeName,
        additionalNotes
      };

      // ✅ CORREÇÃO: Usar apenas generateWhatsAppLink (única função disponível)
      const link = generateWhatsAppLink(employeePhone, reservationDetails);

      toast.success(
        <div className="flex items-center gap-2">
          <span>Enviando reserva para</span>
          <strong>{formatPhoneNumber(employeePhone)}</strong>
          <span>...</span>
        </div>,
        { duration: 3000 }
      );

      // Pequeno delay para o usuário ver a mensagem de sucesso
      setTimeout(() => {
        openWhatsApp(link);
      }, 1000);

    } catch (error: any) {
      console.error("❌ Erro ao gerar link do WhatsApp:", error);
      toast.error(error.message || "Erro ao abrir WhatsApp ❌");
    }
  };

  // ✅ CORREÇÃO: Usar product.nome e product.foto_url em vez de product.name e product.image_url
  const productImage = product.foto_url || product.image_url || product.image || product.imagem || '';

  return (
    <div className="flex flex-col gap-3">
      {/* Preview da Mensagem */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
        <div className="flex items-start gap-3">
          {productImage && (
            <img
              src={productImage}
              alt={product.nome}
              className="w-16 h-16 rounded-lg object-cover border"
            />
          )}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800">Preview da Mensagem:</h4>
            <p className="text-gray-600 mt-1">
              Será enviado para: <strong>{formatPhoneNumber(employeePhone)}</strong>
            </p>
            {productImage && showImageHint && (
              <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                <span>📸</span> Foto do produto incluída na mensagem
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Botão Principal */}
      <button
        onClick={handleClick}
        className={`
          px-6 py-3 bg-green-600 text-white rounded-lg
          hover:bg-green-700 transition-all duration-200
          font-medium flex items-center justify-center gap-3
          shadow-lg hover:shadow-xl transform hover:scale-105
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.49"/>
          </svg>
          <span className="text-lg">Enviar Reserva no WhatsApp</span>
        </div>
      </button>

      {/* Informações Adicionais */}
      <div className="text-xs text-gray-500 text-center">
        📞 Será aberta uma conversa no WhatsApp com todos os detalhes da reserva
        {productImage && " 📸 Incluindo a foto do produto"}
      </div>
    </div>
  );
};

export default WhatsAppButton;
