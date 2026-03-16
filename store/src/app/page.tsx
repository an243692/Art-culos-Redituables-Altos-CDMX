/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars, no-var */
'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react';
import { collection, getDocs, query, orderBy, doc, getDoc, addDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingCart, Search, ChevronLeft, ChevronRight, ChevronDown,
  Minus, Plus, Trash2, X, Package, Home, Grid3X3, Check,
  User, LogOut, Mail, Lock, UserPlus, Menu, FileText, Info, Filter,
  LayoutGrid, Utensils, Bed, Droplet, Umbrella, PenTool, Gamepad2, Shirt, ShoppingBag, Box, Book, Monitor, Sparkles,
  Pen, Scissors, Ruler, BookOpen, Brush, FlaskConical, Archive, NotebookPen, Stamp, GraduationCap, Share2
} from 'lucide-react';
import { SeccionesUI } from '@/components/SeccionesUI';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cldOpt } from '@/lib/utils';
import { AuthModal } from '@/components/AuthModal';
import { FacturacionModal } from '@/components/FacturacionModal';
import { HeroDynamic, HeroSlide } from '@/components/HeroDynamic';
import { Typewriter } from '@/components/Typewriter';

import { ProductCard } from '@/components/ProductCard';
import { VariantConfigurator } from '@/components/VariantConfigurator';
import { FacebookReel } from '@/components/FacebookReel';
import { Chatbot } from '@/components/Chatbot';


// ─── Theme applies perfectly from globals.css for the Betterware clone ──

interface Category {
  id: string;
  name: string;
  order: number;
}

/* ── Related Product Card with visual add feedback ── */
function RelatedProductCard({ product, onAdd, onShowDetail }: { product: Product, onAdd: (p: Product) => void, onShowDetail?: () => void }) {
  const [justAdded, setJustAdded] = React.useState(false);
  return (
    <div className="flex-shrink-0 w-[140px]">
      <div 
        className="relative rounded-xl overflow-hidden bg-gray-50 aspect-square cursor-pointer"
        onClick={onShowDetail}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cldOpt(product.imageUrl, 200) || 'https://placehold.co/140x140/f5f5f5/ccc?text=IMG'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
      </div>
      <p 
        className="text-[12px] font-bold text-gray-900 mt-1.5 line-clamp-2 leading-tight cursor-pointer hover:text-[#f26522] transition-colors"
        onClick={onShowDetail}
      >
        {product.name}
      </p>
      <p className="text-[13px] font-black text-gray-900 mt-0.5">${(product.precioIndividual || 0).toFixed(2)}</p>
      <button
        onClick={() => {
          onAdd(product);
          setJustAdded(true);
          setTimeout(() => setJustAdded(false), 2000);
        }}
        className={`w-full h-7 rounded-lg flex items-center justify-center gap-1.5 mt-2 text-[11px] font-bold transition-all ${
          justAdded
            ? 'bg-green-500 text-white'
            : 'bg-[#FF7F00] text-white hover:bg-[#E06C00]'
        }`}
      >
        {justAdded ? (
          <><Check size={12} /> Añadido</>
        ) : (
          <><ShoppingCart size={12} /> Agregar</>
        )}
      </button>
    </div>
  );
}

