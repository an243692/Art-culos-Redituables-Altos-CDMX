// Tamaños estándar — SIEMPRE usar estos valores para maximizar el cache hit
// Se añadieron tamaños grandes (1920, 2560, 3840) para evitar pixelado en pantallas retina o monitores grandes
const STD_WIDTHS = [120, 400, 800, 1200, 1920, 2560, 3840];

function nearestWidth(w: number): number {
    return STD_WIDTHS.reduce((prev, curr) =>
        Math.abs(curr - w) < Math.abs(prev - w) ? curr : prev
    );
}

export function cldOpt(url: string | undefined, maxW: number): string {
    if (!url) return '';
    if (!url.includes('res.cloudinary.com')) return url;

    // Redondear al tamaño estándar más cercano
    // Ejemplo: 80 → 120, 200 → 120 o 400, 300 → 400, 600 → 400, etc.
    const w = nearestWidth(maxW);

    // Transformaciones: f_auto (webp/avif), q_auto:best (calidad alta para no pixelar)
    // c_limit: nunca agranda imágenes menores al tamaño pedido
    // SIN dpr_auto — ese parámetro genera URLs distintas por cada pantalla y rompe el caché
    const transforms = `f_auto,q_auto:best,w_${w},c_limit`;

    const uploadIdx = url.indexOf('/upload/');
    if (uploadIdx === -1) return url;

    const base = url.slice(0, uploadIdx + 8); // incluye '/upload/'
    let rest = url.slice(uploadIdx + 8);

    // Si ya tiene transformaciones previas, saltarlas para evitar cadenas duplicadas
    if (rest.startsWith('f_auto') || rest.startsWith('q_auto') || rest.startsWith('w_')) {
        const nextSlash = rest.indexOf('/');
        if (nextSlash !== -1) rest = rest.slice(nextSlash + 1);
    }

    return `${base}${transforms}/${rest}`;
}
