import React from 'react';
import AccessCard from '../components/AccessCard';

const Home: React.FC = () => {
  const accessOptions = [
    {
      id: 1,
      title: "App Cliente",
      description: "Acesse como cliente para fazer reservas e acompanhar pedidos.",
      features: [
        "Escanear QR Code das lojas",
        "Fazer reservas de produtos",
        "Receber notificações",
        "Localizar lojas próximas"
      ],
      checked: false,
      type: "client" as const
    },
    {
      id: 2,
      title: "Painel Loja",
      description: "Acesse como lojista para gerenciar seu estabelecimento.",
      features: [
        "Gerenciar produtos e estoque",
        "Visualizar e aprovar reservas",
        "Gerar QR Codes únicos",
        "Analisar relatórios de vendas"
      ],
      checked: true,
      type: "store" as const
    }
  ];

  return (
    <div className="home-container">
      <h1>Loja Conect</h1>
      <p className="subtitle">Sistema integrado para lojas e clientes</p>

      <h2>Escolha seu acesso</h2>

      <div className="access-grid">
        {accessOptions.map((option) => (
          <AccessCard
            key={option.id}
            title={option.title}
            description={option.description}
            features={option.features}
            checked={option.checked}
            type={option.type}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