function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('__loading__');
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const [detailDescExpanded, setDetailDescExpanded] = useState(false);
  const [logoUrl, setLogoUrl] = useState('/logo.jpg');
  const [logo2Url, setLogo2Url] = useState('');
  const [bodySectionUrls, setBodySectionUrls] = useState<string[]>([]);
  const [preFooterUrls, setPreFooterUrls] = useState<string[]>([]);
  const [bodySectionIndex, setBodySectionIndex] = useState(0);
  const [preFooterIndex, setPreFooterIndex] = useState(0);
  const [annIndex, setAnnIndex] = useState(0);
  const [themeColors, setThemeColors] = useState({ primary: '#0a0a0a', accent: '#00b4d8', bg: '#f8f8f8', gradient: null as string | null });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [facturacionModalOpen, setFacturacionModalOpen] = useState(false);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [requiereFactura, setRequiereFactura] = useState(false);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [visualSettings, setVisualSettings] = useState<any>(null);


  // Filtering & Sorting State
  const [sortBy, setSortBy] = useState('Destacados');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterAvailability, setFilterAvailability] = useState<{ available: boolean, unavailable: boolean }>({ available: false, unavailable: false });
  const [priceRange, setPriceRange] = useState<number>(2000);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [leftMenuOpen, setLeftMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeSections, setActiveSections] = useState<string[]>([]);
  const [displayCount, setDisplayCount] = useState(24);

  const { user, logout, loginWithGoogle } = useAuth();

  const { cart, cartCount, cartTotal, updateQuantity, removeFromCart,
    addToCart, calcItemPrice, clearCart } = useCart();

  // Apply theme immediately from localStorage (zero-flash)
  useEffect(() => {
    try {
      const cached = localStorage.getItem('altos-theme-cache');
      if (cached) {
        const { primary, accent, bg, footer } = JSON.parse(cached);
        const root = document.documentElement;
        if (primary) { root.style.setProperty('--bw-teal', primary); root.style.setProperty('--bw-teal-dark', primary); }
        if (accent) { root.style.setProperty('--bw-orange', accent); root.style.setProperty('--bw-orange-dk', accent); }
        if (bg) { root.style.setProperty('--bw-bg', bg); }
        if (footer) { root.style.setProperty('--bw-footer', footer); }
        else if (primary) { root.style.setProperty('--bw-footer', primary); }
      }
    } catch { }
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pSnap, hSnap, cSnap, brandingSnap, themeSnap, secSnap, bodySectionSnap, preFooterSnap] = await Promise.all([
          getDocs(collection(db, 'productos')),
          getDocs(query(collection(db, 'heroCarousel'), orderBy('order', 'asc'))),
          getDocs(query(collection(db, 'categorias'), orderBy('order', 'asc'))),
          getDoc(doc(db, 'config', 'branding')),
          getDoc(doc(db, 'config', 'theme')),
          getDoc(doc(db, 'config', 'secciones')),
          getDoc(doc(db, 'config', 'bodySection')),
          getDoc(doc(db, 'config', 'preFooter')),
        ]);
        const catList = cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
        setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
        setHeroSlides(hSnap.docs.map(d => ({ id: d.id, ...d.data() } as HeroSlide)));
        setCategories(catList);
        // Set first category as active by default
        if (catList.length > 0) setActiveCategory(catList[0].name);
        // Load active sections
        if (secSnap.exists()) {
          const data = secSnap.data();
          setActiveSections(data.active && data.active.length > 0 ? data.active : ['novedades', 'masVendidos', 'ofertas', 'destacados', 'mayoreo', 'piezasUnicas', 'remates', 'exclusivo', 'temporada', 'nuevos']);
        } else {
          // Default: all sections active
          setActiveSections(['novedades', 'masVendidos', 'ofertas', 'destacados', 'mayoreo', 'piezasUnicas', 'remates', 'exclusivo', 'temporada', 'nuevos']);
        }
        if (brandingSnap.exists()) {
          const data = brandingSnap.data();
          if (data.logoUrl) setLogoUrl(data.logoUrl);
          if (data.logo2Url) setLogo2Url(data.logo2Url);
        }
        if (bodySectionSnap.exists()) {
          const bsData = bodySectionSnap.data();
          if (bsData.imageUrls && Array.isArray(bsData.imageUrls) && bsData.imageUrls.length > 0) {
            setBodySectionUrls(bsData.imageUrls);
          } else if (bsData.imageUrl) {
            setBodySectionUrls([bsData.imageUrl]);
          }
        }
        // Load pre-footer images
        if (preFooterSnap.exists()) {
          const pfData = preFooterSnap.data();
          console.log('Pre-footer data loaded:', pfData);
          if (pfData.imageUrls && Array.isArray(pfData.imageUrls) && pfData.imageUrls.length > 0) {
            setPreFooterUrls(pfData.imageUrls);
          }
        } else {
          console.log('No pre-footer document found in config/preFooter');
        }
        // Inject dynamic theme — override Tailwind hardcoded colors
        if (themeSnap.exists()) {
          const t = themeSnap.data();
          const p = t.primary || '#00A0C6';
          const a = t.accent || '#FF7F00';
          const bg = t.bg || '#f2f2f2';
          const footerColor = t.footer || p || '#1a1a1a';

          setThemeColors({ primary: p, accent: a, bg, gradient: t.gradient || null });

          // Cache in localStorage for instant next load (no FOUC)
          localStorage.setItem('altos-theme-cache', JSON.stringify({ primary: p, accent: a, bg, footer: footerColor, gradient: t.gradient || null }));

          // Apply dynamic CSS variables for Tailwind configuration and normal css variables
          const root = document.documentElement;
          root.style.setProperty('--bw-teal', p);
          root.style.setProperty('--bw-teal-dark', p);
          root.style.setProperty('--bw-orange', a);
          root.style.setProperty('--bw-orange-dk', a);
          root.style.setProperty('--bw-bg', bg);
          root.style.setProperty('--bw-footer', footerColor);
        }
        // Load visual editor settings (Wix-style)
        const vSnap = await getDoc(doc(db, 'settings', 'storeDesign'));
        if (vSnap.exists()) {
          setVisualSettings(vSnap.data());
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const nextSlide = useCallback(() => {
    if (heroSlides.length > 0) setCurrentSlide(p => (p + 1) % heroSlides.length);
  }, [heroSlides.length]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const t = setInterval(nextSlide, 4000);
    return () => clearInterval(t);
  }, [heroSlides.length, nextSlide]);

  useEffect(() => {
    if (bodySectionUrls.length <= 1) return;
    const t = setInterval(() => {
      setBodySectionIndex(prev => (prev + 1) % bodySectionUrls.length);
    }, 4000);
    return () => clearInterval(t);
  }, [bodySectionUrls.length]);

  useEffect(() => {
    if (preFooterUrls.length <= 1) return;
    const t = setInterval(() => {
      setPreFooterIndex(prev => (prev + 1) % preFooterUrls.length);
    }, 5000);
    return () => clearInterval(t);
  }, [preFooterUrls.length]);

  // Handle live preview from admin (postMessage)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'UPDATE_VISUAL_SETTINGS') {
        setVisualSettings(e.data.payload);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Announcement bar carousel
  useEffect(() => {
    const texts = visualSettings?.sliders?.annTexts?.split('\n').filter(Boolean) || [];
    if (texts.length <= 1) {
      setAnnIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setAnnIndex(prev => (prev + 1) % texts.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [visualSettings?.sliders?.annTexts]);

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // ── Cargar logo PNG (prioridad 1: archivo PNG local en /public) ───
      let logoBase64: string | null = null;
      let pdfLogo: string | null = null;

      // Intentar primero el logo PNG enviado por el usuario
      try {
        const res = await fetch('/logo-altos.png');
        if (res.ok) {
          const blob = await res.blob();
          pdfLogo = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }
      } catch (e) { /* siguiente fallback */ }

      // Prioridad 2: logo configurado en el admin (Cloudinary)
      if (!pdfLogo && logoUrl) {
        try {
          const res = await fetch(cldOpt(logoUrl, 500));
          if (res.ok) {
            const blob = await res.blob();
            pdfLogo = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          }
        } catch (e) { /* siguiente fallback */ }
      }

      // Prioridad 3: logo JPG local
      if (!pdfLogo) {
        try {
          const res = await fetch('/logo-altos.jpg');
          if (res.ok) {
            const blob = await res.blob();
            pdfLogo = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          }
        } catch (e) { /* sin logo */ }
      }

      // logoBase64 se usa también dentro de las páginas de categorías
      logoBase64 = pdfLogo;

      // ── Paleta de colores papelería ──────────────────────────────────
      const COLORS = [
        { r: 0,   g: 188, b: 212 },  // cyan
        { r: 233, g: 30,  b: 99  },  // pink
        { r: 76,  g: 175, b: 80  },  // green
        { r: 255, g: 193, b: 7   },  // yellow/gold
        { r: 103, g: 58,  b: 183 },  // purple
        { r: 3,   g: 169, b: 244 },  // light blue
        { r: 244, g: 67,  b: 54  },  // red
        { r: 0,   g: 150, b: 136 },  // teal
        { r: 30,  g: 30,  b: 30  },  // near-black
      ];

      // Función para dibujar franjas verticales de colores
      const drawVerticalStripes = (x: number, y: number, totalW: number, h: number) => {
        const stripeW = totalW / COLORS.length;
        COLORS.forEach((c, i) => {
          doc.setFillColor(c.r, c.g, c.b);
          doc.rect(x + i * stripeW, y, stripeW, h, 'F');
        });
      };

      // ── Descargar imágenes de productos ─────────────────────────────
      const imagesMap = new Map<string, string>();
      const uniqueUrls = Array.from(new Set(products.map(p => p.imageUrl).filter(Boolean)));
      await Promise.all(uniqueUrls.map(async url => {
        try {
          const res = await fetch(cldOpt(url, 250));
          const blob = await res.blob();
          const b64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          imagesMap.set(url, b64);
        } catch (e) { /* sin imagen */ }
      }));

      // ──────────────────────────────────────────────────────────────────
      // PORTADA — Minimalista
      // Fondo blanco puro
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, 'F');

      // Línea decorativa superior fina (negro)
      doc.setDrawColor(20, 20, 20);
      doc.setLineWidth(0.5);
      doc.line(20, 28, 190, 28);

      // Línea decorativa inferior fina (negro)
      doc.line(20, 269, 190, 269);

      // Logo Altos — grande y centrado verticalmente
      if (pdfLogo) {
        // Dimensiones: ancho=140mm, altura proporcional ≈ 66mm (ratio 2.1:1 del logo)
        const logoW = 140;
        const logoH = logoW / 2.1;
        const logoX = (210 - logoW) / 2;   // centrado horizontal
        const logoY = (297 - logoH) / 2 - 15; // centrado vertical, ligeramente arriba
        doc.addImage(pdfLogo, 'PNG', logoX, logoY, logoW, logoH);
      }

      // Texto "Catálogo de Productos" — delgado y pequeño, debajo del logo
      doc.setTextColor(40, 40, 40);
      // @ts-ignore
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('C A T Á L O G O   D E   P R O D U C T O S', 105, 185, { align: 'center' });

      // Línea decorativa media — muy fina
      doc.setDrawColor(160, 160, 160);
      doc.setLineWidth(0.2);
      doc.line(70, 190, 140, 190);

      // Fecha — pequeña y elegante
      const today = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long' });
      doc.setTextColor(120, 120, 120);
      // @ts-ignore
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(today, 105, 198, { align: 'center' });

      // Tagline — pie de portada
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7.5);
      doc.text('Mayoreo  ·  Menudeo  ·  Venta por caja', 105, 258, { align: 'center' });

      // ── Agrupar por categoría ────────────────────────────────────────
      const categoriesMap = new Map<string, Product[]>();
      products.forEach(p => {
        const cat = p.category || 'General';
        if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
        categoriesMap.get(cat)!.push(p);
      });

      // ── Layout (Estilo Zigzag / Norma) ─────────────────────────
      // A4: 210 × 297 mm
      const MT = 40;             // margen superior (header)
      const MB = 45;             // margen inferior (footer bandas)
      const ROWS = 3;            // 3 filas por página
      const usableH = 297 - MT - MB;
      const rowH = usableH / ROWS;
      const IMG_SIZE = 55;       // imagen cuadrada grande

      // Colores de la imagen de muestra
      const COLOR_LOGO_TEXT = { r: 35, g: 31, b: 96 }; // Azul oscuro para texto
      const COLOR_FOOTER_1 = { r: 198, g: 236, b: 249 }; // Celeste
      const COLOR_FOOTER_2 = { r: 16, g: 114, b: 184 }; // Azul medio
      const COLOR_FOOTER_3 = { r: 35, g: 31, b: 96 }; // Azul oscuro

      categoriesMap.forEach((catProducts, catName) => {
        const renderPage = (pageNum: number, totalPages: number) => {
          // Fondo blanco global
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, 210, 297, 'F');

          // ── Header (Logo izq, Categoría der) ──────────────────────
          if (logoBase64) {
            // Ajustar logo al tamaño aproximado
            doc.addImage(logoBase64, 'PNG', 15, 12, 55, 20); // Logo a la izquierda
          }
          
          doc.setTextColor(COLOR_LOGO_TEXT.r, COLOR_LOGO_TEXT.g, COLOR_LOGO_TEXT.b);
          // @ts-ignore
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(22);
          const catLines = doc.splitTextToSize(catName.toUpperCase(), 110);
          
          // Imprimir el texto alineado a la derecha/centro, igual q en la imagen
          doc.text(catLines, 195, 25, { align: 'right' });

          // ── Footer (formas geométricas) ──────────────────────────
          // Celeste
          doc.setFillColor(COLOR_FOOTER_1.r, COLOR_FOOTER_1.g, COLOR_FOOTER_1.b);
          doc.rect(0, 255, 210, 14, 'F');
          
          // Azul medio
          doc.setFillColor(COLOR_FOOTER_2.r, COLOR_FOOTER_2.g, COLOR_FOOTER_2.b);
          doc.rect(0, 269, 210, 28, 'F');
          
          // Azul oscuro escuadra (polígono que corta en diagonal)
          doc.setFillColor(COLOR_FOOTER_3.r, COLOR_FOOTER_3.g, COLOR_FOOTER_3.b);
          // Triángulo inferior derecho
          doc.triangle(120, 297, 210, 260, 210, 297, 'F');

          // Texto de paginación (discreto)
          doc.setTextColor(255, 255, 255);
          // @ts-ignore
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.text(`Página ${pageNum} de ${totalPages}`, 195, 292, { align: 'right' });
        };

        const totalPagesThisCat = Math.ceil(catProducts.length / ROWS);
        let rowIdx = 0;
        let pageInCat = 1;

        doc.addPage();
        renderPage(pageInCat, totalPagesThisCat);

        catProducts.forEach((prod, idx) => {
          if (rowIdx >= ROWS) {
            doc.addPage();
            pageInCat++;
            renderPage(pageInCat, totalPagesThisCat);
            rowIdx = 0;
          }

          const y = MT + rowIdx * rowH + 5; // +5 padding superior
          const isEven = (idx % 2 === 0);
          
          // ── Imagen del producto ──────────────────────────────────
          const b64 = prod.imageUrl ? imagesMap.get(prod.imageUrl) : undefined;
          
          // Si es par, la imagen va a la Izquierda. Si es impar, a la Derecha.
          const imgX = isEven ? 20 : 210 - 20 - IMG_SIZE;
          const imgY = y;
          
          if (b64) {
             // sombra gris claro imitando efecto de "papel" / "libreta"
            doc.setFillColor(200, 200, 200);
            doc.rect(imgX + 2, imgY + 2, IMG_SIZE, IMG_SIZE, 'F'); // Shadow
            doc.addImage(b64, 'PNG', imgX, imgY, IMG_SIZE, IMG_SIZE);
          } else {
            doc.setFillColor(240, 240, 240);
            doc.rect(imgX, imgY, IMG_SIZE, IMG_SIZE, 'F');
          }

          // ── Textos: nombre y viñetas ────────────────────────────
          const textBlockW = 210 - 45 - IMG_SIZE;
          const textX = isEven ? 20 + IMG_SIZE + 10 : 20; 

          // Título del artículo
          doc.setTextColor(COLOR_LOGO_TEXT.r, COLOR_LOGO_TEXT.g, COLOR_LOGO_TEXT.b);
          // @ts-ignore
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(16);
          const titleLines = doc.splitTextToSize(prod.name, textBlockW);
          const titleHeight = titleLines.length * 6;
          
          // Centrar título dentro de su bloque (según diseño Norma)
          doc.text(titleLines, textX + textBlockW/2, imgY + 12, { align: 'center' });
          
          let py = imgY + 12 + titleHeight;

          // SKUs o Subtítulo
          doc.setTextColor(0, 0, 0);
          // @ts-ignore
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          if (prod.sku) {
             py += 2;
             doc.text(`SKU: ${prod.sku}`, textX + textBlockW/2, py, { align: 'center' });
             py += 6;
          } else {
             py += 6;
          }

          // Bullets alineados a la izq dentro del bloque de texto
          // Visualmente centrado como lista
          const bulletX = textX + (textBlockW / 2) - 15;

          doc.setFontSize(10);
          const priceRows = [];
          if ((prod.precioIndividual ?? 0) > 0) priceRows.push({ label: 'Menudeo', price: prod.precioIndividual ?? 0, min: 1 });
          if ((prod.precioMayoreo ?? 0) > 0) priceRows.push({ label: 'Mayoreo', price: prod.precioMayoreo ?? 0, min: prod.minMayoreo ?? 0 });
          if ((prod.precioCaja ?? 0) > 0) priceRows.push({ label: 'Por Caja', price: prod.precioCaja ?? 0, min: prod.minCaja ?? 0 });

          priceRows.forEach((row) => {
             doc.circle(bulletX, py - 1, 1, 'F');
             doc.text(`${row.label}: $${row.price.toFixed(2)} (${row.min}+ pzs)`, bulletX + 3, py);
             py += 5;
          });

          rowIdx++;
        });
      });

      doc.save('Catalogo_Altos.pdf');
    } catch (e) {
      console.error('Error generating PDF', e);
      alert('Ocurrió un error al generar el catálogo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };





  const normalizedCats = new Map<string, string>();
  categories.forEach(c => {
    if (c.name) normalizedCats.set(c.name.trim().toLowerCase(), c.name.trim());
  });
  products.forEach(p => {
    if (p.category) normalizedCats.set(p.category.trim().toLowerCase(), p.category.trim());
  });
  const combinedCategories = Array.from(normalizedCats.values()).map(c => c.trim().toUpperCase()).sort();
  const allCategories = ['Todos', ...combinedCategories];

  const randomProductsForEmptyState = useMemo(() => {
    if (!products || products.length === 0) return [];
    return [...products].sort(() => Math.random() - 0.5).slice(0, 10); // randomly pick 10
  }, [products]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return products.filter(p => {
      // Case-insensitive category match
      const matchCat = !activeCategory || activeCategory === '__loading__'
        ? false // nothing active = show nothing (wait for selection)
        : p.category?.toLowerCase() === activeCategory.toLowerCase();
      
      const matchSearch = p.name.toLowerCase().includes(q);
      const matchSection = !activeSection || (p.sections || []).includes(activeSection);
      
      // Stock Availability Filter
      let matchAvailability = true;
      if (filterAvailability.available && !filterAvailability.unavailable) matchAvailability = (p.stock || 0) > 0;
      else if (!filterAvailability.available && filterAvailability.unavailable) matchAvailability = (p.stock || 0) <= 0;
      
      // Price Filter
      const matchPrice = p.precioIndividual <= priceRange;

      if (activeSection) return matchSection && matchSearch && matchAvailability && matchPrice;
      return matchCat && matchSearch && matchAvailability && matchPrice;
    });
  }, [products, activeCategory, searchQuery, activeSection, filterAvailability, priceRange]);

  const processedProducts = useMemo(() => {
    let result = [...filtered];
    switch (sortBy) {
      case 'Alfabéticamente, A-Z':
        result.sort((a,b) => a.name.localeCompare(b.name));
        break;
      case 'Alfabéticamente, Z-A':
        result.sort((a,b) => b.name.localeCompare(a.name));
        break;
      case 'Precio Más Bajo Al Más Alto':
        result.sort((a,b) => a.precioIndividual - b.precioIndividual);
        break;
      case 'Precio Más Alto Al Más Bajo':
        result.sort((a,b) => b.precioIndividual - a.precioIndividual);
        break;
      // 'Destacados' or 'Nuestros Favoritos' - keeps original mapped order
    }
    return result;
  }, [filtered, sortBy]);

  const isCategoryView = !searchQuery && (activeSection || (activeCategory && activeCategory !== '__loading__'));
  const heroProductsCount = isCategoryView ? 4 : 0;
  
  const displayedProducts = processedProducts.slice(heroProductsCount, displayCount + heroProductsCount);

  const productGridContent = useMemo(() => (
    <div className="flex flex-col items-center">
      <div className="bw-product-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 w-full">
        {displayedProducts.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            index={i}
            onAdd={(qty, variant) => addToCart(product, qty, variant)}
            onShowVariants={() => setSelectedProductForDetail(product)}
            onShowDetail={() => setSelectedProductForDetail(product)}
          />
        ))}
      </div>

      {displayCount < processedProducts.length - heroProductsCount && (
        <button
          onClick={() => setDisplayCount(prev => prev + 24)}
          className="mt-12 bg-white border border-gray-200 text-gray-700 font-black text-sm px-8 py-3.5 rounded-2xl shadow-sm hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
        >
          <Search size={16} className="text-[#00b4d8]" />
          Cargar más artículos ({processedProducts.length - heroProductsCount - displayCount} restantes)
        </button>
      )}
    </div>
  ), [displayedProducts, filtered.length, displayCount, addToCart]);

  const handleWhatsApp = async () => {
    if (cart.length === 0) return;

    if (!user) {
      setCartOpen(false);
      setAuthModalOpen(true);
      return;
    }

    let facturacionDetails = '';
    if (requiereFactura) {
      const docSnap = await getDoc(doc(db, 'clientes', user.uid));
      const factData = docSnap.exists() ? docSnap.data().facturacion : null;

      if (!factData || !factData.rfc) {
        setCartOpen(false);
        setFacturacionModalOpen(true);
        return;
      }
      facturacionDetails = `%0A%0A*--- DATOS DE FACTURACIÓN ---*%0ARFC: ${factData.rfc}%0ARazón Social: ${factData.razonSocial}%0ACP: ${factData.cp}%0AUso CFDI: ${factData.usoCfdi}%0A%0A_Por favor adjunta tu Constancia de Situación Fiscal actualizada._`;
    }

    let text = `*PEDIDO — ARTÍCULOS REDITUABLES*%0A%0A`;
    const orderItems = cart.map(item => {
      const price = calcItemPrice(item);
      text += `▪ *${item.name}* ×${item.quantity} → $${(price * item.quantity).toFixed(2)}%0A`;
      return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: price,
        imageUrl: item.imageUrl
      };
    });

    // Save to Firestore
    try {
      await addDoc(collection(db, 'pedidos'), {
        userId: user.uid,
        userName: user.displayName || user.email,
        items: orderItems,
        total: cartTotal,
        requiereFactura,
        status: 'Pendiente',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error saving order:", err);
    }

    text += `%0A*TOTAL: $${cartTotal.toFixed(2)}*%0A%0AHola, me gustaría hacer este pedido.${facturacionDetails}`;
    
    // Use window.location.href instead of window.open to avoid mobile popup blockers
    window.location.href = `https://wa.me/525572177485?text=${text}`;
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── ANNOUNCEMENT BAR — Betterware style ─── */}
      <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center py-[4.5px] px-4 text-white text-[10px] font-bold tracking-[0.05em] uppercase overflow-hidden" style={{ background: 'var(--bw-teal)', letterSpacing: '1px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={annIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="text-center w-full"
          >
            {visualSettings?.sliders?.annTexts?.split('\n').filter(Boolean)?.[annIndex] || 'DESCUBRE LOS MEJORES ARTÍCULOS PARA TU NEGOCIO'}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── HEADER — Betterware style ─────────────── */}
      <header className="fixed top-[22px] left-0 right-0 z-50 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between px-4 md:px-10 h-[60px] max-w-screen-xl mx-auto w-full">
          
          {/* Menú y Logo */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Botón menú lateral */}
            <button
              onClick={() => setLeftMenuOpen(true)}
              className="text-gray-900 transition flex-shrink-0"
            >
              <Menu size={28} strokeWidth={1.5} />
            </button>

            {/* Logo prominente */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cldOpt(logoUrl, 80) || '/logo.jpg'}
                alt="Logo"
                className="h-10 w-10 rounded-lg object-cover border border-gray-100 shadow-sm"
              />
              {logo2Url && (
                <div className="flex items-center ml-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cldOpt(logo2Url, 200)}
                    alt="Altos"
                    className="h-10 object-contain"
                  />
                </div>
              )}
            </div>
          </div>

          {/* User + Cart buttons */}
          <div className="flex items-center gap-3.5 md:gap-5 flex-shrink-0">
            {/* "A+" Teal Box mimicking Betterware "B+" */}
            <button className="hidden sm:flex items-center justify-center text-white w-[26px] h-[26px] font-black text-xs tracking-tighter" style={{ background: 'var(--bw-teal)', borderRadius: '2px' }}>
              A+
            </button>
            <button className="sm:hidden flex items-center justify-center text-white w-[24px] h-[24px] font-black text-[11px] tracking-tighter" style={{ background: 'var(--bw-teal)', borderRadius: '2px' }}>
              A+
            </button>

            {/* User button (Outline) */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center transition"
                >
                  {user.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-[26px] h-[26px] rounded-full object-cover border border-gray-200" />
                  ) : (
                    <div className="w-[26px] h-[26px] rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] font-black uppercase text-gray-800">
                      {user.displayName?.[0] || user.email?.[0] || 'U'}
                    </div>
                  )}
                </button>

                {/* Overlay transparente para cerrar el menú en click afuera */}
                {userMenuOpen && (
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                )}

                {/* Dropdown */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 z-50 overflow-hidden"
                    >
                      {/* Profile header */}
                      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                        {user.photoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 flex items-center justify-center text-base font-black uppercase text-gray-800 flex-shrink-0">
                            {user.displayName?.[0] || user.email?.[0] || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-gray-900 text-sm font-bold truncate">{user.displayName || 'Usuario'}</p>
                          <p className="text-gray-400 text-[11px] font-medium truncate">{user.email}</p>
                        </div>
                      </div>
                      {/* Info */}
                      <div className="px-5 py-3 space-y-2 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">Proveedor</span>
                          <span className="text-gray-600 text-[11px] font-bold flex items-center gap-1.5">
                            {user.providerData[0]?.providerId === 'google.com' ? (
                              <><svg width="12" height="12" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg> Google</>
                            ) : (
                              <><Mail size={12} /> Email</>
                            )}
                          </span>
                        </div>
                        {user.metadata?.creationTime && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">Miembro desde</span>
                            <span className="text-gray-600 text-[11px] font-bold">
                              {new Date(user.metadata.creationTime).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Acciones Facturacion */}
                      <div className="px-5 py-2 border-b border-gray-100 space-y-1">
                        <button
                          onClick={() => {
                            setFacturacionModalOpen(true);
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-colors"
                        >
                          <FileText size={14} className="text-blue-500" /> Mis Datos de Facturación
                        </button>
                        <button
                          onClick={async () => {
                            setUserMenuOpen(false);
                            // Fetch orders before opening
                            const q = query(collection(db, 'pedidos'), where('userId', '==', user.uid));
                            const snap = await getDocs(q);
                            const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
                            orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                            setUserOrders(orders);
                            setOrdersModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-colors"
                        >
                          <Package size={14} className="text-purple-500" /> Mis Pedidos
                        </button>
                      </div>
                      {/* Logout */}
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-5 py-3 text-red-500 hover:bg-red-50 text-xs font-bold transition-colors"
                      >
                        <LogOut size={14} /> Cerrar sesión
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="text-gray-900 transition-all hover:text-black"
                title="Entrar"
              >
                <User size={26} strokeWidth={1.5} />
              </button>
            )}

            {/* Cart / Bag outline */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative text-gray-900 transition-all hover:text-black"
              title="Pedido"
            >
              <div className="relative">
                <ShoppingBag size={25} strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FF7F00] text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full leading-none z-10" style={{ transform: 'translate(25%, -15%)' }}>
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Search Row — Betterware estilo pill exacto */}
        <div className="px-4 md:px-10 pb-3 pt-1 md:pt-2 max-w-screen-xl mx-auto w-full">
          <div className="flex items-center border border-[#dcdcdc] rounded-[24px] px-3.5 py-1.5 bg-white overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] focus-within:border-gray-400 transition-colors h-[42px]">
            <Search className="text-[#888] flex-shrink-0 mr-2.5" size={18} strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-full bg-transparent outline-none text-[#333] placeholder-[#888] text-[15px]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[#888] hover:text-[#333] ml-2">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────── */}
      <section className="mt-[155px] md:mt-[165px] bg-white px-4 md:px-10 pb-4">
        {heroSlides.length > 0 ? (
          <div className="max-w-screen-xl mx-auto rounded-[8px] overflow-hidden relative">
            <HeroDynamic
            slides={heroSlides}
            currentSlide={currentSlide}
            onNext={() => setCurrentSlide(p => (p + 1) % heroSlides.length)}
            onPrev={() => setCurrentSlide(p => (p - 1 + heroSlides.length) % heroSlides.length)}
            onDot={(i) => setCurrentSlide(i)}
            logoUrl={logoUrl}
            primaryColor={themeColors.gradient || themeColors.primary}
          />
          </div>
        ) : (
          // Placeholder hero sin carrusel — Logo estático
          <div suppressHydrationWarning className="altos-hero relative flex flex-col items-center justify-center text-center py-16 md:py-28 px-6 overflow-hidden" style={{ background: themeColors.gradient || themeColors.primary || '#000000' }}>
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(255,255,255,0.04) 0%, transparent 70%)'
            }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl || '/logo.jpg'}
              alt="Logo"
              width={100}
              height={100}
              className="mb-4 rounded-2xl shadow-2xl"
              style={{ objectFit: 'cover' }}
            />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/40 text-xs tracking-[0.4em] uppercase font-medium mb-3 mt-2"
            >
              Bienvenido a
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-white text-4xl md:text-6xl font-black tracking-[0.1em] uppercase leading-none mb-4"
            >
              Artículos<br />
              <span className="font-light tracking-[0.2em]">
                <Typewriter text="Redituables" delay={0.8} speed={100} />
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="text-white/40 text-sm tracking-widest max-w-md font-medium"
            >
              Catálogo mayorista · Precios de caja y volumen
            </motion.p>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="w-16 h-px bg-white/20 mt-8"
            />
          </div>
        )}
      </section>



      {/* ── CATÁLOGO ─────────────────────────────────── */}
      <main className="flex-1" style={{ background: '#ffffff' }}>
        {(!activeSection && (!activeCategory || activeCategory === '__loading__') && !searchQuery) ? (
          <>
            {/* ── Destacados del Mes ── */}
            {!loading && products.length > 0 && (
              <div className="max-w-screen-xl mx-auto pt-8 pb-4">
                <h2 className="text-center font-extrabold text-[17px] mb-5 text-[#0a0a0a] tracking-tight">Destacados del Mes</h2>
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 md:px-10 pb-4 items-stretch" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {products.slice(0, 8).map((product, i) => (
                    <div key={product.id} className="snap-start shrink-0 w-[160px] sm:w-[190px] md:w-[230px] flex">
                      <ProductCard
                        product={product}
                        index={i}
                        onAdd={(qty, variant) => addToCart(product, qty, variant)}
                        onShowVariants={() => setSelectedProductForDetail(product)}
                        onShowDetail={() => setSelectedProductForDetail(product)}
                      />
                    </div>
                  ))}
                </div>
                {/* Custom visual scroll indicator */}
                <div className="w-20 h-1 bg-gray-300 mx-auto mt-1 rounded-full overflow-hidden relative">
                   <div className="w-1/2 h-full bg-[#1a1a1a] rounded-full absolute left-0" />
                </div>
              </div>
            )}

            {/* Cabecera del catálogo y Secciones */}
            <div className="max-w-screen-xl mx-auto px-5 md:px-10 pt-6 md:pt-10 pb-6">
              {/* ── Categorías Visuales (Betterware Style) ── */}
              {!loading && combinedCategories.length > 0 && (
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-gray-200" />
                    <h2 className="text-[15px] font-extrabold text-[#0a0a0a] tracking-tight">Categorías</h2>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-3 gap-y-6">
                    {combinedCategories.map((cat, idx) => {
                      const n = cat.toLowerCase();
                      let icon = <ShoppingBag size={52} strokeWidth={1.5} />;
                      
                      const colorPalette = [
                        '#00B4D8', '#F266AB', '#FF7B54', '#A459D1', '#EBB436', 
                        '#E87D2B', '#68CADA', '#97C042', '#9994BC', '#FF7B9C', 
                        '#3A68A5', '#88317A', '#F05454', '#16C79A', '#11698E', 
                        '#F4A261', '#E76F51', '#2A9D8F', '#E9C46A', '#F7B267',
                        '#D62828', '#8ECAE6', '#219EBC', '#023047', '#FFB703', 
                        '#FB8500', '#8338EC', '#3A86FF', '#FF006E'
                      ];
                      
                      const themeColor = colorPalette[idx % colorPalette.length];

                      if (n.includes('libreta') || n.includes('cuaderno')) { icon = <NotebookPen size={52} strokeWidth={1.5} />; }
                      else if (n.includes('plum') || n.includes('marcador') || n.includes('pluma')) { icon = <Pen size={52} strokeWidth={1.5} />; }
                      else if (n.includes('tijera') || n.includes('recort')) { icon = <Scissors size={52} strokeWidth={1.5} />; }
                      else if (n.includes('regla') || n.includes('geom')) { icon = <Ruler size={52} strokeWidth={1.5} />; }
                      else if (n.includes('libro') || n.includes('texto')) { icon = <BookOpen size={52} strokeWidth={1.5} />; }
                      else if (n.includes('pintura') || n.includes('acuarela') || n.includes('color')) { icon = <Brush size={52} strokeWidth={1.5} />; }
                      else if (n.includes('ciencia') || n.includes('laborator') || n.includes('quim')) { icon = <FlaskConical size={52} strokeWidth={1.5} />; }
                      else if (n.includes('folder') || n.includes('archiv') || n.includes('carpeta')) { icon = <Archive size={52} strokeWidth={1.5} />; }
                      else if (n.includes('agenda') || n.includes('planif') || n.includes('diario')) { icon = <NotebookPen size={52} strokeWidth={1.5} />; }
                      else if (n.includes('escuela') || n.includes('papeler') || n.includes('oficina')) { icon = <GraduationCap size={52} strokeWidth={1.5} />; }
                      else if (n.includes('sello') || n.includes('stamp')) { icon = <Stamp size={52} strokeWidth={1.5} />; }
                      else if (n.includes('bolig') || n.includes('lapiz') || n.includes('lápiz')) { icon = <PenTool size={52} strokeWidth={1.5} />; }
                      else { icon = <NotebookPen size={52} strokeWidth={1.5} />; }

                      const isActive = activeCategory === cat;

                      return (
                        <button
                          key={cat}
                          onClick={() => { setActiveCategory(cat); setActiveSection(null); }}
                          className="group flex flex-col items-center gap-2.5 transition-transform hover:scale-105 active:scale-95"
                        >
                          <div
                            className={`w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-full flex items-center justify-center transition-all duration-200 relative overflow-hidden mx-auto text-white shadow-sm border-2 ${isActive ? 'border-black/20 ring-4 ring-black/5 scale-105' : 'border-transparent'}`}
                            style={{ backgroundColor: themeColor }}
                          >
                            {isActive && <div className="absolute inset-0 bg-black/10 rounded-full" />}
                            {icon}
                          </div>
                          <span
                            className="text-[11px] font-bold text-center leading-tight px-0.5"
                            style={{
                              color: isActive ? themeColor : '#555',
                              fontWeight: isActive ? 800 : 700,
                            }}
                          >
                            {cat}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Secciones del catálogo ── */}
              <SeccionesUI
                loading={loading}
                activeSections={activeSections}
                activeSection={activeSection}
                setActiveSection={(s) => {
                  setActiveSection(s);
                  // When a section is selected, clear category so it shows all products in that section
                  if (s !== null) setActiveCategory('');
                }}
              />
            </div>

            <div id="body-section" className="max-w-screen-xl mx-auto px-3 md:px-10 pb-4">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="bg-white overflow-hidden border border-gray-200">
                      <div className="skeleton aspect-square w-full" />
                      <div className="p-2.5 space-y-2">
                        <div className="skeleton h-3 w-4/5 rounded" />
                        <div className="skeleton h-4 w-1/2 rounded" />
                        <div className="skeleton h-8 w-full rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-8 py-2 w-full animate-in fade-in duration-500">
                  {bodySectionUrls.length > 0 && (
                    <div className="relative w-full rounded-2xl overflow-hidden shadow-sm flex items-center justify-center mb-2">
                      {/* Todos los slides siempre en DOM — CSS opacity, cero requests al cambiar */}
                      {bodySectionUrls.map((url, i) => {
                        const isActive = i === bodySectionIndex;
                        return (
                          <div
                            key={url}
                            className={`w-full flex items-center justify-center transition-opacity duration-700 ${isActive ? 'relative opacity-100 z-10' : 'absolute top-0 left-0 opacity-0 z-0'}`}
                            style={{
                              pointerEvents: isActive ? 'auto' : 'none',
                            }}
                          >
                            <img
                              src={cldOpt(url, 1200)}
                              alt="Promociones y novedades"
                              loading={i === 0 ? 'eager' : 'lazy'}
                              decoding={i === 0 ? 'sync' : 'async'}
                              className="w-full h-auto block"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="w-full flex flex-col gap-0 animate-in fade-in">
            {/* Orange Header Category View */}
            <div className="w-full bg-[#f26522] text-white text-center py-4 shadow-sm border-b-4 border-[#d15316]">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-wide">
                {activeSection 
                  ? ({'novedades': 'Novedades', 'masVendidos': 'Más vendidos', 'ofertas': 'Ofertas', 'destacados': 'Destacados', 'mayoreo': 'Mayoreo', 'piezasUnicas': 'Piezas únicas', 'remates': 'Remates', 'exclusivo': 'Exclusivo online', 'temporada': 'Ofertas de temporada', 'nuevos': 'Recién llegados'}[activeSection] || activeSection)
                  : (activeCategory && activeCategory !== '__loading__' ? activeCategory : (searchQuery ? `Resultados de Búsqueda` : 'Catálogo'))}
              </h2>
            </div>
            
            <div className="w-full max-w-screen-xl mx-auto px-4 md:px-10 mt-3 pb-6">
              
              {/* Featured 4 Images Top Grid (Only if not loading) */}
              {!loading && processedProducts.length > 0 && !searchQuery && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mt-2">
                  {processedProducts.slice(0, 4).map(p => (
                    <div key={p.id} className="relative aspect-[4/3] bg-white border border-gray-100 flex flex-col items-center justify-center overflow-hidden cursor-pointer group rounded-lg shadow-sm hover:shadow-md transition-shadow" onClick={() => setSelectedProductForDetail(p)}>
                      <img src={cldOpt(p.imageUrl, 400)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(p as any).flags?.includes('nuevo') && (
                        <div className="absolute top-2 left-2 bg-[#fff100] text-black text-[9px] md:text-[10px] font-black px-2 py-0.5 uppercase tracking-wider z-10 rounded-sm">Nuevo</div>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); addToCart(p, 1, undefined); }} 
                        className="absolute bottom-3 right-3 w-10 h-10 md:w-11 md:h-11 bg-[#f26522] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#d15316] hover:scale-110 active:scale-95 transition-all z-10"
                      >
                        <ShoppingCart size={18} strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Breadcrumbs */}
              <div className="text-[13px] pt-5 pb-3 flex items-center flex-wrap gap-2 text-gray-500 font-medium tracking-tight">
                <span className="text-[#f26522] hover:underline cursor-pointer" onClick={() => { setActiveCategory('__loading__'); setActiveSection(null); setSearchQuery(''); }}>Home</span>
                <ChevronRight size={14} />
                <span className="text-[#f26522] border-b border-[#f26522] pb-0.5 max-w-[200px] truncate block">
                  {activeSection 
                  ? ({'novedades': 'Novedades', 'masVendidos': 'Más vendidos', 'ofertas': 'Ofertas', 'destacados': 'Destacados', 'mayoreo': 'Mayoreo', 'piezasUnicas': 'Piezas únicas', 'remates': 'Remates', 'exclusivo': 'Exclusivo online', 'temporada': 'Ofertas de temporada', 'nuevos': 'Recién llegados'}[activeSection] || activeSection)
                  : (activeCategory !== '__loading__' && activeCategory ? activeCategory : (searchQuery ? `Resultados` : 'Catálogo'))}
                </span>
              </div>
              
              <h3 className="text-[20px] md:text-[22px] font-black text-[#1a1a1a] mb-5 tracking-tight">
                Ver todo {activeSection 
                  ? ({'novedades': 'Novedades', 'masVendidos': 'Más vendidos', 'ofertas': 'Ofertas', 'destacados': 'Destacados', 'mayoreo': 'Mayoreo', 'piezasUnicas': 'Piezas únicas', 'remates': 'Remates', 'exclusivo': 'Exclusivo online', 'temporada': 'Ofertas de temporada', 'nuevos': 'Recién llegados'}[activeSection] || activeSection)
                  : (activeCategory !== '__loading__' && activeCategory ? activeCategory : (searchQuery ? `Resultados` : ''))}
              </h3>

              {/* Filters Row */}
              <div className="flex flex-row items-center justify-between gap-3 md:gap-5 mb-6 relative">
                <button 
                  onClick={() => setFilterModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 rounded text-[14px] font-bold text-[#1a1a1a] cursor-pointer hover:bg-gray-50 transition min-h-[48px] shadow-sm"
                >
                  <Filter size={18} strokeWidth={2} />
                  Filtro
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#f26522] text-white rounded text-[14px] font-bold cursor-pointer hover:brightness-110 transition min-h-[48px] shadow-sm px-2"
                >
                  <BookOpen size={18} strokeWidth={2} />
                  <span className="hidden sm:inline">Catálogo</span> PDF
                </button>
                <div className="relative flex-1">
                  <button 
                    onClick={() => setSortDropdownOpen(!sortDropdownOpen)} 
                    className="w-full flex items-center justify-between px-4 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition min-h-[48px] shadow-sm"
                  >
                    <div className="flex flex-col text-left justify-center">
                      <span className="text-[#666] font-normal text-[10px] leading-tight">Mostrar Por</span>
                      <span className="font-bold text-[#1a1a1a] text-[13px] leading-tight mt-[1px] truncate max-w-[120px] md:max-w-none">{sortBy}</span>
                    </div>
                    <ChevronRight size={16} className={`text-gray-400 transition-transform ${sortDropdownOpen ? '-rotate-90' : 'rotate-90'}`} />
                  </button>
                  
                  {sortDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setSortDropdownOpen(false)} />
                      <div className="absolute top-[52px] right-0 w-full min-w-[220px] bg-white border border-gray-100 shadow-xl rounded-md z-50 py-1 max-h-[300px] overflow-y-auto">
                        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                          <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Mostrar Por</span>
                        </div>
                        {['Destacados', 'Nuestros Favoritos', 'Alfabéticamente, A-Z', 'Alfabéticamente, Z-A', 'Precio Más Bajo Al Más Alto', 'Precio Más Alto Al Más Bajo'].map(option => (
                          <div 
                            key={option} 
                            onClick={() => { setSortBy(option); setSortDropdownOpen(false); }} 
                            className={`px-4 py-2.5 text-[12px] font-bold cursor-pointer transition-colors ${sortBy === option ? 'text-[#f26522] bg-orange-50/50' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Grid of Results or Empty State */}
              <div className="mt-4">
                {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="bg-white overflow-hidden border border-gray-200">
                        <div className="skeleton aspect-square w-full" />
                        <div className="p-2.5 space-y-2">
                          <div className="skeleton h-3 w-4/5 rounded" />
                          <div className="skeleton h-4 w-1/2 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center text-center py-20"
                  >
                    <div className="w-20 h-20 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-center mb-6">
                      <Package size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-black text-[#0a0a0a] uppercase tracking-widest mb-2">
                      {searchQuery ? 'Sin resultados' : 'Catálogo vacío'}
                    </h3>
                    <p className="text-sm text-gray-400 font-medium max-w-xs">
                      {searchQuery
                        ? `No encontramos artículos para "${searchQuery}". Intenta con otro término.`
                        : 'Próximamente agregaremos productos a este catálogo.'}
                    </p>
                  </motion.div>
                ) : (
                  productGridContent
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ SECCIONES INFERIORES SIEMPRE Visibles (Te podría gustar & Pre-Footer) ══ */}
        <div className="max-w-screen-xl mx-auto px-4 md:px-10 pb-16">
          {randomProductsForEmptyState.length > 0 && (
            <div className="mt-4 overflow-hidden">
              <h3 className="text-[17px] font-black text-[#1a1a1a] tracking-tight mb-5 px-1 border-l-4 border-l-[#274e84] pl-3">Te podría gustar</h3>
              <div className="flex overflow-x-auto gap-3 md:gap-5 w-full pb-6 snap-x snap-mandatory scrollbar-hide">
                {randomProductsForEmptyState.map((product, i) => (
                  <div key={product.id} className="min-w-[150px] max-w-[170px] md:min-w-[200px] md:max-w-[240px] flex-shrink-0 snap-start">
                    <ProductCard
                      product={product}
                      index={i}
                      onAdd={(qty, variant) => addToCart(product, qty, variant)}
                      onShowVariants={() => setSelectedProductForDetail(product)}
                      onShowDetail={() => setSelectedProductForDetail(product)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* ══ IMAGE BEFORE FOOTER CARRUSEL (Ancho Completo / Edge-to-Edge) ══════════════ */}
        {preFooterUrls.length > 0 && (
          <div className="w-full relative shadow-sm flex items-center justify-center mb-8 overflow-hidden">
            {/* Todos los slides siempre en DOM — CSS opacity, cero requests al cambiar */}
            {preFooterUrls.map((url, i) => {
              const isActive = i === preFooterIndex;
              return (
                <div
                  key={url}
                  className={`w-full flex items-center justify-center transition-opacity duration-700 ${isActive ? 'relative opacity-100 z-10' : 'absolute top-0 left-0 opacity-0 z-0'}`}
                  style={{
                    pointerEvents: isActive ? 'auto' : 'none',
                  }}
                >
                  <img
                    src={cldOpt(url, 1200)}
                    alt="Banner Inferior"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding={i === 0 ? 'sync' : 'async'}
                    className="w-full h-auto block"
                  />
                </div>
              );
            })}
            {/* Indicadores */}
            {preFooterUrls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {preFooterUrls.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${i === preFooterIndex ? 'w-8 bg-white shadow-sm' : 'w-2 bg-white/50 backdrop-blur-sm'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ MÁS VENDIDOS Section ══ */}
        {(() => {
          const masVendidos = products.filter(p => p.sections && p.sections.includes('masVendidos'));
          if (masVendidos.length === 0) return null;
          return (
            <div className="max-w-screen-xl mx-auto px-4 md:px-10 pb-16 overflow-hidden">
              <h3 className="text-[17px] font-black text-[#1a1a1a] tracking-tight mb-5 px-1 border-l-4 border-l-[#f26522] pl-3">Más Vendidos</h3>
              <div className="flex overflow-x-auto gap-3 md:gap-5 w-full pb-6 snap-x snap-mandatory scrollbar-hide">
                {masVendidos.map((product, i) => (
                  <div key={product.id} className="min-w-[150px] max-w-[170px] md:min-w-[200px] md:max-w-[240px] flex-shrink-0 snap-start">
                    <ProductCard
                      product={product}
                      index={i}
                      onAdd={(qty, variant) => addToCart(product, qty, variant)}
                      onShowVariants={() => setSelectedProductForDetail(product)}
                      onShowDetail={() => setSelectedProductForDetail(product)}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </main>

      {/* ── CART (Betterware style) ─────────────────── */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-[60]"
              onClick={() => setCartOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.22 }}
              className="fixed right-0 top-0 h-[100dvh] w-full max-w-[340px] bg-white z-[70] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* ── HEADER blanco estilo Betterware */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 flex-shrink-0 bg-white">
                <div>
                  <p className="font-black text-[14px] text-gray-900">
                    Tu Carrito ({cartCount} {cartCount === 1 ? 'Producto' : 'Productos'})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      if (cart.length === 0) return;
                      const textLines = cart.map(item => `${item.quantity}x ${item.name} (- $${calcItemPrice(item).toFixed(2)} c/u)`);
                      const totalFormatted = cartTotal.toFixed(2);
                      const msg = `¡Hola! Aquí está mi carrito de compras:\n\n${textLines.join('\n')}\n\nTotal estimado: $${totalFormatted}\n\nVisita el catálogo en: ${window.location.origin}`;
                      const wtspUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
                      window.open(wtspUrl, '_blank');
                    }}
                    className="flex items-center gap-1.5 border border-[#00A0C6] text-[#00A0C6] rounded-full px-3 py-1.5 text-[11px] font-bold hover:bg-[#00A0C6]/5 transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    Compartir Carrito
                  </button>
                  <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-black p-1 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* ── ITEMS */}
              <div className="flex-1 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
                    <ShoppingCart size={48} className="text-gray-200 mb-4" />
                    <p className="font-bold text-gray-300 text-sm tracking-wider uppercase">Tu carrito está vacío</p>
                    <button onClick={() => setCartOpen(false)} className="mt-5 px-6 py-2 rounded-full text-[12px] font-bold text-white bg-[#FF7F00] hover:bg-[#E06C00] transition-colors">
                      Ver productos
                    </button>
                  </div>
                ) : (
                  <>
                    {cart.map(item => {
                      const price = calcItemPrice(item);
                      const cid = item.cartItemId || item.id;
                      const itemImgUrl = item.selectedVariant?.imageUrl || item.imageUrl;
                      const subtotal = price * item.quantity;

                      return (
                        <div key={cid} className="px-4 py-4 border-b border-gray-100">
                          <div className="flex gap-3">
                            {/* Imagen con badges */}
                            <div className="relative flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={cldOpt(itemImgUrl, 120) || 'https://placehold.co/80x80/f5f5f5/ccc?text=IMG'}
                                alt={item.name}
                                className="w-[80px] h-[80px] object-contain bg-gray-50 rounded-md"
                              />
                              {/* Badge NUEVO */}
                              <span className="absolute top-1 left-1 bg-yellow-300 text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase leading-none">NUEVO</span>
                              {/* Icono categoría */}
                              <div className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                <Home size={10} className="text-white" />
                              </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[13px] text-gray-900 leading-snug line-clamp-2">{item.name}</p>
                              {item.selectedVariant && (
                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-0.5">{item.selectedVariant.name}</p>
                              )}
                              <p className="text-[14px] font-black text-gray-900 mt-1">${price.toFixed(2)}</p>
                              <p className="text-[11px] text-gray-500 font-medium">Subtotal: <span className="font-bold text-gray-700">${subtotal.toFixed(2)}</span></p>
                              <button
                                onClick={() => removeFromCart(cid)}
                                className="text-[11px] text-[#00A0C6] font-semibold mt-0.5 hover:underline"
                              >
                                Quitar
                              </button>
                            </div>

                            {/* Qty — derecha */}
                            <div className="flex-shrink-0 flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white h-8 self-center">
                              <button onClick={() => updateQuantity(cid, item.quantity - 1)} className="px-2 text-gray-500 hover:bg-gray-50 h-full flex items-center text-[13px] font-bold">−</button>
                              <span className="w-7 text-center text-[12px] font-black text-gray-900">{item.quantity}</span>
                              <button onClick={() => updateQuantity(cid, item.quantity + 1)} className="px-2 text-gray-500 hover:bg-gray-50 h-full flex items-center text-[13px] font-bold">+</button>
                            </div>
                          </div>

                          {/* Promo mensaje */}
                          <p className="mt-2.5 text-[11px] font-bold text-[#E91E8C] leading-tight">
                            Aprovecha la promoción: Ahorra al comprar 3 productos de todo el catálogo
                          </p>
                        </div>
                      );
                    })}

                    {/* ── También podría gustarte */}
                    {products.length > 2 && (
                      <div className="px-4 py-4 border-b border-gray-100">
                        <p className="text-[13px] font-black text-gray-900 mb-3">También podría gustarte</p>
                        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                          {[...products].sort(() => 0.5 - Math.random()).slice(0, 5).map(p => (
                            <div key={p.id} className="flex-shrink-0 w-[110px]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={cldOpt(p.imageUrl, 120) || 'https://placehold.co/110x90/f5f5f5/ccc?text=IMG'}
                                alt={p.name}
                                className="w-full h-[80px] object-cover rounded-lg bg-gray-50"
                              />
                              <p className="text-[11px] font-bold text-gray-800 mt-1 line-clamp-2 leading-tight">{p.name}</p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-[12px] font-black text-gray-900">${(p.precioIndividual || 0).toFixed(2)}</p>
                                <button
                                  onClick={() => addToCart(p, 1)}
                                  className="w-7 h-7 bg-[#FF7F00] rounded-full flex items-center justify-center text-white hover:bg-[#E06C00] transition-colors"
                                >
                                  <ShoppingCart size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}


                  </>
                )}
              </div>

              {/* ── FOOTER con Facturación y Botón naranja */}
              {cart.length > 0 && (
                <div className="px-4 pt-4 pb-8 md:pb-4 border-t border-gray-100 space-y-3 flex-shrink-0 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">

                  {/* Toggle Facturación */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={requiereFactura}
                        onChange={(e) => setRequiereFactura(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00A0C6]"></div>
                    </div>
                    <span className="text-[11px] font-bold text-gray-700">Requiero factura</span>
                  </label>

                  {/* Botón Finalizar pedido — naranja pill con total */}
                  <div className="space-y-2.5">
                    <button
                      onClick={handleWhatsApp}
                      className="w-full flex items-center justify-between px-5 py-4 rounded-full text-white font-black text-[14px] shadow-lg transition-all active:scale-[0.98] hover:brightness-105"
                      style={{ background: '#FF7F00' }}
                    >
                      <span>Finalizar pedido</span>
                      <span className="text-[14px] font-black">${cartTotal.toFixed(2)}</span>
                    </button>

                    <button 
                      onClick={() => {
                        if (cart.length === 0) return;
                        const textLines = cart.map(item => `${item.quantity}x ${item.name} (- $${calcItemPrice(item).toFixed(2)} c/u)`);
                        const msg = `🛒 *MI CARRITO DE COMPRAS*\n\n${textLines.join('\n')}\n\n*TOTAL: $${cartTotal.toFixed(2)}*`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-emerald-50 text-emerald-600 font-black text-[11px] uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95"
                    >
                      <Share2 size={14} />
                      Compartir Carrito
                    </button>
                  </div>

                  <button onClick={clearCart} className="w-full text-[11px] text-gray-400 hover:text-red-400 transition font-bold uppercase tracking-widest text-center pt-2">
                    Vaciar carrito
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── LEFT SIDEBAR (Menu Betterware style) ────────── */}
      <AnimatePresence>
        {leftMenuOpen && (
          <>
            {/* Overlay sutil */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setLeftMenuOpen(false)}
              className="fixed inset-0 bg-black/30 z-[60]"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.22 }}
              className="fixed top-0 left-0 bottom-0 w-[72vw] max-w-[300px] bg-white z-[70] shadow-xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <button
                  onClick={() => { setAuthModalOpen(true); setLeftMenuOpen(false); }}
                  className="text-[11px] font-bold tracking-widest uppercase text-gray-500 hover:text-black transition-colors"
                >
                  INICIO DE SESIÓN
                </button>
                <button onClick={() => setLeftMenuOpen(false)} className="text-gray-400 hover:text-black transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Nav items */}
              <nav className="flex-1 overflow-y-auto flex flex-col">

                {/* NUEVOS */}
                <button
                  onClick={() => { setActiveSection('novedades'); setLeftMenuOpen(false); window.scrollTo({ top: document.getElementById('body-section')?.offsetTop || 600, behavior: 'smooth' }); }}
                  className="flex items-center px-5 py-4 border-b border-gray-100 text-[13px] font-bold tracking-widest uppercase text-gray-800 hover:bg-gray-50 transition-colors text-left"
                >
                  NUEVOS
                </button>

                {/* OFERTAS */}
                <button
                  onClick={() => { setActiveSection('ofertas'); setLeftMenuOpen(false); window.scrollTo({ top: document.getElementById('body-section')?.offsetTop || 600, behavior: 'smooth' }); }}
                  className="flex items-center px-5 py-4 border-b border-gray-100 text-[13px] font-bold tracking-widest uppercase text-gray-800 hover:bg-gray-50 transition-colors text-left"
                >
                  OFERTAS
                </button>

                {/* ÚNETE */}
                <button
                  onClick={() => { setAuthModalOpen(true); setLeftMenuOpen(false); }}
                  className="flex items-center px-5 py-4 border-b border-gray-100 text-[13px] font-bold tracking-widest uppercase text-gray-800 hover:bg-gray-50 transition-colors text-left"
                >
                  ÚNETE
                </button>

                {/* DESCARGAR CATALOGO */}
                <button
                  onClick={() => { setLeftMenuOpen(false); handleDownloadPDF(); }}
                  className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 text-[13px] font-bold tracking-widest uppercase text-gray-800 hover:bg-gray-50 transition-colors text-left w-full"
                >
                   <BookOpen size={16} className="text-[#f26522]" /> DESCARGAR CATÁLOGO DIGITAL
                </button>

              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>


      {/* ── PRODUCT DETAIL MODAL (Betterware style) ── */}
      <AnimatePresence>
        {selectedProductForDetail && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[85]"
              onClick={() => setSelectedProductForDetail(null)}
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
              className="fixed bottom-0 md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:bottom-auto left-0 right-0 bg-white z-[90] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col md:flex-row max-h-[95vh] md:max-h-[85vh] md:w-[90vw] md:max-w-5xl overflow-hidden"
            >
              <button onClick={() => setSelectedProductForDetail(null)} className="hidden md:flex absolute top-5 right-5 w-10 h-10 bg-gray-100 hover:bg-gray-200 items-center justify-center rounded-full text-gray-600 transition z-50 cursor-pointer">
                <X size={20} />
              </button>
              {/* Handle bar mobile */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0 md:hidden bg-white z-10 rounded-t-3xl border-b border-gray-50">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              {/* Contenedor Interior Scrolleable en Mobile */}
              <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden w-full" style={{ scrollbarWidth: 'none' }}>

              {/* Contenedor Izquierdo (Imagen) */}
              <div className="md:w-1/2 bg-[#f0ecfc]/30 flex flex-col md:justify-center relative p-4 md:p-8 shrink-0 md:overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                {/* Product info top (MOBILE) */}
                <div className="px-2 pt-1 pb-4 md:hidden">
                  <p className="text-[11px] text-gray-400 font-semibold">
                    {selectedProductForDetail.sku ? `SKU #${selectedProductForDetail.sku}` : ''}
                  </p>
                  <h2 className="text-[18px] font-black text-gray-900 leading-tight mt-0.5">{selectedProductForDetail.name}</h2>
                  <p className="text-[22px] font-black text-gray-900 mt-1">
                    ${(selectedProductForDetail.precioIndividual || 0).toFixed(2)}
                  </p>
                </div>

                {/* Main image gallery */}
                {(() => {
                  /* eslint-disable @typescript-eslint/no-explicit-any */
                  const allImages: string[] = [
                    selectedProductForDetail.imageUrl,
                    ...((selectedProductForDetail as any).extraImages || [])
                  ].filter(Boolean);
                  const hasMultipleImages = allImages.length > 1;
                  return (
                    <>
                      <div className="relative mx-5 rounded-3xl overflow-hidden bg-white aspect-square border border-gray-100 shadow-inner">
                        {/* Botón Volver para móvil */}
                        <button 
                          onClick={() => setSelectedProductForDetail(null)} 
                          className="md:hidden absolute top-4 left-4 z-40 bg-white/90 backdrop-blur-sm w-9 h-9 rounded-full flex items-center justify-center shadow-md text-gray-800"
                        >
                          <ChevronLeft size={22} />
                        </button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cldOpt(allImages[detailImageIndex] || selectedProductForDetail.imageUrl, 800) || 'https://placehold.co/400x400/f5f5f5/ccc?text=IMG'}
                          alt={selectedProductForDetail.name}
                          className="w-full h-full object-contain p-4"
                        />
                        {/* Expand/zoom icon */}
                        <button onClick={() => setZoomedImage(cldOpt(allImages[detailImageIndex] || selectedProductForDetail.imageUrl, 1200) || 'https://placehold.co/1200')} className="absolute bottom-3 right-3 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors z-20">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                        </button>
                        {/* Nav arrows for multiple images */}
                        {hasMultipleImages && (
                          <>
                            <button onClick={() => setDetailImageIndex(i => (i - 1 + allImages.length) % allImages.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full shadow flex items-center justify-center text-gray-600 hover:bg-white transition z-10">
                              <ChevronLeft size={18} />
                            </button>
                            <button onClick={() => setDetailImageIndex(i => (i + 1) % allImages.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full shadow flex items-center justify-center text-gray-600 hover:bg-white transition z-10">
                              <ChevronRight size={18} />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Dot indicator — only when multiple images */}
                      {hasMultipleImages && (
                        <div className="flex justify-center gap-1.5 mt-3">
                          {allImages.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setDetailImageIndex(idx)}
                              className={`w-2 h-2 rounded-full transition-colors ${idx === detailImageIndex ? 'bg-gray-800' : 'bg-gray-200'}`}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}

              </div>

              {/* Contenedor Derecho (Info Gral) */}
              <div className="md:w-1/2 md:overflow-y-auto flex-1 pb-28 md:pb-10 pt-2 md:pt-10 md:px-6 relative">
                
                {/* Product info top (LAPTOP) */}
                <div className="px-5 pb-4 hidden md:block">
                  <h2 className="text-[32px] font-black text-[#0d1b2a] leading-tight tracking-tight">{selectedProductForDetail.name}</h2>
                  <p className="text-[14px] text-gray-400 font-bold uppercase tracking-widest mt-1 mb-4">
                    {selectedProductForDetail.sku ? `SKU #${selectedProductForDetail.sku}` : ''}
                  </p>
                  <p className="text-[36px] font-black text-[#0d1b2a]">
                    ${(selectedProductForDetail.precioIndividual || 0).toFixed(2)}
                  </p>
                </div>

                {/* Tabs Detalles */}
                <div className="px-5 mt-5">
                  <div className="flex border-b border-gray-200 gap-6">
                    <button className="pb-2 text-[13px] font-black text-gray-900 border-b-2 border-gray-900">Detalles</button>
                  </div>
                  <div className="mt-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <p className={`text-[13px] text-gray-600 leading-relaxed ${!detailDescExpanded ? 'line-clamp-3' : ''}`}>
                      {(selectedProductForDetail as any).description || `${selectedProductForDetail.name}. Artículo de papelería de alta calidad, ideal para uso escolar y de oficina.`}
                    </p>
                    {((selectedProductForDetail as any).description || '').length > 120 && (
                      <button onClick={() => setDetailDescExpanded(v => !v)} className="text-[12px] font-bold text-[#00A0C6] mt-2">
                        {detailDescExpanded ? 'Ver menos' : 'Leer más'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Pricing tiers */}
                <div className="px-5 mt-5">
                  <h4 className="text-[14px] font-black text-gray-900 mb-3 uppercase tracking-wider">PRECIOS POR VOLUMEN</h4>
                  <div className="flex flex-wrap gap-2">
                    {/* Individual */}
                    <div className="flex-1 min-w-[120px] bg-white border border-gray-100 rounded-2xl p-3 flex flex-col justify-center shadow-sm">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">INDIVIDUAL</span>
                      <span className="text-[18px] font-black text-gray-900 leading-none mb-1">
                        ${(selectedProductForDetail.precioIndividual || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-gray-500 font-bold">1 pza</span>
                    </div>

                    {/* Mayoreo */}
                    {(selectedProductForDetail.precioMayoreo || 0) > 0 && (
                      <div className="flex-1 min-w-[120px] bg-green-50/50 border border-green-100 rounded-2xl p-3 flex flex-col justify-center shadow-sm">
                        <span className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">MAYOREO</span>
                        <span className="text-[18px] font-black text-green-700 leading-none mb-1">
                          ${(selectedProductForDetail.precioMayoreo || 0).toFixed(2)}
                        </span>
                        <span className="text-[10px] bg-green-200/50 text-green-800 font-bold px-1.5 py-0.5 rounded-md inline-block w-max">
                          {selectedProductForDetail.minMayoreo || 5} pzas min.
                        </span>
                      </div>
                    )}

                    {/* Caja */}
                    {(selectedProductForDetail.precioCaja || 0) > 0 && (
                      <div className="flex-1 min-w-[120px] bg-blue-50/50 border border-blue-100 rounded-2xl p-3 flex flex-col justify-center shadow-sm">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">CAJA DESC.</span>
                        <span className="text-[18px] font-black text-blue-700 leading-none mb-1">
                          ${(selectedProductForDetail.precioCaja || 0).toFixed(2)}
                        </span>
                        <span className="text-[10px] bg-blue-200/50 text-blue-800 font-bold px-1.5 py-0.5 rounded-md inline-block w-max">
                          {selectedProductForDetail.minCaja || 24} pzas min.
                        </span>
                      </div>
                    )}

                    {/* Especial */}
                    {(selectedProductForDetail.precioEspecial || 0) > 0 && (
                      <div className="flex-1 min-w-[120px] bg-purple-50/50 border border-purple-100 rounded-2xl p-3 flex flex-col justify-center shadow-sm">
                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">ESPECIAL</span>
                        <span className="text-[18px] font-black text-purple-700 leading-none mb-1">
                          ${(selectedProductForDetail.precioEspecial || 0).toFixed(2)}
                        </span>
                        <span className="text-[10px] bg-purple-200/50 text-purple-800 font-bold px-1.5 py-0.5 rounded-md inline-block w-max">
                          {selectedProductForDetail.minEspecial || 50} pzas min.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Share buttons */}
                <div className="px-5 mt-5 flex gap-2">
                  <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(selectedProductForDetail.name)}`, '_blank')} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-gray-600 text-[11px] font-bold hover:bg-gray-50 transition-all">
                    <svg width="14" height="14" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Compartir
                  </button>
                  <button onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Mira este producto: ' + selectedProductForDetail.name + ' ' + window.location.href)}`, '_blank')} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-gray-600 text-[11px] font-bold hover:bg-gray-50 transition-all">
                    <svg width="14" height="14" fill="#25D366" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Compartir
                  </button>
                  <button onClick={() => {
                    if (navigator.share) navigator.share({ title: selectedProductForDetail.name, url: window.location.href });
                  }} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-gray-600 text-[11px] font-bold hover:bg-gray-50 transition-all">
                    <Share2 size={14} className="text-gray-500" />
                    Compartir
                  </button>
                </div>

                {/* Productos Relacionados with visual feedback */}
                {products.length > 1 && (
                  <div className="px-5 mt-6">
                    <h3 className="text-[15px] font-black text-gray-900 mb-3">Productos Relacionados</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                      {[...products].filter(p => p.id !== selectedProductForDetail.id && p.category === selectedProductForDetail.category)
                        .concat([...products].filter(p => p.id !== selectedProductForDetail.id && p.category !== selectedProductForDetail.category))
                        .slice(0, 6)
                        .map(p => (
                          <RelatedProductCard 
                            key={p.id} 
                            product={p} 
                            onAdd={(prod) => addToCart(prod, 1)} 
                            onShowDetail={() => setSelectedProductForDetail(p)}
                          />
                        ))}
                    </div>
                  </div>
                )}
                {/* Opciones de Variantes inline (si tiene) */}
                {selectedProductForDetail.variants && selectedProductForDetail.variants.length > 0 && (
                  <div className="px-5 mt-6 border-t border-gray-100 pt-6">
                    <VariantConfigurator
                      product={selectedProductForDetail}
                      onAdd={(qty, variant) => {
                        addToCart(selectedProductForDetail, qty, variant);
                        setSelectedProductForDetail(null);
                        setCartOpen(true);
                      }}
                    />
                  </div>
                )}
              </div>
              </div>

              {/* Footer fixed — qty + Añadir al Carrito (oculto si hay variantes configurándose arriba) */}
              {!(selectedProductForDetail.variants && selectedProductForDetail.variants.length > 0) && (
                <div className="absolute bottom-0 left-0 right-0 md:static md:mt-2 md:mb-10 p-5 bg-white border-t border-gray-100 md:border-none flex items-center justify-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)] md:shadow-none z-10 w-full">
                  <button
                    onClick={() => {
                      addToCart(selectedProductForDetail, 1);
                      setSelectedProductForDetail(null);
                      setCartOpen(true);
                    }}
                    className="w-full md:w-[90%] h-[50px] md:h-[60px] rounded-full bg-black text-white font-black text-[16px] md:text-[18px] tracking-wide text-center shadow-lg shadow-orange-500/30 hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    style={{ background: 'var(--bw-orange)' }}
                  >
                    <span>Añadir Al Carrito</span>
                    <ShoppingCart size={20} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── CHATBOT IA ───────────────────────────── */}
      <Chatbot catalogData={products} />


      {/* ── WA FLOAT ─────────────────────────────── */}
      <a
        href="https://wa.me/525572177485"
        target="_blank"
        rel="noopener noreferrer"
        className="wa-float fixed bottom-24 md:bottom-8 right-5 z-50 w-13 h-13 bg-[#25D366] rounded-full flex items-center justify-center shadow-xl"
        style={{ width: 52, height: 52 }
        }
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
      </a>

      {/* ── BOTTOM NAV MOBILE — Betterware blanco ── */}
      <nav className="bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 bg-white border-t border-gray-200">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-gray-500 hover:text-[#00A0C6] transition"
        >
          <Home size={20} strokeWidth={1.8} />
          Inicio
        </button>
        <button
          onClick={() => window.scrollTo({ top: document.getElementById('body-section')?.offsetTop || 500, behavior: 'smooth' })}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-gray-500 hover:text-[#00A0C6] transition"
        >
          <Grid3X3 size={20} strokeWidth={1.8} />
          Catálogo
        </button>
        <button
          onClick={() => setCartOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-gray-500 hover:text-[#FF7F00] transition relative"
        >
          <div className="relative">
            <ShoppingCart size={20} strokeWidth={1.8} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#FF7F00] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          Pedido
        </button>
      </nav>

      {/* ── FOOTER — Accordion style ────── */}
      <footer suppressHydrationWarning className="text-white pb-24 md:pb-12" style={{ background: 'var(--bw-footer)' }}>
        <div className="h-[2px] w-full" style={{ background: 'var(--bw-teal)' }} />

        <div className="max-w-screen-xl mx-auto px-6 md:px-10 pt-10">

          <details className="group border-b border-white/10" open>
            <summary className="cursor-pointer font-black uppercase tracking-widest text-[11px] flex justify-between items-center text-white/90 list-none [&::-webkit-details-marker]:hidden py-5">
              ALTOS ARTÍCULOS
              <ChevronDown size={14} className="group-open:rotate-180 transition-transform opacity-60" />
            </summary>
            <div className="pb-6 text-white/70 space-y-4">
              <div className="flex flex-col items-start gap-4 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-altos.png"
                  alt="Altos Artículos"
                  className="h-14 w-auto object-contain brightness-0 invert opacity-90"
                />
              </div>
              <p className="text-xs leading-relaxed max-w-sm">
                Distribuidora mayorista de artículos de calidad. Envíos a todo México con los mejores precios del mercado.
              </p>
              <a href="https://wa.me/5215572177485" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[11px] font-bold text-white hover:text-[#25D366] transition mt-2">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                +52 1 55 7217 7485
              </a>
            </div>
          </details>

          <details className="group border-b border-white/10">
            <summary className="cursor-pointer font-black uppercase tracking-widest text-[11px] flex justify-between items-center text-white/90 list-none [&::-webkit-details-marker]:hidden py-5">
              ÚNETE HOY
              <ChevronDown size={14} className="group-open:rotate-180 transition-transform opacity-60" />
            </summary>
            <div className="pb-6 space-y-4 flex flex-col items-start pt-2">
              {['Regístrate', 'Inicia Sesión'].map(link => (
                <button
                  key={link}
                  onClick={() => setAuthModalOpen(true)}
                  className="text-[12px] font-bold text-white hover:text-white/70 transition tracking-wide"
                >
                  {link}
                </button>
              ))}
            </div>
          </details>

          <details className="group border-b border-white/10">
            <summary className="cursor-pointer font-black uppercase tracking-widest text-[11px] flex justify-between items-center text-white/90 list-none [&::-webkit-details-marker]:hidden py-5">
              CATÁLOGO & MI CUENTA
              <ChevronDown size={14} className="group-open:rotate-180 transition-transform opacity-60" />
            </summary>
            <div className="pb-6 space-y-4 flex flex-col items-start pt-2">
              {['Todos los artículos', 'Novedades', 'Ofertas especiales', 'Mayoreo'].map(link => (
                <button key={link} className="text-[12px] font-bold text-white hover:text-white/70 transition tracking-wide">{link}</button>
              ))}
              <div className="h-2" />
              {user && (
                <>
                  <button onClick={() => setFacturacionModalOpen(true)} className="text-[12px] font-bold text-white hover:text-white/70 transition tracking-wide">
                    Mis Datos Fiscales
                  </button>
                  <button onClick={async () => {
                    const q = query(collection(db, 'pedidos'), where('userId', '==', user.uid));
                    const snap = await getDocs(q);
                    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
                    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    setUserOrders(orders);
                    setOrdersModalOpen(true);
                  }} className="text-[12px] font-bold text-white hover:text-white/70 transition tracking-wide">
                    Mis Pedidos
                  </button>
                </>
              )}
            </div>
          </details>

          {/* ── MAPA DE UBICACIÓN ── */}
          <div className="mt-10 mb-2">
            <p className="font-black uppercase tracking-widest text-[11px] text-white/90 mb-4 px-1">
              NUESTRA UBICACIÓN
            </p>
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 shadow-inner">
              <iframe 
                 src="https://www.google.com/maps/embed?pb=!4v1773557963163!6m8!1m7!1sJPmx0hnLtU-zSE2pdZXE5w!2m2!1d19.42801297897359!2d-99.13278149410918!3f99.74115467427897!4f2.8687543569622562!5f1.5845165093927105" 
                 className="w-full h-[250px] md:h-[350px] duration-300"
                 style={{ border: 0 }} 
                 allowFullScreen={true} 
                 loading="lazy" 
                 referrerPolicy="no-referrer-when-downgrade">
              </iframe>
            </div>
          </div>

          {/* Spacer to push everything to Bottom Layout */}
          <div className="mt-12 flex flex-col md:flex-row justify-between items-center md:items-end w-full gap-8">
            
            {/* Left side: Socials and Links */}
            <div className="flex flex-col items-center md:items-start select-none w-full md:w-auto">
              
              {/* Redes Sociales */}
              <div className="flex items-center gap-6 mb-6 text-white">
                <a href="https://www.facebook.com/profile.php?id=100026258081577&sk=photos&locale=es_LA" target="_blank" rel="noopener noreferrer" className="hover:opacity-75 transition">
                  <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="https://www.instagram.com/articulos_redituables7/" target="_blank" rel="noopener noreferrer" className="hover:opacity-75 transition">
                  <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" className="hover:opacity-75 transition">
                  <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>

              {/* Links Legal & Derechos */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-3 text-[10px] font-bold tracking-widest uppercase text-white/90">
                <span>© ALTOS 2026</span>
                <a href="#" className="hover:text-white transition">POLÍTICA DE PRIVACIDAD</a>
                <a href="#" className="hover:text-white transition">CONDICIONES GENERALES DE VENTA</a>
              </div>
            </div>

            {/* Right side: Powered By */}
            <div className="flex flex-col items-center md:items-end w-full md:w-auto mt-4 md:mt-0">
              <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.4em] mb-3 md:text-right">Powered By</p>
              <div className="flex justify-center items-center gap-6 transition-opacity duration-300">
                {/* AWS Logo */}
                <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" alt="AWS" className="h-[14px] md:h-4 object-contain bg-white px-1 py-0.5 rounded-sm" />
                {/* Google Cloud Logo */}
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg" alt="Google Cloud" className="h-[14px] md:h-4 object-contain" />
                {/* Gemini Logo */}
                <div className="flex items-center gap-1.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="url(#gemini-gradient)">
                    <defs>
                      <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4285f4" />
                        <stop offset="50%" stopColor="#9b72cb" />
                        <stop offset="100%" stopColor="#d96570" />
                      </linearGradient>
                    </defs>
                    <path d="M12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0Z" />
                  </svg>
                  <span className="text-white font-black text-[10px] tracking-wider uppercase mt-0.5">Gemini AI</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </footer>

      {/* Scroll To Top Button (Teal Circle, matches Betterware image) */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-24 md:bottom-8 right-5 z-40 w-12 h-12 rounded-full flex items-center justify-center shadow-xl text-white hover:scale-105 active:scale-95 transition-transform"
        style={{ background: 'var(--bw-teal)' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      </button>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
            <button onClick={() => setZoomedImage(null)} className="absolute top-5 right-5 w-11 h-11 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition cursor-pointer z-[110]">
              <X size={24} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoomedImage} alt="Zoom" className="max-w-full max-h-[90vh] object-contain relative z-[105]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL: FILTRO ────────────────────────────────── */}
      <AnimatePresence>
        {filterModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-[60]"
              onClick={() => setFilterModalOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.22 }}
              className="fixed left-0 top-0 h-full w-full max-w-[340px] bg-white z-[70] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0 bg-white">
                <p className="font-black text-[14px] text-[#1a1a1a]">
                  Filtro
                </p>
                <button onClick={() => setFilterModalOpen(false)} className="text-gray-400 hover:text-black p-1 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 pb-20">
                {/* Disponibilidad */}
                <div className="mb-6">
                  <h4 className="font-black text-[13px] text-[#1a1a1a] mb-4">Disponibilidad</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setFilterAvailability(prev => ({ ...prev, available: !prev.available }))}>
                      <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition ${filterAvailability.available ? 'border-[#f26522]' : 'border-gray-300 group-hover:border-[#f26522]'}`}>
                        <div className={`w-2 h-2 rounded-[1px] bg-[#f26522] transition ${filterAvailability.available ? 'opacity-100' : 'opacity-0'}`}></div>
                      </div>
                      <span className="text-[12px] font-medium text-gray-600 group-hover:text-gray-900">Disponible ({products.filter(p => (p.stock || 0) > 0).length})</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setFilterAvailability(prev => ({ ...prev, unavailable: !prev.unavailable }))}>
                      <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition ${filterAvailability.unavailable ? 'border-[#f26522]' : 'border-gray-300 group-hover:border-[#f26522]'}`}>
                        <div className={`w-2 h-2 rounded-[1px] bg-[#f26522] transition ${filterAvailability.unavailable ? 'opacity-100' : 'opacity-0'}`}></div>
                      </div>
                      <span className="text-[12px] font-medium text-gray-600 group-hover:text-gray-900">No Disponible ({products.filter(p => (p.stock || 0) <= 0).length})</span>
                    </label>
                  </div>
                </div>

                <hr className="border-gray-100 my-5" />

                {/* Precio */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-black text-[13px] text-[#1a1a1a]">Precio</h4>
                    <span className="text-[12px] font-black text-[#f26522]">${priceRange}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="5000" 
                    step="50"
                    value={priceRange}
                    onChange={(e) => setPriceRange(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#f26522]"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] font-bold text-gray-400">$0</span>
                    <span className="text-[10px] font-bold text-gray-400">$5000</span>
                  </div>
                </div>

                <hr className="border-gray-100 my-5" />

                {/* Categoría */}
                <div className="mb-6">
                  <h4 className="font-black text-[13px] text-[#1a1a1a] mb-4">Categoría</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer group" onClick={(e) => { e.preventDefault(); setActiveCategory('__loading__'); }}>
                      <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition ${activeCategory === '__loading__' ? 'border-[#f26522]' : 'border-gray-300 group-hover:border-[#f26522]'}`}>
                        <div className={`w-2 h-2 rounded-[1px] bg-[#f26522] transition ${activeCategory === '__loading__' ? 'opacity-100' : 'opacity-0'}`}></div>
                      </div>
                      <span className={`text-[12px] font-medium ${activeCategory === '__loading__' ? 'text-gray-900 font-bold' : 'text-gray-600 group-hover:text-gray-900'}`}>Todos</span>
                    </label>
                    {combinedCategories.map(cat => {
                      const isActive = activeCategory?.toLowerCase() === cat.toLowerCase();
                      return (
                        <label key={cat} className="flex items-center gap-2 cursor-pointer group" onClick={(e) => { e.preventDefault(); setActiveCategory(cat); }}>
                          <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition ${isActive ? 'border-[#f26522]' : 'border-gray-300 group-hover:border-[#f26522]'}`}>
                            <div className={`w-2 h-2 rounded-[1px] bg-[#f26522] transition ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
                          </div>
                          <span className={`text-[12px] font-medium ${isActive ? 'text-gray-900 font-bold' : 'text-gray-600 group-hover:text-gray-900'}`}>{cat} ({products.filter(p => p.category?.toLowerCase() === cat.toLowerCase()).length})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-white">
                <button onClick={() => setFilterModalOpen(false)} className="w-full bg-[#f26522] hover:bg-[#d15316] text-white font-black text-[13px] py-3.5 rounded transition">
                  Aplicar filtro
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MODAL: MIS PEDIDOS ────────────────────────────────── */}
      <AnimatePresence>
        {ordersModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-[60]"
              onClick={() => setOrdersModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-[61] flex items-center justify-center p-4 sm:p-6"
            >
              <div className="bg-white border border-gray-100 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm">
                      <Package size={20} />
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-black text-sm tracking-widest uppercase leading-none mb-1">
                        Mis Pedidos
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Historial de compras</p>
                    </div>
                  </div>
                  <button onClick={() => setOrdersModalOpen(false)} className="text-gray-400 hover:text-black hover:bg-white w-10 h-10 rounded-2xl flex items-center justify-center transition shadow-sm border border-transparent hover:border-gray-100">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {userOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                      <Package size={48} className="mb-4 opacity-20" />
                      <p className="text-sm font-bold tracking-widest uppercase">No tienes pedidos aún</p>
                      <p className="text-xs font-medium mt-1">Tus pedidos aparecerán aquí después de enviarlos por WhatsApp</p>
                    </div>
                  ) : (
                    userOrders.map((order) => (
                      <div key={order.id} className="group bg-gray-50 hover:bg-white border border-gray-100 rounded-2xl p-5 transition-all hover:shadow-lg hover:shadow-gray-100 hover:border-purple-100">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Orden #{order.id.slice(-6).toUpperCase()}</p>
                            <p className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1.5">
                              <Sparkles size={10} /> {new Date(order.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${order.status === 'Pendiente' ? 'bg-amber-100 text-amber-600' :
                            order.status === 'Enviado' ? 'bg-blue-100 text-blue-600' :
                              order.status === 'Completado' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                            {order.status}
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-contain bg-white border border-gray-100" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-200">
                                  <Package size={16} />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-[11px] font-black text-gray-800 leading-tight">{item.name}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Cant: {item.quantity} · ${item.price.toFixed(2)} c/u</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            {order.requiereFactura && (
                              <span className="flex items-center gap-1 text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full">
                                <FileText size={10} /> Factura Solicitada
                              </span>
                            )}
                          </div>
                          <p className="text-base font-black text-gray-900 tracking-tight">Total: ${order.total.toFixed(2)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <FacturacionModal
        isOpen={facturacionModalOpen}
        onClose={() => setFacturacionModalOpen(false)}
        onDataSaved={() => {
          if (requiereFactura) {
            setFacturacionModalOpen(false);
            setCartOpen(true);
          }
        }}
      />


    </div>
  );
}

export default memo(Storefront);
