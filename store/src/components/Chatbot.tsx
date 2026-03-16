'use client';

import { useState } from 'react';

import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GeminiStar = ({ className, size = 24 }: { className?: string; size?: number }) => {
    return (
        <img 
            src="/gemini-logo.svg" 
            alt="Gemini Star" 
            style={{ width: size, height: size, objectFit: 'contain' }}
            className={className || ''} 
        />
    );
};

export function Chatbot({ catalogData }: { catalogData: any[] }) {
    const [isOpen, setIsOpen] = useState(false);

    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { id: Date.now().toString(), role: 'user', content: input.trim() };
        const newMessages = [...messages, userMessage];

        setMessages(newMessages);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;

            if (!apiKey) {
                throw new Error("La clave de API de Gemini no está configurada (NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY).");
            }

            const activeProducts = catalogData.filter((p) => p.status !== 'Inactivo');
            let systemInstruction = `Eres un asistente de ventas de "Altos Artículos", una distribuidora mayorista y minorista de artículos.
Eres muy amable, persuasivo y respondes de forma concisa. Actúas casi como una recepcionista carismática.
Aquí está nuestro catálogo actual de productos:\n\n`;

            if (activeProducts.length > 0) {
                activeProducts.forEach((p: any) => {
                    systemInstruction += `- [SKU: ${p.sku ?? 'N/A'}] ${p.name} (${p.category}): Normal $${p.precioIndividual}, Mayoreo $${p.precioMayoreo} (desde ${p.minMayoreo}pzs), Caja $${p.precioCaja} (desde ${p.minCaja}pzs). Stock: ${p.stock}\n`;
                });
            } else {
                systemInstruction += `[Aún no hay ningún producto en el catálogo. Dile al usuario que pronto añadiremos más.]\n`;
            }

            systemInstruction += `
Instrucciones Finales:
1. Si preguntan precios, resalta el Precio Individual y anímalos a llevar por Mayoreo o Caja mencionando cuánto baja el precio.
2. Si preguntan por algo que NO está en el catálogo, di amablemente que no lo tienes pero pueden dejar sugerencias.
3. Di "Nuestros envíos son a todo México". No prometas paqueterías específicas ni envíos gratis.
4. Sé súper breve y al grano, máximo 2-3 párrafos cortos. Agrega emojis para darle vida.`;

            const contents = newMessages.map((m: any) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: String(m.content ?? '') }]
            }));

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    contents: contents
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("Gemini API Error:", data);
                throw new Error(data.error?.message || 'Error al comunicarse con la IA');
            }

            const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!replyText) throw new Error("Respuesta inválida de la IA.");

            setMessages((prev) => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: replyText
            }]);
        } catch (err: any) {
            console.error(err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Minimalist Floating Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-[160px] md:bottom-[100px] right-5 z-[60] w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        aria-label="Hablar con IA"
                    >
                        <GeminiStar size={24} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Minimalist Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: '20%', scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: '20%', scale: 0.95 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="fixed inset-0 md:inset-auto md:bottom-24 md:right-8 z-[100] w-full h-full md:w-[420px] md:h-[650px] md:max-h-[85vh] bg-white md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border-none md:border md:border-gray-100/50"
                    >
                        {/* Header Minimalista pero Elegante */}
                        <div className="bg-black text-white px-6 py-6 flex items-center justify-between shrink-0 md:rounded-t-[2.5rem]">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                                    <GeminiStar size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm text-white tracking-widest uppercase">Asistente IA</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" /> En línea
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white rounded-2xl transition-all active:scale-95 border border-transparent hover:border-white/10"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* Error API */}
                        {error && (
                            <div className="bg-red-50 p-3 text-red-600 text-xs text-center shrink-0 border-b border-red-100">
                                ⚠️ {error.message || 'Error al conectar con el asistente.'}
                            </div>
                        )}

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                            {(!messages || messages.length === 0) && (
                                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                                    <div className="w-12 h-12 bg-blue-50 border border-blue-100/50 rounded-full flex items-center justify-center mb-4 shadow-sm">
                                        <GeminiStar size={22} />
                                    </div>
                                    <h4 className="font-medium text-gray-900 text-sm mb-1">¿En qué puedo ayudarte?</h4>
                                    <p className="text-gray-500 text-xs">
                                        Pregúntame sobre precios, mayoreos o disponibilidad de artículos.
                                    </p>
                                </div>
                            )}

                            {messages.map((m: any) => (
                                <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {m.role !== 'user' && (
                                        <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                            <GeminiStar size={13} />
                                        </div>
                                    )}

                                    <div className={`
                                        max-w-[80%] px-4 py-2.5 text-[13.5px] whitespace-pre-wrap leading-relaxed shadow-sm
                                        ${m.role === 'user'
                                            ? 'bg-black text-white rounded-2xl rounded-tr-sm'
                                            : 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-gray-800 rounded-2xl rounded-tl-sm'
                                        }
                                    `}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                        <GeminiStar size={13} />
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center h-[38px] shadow-sm">
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Minimalist Input Form */}
                        <form onSubmit={handleSubmit} className="p-5 md:p-6 bg-white border-t border-gray-100 flex items-center gap-3 shrink-0">
                            <input
                                value={input || ''}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                placeholder="Pregunta algo sobre el catálogo..."
                                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-black focus:bg-white transition-all"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input?.trim()}
                                className="w-12 h-12 bg-black hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 shrink-0"
                            >
                                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
