import React from 'react';
import {
    Sparkles, Flame, Tag, Star, Box, Gem, Zap, ShieldCheck, Calendar, Rocket, LayoutGrid
} from 'lucide-react';

export function SeccionesUI({
    loading, activeSections, activeSection, setActiveSection
}: {
    loading: boolean;
    activeSections: string[];
    activeSection: string | null;
    setActiveSection: (id: string | null) => void;
}) {
    if (loading || activeSections.length === 0) return null;

    const ALL_SECTIONS_UI = [
        { id: 'novedades', label: 'Novedades', icon: <Sparkles size={22} strokeWidth={1.5} /> },
        { id: 'masVendidos', label: 'Más vendidos', icon: <Flame size={22} strokeWidth={1.5} /> },
        { id: 'ofertas', label: 'Ofertas', icon: <Tag size={22} strokeWidth={1.5} /> },
        { id: 'destacados', label: 'Destacados', icon: <Star size={22} strokeWidth={1.5} /> },
        { id: 'mayoreo', label: 'Mayoreo', icon: <Box size={22} strokeWidth={1.5} /> },
        { id: 'piezasUnicas', label: 'Piezas únicas', icon: <Gem size={22} strokeWidth={1.5} /> },
        { id: 'remates', label: 'Remates', icon: <Zap size={22} strokeWidth={1.5} /> },
        { id: 'exclusivo', label: 'Exclusivo online', icon: <ShieldCheck size={22} strokeWidth={1.5} /> },
        { id: 'temporada', label: 'Ofertas de temporada', icon: <Calendar size={22} strokeWidth={1.5} /> },
        { id: 'nuevos', label: 'Recién llegados', icon: <Rocket size={22} strokeWidth={1.5} /> },
    ];

    const SECTION_COLORS: Record<string, string> = {
        novedades: '#4ea1d3',
        masVendidos: '#ff4d4d',
        ofertas: '#274e84',
        destacados: '#ffcc00',
        mayoreo: '#a031a0',
        piezasUnicas: '#00d1b2',
        remates: '#ff8c00',
        exclusivo: '#48c774',
        temporada: '#ff3860',
        nuevos: '#3273dc',
    };

    const visible = ALL_SECTIONS_UI.filter(s => activeSections.includes(s.id));
    if (visible.length === 0) return null;

    return (
        <div className="pb-8">
            <p className="text-[13px] font-bold text-[#1f3050] mb-4 tracking-tight">Encuentra tus artículos por:</p>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5">

                {visible.map(s => {
                    const iconColor = SECTION_COLORS[s.id] || '#32527b';
                    return (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id === activeSection ? null : s.id)}
                            className={`flex flex-col items-center justify-center gap-2.5 p-2 rounded-xl border transition-all aspect-square w-full bg-white ${activeSection === s.id
                                ? 'border-[#274e84] shadow-sm bg-[#f8fbff]'
                                : 'border-gray-100 hover:border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]'}`}
                        >
                            <span style={{ color: iconColor }}>{s.icon}</span>
                            <span className="text-[11px] font-semibold text-gray-800 leading-[1.15] text-center px-0.5">
                                {s.label.split(' ').map((word, i, arr) => (
                                    <span key={i}>{word}{i < arr.length - 1 && <br />}</span>
                                ))}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
