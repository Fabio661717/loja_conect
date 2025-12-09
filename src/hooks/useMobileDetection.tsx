import { useEffect, useState } from 'react';

export const useMobileDetection = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkDevice = (): void => {
      const isMobileDevice: boolean =
        window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      setIsMobile(isMobileDevice);
    };

    // Verificar inicialmente
    checkDevice();

    // Adicionar listener para redimensionamento
    window.addEventListener('resize', checkDevice);

    // Cleanup
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isMobile;
};
