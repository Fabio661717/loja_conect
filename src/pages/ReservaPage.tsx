// src/pages/ReservaPage.tsx
import { useReservation } from '../hooks/useReservations';

export function ReservaPage() {
  const { loading, createReservation, cancelReservation } = useReservation();

  // Exemplo de uso
  const handleReserve = async () => {
    try {
      const reservation = await createReservation(
        'prod_123',
        'emp_456', // lojaId deve vir antes da quantidade
        1, // quantidade
        'M', // tamanho
        'func_789' // funcionarioId (opcional)
      );
      console.log('Reserva criada:', reservation);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <button onClick={handleReserve} disabled={loading}>
        {loading ? 'Criando...' : 'Criar Reserva'}
      </button>
    </div>
  );
}
