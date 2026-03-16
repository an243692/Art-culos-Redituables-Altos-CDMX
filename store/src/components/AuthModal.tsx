import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, ChevronRight, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const reset = () => { setEmail(''); setPassword(''); setName(''); setLastName(''); setError(''); };

  const handleError = (err: unknown) => {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/user-not-found') setError('No existe una cuenta con ese correo');
    else if (code === 'auth/wrong-password') setError('Contraseña incorrecta');
    else if (code === 'auth/email-already-in-use') setError('Ya existe una cuenta con ese correo');
    else if (code === 'auth/weak-password') setError('La contraseña debe tener al menos 6 caracteres');
    else if (code === 'auth/invalid-email') setError('Correo electrónico inválido');
    else if (code === 'auth/invalid-credential') setError('Credenciales inválidas');
    else setError('Error al autenticar. Intenta de nuevo.');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode !== 'login') return;
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      reset();
      onClose();
    } catch (err: unknown) {
      handleError(err);
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode !== 'register') return;
    if (!name.trim()) { setError('Ingresa tu nombre'); return; }
    setError('');
    setLoading(true);
    try {
      await registerWithEmail(email, password, `${name} ${lastName}`.trim());
      reset();
      onClose();
    } catch (err: unknown) {
      handleError(err);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      reset();
      onClose();
    } catch {
      setError('Error con Google. Intenta de nuevo.');
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4 md:py-8 overflow-y-auto"
          >
            <div className="bg-white w-full max-w-[420px] shadow-2xl my-auto relative flex flex-col max-h-full overflow-y-auto">
              
              {/* Header */}
              <div className="bg-[#eefbfd] text-center pt-8 pb-8 relative shrink-0">
                <button onClick={onClose} className="absolute right-4 top-4 text-black hover:bg-black/5 p-1 rounded-full transition">
                  <X size={20} strokeWidth={2.5} />
                </button>
                <h2 className="text-[22px] font-bold text-[#1e293b] tracking-tight">¡Hola!</h2>
              </div>

              <div className="p-6 md:p-8 flex-1">
                {/* Login Accordion Box */}
                {mode === 'login' ? (
                  <div className="mb-8">
                    <h3 className="text-xl font-medium text-[#1e293b] mb-4">Inicio de Sesión</h3>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="block text-[13px] text-[#334155] mb-1.5">Correo Electrónico</label>
                        <input type="email" placeholder="Ingresa tu Correo Electrónico" value={email} onChange={e => setEmail(e.target.value)} required
                          className="w-full bg-[#f8fafc] border border-gray-200 px-3.5 py-2.5 rounded text-[14px] text-gray-900 placeholder-[#94a3b8] focus:outline-none focus:border-gray-400 transition" />
                      </div>
                      <div>
                        <label className="block text-[13px] text-[#334155] mb-1.5">Contraseña</label>
                        <div className="relative">
                          <input type={showPassword ? 'text' : 'password'} placeholder="Ingresa tu Contraseña" value={password} onChange={e => setPassword(e.target.value)} required
                            className="w-full bg-[#f8fafc] border border-gray-200 pl-3.5 pr-10 py-2.5 rounded text-[14px] text-gray-900 placeholder-[#94a3b8] focus:outline-none focus:border-gray-400 transition" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black hover:text-gray-700">
                            {showPassword ? <Eye size={18} strokeWidth={2} /> : <EyeOff size={18} strokeWidth={2} />}
                          </button>
                        </div>
                      </div>
                      
                      {error && mode === 'login' && <p className="text-red-500 text-xs font-medium">{error}</p>}
                      
                      <button type="submit" disabled={loading}
                        className="w-full py-3.5 mt-2 bg-white border border-[#1e293b] text-[#1e293b] hover:bg-gray-50 rounded-full font-bold text-[12px] tracking-widest uppercase transition disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <div className="w-4 h-4 border-2 border-[#1e293b]/20 border-t-[#1e293b] rounded-full animate-spin" /> : 'INICIAR SESIÓN'}
                      </button>
                      
                      <div className="text-center mt-4">
                        <a href="#" className="text-[13px] text-[#475569] hover:text-[#1e293b] underline underline-offset-2">¿Olvidaste tu contraseña?</a>
                      </div>
                    </form>
                  </div>
                ) : (
                  <button onClick={() => { setMode('login'); reset(); }}
                    className="w-full py-3.5 mb-8 bg-white border border-[#1e293b] text-[#1e293b] hover:bg-gray-50 rounded-full font-bold text-[12px] tracking-widest uppercase transition flex items-center justify-center">
                    INICIAR SESIÓN
                  </button>
                )}

                {/* Register Accordion Box */}
                {mode === 'register' ? (
                  <div className="mb-4">
                    <h3 className="text-xl font-medium text-[#1e293b] mb-1">Registro</h3>
                    <p className="text-[14px] text-[#475569] mb-4">Regístrate en nuestra tienda online es fácil y rápido</p>
                    
                    <div className="border border-gray-300 rounded p-4">
                      <button onClick={() => { setMode('login'); reset(); }}
                        className="w-full flex items-center justify-between text-[11px] font-bold text-[#1e293b] tracking-widest uppercase mb-4">
                        REGISTRARME
                        <ChevronDown size={16} className="text-[#475569]" />
                      </button>
                      
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                          <label className="block text-[13px] text-[#334155] mb-1.5">Nombre</label>
                          <input type="text" placeholder="Ingresa tu Nombre" value={name} onChange={e => setName(e.target.value)} required
                            className="w-full bg-[#f8fafc] border border-gray-200 px-3.5 py-2.5 rounded text-[14px] text-gray-900 placeholder-[#94a3b8] focus:outline-none focus:border-gray-400 transition" />
                        </div>
                        <div>
                          <label className="block text-[13px] text-[#334155] mb-1.5">Apellido</label>
                          <input type="text" placeholder="Ingresa tus Apellidos" value={lastName} onChange={e => setLastName(e.target.value)} required
                            className="w-full bg-[#f8fafc] border border-gray-200 px-3.5 py-2.5 rounded text-[14px] text-gray-900 placeholder-[#94a3b8] focus:outline-none focus:border-gray-400 transition" />
                        </div>
                        <div>
                          <label className="block text-[13px] text-[#334155] mb-1.5">Correo electrónico</label>
                          <input type="email" placeholder="Ingresa tu Correo Electrónico" value={email} onChange={e => setEmail(e.target.value)} required
                            className="w-full bg-[#f8fafc] border border-gray-200 px-3.5 py-2.5 rounded text-[14px] text-gray-900 placeholder-[#94a3b8] focus:outline-none focus:border-gray-400 transition" />
                        </div>
                        <div>
                          <label className="block text-[13px] text-[#334155] mb-1.5">Contraseña</label>
                          <div className="relative">
                            <input type={showPassword ? 'text' : 'password'} placeholder="Ingresa tu Contraseña" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                              className="w-full bg-[#f8fafc] border border-gray-200 pl-3.5 pr-10 py-2.5 rounded text-[14px] text-gray-900 placeholder-[#94a3b8] focus:outline-none focus:border-gray-400 transition" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black hover:text-gray-700">
                              {showPassword ? <Eye size={18} strokeWidth={2} /> : <EyeOff size={18} strokeWidth={2} />}
                            </button>
                          </div>
                        </div>
                        
                        {error && mode === 'register' && <p className="text-red-500 text-xs font-medium">{error}</p>}
                        
                        <button type="submit" disabled={loading}
                          className="w-full py-3.5 mt-2 bg-white border border-[#1e293b] text-[#1e293b] hover:bg-gray-50 rounded-full font-bold text-[12px] tracking-widest uppercase transition disabled:opacity-50 flex items-center justify-center gap-2">
                          {loading ? <div className="w-4 h-4 border-2 border-[#1e293b]/20 border-t-[#1e293b] rounded-full animate-spin" /> : 'REGISTRARME'}
                        </button>
                        
                        <p className="text-[11px] text-[#64748b] italic mt-4 leading-tight">
                          Este sitio está protegido por hCaptcha y se aplican la Política de privacidad de hCaptcha y los Términos del servicio.
                        </p>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <h3 className="text-xl font-medium text-[#1e293b] mb-1">Registro</h3>
                    <p className="text-[14px] text-[#475569] mb-4">Regístrate en nuestra tienda online es fácil y rápido</p>
                    <button onClick={() => { setMode('register'); reset(); }}
                      className="w-full py-3.5 bg-white border border-[#64748b] text-[#1e293b] hover:bg-gray-50 rounded-[4px] font-bold text-[12px] tracking-widest uppercase transition flex items-center justify-between px-5">
                      REGISTRARME
                      <ChevronRight size={18} className="text-[#475569]" />
                    </button>
                  </div>
                )}

                {/* Google Button */}
                <div className="mt-8 border-t border-gray-100 pt-6">
                  <button onClick={handleGoogle} disabled={loading}
                    className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded font-bold text-[13px] tracking-widest uppercase transition disabled:opacity-50 flex items-center justify-center gap-3">
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continuar con Google
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
