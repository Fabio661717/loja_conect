// src/components/client/PromotionList.tsx - VERSÃO CORRIGIDA
import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Promotion } from '../../types'; // ✅ CORREÇÃO: Use o import do arquivo centralizado
import PromotionCardClient from './PromotionCardClient';

// ❌ REMOVIDO: Interface local que causava conflito
// A interface Promotion já está sendo importada de '../../types'

export default function PromotionList() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem('storeId');
    setStoreId(storedId);

    if (storedId) {
      loadPromotions(storedId);
      setupRealtime(storedId);
    }
  }, []);

  const loadPromotions = async (lojaId: string) => {
    try {
      const { data, error } = await supabase
        .from('promocoes')
        .select(`
          *,
          produto:produtos(id, nome, foto_url, descricao, categoria_id)
        `)
        .eq('loja_id', lojaId)
        .eq('ativa', true)
        .gte('data_fim', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // ✅ CORREÇÃO: Garantir tipagem correta
      const typedPromotions: Promotion[] = (data || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        loja_id: item.loja_id,
        preco_original: item.preco_original,
        preco_promocional: item.preco_promocional,
        parcelas: item.parcelas,
        valor_parcela: item.valor_parcela,
        categoria_id: item.categoria_id,
        data_inicio: item.data_inicio,
        data_fim: item.data_fim,
        ativa: item.ativa,
        created_at: item.created_at,
        produto: item.produto ? {
          id: item.produto.id,
          nome: item.produto.nome,
          foto_url: item.produto.foto_url,
          descricao: item.produto.descricao,
          categoria_id: item.produto.categoria_id
        } : undefined
      }));

      setPromotions(typedPromotions);
    } catch (error) {
      console.error('Erro ao carregar promoções:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = (lojaId: string) => {
    const channel = supabase
      .channel('promocoes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'promocoes',
          filter: `loja_id=eq.${lojaId}`
        },
        (payload) => {
          // ✅ CORREÇÃO: Tipagem segura para os eventos
          if (payload.eventType === 'INSERT' && payload.new.ativa) {
            const newPromotion: Promotion = {
              id: payload.new.id,
              product_id: payload.new.product_id,
              loja_id: payload.new.loja_id,
              preco_original: payload.new.preco_original,
              preco_promocional: payload.new.preco_promocional,
              parcelas: payload.new.parcelas,
              valor_parcela: payload.new.valor_parcela,
              categoria_id: payload.new.categoria_id,
              data_inicio: payload.new.data_inicio,
              data_fim: payload.new.data_fim,
              ativa: payload.new.ativa,
              created_at: payload.new.created_at
            };
            setPromotions(prev => [newPromotion, ...prev]);
          }
          else if (payload.eventType === 'UPDATE') {
            setPromotions(prev =>
              prev.map(p =>
                p.id === payload.new.id ? {
                  ...p,
                  ...payload.new,
                  // ✅ CORREÇÃO: Garantir que todos os campos obrigatórios existam
                  id: payload.new.id || p.id,
                  product_id: payload.new.product_id || p.product_id,
                  loja_id: payload.new.loja_id || p.loja_id,
                  preco_original: payload.new.preco_original ?? p.preco_original,
                  preco_promocional: payload.new.preco_promocional ?? p.preco_promocional,
                  parcelas: payload.new.parcelas ?? p.parcelas,
                  valor_parcela: payload.new.valor_parcela ?? p.valor_parcela,
                  categoria_id: payload.new.categoria_id || p.categoria_id,
                  data_inicio: payload.new.data_inicio || p.data_inicio,
                  data_fim: payload.new.data_fim || p.data_fim,
                  ativa: payload.new.ativa ?? p.ativa,
                  created_at: payload.new.created_at || p.created_at
                } : p
              )
            );
          }
          else if (payload.eventType === 'DELETE') {
            setPromotions(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🔥</div>
        <h3 className="text-xl font-semibold mb-2">Escaneie o QR Code da Loja</h3>
        <p className="text-gray-500">
          Para ver as promoções disponíveis, primeiro escaneie o QR Code da loja.
        </p>
      </div>
    );
  }

  if (promotions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🔥</div>
        <h3 className="text-xl font-semibold mb-2">Nenhuma Promoção no Momento</h3>
        <p className="text-gray-500">
          Esta loja ainda não possui promoções ativas.
        </p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🔥 Promoções em Destaque
        </h2>
        <p className="text-gray-600">
          Aproveite nossas ofertas especiais por tempo limitado!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map(promotion => (
          <PromotionCardClient
            key={promotion.id}
            promotion={promotion}
          />
        ))}
      </div>
    </div>
  );
}
