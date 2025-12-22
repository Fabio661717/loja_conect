export function productCreatedEmail(produto: string) {
  return `
    <h2>Novo produto cadastrado 🆕</h2>
    <p>O produto <strong>${produto}</strong> foi adicionado à sua loja.</p>
  `;
}
