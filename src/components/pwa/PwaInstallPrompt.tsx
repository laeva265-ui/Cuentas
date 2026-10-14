import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Share2, CheckCircle2 } from 'lucide-react';
import { usePwa } from '../../hooks/usePwa';

export const PwaInstallPrompt: React.FC = () => {
  const { isInstallable, isStandalone, isIOS, install } = usePwa();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    const dismissedUntil = localStorage.getItem('finflow_pwa_dismissed_until');
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      setIsDismissed(true);
    }
  }, []);

  if (isStandalone || isDismissed) {
    return null;
  }

  // Only display if installable or iOS browser
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    // Dismiss for 24 hours
    localStorage.setItem('finflow_pwa_dismissed_until', String(Date.now() + 24 * 60 * 60 * 1000));
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosGuide(true);
      return;
    }
    await install();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      <div className="bg-gradient-to-r from-[#0B1A2E] via-[#122B4A] to-[#1A3A5C] text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        {/* Abstract Gold Glow */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#D4A853]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3.5 z-10">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#D4A853] shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-white">Instala FinFlow Bank en tu Dispositivo</h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#D4A853] text-[#0B1A2E] uppercase">
                PWA
              </span>
            </div>
            <p className="text-xs text-white/80 mt-0.5 leading-relaxed">
              Disfruta de la experiencia de app nativa en tu celular, tablet o PC con pantalla completa y sin conexión.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto z-10 justify-end">
          <button
            onClick={handleInstallClick}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#D4A853] to-[#E8C374] text-[#0B1A2E] font-bold text-xs sm:text-sm rounded-xl hover:opacity-95 transition-opacity shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Instalar Aplicación</span>
          </button>
          
          <button
            onClick={handleDismiss}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title="Cerrar sugerencia"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-slate-800">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-[#1A56DB]">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#0B1A2E]">Cómo instalar en iPhone / iPad</h4>
                  <p className="text-xs text-slate-500">Pasos rápidos en Safari</p>
                </div>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ol className="space-y-3 text-xs sm:text-sm text-slate-600 mb-6">
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1A56DB] font-bold text-xs flex items-center justify-center shrink-0">1</span>
                <span>Toca el botón <strong>Compartir</strong> <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" /> en la barra inferior de Safari.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1A56DB] font-bold text-xs flex items-center justify-center shrink-0">2</span>
                <span>Desplázate hacia abajo y selecciona <strong>"Añadir a pantalla de inicio"</strong>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1A56DB] font-bold text-xs flex items-center justify-center shrink-0">3</span>
                <span>Toca <strong>Añadir</strong> en la esquina superior derecha y ¡listo!</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-[#0B1A2E] text-white rounded-xl text-sm font-semibold hover:bg-[#122B4A] transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
