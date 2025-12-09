// src/pages/admin/PromotionCreate.tsx
import PromotionForm from '../../components/store/PromotionForm';
import { PromotionProvider } from '../../context/PromotionContext';

export default function PromotionCreate() {
  return (
    <PromotionProvider>
      <PromotionForm />
    </PromotionProvider>
  );
}
