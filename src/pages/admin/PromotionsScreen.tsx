// src/pages/admin/PromotionsScreen.tsx
import PromotionManager from '../../components/store/PromotionManager';
import { PromotionProvider } from '../../context/PromotionContext';

export default function PromotionsScreen() {
  return (
    <PromotionProvider>
      <PromotionManager />
    </PromotionProvider>
  );
}
