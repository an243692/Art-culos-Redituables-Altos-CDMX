import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles, Flame, Tag, Star, Box, Gem, Zap, ShieldCheck, Calendar, Rocket,
    Pencil, Palette, BookOpen, Scissors, Ruler, NotebookPen, GraduationCap,
    Package, Gift, Heart, TrendingUp, Award, Layers, ShoppingBag, Clock
} from 'lucide-react';

export const ALL_SECTIONS_DEFINITION = [
    { id: 'novedades',    label: 'Novedades',          icon: 'Sparkles',      color: '#4ea1d3' },
    { id: 'masVendidos',  label: 'Más vendidos',        icon: 'Flame',         color: '#ff4d4d' },
    { id: 'ofertas',      label: 'Ofertas',             icon: 'Tag',           color: '#274e84' },
    { id: 'destacados',   label: 'Destacados',          icon: 'Star',          color: '#ffcc00' },
    { id: 'mayoreo',      label: 'Mayoreo',             icon: 'Box',           color: '#a031a0' },
    { id: 'piezasUnicas', label: 'Piezas únicas',       icon: 'Gem',           color: '#00d1b2' },
    { id: 'remates',      label: 'Remates',             icon: 'Zap',           color: '#ff8c00' },
    { id: 'exclusivo',    label: 'Exclusivo online',    icon: 'ShieldCheck',   color: '#48c774' },
    { id: 'temporada',    label: 'Temporada',           icon: 'Calendar',      color: '#ff3860' },
    { id: 'nuevos',       label: 'Recién llegados',     icon: 'Rocket',        color: '#3273dc' },
    { id: 'papeleria',    label: 'Papelería',           icon: 'Pencil',        color: '#e67e22' },
    { id: 'arte',         label: 'Arte y Manualidades', icon: 'Palette',       color: '#9b59b6' },
    { id: 'libretas',     label: 'Libretas',            icon: 'NotebookPen',   color: '#1abc9c' },
    { id: 'escolares',    label: 'Útiles Escolares',    icon: 'GraduationCap', color: '#2980b9' },
    { id: 'tijeras',      label: 'Corte y Ensamble',   icon: 'Scissors',      color: '#e74c3c' },
    { id: 'reglas',       label: 'Geometría',           icon: 'Ruler',         color: '#27ae60' },
    { id: 'libros',       label: 'Libros y Textos',     icon: 'BookOpen',      color: '#8e44ad' },
    { id: 'kits',         label: 'Kits y Sets',         icon: 'Package',       color: '#d35400' },
    { id: 'regalos',      label: 'Ideas de Regalo',     icon: 'Gift',          color: '#e91e8c' },
    { id: 'favoritos',    label: 'Favoritos',           icon: 'Heart',         color: '#e53935' },
    { id: 'tendencias',   label: 'Tendencias',          icon: 'TrendingUp',    color: '#00897b' },
    { id: 'premium',      label: 'Premium',             icon: 'Award',         color: '#f39c12' },
    { id: 'colecciones',  label: 'Colecciones',         icon: 'Layers',        color: '#546e7a' },
    { id: 'bolsas',       label: 'Bolsas y Mochilas',   icon: 'ShoppingBag',   color: '#5c6bc0' },
    { id: 'edicion',      label: 'Ed. Limitada',        icon: 'Clock',         color: '#00bcd4' },
];

const ICON_MAP: Record<string, React.ReactNode> = {
    Sparkles:      <Sparkles className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    Flame:         <Flame className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    Tag:           <Tag className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    Star:          <Star className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    Box:           <Box className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    Gem:           <Gem className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    Zap:           <Zap className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    ShieldCheck:   <ShieldCheck className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    Calendar:      <Calendar className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    Rocket:        <Rocket className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    Pencil:        <Pencil className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    Palette:       <Palette className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    NotebookPen:   <NotebookPen className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    GraduationCap: <GraduationCap className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    Scissors:      <Scissors className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    Ruler:         <Ruler className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    BookOpen:      <BookOpen className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    Package:       <Package className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    Gift:          <Gift className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    Heart:         <Heart className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    TrendingUp:    <TrendingUp className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    Award:         <Award className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    Layers:        <Layers className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    ShoppingBag:   <ShoppingBag className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
    Clock:         <Clock className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] lg:w-[48px] lg:h-[48px]" strokeWidth={1.5} />,
};

