// PWA Service to handle registration and install prompts

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

class PwaService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private listeners: Array<() => void> = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('FinFlow Bank PWA Service Worker registrado con éxito:', reg.scope);
          })
          .catch((err) => {
            console.warn('Error al registrar Service Worker:', err);
          });
      });
    }

    // Capture beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.notifyListeners();
      console.log('FinFlow Bank PWA listo para ser instalado');
    });

    // Detect app installed
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.notifyListeners();
      console.log('FinFlow Bank PWA instalado en el dispositivo');
    });
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb());
  }

  public get isInstallable(): boolean {
    return this.deferredPrompt !== null;
  }

  public get isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  public get isIOS(): boolean {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  }

  public async install(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.deferredPrompt) {
      return 'unavailable';
    }

    try {
      await this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        this.deferredPrompt = null;
        this.notifyListeners();
      }
      return choice.outcome;
    } catch (err) {
      console.error('Error al solicitar instalación PWA:', err);
      return 'unavailable';
    }
  }
}

export const pwaService = new PwaService();
