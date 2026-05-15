'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
};

const AIIcon = ({ size = 24 }: { size?: number }) => (
    <img
        src="/gemini-logo.svg"
        alt="AI"
        style={{ width: size, height: size, objectFit: 'contain' }}
    />
);

// Partícula flotante decorativa para el estado vacío
const FloatingOrb = ({ delay = 0, x = 0, y = 0, size = 6, color = '#818cf8' }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!ref.current) return;
        gsap.to(ref.current, {
            y: y - 18,
            x: x + 6,
            duration: 2.2 + delay * 0.4,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay,
        });
    }, [delay, x, y]);
    return (
        <div
            ref={ref}
            style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: '50%',
                background: color,
                opacity: 0.18,
                top: `calc(50% + ${y}px)`,
                left: `calc(50% + ${x}px)`,
                pointerEvents: 'none',
            }}
        />
    );
};

export function Chatbot({ catalogData }: { catalogData: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fabRef = useRef<HTMLButtonElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const sendBtnRef = useRef<HTMLButtonElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll al último mensaje
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Animación del FAB: latido continuo mientras está cerrado
    useEffect(() => {
        if (!fabRef.current || isOpen) return;
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.5 });
        tl.to(fabRef.current, { scale: 1.12, duration: 0.3, ease: 'power2.out' })
          .to(fabRef.current, { scale: 1, duration: 0.3, ease: 'power2.in' })
          .to(fabRef.current, { scale: 1.07, duration: 0.2, ease: 'power2.out' })
          .to(fabRef.current, { scale: 1, duration: 0.2, ease: 'power2.in' });
        return () => { tl.kill(); };
    }, [isOpen]);

    // Animación de entrada del header al abrir el chat
    useEffect(() => {
        if (!isOpen || !headerRef.current) return;
        gsap.fromTo(
            headerRef.current.children,
            { y: -12, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.08, duration: 0.45, ease: 'power3.out', delay: 0.2 }
        );
    }, [isOpen]);

    // Aura de brillo en el ícono del header
    useEffect(() => {
        if (!isOpen || !headerRef.current) return;
        const iconBox = headerRef.current.querySelector('.icon-box') as HTMLElement;
        if (!iconBox) return;
        gsap.to(iconBox, {
            boxShadow: '0 0 22px 6px rgba(129,140,248,0.35)',
            duration: 1.4,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
        });
        return () => { gsap.killTweensOf(iconBox); };
    }, [isOpen]);

    // Animación de nuevos mensajes (slide + fade desde abajo)
    const lastMsgId = messages[messages.length - 1]?.id;
    useEffect(() => {
        if (!lastMsgId || !messagesContainerRef.current) return;
        const lastEl = messagesContainerRef.current.querySelector(`[data-msg-id="${lastMsgId}"]`);
        if (!lastEl) return;
        gsap.fromTo(lastEl,
            { opacity: 0, y: 20, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.4)' }
        );
    }, [lastMsgId]);

    // Animación del botón send al tener texto
    useEffect(() => {
        if (!sendBtnRef.current) return;
        if (input.trim()) {
            gsap.to(sendBtnRef.current, { scale: 1.08, duration: 0.2, ease: 'back.out(2)' });
        } else {
            gsap.to(sendBtnRef.current, { scale: 1, duration: 0.15, ease: 'power2.in' });
        }
    }, [input]);

    // Ripple en el botón send al hacer click
    const handleSendClick = useCallback(() => {
        if (!sendBtnRef.current || !input.trim()) return;
        gsap.timeline()
            .to(sendBtnRef.current, { scale: 0.88, duration: 0.1, ease: 'power2.in' })
            .to(sendBtnRef.current, { scale: 1, duration: 0.3, ease: 'elastic.out(1.2, 0.5)' });
    }, [input]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || isLoading) return;

        handleSendClick();

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const activeProducts = catalogData.filter((p) => p.status !== 'Inactivo');
            const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
            if (!apiKey) throw new Error('API key no configurada.');

            // Construir system prompt con el catálogo
            let systemPrompt = `Eres un asistente de ventas de "Altos Artículos", una distribuidora mayorista y minorista en el centro de la CDMX. Eres amable, persuasivo y respondes de forma concisa. Catálogo actual:\n\n`;
            activeProducts.forEach((p: any) => {
                systemPrompt += `- [SKU: ${p.sku ?? 'N/A'}] ${p.name} (${p.category}): Individual $${p.precioIndividual}, Mayoreo $${p.precioMayoreo} (desde ${p.minMayoreo} pzs), Caja $${p.precioCaja} (desde ${p.minCaja} pzs). Stock: ${p.stock}\n`;
            });
            systemPrompt += `\nReglas: 1) Resalta mayoreo/caja y el ahorro. 2) Si no está en catálogo, dilo amablemente. 3) Sé breve (máx 3 párrafos). 4) Usa emojis. 5) Sucursales: Mesones 123 y Plaza Izazaga 89, Centro CDMX. 6) Envíos a todo México.`;

            // Llamada directa a Groq desde el browser
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.7,
                    max_tokens: 1024,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...newMessages.map((m) => ({ role: m.role, content: m.content })),
                    ],
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || 'Error al conectar con Groq');

            const reply = data.choices?.[0]?.message?.content;
            if (!reply) throw new Error('Respuesta inválida de la IA.');

            setMessages((prev) => [
                ...prev,
                { id: (Date.now() + 1).toString(), role: 'assistant', content: reply },
            ]);
        } catch (err: any) {
            console.error('[Chatbot Error]', err);
            setError(err.message || 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* ── FAB flotante ─────────────────────────────── */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        ref={fabRef}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        aria-label="Hablar con Asistente"
                        style={{ 
                            position: 'fixed',
                            zIndex: 60,
                        }}
                        className="bottom-[170px] md:bottom-[100px] right-5 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-2xl"
                    >
                        {/* Halo exterior pulsante */}
                        <span className="absolute inset-0 rounded-full bg-indigo-500 opacity-20 animate-ping" />
                        {/* Segundo halo más lento */}
                        <span
                            className="absolute inset-[-6px] rounded-full border border-indigo-400/30"
                            style={{ animation: 'ping 2.5s cubic-bezier(0,0,0.2,1) infinite' }}
                        />
                        <AIIcon size={24} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ── Ventana del chat ──────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={chatWindowRef}
                        initial={{ opacity: 0, y: 40, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.94 }}
                        transition={{ duration: 0.3, ease: [0.34, 1.2, 0.64, 1] }}
                        className="fixed inset-0 md:inset-auto md:bottom-24 md:right-8 z-[100] w-full h-full md:w-[420px] md:h-[650px] md:max-h-[85vh] bg-white md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border-none md:border md:border-gray-100/50"
                        style={{ boxShadow: '0 32px 80px -10px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.04)' }}
                    >
                        {/* ── Header ── */}
                        <div
                            ref={headerRef}
                            className="relative bg-black text-white px-6 py-5 flex items-center justify-between shrink-0 md:rounded-t-[2.5rem] overflow-hidden"
                        >
                            {/* Gradiente decorativo de fondo */}
                            <div
                                className="absolute inset-0 opacity-30 pointer-events-none"
                                style={{
                                    background: 'radial-gradient(ellipse at 20% 50%, #4f46e5 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #7c3aed 0%, transparent 55%)',
                                }}
                            />

                            <div className="flex items-center gap-4 relative z-10">
                                <div className="icon-box w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center border border-white/15 shadow-inner">
                                    <AIIcon size={22} />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm text-white tracking-widest uppercase">
                                        Asistente de Ventas
                                    </h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2 mt-0.5">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.7)]" />
                                        En línea · Groq AI
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsOpen(false)}
                                className="relative z-10 w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white rounded-2xl transition-all active:scale-90"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* ── Error banner ── */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-red-50 px-4 py-2.5 text-red-600 text-xs text-center shrink-0 border-b border-red-100"
                                >
                                    ⚠️ {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Área de mensajes ── */}
                        <div
                            ref={messagesContainerRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50"
                            style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
                        >
                            {/* Estado vacío con orbes animados */}
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center px-6 relative">
                                    {/* Orbes decorativos de fondo */}
                                    <FloatingOrb delay={0}   x={-55} y={-30} size={50} color="#818cf8" />
                                    <FloatingOrb delay={0.5} x={45}  y={-10} size={30} color="#a78bfa" />
                                    <FloatingOrb delay={1}   x={-30} y={40}  size={20} color="#60a5fa" />
                                    <FloatingOrb delay={0.3} x={60}  y={30}  size={14} color="#f472b6" />

                                    <motion.div
                                        initial={{ scale: 0.7, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
                                        className="relative w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
                                    >
                                        <AIIcon size={30} />
                                        <Sparkles
                                            size={12}
                                            className="absolute -top-1.5 -right-1.5 text-indigo-400"
                                        />
                                    </motion.div>

                                    <motion.h4
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.25 }}
                                        className="font-bold text-gray-900 text-sm mb-2"
                                    >
                                        ¿En qué puedo ayudarte?
                                    </motion.h4>
                                    <motion.p
                                        initial={{ y: 8, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.35 }}
                                        className="text-gray-400 text-xs leading-relaxed"
                                    >
                                        Pregúntame sobre precios, mayoreos<br />o disponibilidad de artículos.
                                    </motion.p>

                                    {/* Chips de sugerencia */}
                                    <motion.div
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.45 }}
                                        className="flex flex-wrap gap-2 justify-center mt-5"
                                    >
                                        {['💰 Ver precios', '📦 Mayoreo', '🚚 Envíos'].map((chip) => (
                                            <button
                                                key={chip}
                                                onClick={() => setInput(chip.replace(/^.{2}\s/, ''))}
                                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[11px] text-gray-600 font-medium hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95 shadow-sm"
                                            >
                                                {chip}
                                            </button>
                                        ))}
                                    </motion.div>
                                </div>
                            )}

                            {/* Lista de mensajes */}
                            {messages.map((m) => (
                                <div
                                    key={m.id}
                                    data-msg-id={m.id}
                                    className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {m.role === 'assistant' && (
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                            <AIIcon size={13} />
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] px-4 py-2.5 text-[13.5px] whitespace-pre-wrap leading-relaxed shadow-sm ${
                                        m.role === 'user'
                                            ? 'bg-gradient-to-br from-gray-900 to-black text-white rounded-2xl rounded-tr-sm'
                                            : 'bg-gradient-to-br from-indigo-50/80 to-purple-50/60 border border-indigo-100/70 text-gray-800 rounded-2xl rounded-tl-sm'
                                    }`}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}

                            {/* Indicador de escritura */}
                            <AnimatePresence>
                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="flex justify-start gap-2.5"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                            <AIIcon size={13} />
                                        </div>
                                        <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/60 border border-indigo-100/70 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center h-[38px] shadow-sm">
                                            {[0, 150, 300].map((delay) => (
                                                <span
                                                    key={delay}
                                                    className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                                                    style={{ animationDelay: `${delay}ms` }}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div ref={messagesEndRef} />
                        </div>

                        {/* ── Input ── */}
                        <form
                            onSubmit={handleSubmit}
                            className="p-4 md:p-5 bg-white border-t border-gray-100/80 flex items-center gap-3 shrink-0"
                        >
                            <div className="flex-1 relative">
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={isLoading}
                                    placeholder="Pregunta sobre el catálogo..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-indigo-300 focus:bg-white focus:shadow-[0_0_0_3px_rgba(129,140,248,0.15)] transition-all pr-4"
                                />
                                {/* Barra de progreso sutil cuando está cargando */}
                                {isLoading && (
                                    <motion.div
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ duration: 8, ease: 'linear' }}
                                        className="absolute bottom-0 left-4 right-4 h-[2px] bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full origin-left"
                                    />
                                )}
                            </div>

                            <button
                                ref={sendBtnRef}
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="w-12 h-12 bg-black hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-300 text-white rounded-2xl flex items-center justify-center transition-colors shadow-lg shrink-0"
                                style={{ willChange: 'transform' }}
                            >
                                {isLoading
                                    ? <Loader2 size={18} className="animate-spin" />
                                    : <Send size={18} className="ml-0.5" />
                                }
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
