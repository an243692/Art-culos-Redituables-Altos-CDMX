import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, ChevronRight, Lock, ShieldCheck, ArrowLeft, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { ConfirmationResult } from 'firebase/auth';

type AuthStep =
  | 'choose'
  | 'phone-input'
  | 'phone-otp'
  | 'phone-register-fast'
  | 'phone-login'
  | 'forgot-otp'
  | 'phone-reset';

/* ─────────────────────────────────────────────────────────────
   Stable sub-components — defined OUTSIDE AuthModal so React
   never remounts them when parent state changes (which would
   close the mobile keyboard on every keystroke).
───────────────────────────────────────────────────────────── */

function PhoneInputRow({ phone, setPhone }: { phone: string; setPhone: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2">Número de celular</label>
      <div className="flex items-center border-2 border-gray-200 rounded-2xl overflow-hidden focus-within:border-[#00A0C6] focus-within:ring-4 focus-within:ring-[#00A0C6]/10 transition-all bg-gray-50">
        <span className="px-4 py-[15px] text-gray-500 text-[15px] font-black border-r-2 border-gray-200 bg-gray-100 select-none whitespace-nowrap">🇲🇽 +52</span>
        <input
          type="tel" placeholder="55 1234 5678" value={phone}
          onChange={e => setPhone(e.target.value.replace(/[^\d\s]/g, ''))}
          maxLength={12}
          className="flex-1 px-4 py-[15px] bg-transparent text-[16px] text-gray-900 placeholder-gray-400 focus:outline-none font-bold"
        />
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggle }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2">{label}</label>
      <div className="flex items-center border-2 border-gray-200 rounded-2xl overflow-hidden focus-within:border-[#00A0C6] focus-within:ring-4 focus-within:ring-[#00A0C6]/10 transition-all bg-gray-50">
        <input
          type={show ? 'text' : 'password'} placeholder="••••••" value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-4 py-[15px] bg-transparent text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none font-bold"
        />
        <button type="button" onClick={onToggle} className="px-4 text-gray-400 hover:text-gray-700 transition-colors">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function OtpField({ otp, setOtp, onEnter }: { otp: string; setOtp: (v: string) => void; onEnter: () => void }) {
  return (
    <div>
      <label className="block text-[11px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2 text-center">Código de 6 dígitos</label>
      <input
        type="tel" inputMode="numeric" pattern="[0-9]*" placeholder="––––––" value={otp}
        onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
        onKeyDown={e => { if (e.key === 'Enter') onEnter(); }}
        className="w-full text-center text-[36px] font-black tracking-[0.35em] border-2 border-gray-200 rounded-2xl py-5 px-4 bg-gray-50 focus:outline-none focus:border-[#00A0C6] focus:ring-4 focus:ring-[#00A0C6]/10 transition-all"
      />
    </div>
  );
}

function ErrorMsg({ error }: { error: string }) {
  if (!error) return null;
  return (
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs font-bold text-center bg-red-50 py-2.5 px-4 rounded-xl">
      {error}
    </motion.p>
  );
}

function SubmitBtn({ label, onClick, disabled, loading }: { label: string; onClick: () => void; disabled?: boolean; loading: boolean }) {
  return (
    <button
      onClick={onClick} disabled={loading || disabled}
      className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-[15px] tracking-wide transition-all disabled:opacity-40 flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg shadow-black/10"
    >
      {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
      {loading ? 'Un momento...' : label}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { sendPhoneOtp, confirmPhoneOtp, loginWithGoogle, loginWithPhone, resetPhonePassword, registerWithPhoneOnly } = useAuth();

  const [step, setStep] = useState<AuthStep>('choose');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  const reset = () => {
    setStep('choose'); setPhone(''); setOtp(''); setName('');
    setPassword(''); setConfirmPassword(''); setShowPass(false); setShowConfirmPass(false);
    setError(''); setLoading(false); setConfirmation(null);
  };
  const handleClose = () => { reset(); onClose(); };

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('52') && digits.length >= 12) return `+${digits}`;
    if (digits.length === 10) return `+52${digits}`;
    return `+52${digits}`;
  };

  const handleSendOtp = async (nextStep: AuthStep) => {
    const formatted = formatPhone(phone);
    if (formatted.replace(/\D/g, '').length < 12) { setError('Ingresa un número de celular válido a 10 dígitos'); return; }
    setError(''); setLoading(true);
    try {
      const result = await sendPhoneOtp(formatted);
      setConfirmation(result);
      setStep(nextStep);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-phone-number') setError('Número de celular inválido');
      else if (code === 'auth/too-many-requests') setError('Demasiados intentos. Espera unos minutos.');
      else setError(`Error: ${err.message || 'Error al enviar el código.'}`);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!confirmation) return;
    if (otp.length < 6) { setError('Ingresa el código de 6 dígitos'); return; }
    if (!name.trim()) { setError('Ingresa tu nombre completo'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    setError(''); setLoading(true);
    try {
      await confirmPhoneOtp(confirmation, otp, name, password);
      reset(); onClose();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-verification-code') setError('Código incorrecto.');
      else if (code === 'auth/code-expired') setError('El código expiró. Solicita uno nuevo.');
      else setError(`Error interno: ${err.message || code || 'Intenta de nuevo'}`);
    }
    setLoading(false);
  };

  const handlePhoneLogin = async () => {
    const formatted = formatPhone(phone);
    if (formatted.replace(/\D/g, '').length < 12) { setError('Número inválido'); return; }
    if (!password) { setError('Ingresa tu contraseña'); return; }
    setError(''); setLoading(true);
    try {
      await loginWithPhone(formatted, password);
      reset(); onClose();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Número o contraseña incorrectos.');
      } else {
        setError(`Error: ${err.message || 'Intenta de nuevo.'}`);
      }
    }
    setLoading(false);
  };

  const handleFastRegister = async () => {
    const formatted = formatPhone(phone);
    if (formatted.replace(/\D/g, '').length < 12) { setError('Número inválido a 10 dígitos'); return; }
    if (!name.trim()) { setError('Ingresa tu nombre completo'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    setError(''); setLoading(true);
    try {
      await registerWithPhoneOnly(formatted, password, name);
      reset(); onClose();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') setError('Este número ya está registrado. Inicia sesión.');
      else setError(`Error: ${err.message || 'Intenta de nuevo.'}`);
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!confirmation) return;
    if (otp.length < 6) { setError('Ingresa el código de 6 dígitos'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    setError(''); setLoading(true);
    try {
      await resetPhonePassword(confirmation, otp, password);
      reset(); onClose();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/invalid-verification-code') setError('Código incorrecto.');
      else if (code === 'auth/code-expired') setError('El código expiró. Solicita uno nuevo.');
      else setError('Error al restablecer. Intenta de nuevo.');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try { await loginWithGoogle(); reset(); onClose(); }
    catch (err: any) { setError(`Error con Google: ${err.message || 'Intenta de nuevo'}`); }
    setLoading(false);
  };

  const titles: Record<AuthStep, { title: string; sub: string }> = {
    'choose':              { title: '¡Bienvenido a Altos Artículos!', sub: 'Accede para ver tus pedidos y descuentos exclusivos' },
    'phone-register-fast': { title: 'Crea tu cuenta', sub: 'Registra tu celular y contraseña' },
    'phone-input':         { title: 'Ingresa tu celular', sub: 'Recibirás un SMS con tu código de verificación' },
    'phone-otp':           { title: 'Confirma el código', sub: `Código enviado al +52 ${phone}` },
    'phone-login':         { title: 'Inicia sesión', sub: 'Ingresa tu número y contraseña' },
    'forgot-otp':          { title: 'Restablecer contraseña', sub: 'Recibirás un SMS para verificar tu número' },
    'phone-reset':         { title: 'Nueva contraseña', sub: `Código enviado al +52 ${phone}` },
  };
  const { title: stepTitle, sub: stepSub } = titles[step];

  const backStep: Partial<Record<AuthStep, AuthStep>> = {
    'phone-register-fast': 'choose',
    'phone-input':         'choose',
    'phone-otp':           'phone-input',
    'phone-login':         'choose',
    'forgot-otp':          'phone-login',
    'phone-reset':         'forgot-otp',
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] md:hidden" onClick={handleClose} />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-[60] hidden md:block" />

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-0 z-[61] flex items-end md:items-center justify-center pointer-events-none"
            >
              <div className="pointer-events-auto w-full h-[100dvh] md:h-full flex flex-col md:flex-row bg-white shadow-2xl overflow-hidden">

                {/* Illustration */}
                <div className="flex bg-[#f0f2f5] relative items-end justify-center overflow-hidden h-[36dvh] md:h-auto md:flex-1 shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#e9edf2] via-[#f0f3f7] to-[#dde3ec]" />
                  <div className="absolute bottom-[-15%] md:bottom-[-8%] left-1/2 -translate-x-1/2 w-[120%] aspect-square rounded-full bg-white/50" />
                  <div className="absolute top-6 left-6 md:top-10 md:left-10 z-20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo-altos.png" alt="Altos Artículos" className="h-7 md:h-9 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                  <div className="absolute top-6 right-6 md:top-10 md:right-10 z-20 text-right hidden md:block">
                    <p className="text-[13px] font-black text-gray-400 uppercase tracking-widest">Papelería &amp; Oficina</p>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/login-illustration.png" alt="Bienvenido" className="relative z-10 h-[85%] md:h-auto md:w-[85%] max-w-[520px] object-contain object-bottom select-none pt-4 md:pt-0" draggable={false} />
                </div>

                {/* Form panel */}
                <div className="w-full md:w-[480px] lg:w-[520px] xl:w-[560px] flex flex-col relative bg-white flex-1 min-h-0 md:flex-none">
                  {/* Close */}
                  <button onClick={handleClose} className="absolute right-4 top-4 md:right-6 md:top-6 z-20 text-gray-400 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-all bg-white shadow-sm md:shadow-none">
                    <X size={22} strokeWidth={2.5} />
                  </button>
                  {/* Back */}
                  {step !== 'choose' && (
                    <button onClick={() => { setStep(backStep[step] || 'choose'); setError(''); }}
                      className="absolute left-4 top-4 md:left-6 md:top-6 z-20 text-gray-400 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-all bg-white shadow-sm md:shadow-none">
                      <ArrowLeft size={22} strokeWidth={2.5} />
                    </button>
                  )}

                  {/* Scrollable area */}
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col pb-8 md:pb-14 w-full">
                    <div className="w-full flex flex-col px-6 md:px-12 lg:px-16 pt-14 pb-10 md:py-14">

                      {/* Step title */}
                      <AnimatePresence mode="wait">
                        <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="mb-8">
                          <h1 className="text-[26px] md:text-[34px] font-black text-gray-900 leading-tight tracking-tight">{stepTitle}</h1>
                          <p className="text-gray-500 text-[14px] font-medium mt-2 leading-relaxed">{stepSub}</p>
                        </motion.div>
                      </AnimatePresence>

                      <AnimatePresence mode="wait">

                        {/* ── CHOOSE ── */}
                        {step === 'choose' && (
                          <motion.div key="choose" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="space-y-4">
                            <button onClick={handleGoogle} disabled={loading}
                              className="group w-full flex items-center gap-4 px-5 py-4 bg-white border-2 border-gray-200 hover:border-blue-400 rounded-2xl font-semibold text-gray-800 hover:bg-blue-50/40 transition-all disabled:opacity-50 active:scale-[0.98] shadow-sm">
                              <svg width="22" height="22" viewBox="0 0 24 24" className="flex-shrink-0">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                              </svg>
                              <span className="font-bold flex-1 text-left">Continuar con Google</span>
                              {loading ? <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /> : <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />}
                            </button>

                            <button onClick={() => setStep('phone-register-fast')}
                              className="group w-full flex items-center gap-4 px-5 py-4 bg-white border-2 border-gray-200 hover:border-gray-800 rounded-2xl font-semibold text-gray-800 hover:bg-gray-50 transition-all active:scale-[0.98] shadow-sm">
                              <Phone size={22} className="flex-shrink-0 text-gray-500" />
                              <span className="font-bold flex-1 text-left">Registrarse con Celular (Rápido)</span>
                              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-800 group-hover:translate-x-1 transition-all" />
                            </button>

                            <button onClick={() => setStep('phone-login')}
                              className="group w-full flex items-center gap-4 px-5 py-4 bg-white border-2 border-gray-200 hover:border-[#00A0C6] rounded-2xl font-semibold text-gray-800 hover:bg-[#00A0C6]/5 transition-all active:scale-[0.98] shadow-sm">
                              <KeyRound size={22} className="flex-shrink-0 text-[#00A0C6]" />
                              <span className="font-bold flex-1 text-left">Ya tengo cuenta (Celular + Contraseña)</span>
                              <ChevronRight size={16} className="text-gray-300 group-hover:text-[#00A0C6] group-hover:translate-x-1 transition-all" />
                            </button>

                            <ErrorMsg error={error} />

                            <div className="pt-4 flex flex-col items-center gap-2.5">
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-semibold">
                                <ShieldCheck size={12} className="text-green-500" /> Tus datos están 100% protegidos
                              </div>
                              <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                                Al continuar aceptas nuestros{' '}
                                <a href="#" className="underline font-bold text-gray-600 hover:text-gray-900">Términos</a>{' '}y{' '}
                                <a href="#" className="underline font-bold text-gray-600 hover:text-gray-900">Privacidad</a>
                              </p>
                            </div>
                          </motion.div>
                        )}

                        {/* ── PHONE INPUT ── */}
                        {step === 'phone-input' && (
                          <motion.div key="phone-input" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="space-y-5">
                            <PhoneInputRow phone={phone} setPhone={setPhone} />
                            <p className="text-[12px] text-gray-400 flex items-center gap-1.5 px-1"><Lock size={11} /> Solo para enviarte el código de verificación</p>
                            <ErrorMsg error={error} />
                            <SubmitBtn label="Recibir Código SMS →" onClick={() => handleSendOtp('phone-otp')} disabled={phone.replace(/\D/g, '').length < 10} loading={loading} />
                          </motion.div>
                        )}

                        {/* ── PHONE OTP (new user) ── */}
                        {step === 'phone-otp' && (
                          <motion.div key="phone-otp" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="space-y-4">
                            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
                              <Phone size={18} className="text-green-600 flex-shrink-0" />
                              <p className="text-[13px] text-green-800 font-bold flex-1">Código enviado a <span className="font-black">+52 {phone}</span></p>
                              <button onClick={() => setStep('phone-input')} className="text-[11px] font-black text-green-600 hover:underline">EDITAR</button>
                            </div>
                            <OtpField otp={otp} setOtp={setOtp} onEnter={handleVerifyOtp} />
                            <div>
                              <label className="block text-[11px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2">Tu nombre completo</label>
                              <input type="text" placeholder="Ej. Juan Pérez" value={name} onChange={e => setName(e.target.value)}
                                className="w-full border-2 border-gray-200 rounded-2xl py-4 px-5 bg-gray-50 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00A0C6] focus:ring-4 focus:ring-[#00A0C6]/10 transition-all font-bold" />
                            </div>
                            <PasswordField label="Crea tu contraseña" value={password} onChange={setPassword} show={showPass} onToggle={() => setShowPass(p => !p)} />
                            <PasswordField label="Confirma tu contraseña" value={confirmPassword} onChange={setConfirmPassword} show={showConfirmPass} onToggle={() => setShowConfirmPass(p => !p)} />
                            <ErrorMsg error={error} />
                            <SubmitBtn label="Crear cuenta →" onClick={handleVerifyOtp} disabled={otp.length < 6 || !name.trim() || password.length < 6} loading={loading} />
                            <button onClick={() => handleSendOtp('phone-otp')} disabled={loading} className="w-full text-[13px] text-gray-400 font-bold hover:text-[#00A0C6] transition-colors text-center py-1">
                              ¿No recibiste el código?{' '}<span className="text-[#00A0C6] font-black underline ml-1">Reenviar</span>
                            </button>
                          </motion.div>
                        )}

                        {/* ── PHONE REGISTER FAST (NO SMS) ── */}
                        {step === 'phone-register-fast' && (
                          <motion.div key="phone-register-fast" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="space-y-4">
                            <PhoneInputRow phone={phone} setPhone={setPhone} />
                            <div>
                              <label className="block text-[11px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2">Tu nombre completo</label>
                              <input type="text" placeholder="Ej. Juan Pérez" value={name} onChange={e => setName(e.target.value)}
                                className="w-full border-2 border-gray-200 rounded-2xl py-4 px-5 bg-gray-50 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00A0C6] focus:ring-4 focus:ring-[#00A0C6]/10 transition-all font-bold" />
                            </div>
                            <PasswordField label="Crea tu contraseña" value={password} onChange={setPassword} show={showPass} onToggle={() => setShowPass(p => !p)} />
                            <PasswordField label="Confirma tu contraseña" value={confirmPassword} onChange={setConfirmPassword} show={showConfirmPass} onToggle={() => setShowConfirmPass(p => !p)} />
                            <ErrorMsg error={error} />
                            <SubmitBtn label="Crear cuenta →" onClick={handleFastRegister} disabled={phone.replace(/\D/g, '').length < 10 || !name.trim() || password.length < 6} loading={loading} />
                          </motion.div>
                        )}

                        {/* ── PHONE LOGIN (returning user) ── */}
                        {step === 'phone-login' && (
                          <motion.div key="phone-login" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="space-y-5">
                            <PhoneInputRow phone={phone} setPhone={setPhone} />
                            <PasswordField label="Contraseña" value={password} onChange={setPassword} show={showPass} onToggle={() => setShowPass(p => !p)} />
                            <button onClick={() => { setStep('forgot-otp'); setError(''); }} className="text-[13px] text-[#00A0C6] font-black hover:underline w-full text-right -mt-2">
                              ¿Olvidaste tu contraseña?
                            </button>
                            <ErrorMsg error={error} />
                            <SubmitBtn label="Iniciar Sesión →" onClick={handlePhoneLogin} disabled={phone.replace(/\D/g, '').length < 10 || !password} loading={loading} />
                            <button onClick={() => setStep('phone-register-fast')} className="w-full text-[13px] text-gray-400 font-bold hover:text-gray-800 transition-colors text-center py-1">
                              ¿Eres nuevo? <span className="font-black underline ml-1">Regístrate aquí</span>
                            </button>
                          </motion.div>
                        )}

                        {/* ── FORGOT OTP ── */}
                        {step === 'forgot-otp' && (
                          <motion.div key="forgot-otp" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="space-y-5">
                            <PhoneInputRow phone={phone} setPhone={setPhone} />
                            <p className="text-[12px] text-gray-400 flex items-center gap-1.5 px-1"><Lock size={11} /> Verificaremos que el número sea tuyo</p>
                            <ErrorMsg error={error} />
                            <SubmitBtn label="Enviar código para restablecer →" onClick={() => handleSendOtp('phone-reset')} disabled={phone.replace(/\D/g, '').length < 10} loading={loading} />
                          </motion.div>
                        )}

                        {/* ── PHONE RESET ── */}
                        {step === 'phone-reset' && (
                          <motion.div key="phone-reset" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="space-y-4">
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
                              <Phone size={18} className="text-blue-600 flex-shrink-0" />
                              <p className="text-[13px] text-blue-800 font-bold flex-1">Código enviado a <span className="font-black">+52 {phone}</span></p>
                              <button onClick={() => setStep('forgot-otp')} className="text-[11px] font-black text-blue-600 hover:underline">EDITAR</button>
                            </div>
                            <OtpField otp={otp} setOtp={setOtp} onEnter={handleResetPassword} />
                            <PasswordField label="Nueva contraseña" value={password} onChange={setPassword} show={showPass} onToggle={() => setShowPass(p => !p)} />
                            <PasswordField label="Confirma nueva contraseña" value={confirmPassword} onChange={setConfirmPassword} show={showConfirmPass} onToggle={() => setShowConfirmPass(p => !p)} />
                            <ErrorMsg error={error} />
                            <SubmitBtn label="Guardar nueva contraseña →" onClick={handleResetPassword} disabled={otp.length < 6 || password.length < 6} loading={loading} />
                          </motion.div>
                        )}

                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