export function SeccionesUI({
    loading, activeSections, activeSection, setActiveSection
}: {
    loading: boolean;
    activeSections: string[];
    activeSection: string | null;
    setActiveSection: (id: string | null) => void;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);

    if (loading || activeSections.length === 0) return null;

    const visible = ALL_SECTIONS_DEFINITION.filter(s => activeSections.includes(s.id));
    if (visible.length === 0) return null;

    return (
        <div className="pb-10 relative mt-4">
            <div className="flex items-center gap-3 mb-6 max-w-screen-xl mx-auto px-4 md:px-0">
                <span className="text-[14px] md:text-[16px] font-black text-[#1f3050] tracking-tight uppercase">Encuentra tus artículos por</span>
                <div className="hidden sm:block flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
            </div>
            
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-6 px-4 md:px-0 pb-8 pt-4 items-stretch max-w-screen-xl mx-auto scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {visible.map((s, index) => {
                    const iconColor = s.color;
                    const isActive = activeSection === s.id;
                    return (
                        <motion.button
                            initial={{ opacity: 0, x: 40, scale: 0.95, y: 0 }}
                            whileInView={{ 
                                opacity: 1, 
                                x: 0, 
                                scale: 1,
                                y: isActive ? 0 : [0, index % 2 === 0 ? -14 : 14, 0]
                            }}
                            viewport={{ once: true, margin: "0px -30px" }}
                            transition={{ 
                                opacity: { duration: 0.5, delay: index * 0.05, ease: "easeOut" },
                                x: { duration: 0.5, delay: index * 0.05, ease: "easeOut" },
                                scale: { duration: 0.5, delay: index * 0.05, ease: "easeOut" },
                                y: isActive ? { duration: 0.3 } : { duration: 4, repeat: Infinity, ease: "easeInOut", delay: index * 0.15 }
                            }}
                            key={s.id}
                            onClick={() => setActiveSection(isActive ? null : s.id)}
                            className={`group relative flex flex-col items-center justify-between p-5 rounded-[28px] w-[135px] sm:w-[160px] md:w-[180px] shrink-0 snap-center aspect-square transition-all duration-500 overflow-hidden outline-none ${
                                isActive 
                                    ? 'bg-[#0a0a0a] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] border border-black ring-4 ring-black/5 scale-[1.02]'
                                    : 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)] border border-gray-100 hover:border-transparent'
                            }`}
                        >
                            {/* Ambient background glow on hover */}
                            {!isActive && (
                                <div 
                                    className="absolute inset-x-0 -bottom-10 h-32 opacity-0 group-hover:opacity-15 transition-opacity duration-500 pointer-events-none rounded-full blur-2xl"
                                    style={{ backgroundColor: iconColor }}
                                />
                            )}
                            
                            {/* Discrete Floating Particles */}
                            {!isActive && (
                                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[28px]">
                                    <motion.div
                                        animate={{ y: [10, -30], opacity: [0, 0.5, 0], scale: [0.5, 1, 0.5] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: index * 0.2 }}
                                        className="absolute top-1/2 left-[20%] w-1.5 h-1.5 rounded-full"
                                        style={{ backgroundColor: iconColor }}
                                    />
                                    <motion.div
                                        animate={{ y: [0, -40], opacity: [0, 0.4, 0], scale: [0.5, 1, 0.5] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: index * 0.4 + 1 }}
                                        className="absolute top-3/4 right-[20%] w-2 h-2 rounded-full"
                                        style={{ backgroundColor: iconColor }}
                                    />
                                    <motion.div
                                        animate={{ y: [20, -20], opacity: [0, 0.3, 0], scale: [0.5, 1, 0.5] }}
                                        transition={{ duration: 3.5, repeat: Infinity, ease: "linear", delay: index * 0.1 + 0.5 }}
                                        className="absolute top-1/3 right-[40%] w-1 h-1 rounded-full"
                                        style={{ backgroundColor: iconColor }}
                                    />
                                </div>
                            )}

                            {/* Animated Top Glow Border */}
                            <div 
                                className={`absolute top-0 left-0 right-0 h-[3px] opacity-0 transition-all duration-500 ease-out transform -translate-y-full group-hover:translate-y-0 group-hover:opacity-100 ${isActive ? '!opacity-0' : ''}`}
                                style={{ background: `linear-gradient(90deg, transparent, ${iconColor}, transparent)` }}
                            />

                            <div 
                                className={`relative z-10 flex-1 flex items-center justify-center w-full transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) group-hover:scale-[1.15] group-hover:-translate-y-1 ${isActive ? 'text-white' : ''}`}
                                style={{ color: isActive ? '#fff' : iconColor, filter: isActive ? 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' : 'none' }}
                            >
                                {ICON_MAP[s.icon] || <Sparkles className="w-[32px] h-[32px] sm:w-[38px] sm:h-[38px]" strokeWidth={1.5} />}
                            </div>
                            
                            <div className="relative z-10 w-full mt-2 sm:mt-3">
                                <span className={`text-[12px] sm:text-[13px] lg:text-[14px] font-extrabold leading-[1.2] text-center block w-full transition-colors duration-300 ${
                                    isActive ? 'text-white' : 'text-gray-700 group-hover:text-[#0a0a0a]'
                                }`}>
                                    {s.label}
                                </span>
                                
                                {/* Micro "Explorar" action tag on hover (desktop only) */}
                                <div className={`hidden sm:block overflow-hidden transition-all duration-300 ease-out ${isActive ? 'h-0 opacity-0' : 'h-0 group-hover:h-5 opacity-0 group-hover:opacity-100 mt-1.5'}`}>
                                    <span 
                                        className="text-[9px] font-black uppercase tracking-widest block text-center" 
                                        style={{ color: iconColor }}
                                    >
                                        Explorar &rarr;
                                    </span>
                                </div>
                            </div>

                            {/* Active state particles/blobs inside card */}
                            {isActive && (
                                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[24px]">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-xl rounded-full translate-x-12 -translate-y-8" />
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 blur-xl rounded-full -translate-x-12 translate-y-8" />
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
