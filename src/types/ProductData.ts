// src/types/ProductData.ts - VERSÃO COMPLETAMENTE CORRIGIDA
export interface ParcelamentoOptions {
  habilitado: boolean;
  max_parcelas: number;
  juros: number;
  product: string;
}

// Interface principal em português (compatível com seu sistema)
export interface Product {
  id: string;
  nome: string;
  descricao?: string;
  categoria_id?: string;
  preco: number;
  estoque: number;
  foto_url?: string;
  loja_id?: string;
  store_id?: string;
  created_at?: string;
  updated_at?: string;
  tamanhos?: string[];
  parcelamento?: ParcelamentoOptions;
  ativo?: boolean;
  image_url?: string; // Para compatibilidade com alguns serviços
image?: string;    // Para compatibilidade com alguns serviços
imageUrls?: string[]; // Para compatibilidade com alguns serviços
images?: string[];   // Para compatibilidade com alguns serviços
  category_id?: string; // Para compatibilidade com alguns serviços
  category?: string;   // Para compatibilidade com alguns serviços
  description?: string; // Para compatibilidade com alguns serviços
  name?: string;       // Para compatibilidade com alguns serviços
  price?: number;      // Para compatibilidade com alguns serviços
  stock?: number;      // Para compatibilidade com alguns serviços
  imagens?: string[]; // Para compatibilidade com alguns serviços em português
categoria?: string; // Para compatibilidade com alguns serviços em português
imagem?: string; // Para compatibilidade com alguns serviços em português
}

// Interface em inglês para compatibilidade (usada no ProductFormState)
export interface ProductData {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  category_id?: string;
  image_url?: string;
  store_id: string;
  created_at?: string;
  updated_at?: string;
  // Campos em português para compatibilidade
  nome?: string;
  descricao?: string;
  preco?: number;
  foto_url?: string;
  loja_id?: string;
  estoque?: number;
  categoria_id?: string;
  tamanhos?: string[];
  parcelamento?: ParcelamentoOptions;
  ativo?: boolean;
}

// Interface específica para o formulário
export interface ProductFormData {
  id: string;
  nome: string;
  descricao: string;
  categoria_id: string;
  preco: number;
  estoque: number;
  sizes: string[];
  images: string[];
  parcelamento: ParcelamentoOptions;
}

export interface ProductFormState {
  id: string;
  nome: string;
  descricao: string;
  categoria_id:  string;
  preco: number;
  estoque: number;
  sizes: string[];
  images: string[];
  parcelamento: ParcelamentoOptions;
  productData: ProductData;
  product: Product;
  product_id: string;
}

// Interface para criação
export interface CreateProductData {
  nome: string;
  descricao: string;
  preco: number;
  estoque: number;
  categoria_id: string;
  foto_url?: string;
  tamanhos?: string[];
  parcelamento?: ParcelamentoOptions;
  store_id?: string;
  loja_id?: string;
}

// Valores padrão
export const DEFAULT_PARCELAMENTO: ParcelamentoOptions = {
  habilitado: false,
  max_parcelas: 1,
  juros: 0,
  product: ""
};

// Função de conversão
export function convertProductToProductData(product: Product): ProductData {
  return {
    id: product.id,
    name: product.nome,
    description: product.descricao,
    price: product.preco,
    category_id: product.categoria_id,
    image_url: product.foto_url,
    store_id: product.loja_id || product.store_id || '',
    created_at: product.created_at,
    updated_at: product.updated_at,
    // Campos de compatibilidade
    nome: product.nome,
    descricao: product.descricao,
    preco: product.preco,
    foto_url: product.foto_url,
    loja_id: product.loja_id,
    estoque: product.estoque,
    categoria_id: product.categoria_id,
    tamanhos: product.tamanhos,
    parcelamento: product.parcelamento,
    ativo: product.ativo
  };
}
