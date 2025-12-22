export function productPromotionEmail(produto: string, preco: number) {
  return `
    <h2>Produto em promoção 🔥</h2>
    <p>O produto <strong>${produto}</strong> entrou em promoção!</p>
    <p><strong>Preço especial:</strong> R$ ${preco.toFixed(2)}</p>
  `;
}
