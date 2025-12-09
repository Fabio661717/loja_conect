// src/pages/ProdutoPage.tsx
import WhatsAppButton from "../components/WhatsAppButton";

const ProdutoPage = () => {
  const product = { name: "Pizza Margherita" };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
      <WhatsAppButton
        employeePhone="+55 11999999999"
        clientName="Fábio Paiva"
        product={product}
        size="Grande"
        quantity={2}
        pickupTime="19:30"
        reservationId="ABC123"
      />
    </div>
  );
};

export default ProdutoPage;
