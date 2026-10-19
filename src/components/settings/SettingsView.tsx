import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, 
  ArrowLeft, 
  Download, 
  Upload, 
  Trash2, 
  Save, 
  User as UserIcon, 
  Palette, 
  Fingerprint, 
  ScanFace, 
  Check, 
  ShieldCheck, 
  AlertCircle,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { User, CurrencyCode, ColorThemeId } from '../../types';
import { CURRENCIES } from '../../utils/formatters';
import { APP_THEMES, applyAppTheme } from '../../utils/themes';
import { StorageService } from '../../services/storageService';
import { AuthService } from '../../services/authService';
import { BiometricService } from '../../services/biometricService';

interface SettingsViewProps {
  currentUser: User;
  onUserUpdated: (user: User) => void;
  onReloadData: () => void;
  onBackToDashboard: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onUserUpdated,
  onReloadData,
  onBackToDashboard
}) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [currency, setCurrency] = useState(currentUser.currency);
  const [selectedTheme, setSelectedTheme] = useState<ColorThemeId>(
    currentUser.colorTheme || (localStorage.getItem('finflow_app_theme') as ColorThemeId) || 'navy'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Biometrics state
  const [isBiometricEnrolled, setIsBiometricEnrolled] = useState<boolean>(() =>
    BiometricService.isUserEnrolled(currentUser.id)
  );
  const [isPlatformSupported, setIsPlatformSupported] = useState(false);
  const [biometricStatusMsg, setBiometricStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isProcessingBiometrics, setIsProcessingBiometrics] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    BiometricService.isPlatformAuthenticatorAvailable().then((supported) => {
      setIsPlatformSupported(supported);
    });
    setIsBiometricEnrolled(BiometricService.isUserEnrolled(currentUser.id));
  }, [currentUser.id]);

  const handleSelectTheme = (themeId: ColorThemeId) => {
    setSelectedTheme(themeId);
    applyAppTheme(themeId);
    
    // Persist in user profile
    const updatedUser = AuthService.updateProfile({ colorTheme: themeId });
    if (updatedUser) {
      onUserUpdated(updatedUser);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg('');
    
    setTimeout(() => {
      const updatedUser = AuthService.updateProfile({
        name,
        email,
        currency,
        colorTheme: selectedTheme
      });
      if (updatedUser) {
        onUserUpdated(updatedUser);
        setSaveSuccessMsg('¡Perfil actualizado con éxito!');
        setTimeout(() => setSaveSuccessMsg(''), 3000);
      }
      setIsSaving(false);
    }, 500);
  };

  const handleRegisterBiometrics = async () => {
    setIsProcessingBiometrics(true);
    setBiometricStatusMsg(null);

    const result = await BiometricService.registerBiometrics(currentUser);
    setIsProcessingBiometrics(false);

    if (result.success) {
      setIsBiometricEnrolled(true);
      const updatedUser = AuthService.updateProfile({ biometricsEnabled: true });
      if (updatedUser) onUserUpdated(updatedUser);
      setBiometricStatusMsg({
        text: '¡Huella / Face ID vinculada con éxito a tu cuenta bancaria!',
        type: 'success'
      });
    } else {
      setBiometricStatusMsg({
        text: result.message,
        type: 'error'
      });
    }
  };

  const handleTestBiometrics = async () => {
    setIsProcessingBiometrics(true);
    setBiometricStatusMsg(null);

    const result = await BiometricService.authenticateWithBiometrics(currentUser.id);
    setIsProcessingBiometrics(false);

    if (result.success) {
      setBiometricStatusMsg({
        text: `¡Identidad verificada exitosamente! Sensor biométrico funcionando a la perfección.`,
        type: 'success'
      });
    } else {
      setBiometricStatusMsg({
        text: result.error || 'No se pudo verificar la identidad biométrica.',
        type: 'error'
      });
    }
  };

  const handleRemoveBiometrics = () => {
    if (window.confirm('¿Deseas desvincular el acceso por Huella / Face ID de este dispositivo?')) {
      BiometricService.removeBiometrics(currentUser.id);
      setIsBiometricEnrolled(false);
      const updatedUser = AuthService.updateProfile({ biometricsEnabled: false });
      if (updatedUser) onUserUpdated(updatedUser);
      setBiometricStatusMsg({
        text: 'Acceso biométrico desvinculado de este dispositivo.',
        type: 'info'
      });
    }
  };

  const handleExport = () => {
    const dataStr = StorageService.exportUserData(currentUser.id);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finflow_backup_${currentUser.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = StorageService.importUserData(currentUser.id, content);
        if (success) {
          alert('Datos importados correctamente.');
          onReloadData();
        } else {
          alert('Error al importar los datos. Verifica el formato del archivo.');
        }
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('¿Estás seguro de que deseas borrar TODOS los datos de tu cuenta? Esta acción no se puede deshacer.')) {
      AuthService.deleteUser(currentUser.id);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] p-4 md:p-6 pb-28">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation */}
        <button 
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-[#1A56DB] font-semibold hover:underline bg-white px-4 py-2 rounded-full shadow-sm w-fit border border-slate-200 transition-all hover:shadow"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Menú Principal
        </button>

        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="bank-header-gradient p-3 sm:p-3.5 rounded-2xl shadow-md text-white">
            <Settings className="w-7 h-7 sm:w-8 sm:h-8 gold-accent" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Ajustes y Personalización
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Personaliza los colores del banco, configura tu huella o Face ID y gestiona tu perfil
            </p>
          </div>
        </div>

        {/* 1. SECCIÓN: COLORES Y APARIENCIA DE LA APP */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 bank-card">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">Colores y Temas de la App</h2>
                <p className="text-xs text-slate-500">Selecciona el estilo visual que deseas para toda la banca digital</p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {APP_THEMES.length} Estilos Disponibles
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-2">
            {APP_THEMES.map((theme) => {
              const isSelected = selectedTheme === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`relative p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#1A56DB] bg-blue-50/40 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* Theme Header Swatches */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      {theme.previewColors.map((col, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-4 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {theme.badge}
                    </span>
                  </div>

                  {/* Gradient Preview Bar */}
                  <div 
                    className="h-9 rounded-lg mb-2.5 flex items-center justify-between px-3 text-white font-medium shadow-inner"
                    style={{
                      background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 60%, ${theme.accentColor} 140%)`
                    }}
                  >
                    <span className="text-[11px] font-bold tracking-wide">FinFlow</span>
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: theme.accentColor }} 
                    />
                  </div>

                  {/* Name and subtitle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                        {theme.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate max-w-[170px] mt-0.5">
                        {theme.subtitle}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#1A56DB] text-white flex items-center justify-center shrink-0 shadow">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. SECCIÓN: SEGURIDAD BIOMÉTRICA (HUELLA / FACE ID) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 bank-card">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">Seguridad Biométrica (Huella / Face ID)</h2>
                <p className="text-xs text-slate-500">Inicia sesión al instante y desbloquea tu banca sin escribir contraseñas</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                isBiometricEnrolled
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {isBiometricEnrolled ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Activo
                  </>
                ) : (
                  'No Vinculado'
                )}
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 mb-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-700 shrink-0">
                <ScanFace className="w-6 h-6 text-[#1A56DB]" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">
                  {isBiometricEnrolled ? 'Acceso Biométrico Habilitado' : 'Vincular Huella Dactilar o Reconocimiento Facial'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed max-w-xl">
                  {isBiometricEnrolled
                    ? 'Tu dispositivo está configurado para autorizar inicios de sesión seguros con Windows Hello, Touch ID, Face ID o sensor biométrico móvil.'
                    : 'Permite ingresar de forma instantánea tras 1 minuto de inactividad o al iniciar la app usando el sensor de tu teléfono, laptop o lector de huellas.'}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                  <span>Compatible con: Windows Hello · Apple Touch ID / Face ID · Biometría Android</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {isBiometricEnrolled ? (
                <>
                  <button
                    type="button"
                    disabled={isProcessingBiometrics}
                    onClick={handleTestBiometrics}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                  >
                    <Fingerprint className="w-4 h-4" />
                    Probar Reconocimiento
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingBiometrics}
                    onClick={handleRemoveBiometrics}
                    className="px-3 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-semibold transition-all"
                  >
                    Desvincular
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={isProcessingBiometrics}
                  onClick={handleRegisterBiometrics}
                  className="px-4 py-2.5 bank-header-gradient text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 hover:opacity-95 active:scale-95"
                >
                  <Fingerprint className="w-4 h-4 gold-accent" />
                  <span>{isProcessingBiometrics ? 'Registrando...' : 'Vincular Huella / Face ID'}</span>
                </button>
              )}
            </div>
          </div>

          {biometricStatusMsg && (
            <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-fadeIn ${
              biometricStatusMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : biometricStatusMsg.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {biometricStatusMsg.type === 'success' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{biometricStatusMsg.text}</span>
            </div>
          )}
        </div>

        {/* 3. SECCIÓN: DATOS DEL TITULAR Y RESPALDO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 bank-card">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <UserIcon className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">Datos del Titular</h2>
            </div>
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="bank-section-title block mb-1 text-slate-500 font-bold">Nombre Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:bg-white"
                  required
                />
              </div>
              
              <div>
                <label className="bank-section-title block mb-1 text-slate-500 font-bold">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="bank-section-title block mb-1 text-slate-500 font-bold">Moneda de Referencia</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] cursor-pointer"
                >
                  {(Object.entries(CURRENCIES) as [CurrencyCode, typeof CURRENCIES[CurrencyCode]][]).map(([code, c]) => (
                    <option key={code} value={code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {saveSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 bank-header-gradient hover:opacity-95 text-white py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-[0.99]"
                >
                  <Save className="w-4 h-4 gold-accent" />
                  <span>{isSaving ? 'Guardando...' : 'Actualizar Perfil'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 bank-card h-fit">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
              <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                <Settings className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">Respaldo y Seguridad</h2>
            </div>
            
            <div className="space-y-3.5">
              <button
                type="button"
                onClick={handleExport}
                className="w-full flex items-center justify-between p-3.5 border border-slate-200 rounded-xl hover:border-[#1A56DB] hover:bg-blue-50/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-[#1A56DB] group-hover:text-white transition-colors">
                    <Download className="w-4 h-4 text-[#1A56DB] group-hover:text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-xs sm:text-sm text-slate-800">Exportar Respaldo</p>
                    <p className="text-[11px] text-slate-500">Descargar copia de seguridad en JSON</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-between p-3.5 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-lg group-hover:bg-[#059669] group-hover:text-white transition-colors">
                    <Upload className="w-4 h-4 text-[#059669] group-hover:text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-xs sm:text-sm text-slate-800">Restaurar Respaldo</p>
                    <p className="text-[11px] text-slate-500">Cargar archivo JSON previo</p>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImport}
                  accept=".json"
                  className="hidden"
                />
              </button>

              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full flex items-center justify-between p-3.5 border border-red-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <Trash2 className="w-4 h-4 text-red-600 group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-xs sm:text-sm text-red-700">Eliminar Cuenta</p>
                      <p className="text-[11px] text-red-500">Borrar todos los datos permanentemente</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
