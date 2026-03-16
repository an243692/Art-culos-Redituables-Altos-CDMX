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
    let css = ':root {\n';

    // Declarar variables solo si existen
    if (c.bodyBg)        css += `  --wix-body-bg: ${c.bodyBg};\n`;
    if (c.headerBg)      css += `  --wix-header-bg: ${c.headerBg};\n`;
    if (c.headerText)    css += `  --wix-header-text: ${c.headerText};\n`;
    if (c.footerBg)      css += `  --wix-footer-bg: ${c.footerBg};\n`;
    if (c.footerText)    css += `  --wix-footer-text: ${c.footerText};\n`;
    if (c.btnBg)         css += `  --wix-btn-bg: ${c.btnBg};\n`;
    if (c.btnText)       css += `  --wix-btn-text: ${c.btnText};\n`;
    if (c.accent)        css += `  --wix-accent: ${c.accent};\n`;
    if (c.cardBg)        css += `  --wix-card-bg: ${c.cardBg};\n`;
    if (c.cardBorder)    css += `  --wix-card-border: ${c.cardBorder};\n`;
    if (c.annBarBg)      css += `  --wix-ann-bg: ${c.annBarBg};\n`;
    if (data.borderRadius) css += `  --wix-radius: ${data.borderRadius};\n`;
    css += '}\n\n';

    // ── ANNOUNCEMENT BAR ──────────────────────────────────────────────────────
    if (c.annBarBg) css += `.fixed.top-0.left-0.right-0.z-\\[60\\] { background-color: var(--wix-ann-bg) !important; }\n`;
    
    // ── FONDO DE LA PÁGINA ────────────────────────────────────────────────────
    if (c.bodyBg) css += `body, html, main, .min-h-screen { background-color: var(--wix-body-bg) !important; }\n`;
    
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
    if (c.headerBg) css += `header, header > div { background-color: var(--wix-header-bg) !important; }\n`;
    if (c.headerText) css += `
        header button:not(.bg-red-500), header button:not(.bg-[#FF7F00]), header span:not(.font-black), header svg, header .text-[#888] { 
            color: var(--wix-header-text) !important; 
        }
        header .bg-gray-100 { background-color: transparent !important; border-color: var(--wix-header-text) !important; color: var(--wix-header-text) !important; }
    \n`;

    // ── FOOTER (Si existe) ────────────────────────────────────────────────────
    if (c.footerBg) css += `footer { background-color: var(--wix-footer-bg) !important; }\n`;
    if (c.footerText) css += `footer * { color: var(--wix-footer-text) !important; }\n`;

    // ── COLOR ACENTO (Barra naranjas principales) ─────────────────────────────
    if (c.accent) css += `
        .bg-\\[\\#FF7F00\\], .bg-\\[\\#f26522\\] { background-color: var(--wix-accent) !important; }
        .text-\\[\\#FF7F00\\], .text-\\[\\#f26522\\] { color: var(--wix-accent) !important; }
        .border-\\[\\#FF7F00\\], .border-\\[\\#f26522\\] { border-color: var(--wix-accent) !important; }
    \n`;

    // ── BOTONES DE ACCIÓN ─────────────────────────────────────────────────────
    if (c.btnBg) css += `
        button.bg-\\[\\#FF7F00\\], button.hover\\:bg-\\[\\#E06C00\\],
        button.bg-\\[\\#00A0C6\\], button.hover\\:bg-\\[\\#0088A8\\],
        .bw-btn-orange,
        button[title="Agregar al pedido"], button[title="Comprar"],
        button:has(svg.lucide-shopping-cart), button:has(svg.lucide-circle-dollar-sign)
        { 
            background-color: var(--wix-btn-bg) !important; 
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
