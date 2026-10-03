import React, { useState, useRef } from 'react';
import { Settings, ArrowLeft, Download, Upload, Trash2, Save, User as UserIcon, Link2, Check, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { User, CurrencyCode } from '../../types';
import { CURRENCIES } from '../../utils/formatters';
import { StorageService } from '../../services/storageService';
import { AuthService } from '../../services/authService';
import { GoogleAppsScriptService } from '../../services/appsScriptService';

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
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Apps Script Web App URL state
  const [scriptUrl, setScriptUrl] = useState(GoogleAppsScriptService.getScriptUrl());
  const [scriptStatus, setScriptStatus] = useState<string>('');
  const [isTestingScript, setIsTestingScript] = useState(false);

  const handleSaveScriptUrl = () => {
    GoogleAppsScriptService.setScriptUrl(scriptUrl);
    setScriptStatus('URL de Apps Script guardada.');
    setTimeout(() => setScriptStatus(''), 3000);
  };

  const handleTestScript = async () => {
    setIsTestingScript(true);
    setScriptStatus('Probando conexión con Google Sheets...');
    GoogleAppsScriptService.setScriptUrl(scriptUrl);
    const res = await GoogleAppsScriptService.testConnection();
    setIsTestingScript(false);
    if (res.success) {
      setScriptStatus(`Conectado exitosamente. Hojas detectadas: ${res.sheets?.join(', ')}`);
      onReloadData();
    } else {
      setScriptStatus(`Error: ${res.message}`);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    setTimeout(() => {
      const updatedUser = AuthService.updateProfile({
        name,
        email,
        currency
      });
      if (updatedUser) {
        onUserUpdated(updatedUser);
      }
      setIsSaving(false);
    }, 600);
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
    <div className="min-h-screen bg-[#F0F4F8] p-4 md:p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation */}
        <button 
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-[#1A56DB] font-medium hover:underline bg-white px-4 py-2 rounded-full shadow-sm w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Menú Principal
        </button>

        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="bg-[#0B1A2E] p-3 rounded-2xl shadow-md">
            <Settings className="w-8 h-8 text-[#D4A853]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Configuración de la Cuenta</h1>
            <p className="text-slate-500 mt-1">Gestiona tu perfil y preferencias de seguridad</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 bank-card">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <UserIcon className="w-5 h-5 text-[#1A56DB]" />
              <h2 className="text-xl font-bold text-slate-800">Datos del Titular</h2>
            </div>
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Moneda de Referencia</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-shadow"
                >
                  {(Object.entries(CURRENCIES) as [CurrencyCode, typeof CURRENCIES[CurrencyCode]][]).map(([code, c]) => (
                    <option key={code} value={code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 bg-[#0B1A2E] hover:bg-[#122B4A] text-white py-3 rounded-xl font-medium transition-colors"
                >
                  <Save className="w-5 h-5" />
                  {isSaving ? 'Guardando Cambios...' : 'Actualizar Perfil'}
                </button>
              </div>
            </form>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 bank-card h-fit">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <Settings className="w-5 h-5 text-[#1A56DB]" />
              <h2 className="text-xl font-bold text-slate-800">Respaldo y Seguridad</h2>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-[#1A56DB] hover:bg-blue-50/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-[#1A56DB] group-hover:text-white transition-colors">
                    <Download className="w-5 h-5 text-[#1A56DB] group-hover:text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-800">Exportar Respaldo</p>
                    <p className="text-xs text-slate-500">Descargar copia de seguridad en JSON</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-[#1A56DB] hover:bg-blue-50/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-lg group-hover:bg-[#059669] group-hover:text-white transition-colors">
                    <Upload className="w-5 h-5 text-[#059669] group-hover:text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-800">Restaurar Respaldo</p>
                    <p className="text-xs text-slate-500">Cargar archivo JSON previo</p>
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

              <div className="pt-4 mt-2 border-t border-slate-100">
                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-between p-4 border border-red-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <Trash2 className="w-5 h-5 text-red-600 group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-red-700">Eliminar Cuenta</p>
                      <p className="text-xs text-red-500">Borrar todos los datos permanentemente</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Google Sheets Apps Script Sync */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 bank-card">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-700">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Conexión a Hoja de Cálculo Google Sheets</h2>
                  <p className="text-xs text-slate-500">Sincronización en la nube con "FinFlow Bank" vía Google Apps Script</p>
                </div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                GoogleAppsScriptService.isConfigured() 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {GoogleAppsScriptService.isConfigured() ? '● Vinculado' : '○ No Vinculado'}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  URL de la Aplicación Web (Google Apps Script)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      value={scriptUrl}
                      onChange={(e) => setScriptUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveScriptUrl}
                    className="bg-[#0B1A2E] text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-[#122B4A] transition-colors"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={handleTestScript}
                    disabled={isTestingScript || !scriptUrl}
                    className="bg-[#1A56DB] text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isTestingScript ? 'animate-spin' : ''}`} />
                    Probar Conexión
                  </button>
                </div>
                {scriptStatus && (
                  <p className="mt-2 text-xs font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {scriptStatus}
                  </p>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
                <p className="font-bold text-slate-800">📌 Pasos rápidos para obtener la URL de Apps Script:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-500 pl-1">
                  <li>En tu hoja de cálculo <b>FinFlow Bank</b> en Google Drive, ve a <b>Extensiones &gt; Apps Script</b>.</li>
                  <li>Pega el código generado en el archivo <code>google-apps-script/Codigo.gs</code> del proyecto.</li>
                  <li>Haz clic en <b>Implementar &gt; Nueva implementación</b> y selecciona <b>Aplicación web</b>.</li>
                  <li>Configura: <i>Quién tiene acceso: "Cualquier usuario" (Anyone)</i> y pulsa <b>Implementar</b>.</li>
                  <li>Copia la URL que termina en <code>/exec</code> y pégala arriba.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
