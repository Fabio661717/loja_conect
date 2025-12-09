import { useEffect, useState } from "react";
import type { Reservation } from "../hooks/useSupabase";
import { supabase } from "../services/supabase";
import type { ProductData } from "../types/ProductData";

export default function ReservationsList() {
  const [reservations, setReservations] = useState<(Reservation & { produtos: ProductData | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      const loja_id = localStorage.getItem("loja_id");
      if (!loja_id) return;

      const { data, error } = await supabase
        .from("reservas")
        .select(`*, produtos(*), clientes(*)`)
        .eq("loja_id", loja_id)
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else setReservations(data);

      setLoading(false);
    };

    fetchReservations();
  }, []);

  if (loading) return <p>Carregando reservas...</p>;

  return (
    <div className="space-y-4">
      {reservations.length === 0 && <p>Nenhuma reserva encontrada.</p>}
      {reservations.map((r) => (
        <div key={r.id} className="border p-4 rounded shadow bg-white">
          <p><strong>Produto:</strong> {r.produtos?.nome || "Produto não encontrado"}</p>
          <p><strong>Cliente:</strong> {r.clientes?.nome || "Cliente não encontrado"}</p>
          <p><strong>Quantidade:</strong> {r.quantidade || 1}</p>
          <p><strong>Status:</strong> {r.status}</p>
          <p><strong>Criada em:</strong> {new Date(r.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
