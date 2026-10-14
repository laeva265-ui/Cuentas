import { useState, useEffect } from 'react';
import { pwaService } from '../services/pwaService';

export function usePwa() {
  const [isInstallable, setIsInstallable] = useState(pwaService.isInstallable);
  const [isStandalone, setIsStandalone] = useState(pwaService.isStandalone);
  const [isIOS] = useState(pwaService.isIOS);

  useEffect(() => {
    const unsubscribe = pwaService.subscribe(() => {
      setIsInstallable(pwaService.isInstallable);
      setIsStandalone(pwaService.isStandalone);
    });

    setIsInstallable(pwaService.isInstallable);
    setIsStandalone(pwaService.isStandalone);

    return unsubscribe;
  }, []);

  const install = async () => {
    return await pwaService.install();
  };

  return {
    isInstallable,
    isStandalone,
    isIOS,
    install
  };
}
