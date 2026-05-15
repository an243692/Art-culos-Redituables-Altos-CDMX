'use client';

import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─────────────────────────────────────────────────────────────────────────────
// ThemeListener — aplica SOLO colores y tipografía seguros del Editor Visual
// No toca layout, grid, transforms ni botones del sistema de navegación
// ─────────────────────────────────────────────────────────────────────────────

function buildSafeCSS(data: any): string {
    if (!data) return '';
    const c = data.colors || {};
    const s = data.sliders || {};
    const t = data.toggles || {};
    let css = ':root {\n';

    // Helper: returns gradient or solid color
    const bg = (c1: string, c2: string | undefined, gradKey: string, dirKey: string): string => {
        if (t[gradKey] && c2) {
            const dir = t[dirKey] || '135deg';
            return `linear-gradient(${dir},${c1},${c2})`;
        }
        return c1;
    };

    // Declarar variables solo si existen
    if (c.bodyBg)        css += `  --wix-body-bg: ${bg(c.bodyBg, c.bodyBg2, 'bodyGradient', 'bodyGradDir')};\n`;
    if (c.headerBg)      css += `  --wix-header-bg: ${bg(c.headerBg, c.headerBg2, 'headerGradient', 'headerGradDir')};\n`;
    if (c.headerText)    css += `  --wix-header-text: ${c.headerText};\n`;
    if (c.footerBg)      css += `  --wix-footer-bg: ${bg(c.footerBg, c.footerBg2, 'footerGradient', 'footerGradDir')};\n`;
    if (c.footerText)    css += `  --wix-footer-text: ${c.footerText};\n`;
    if (c.btnBg)         css += `  --wix-btn-bg: ${bg(c.btnBg, c.btnBg2, 'btnGradient', 'btnGradDir')};\n`;
    if (c.btnText)       css += `  --wix-btn-text: ${c.btnText};\n`;
    if (c.accent)        css += `  --wix-accent: ${bg(c.accent, c.accentBg2, 'accentGradient', 'accentGradDir')};\n`;
    if (c.cardBg)        css += `  --wix-card-bg: ${c.cardBg};\n`;
    if (c.cardBorder)    css += `  --wix-card-border: ${c.cardBorder};\n`;
    if (c.annBarBg)      css += `  --wix-ann-bg: ${bg(c.annBarBg, c.annBarBg2, 'annBarGradient', 'annBarGradDir')};\n`;
    if (data.borderRadius) css += `  --wix-radius: ${data.borderRadius};\n`;
    css += '}\n\n';

    // ── ANNOUNCEMENT BAR — El color se aplica por style property en page.tsx, no ocupamos override global aquí. 
    // ──────────────────────────────────────────────────────────────────────────
    
    // ── FONDO DE LA PÁGINA ────────────────────────────────────────────────────
    if (c.bodyBg) {
        if (t.bodyGradient && c.bodyBg2) {
            css += `body, html, main, .min-h-screen { background: var(--wix-body-bg) !important; }\n`;
        } else {
            css += `body, html, main, .min-h-screen { background-color: var(--wix-body-bg) !important; }\n`;
        }
    }
    
    // ── TIPOGRAFÍA ────────────────────────────────────────────────────────────
    if (data.font) {
        let fam = data.font;
        const fontName = fam.replace(/'/g, '').split(',')[0].trim();
        
        // Inject Google Fonts if it's not a default one
        const defaults = ['Outfit', 'font-sans', 'font-serif', 'font-mono'];
        if (!defaults.includes(fontName) && !defaults.includes(fam)) {
            const linkId = `gfont-${fontName.replace(/\s+/g, '-')}`;
            if (!document.getElementById(linkId)) {
                const link = document.createElement('link');
                link.id = linkId;
                link.rel = 'stylesheet';
                link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;700;900&display=swap`;
                document.head.appendChild(link);
            }
        }

        if (fam === 'font-sans') fam = 'var(--font-montserrat), sans-serif';
        else if (fam === 'font-serif') fam = 'ui-serif, Georgia, serif';
        else if (fam === 'font-mono') fam = '"Courier New", monospace';
        css += `body, h1, h2, h3, h4, p, span, a, button, input { font-family: ${fam} !important; }\n`;
    }
    if (s.baseFontSize) css += `body { font-size: ${s.baseFontSize}px; }\n`;

    // ── HEADER ────────────────────────────────────────────────────────────────
    if (c.headerBg) {
        const headerProp = t.headerGradient ? 'background' : 'background-color';
        css += `header, header > div { ${headerProp}: var(--wix-header-bg) !important; }\n`;
    }
    if (c.headerText) css += `
        header button:not(.bg-red-500), header button:not(.bg-[#FF7F00]), header span:not(.font-black), header svg, header .text-[#888] { 
            color: var(--wix-header-text) !important; 
        }
        header .bg-gray-100 { background-color: transparent !important; border-color: var(--wix-header-text) !important; color: var(--wix-header-text) !important; }
    \n`;

    // ── FOOTER (Si existe) ────────────────────────────────────────────────────
    if (c.footerBg) {
        const footerProp = t.footerGradient ? 'background' : 'background-color';
        css += `footer { ${footerProp}: var(--wix-footer-bg) !important; }\n`;
    }
    if (c.footerText) css += `footer * { color: var(--wix-footer-text) !important; }\n`;

    // ── COLOR ACENTO (Barra naranjas principales) ─────────────────────────────
    if (c.accent) css += `
        .bg-\\[\\#FF7F00\\], .bg-\\[\\#f26522\\] { background: var(--wix-accent) !important; }
        .text-\\[\\#FF7F00\\], .text-\\[\\#f26522\\] { color: ${c.accent} !important; }
        .border-\\[\\#FF7F00\\], .border-\\[\\#f26522\\] { border-color: ${c.accent} !important; }
    \n`;

    // ── BOTONES DE ACCIÓN ─────────────────────────────────────────────────────
    if (c.btnBg) css += `
        button.bg-\\[\\#FF7F00\\], button.hover\\:bg-\\[\\#E06C00\\],
        button.bg-\\[\\#00A0C6\\], button.hover\\:bg-\\[\\#0088A8\\],
        .bw-btn-orange,
        button[title="Agregar al pedido"], button[title="Comprar"],
        button:has(svg.lucide-shopping-cart), button:has(svg.lucide-circle-dollar-sign)
        { 
            background: var(--wix-btn-bg) !important; 
            color: var(--wix-btn-text, #fff) !important; 
            border: none !important;
        }\n`;

    // ── TARJETAS DE PRODUCTO Y MODALES ────────────────────────────────────────
    if (c.cardBg) css += `
        .product-card > div, 
        .product-card,
        main .grid > div > div.bg-white,
        .aspect-square.bg-\\[\\#f7f7f7\\],
        .fixed.inset-0 .bg-white, 
        div[role="dialog"] .bg-white,
        #product-detail-modal .bg-white
        { background-color: var(--wix-card-bg) !important; }\n`;
    
    if (c.cardBorder) css += `
        .product-card, main .grid > div > div,
        .fixed.inset-0 .bg-white,
        div[role="dialog"] .bg-white
        { border-color: var(--wix-card-border) !important; border-width: 1px !important; border-style: solid !important; }\n`;
    
    // Títulos y precios en las tarjetas
    if (c.textMain) css += `
        .product-card h3, .fixed.inset-0 .bg-white h2, div[role="dialog"] h2, h3.font-black { color: var(--wix-text-main) !important; }
        .product-card p.font-black, .fixed.inset-0 p.font-black, div[role="dialog"] p.font-black { color: var(--wix-text-main) !important; }
    \n`;

    if (data.borderRadius) css += `
        .product-card, .rounded-2xl, .bg-white.rounded-lg, .fixed.inset-0 .bg-white,
        header > div:last-child > div 
        { border-radius: var(--wix-radius) !important; }\n`;

    // ── ADVANCED TOGGLES (Nuevas Funciones Wix) ────────────────────────────────
    if (data.toggles) {
        if (data.toggles.hideWhatsApp) {
            css += `a[href*="wa.me"], a.bg-green-500.fixed { display: none !important; }\n`;
        }
        if (data.toggles.hideFooter) {
            css += `footer { display: none !important; }\n`;
        }
        if (data.toggles.cardShadow) {
            css += `
                .product-card { 
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important; 
                    border: none !important; 
                }
                .product-card:hover {
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
                }\n`;
        }
        if (data.toggles.cardSquare) {
            css += `
                /* Grid Adjustment: fewer columns = 40% larger cards */
                .bw-product-grid {
                    grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
                }
                @media (min-width: 640px) {
                    .bw-product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                }
                @media (min-width: 1024px) {
                    .bw-product-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
                }

                .product-card { 
                    aspect-ratio: 1 / 1 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    overflow: hidden !important;
                    padding: 0 !important; /* Remove card padding to use full space */
                }
                .product-card > div:first-child {
                    aspect-ratio: auto !important;
                    height: 42% !important;
                    flex-shrink: 0 !important;
                    background: #fdfdfd !important;
                }
                .product-card > div:last-child {
                    padding: 12px 14px !important;
                    padding-bottom: 16px !important;
                    flex-grow: 1 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: flex-start !important;
                    gap: 8px !important;
                    align-items: center !important;
                    text-align: center !important;
                }
                .product-card h3 {
                    font-size: 14px !important;
                    font-weight: 800 !important;
                    -webkit-line-clamp: 2 !important;
                    line-clamp: 2 !important;
                    height: 36px !important; /* Fixed height for alignment */
                    overflow: hidden !important;
                    margin-bottom: 0 !important;
                    line-height: 1.2 !important;
                    text-align: center !important;
                    display: -webkit-box !important;
                    -webkit-box-orient: vertical !important;
                }
                .product-card .flex.items-baseline.gap-1\\.5 {
                    margin: 0 !important;
                    justify-content: center !important;
                    height: 24px !important; /* Fixed height for price area */
                }
                .product-card .text-\\[16px\\] {
                    font-size: 18px !important;
                }
                .product-card span.text-\\[10px\\] {
                    font-size: 11px !important;
                }
                /* Spacer to push buttons to bottom */
                .product-card .flex-grow {
                    display: none !important; 
                }
                .product-card .mt-auto {
                    margin-top: auto !important;
                    width: 100% !important;
                }
                .product-card .h-\\[34px\\] {
                    height: 38px !important;
                    border-radius: 8px !important;
                    margin-bottom: 4px !important;
                }
                .product-card .h-\\[38px\\] {
                    height: 42px !important;
                    border-radius: 8px !important;
                    font-size: 13px !important;
                }
                /* Higher text for Agregar */
                .product-card button, .product-card input {
                    font-size: 13px !important;
                }
                
                /* Badges scaling */
                .bw-badge-nuevo, span.absolute.top-2.left-0 {
                    font-size: 11px !important;
                    padding: 4px 10px !important;
                    top: 8px !important;
                    border-radius: 4px !important;
                }

                @media (max-width: 640px) {
                    .bw-product-grid { 
                        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                        gap: 8px !important;
                    }
                    .product-card > div:first-child {
                        height: 38% !important; /* Slightly more image for mobile */
                    }
                    .product-card > div:last-child { 
                        padding: 6px 8px !important; 
                        padding-bottom: 8px !important;
                        gap: 2px !important; 
                        justify-content: flex-start !important;
                    }
                    .product-card h3 { 
                        font-size: 10px !important; 
                        height: 24px !important; 
                        line-height: 1.1 !important;
                        margin-bottom: 0 !important;
                    }
                    .product-card .flex.items-baseline.gap-1\\.5 {
                        height: 16px !important;
                        margin-bottom: 2px !important;
                        overflow: hidden !important;
                    }
                    .product-card .text-\\[16px\\] { 
                        font-size: 11px !important; 
                    }
                    .product-card span.text-\\[10px\\] {
                        font-size: 9px !important;
                    }
                    .product-card .h-\\[34px\\] { 
                        height: 26px !important; 
                        padding: 0 4px !important;
                        margin-bottom: 2px !important;
                    }
                    .product-card .h-\\[38px\\] { 
                        height: 28px !important; 
                        font-size: 10px !important;
                        gap: 1px !important;
                    }
                    .product-card input {
                        font-size: 10px !important;
                        width: 24px !important;
                    }
                    .product-card button {
                        font-size: 12px !important;
                    }
                    .product-card button svg {
                        width: 10px !important;
                        height: 10px !important;
                    }
                    /* Scale badges for mobile */
                    .bw-badge-nuevo, span.absolute.top-2.left-0 {
                        font-size: 8px !important;
                        padding: 2px 6px !important;
                        top: 4px !important;
                        left: 4px !important;
                    }
                }
                /* Carousel item widths adjustment (+40%) */
                .snap-start.shrink-0.w-\\[160px\\], .snap-start.shrink-0.sm\\:w-\\[190px\\], .snap-start.shrink-0.md\\:w-\\[230px\\] {
                    width: 220px !important;
                }
                @media (min-width: 640px) {
                    .snap-start.shrink-0.sm\\:w-\\[190px\\] { width: 260px !important; }
                }
                @media (min-width: 768px) {
                    .snap-start.shrink-0.md\\:w-\\[230px\\] { width: 320px !important; }
                }

                .min-w-\\[150px\\].max-w-\\[170px\\] { min-width: 210px !important; max-width: 240px !important; }
                @media (min-width: 768px) {
                    .md\\:min-w-\\[200px\\].md\\:max-w-\\[240px\\] { min-width: 280px !important; max-width: 340px !important; }
                }

                /* Product Detail Modal resizing logic moved to page.tsx directly to avoid backdrop collisions */
            \n`;
        }
        if (data.toggles.cardHideBorder) {
            css += `
                .product-card { 
                    border: none !important;
                }\n`;
        }
        if (data.toggles.glassHeader) {
            css += `
                header { 
                    background-color: var(--wix-header-bg, rgba(255,255,255,0.7)) !important;
                    background-image: linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 100%) !important;
                    backdrop-filter: blur(12px) !important; 
                    -webkit-backdrop-filter: blur(12px) !important;
                    border-bottom: 1px solid rgba(0,0,0,0.05) !important;
                }\n`;
        }
        if (data.toggles.hideTopBanner) {
            // El Top Banner suele ser el primer div dentro de header
            css += `header > div:first-child:not(:last-child) { display: none !important; }\n`;
        }

        // --- NUEVAS FUNCIONES VISUALES ---
        if (data.toggles.pillButtons) {
            css += `
                .w-full.flex.items-center.justify-center.gap-3.py-3\\.5.rounded-2xl,
                .product-card button,
                [role="dialog"] button:not(.rounded-full),
                nav button.rounded-2xl,
                .bw-btn-orange {
                    border-radius: 9999px !important;
                }\n`;
        }
        if (data.toggles.flatSearch) {
             css += `
                 header .border-\\[\\#dcdcdc\\] {
                     border-radius: 8px !important; 
                     background-color: #f1f5f9 !important; 
                     border: none !important; 
                     box-shadow: none !important;
                 }\n`;
        }
        if (data.toggles.boldTitles) {
            css += `
                .product-card h3 { 
                    font-size: 15px !important; 
                    font-weight: 900 !important; 
                    letter-spacing: -0.01em !important;
                }
                @media (max-width: 640px) {
                    .product-card h3 { font-size: 11px !important; }
                }\n`;
        }
        if (data.toggles.hoverLift) {
            css += `
                .product-card {
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                .product-card:hover {
                    transform: translateY(-6px) !important;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
                    z-index: 10 !important;
                }\n`;
        }
    }

    return css;
}

export function ThemeListener() {
    useEffect(() => {
        const applySettings = (data: any) => {
            if (!data) return;
            const styleId = 'wix-dynamic-theme';
            let el = document.getElementById(styleId) as HTMLStyleElement | null;
            if (!el) {
                el = document.createElement('style');
                el.id = styleId;
                document.head.appendChild(el);
            }
            el.innerHTML = buildSafeCSS(data);
        };

        // ── Live preview (admin postMessage) ──────────────────────────────────
        const handleMessage = (e: MessageEvent) => {
            if (e.data?.type === 'UPDATE_VISUAL_SETTINGS') {
                applySettings(e.data.payload);
            }
            // Allow admin to fully reset the store to original styles
            if (e.data?.type === 'RESET_VISUAL_SETTINGS') {
                const el = document.getElementById('wix-dynamic-theme');
                if (el) el.innerHTML = '';
            }
        };
        window.addEventListener('message', handleMessage);

        // ── Firestore saved settings ──────────────────────────────────────────
        const ref = doc(db, 'settings', 'storeDesign');
        const unsub = onSnapshot(ref, (snap) => {
            if (snap.exists()) applySettings(snap.data());
        });

        return () => {
            window.removeEventListener('message', handleMessage);
            unsub();
        };
    }, []);

    return null;
}
