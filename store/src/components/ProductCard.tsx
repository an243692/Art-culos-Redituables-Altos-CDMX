import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Check } from 'lucide-react';
import { Product } from '@/context/CartContext';
import { cldOpt } from '@/lib/utils';

export const ProductCard = memo(function ProductCard({ product, onAdd, onShowVariants, onShowDetail, index = 0 }: {
  product: Product;
  onAdd: (qty: number, variant?: { name: string, imageUrl: string }) => void;
  onShowVariants?: () => void;
  onShowDetail?: () => void;
  index?: number;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const hasVariants = product.variants && product.variants.length > 0;
  const extraImages: string[] = (product as any).extraImages || [];
  const secondImage = extraImages[0] || null;

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVariants && onShowVariants) { onShowVariants(); return; }
    onAdd(qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleCardClick = () => {
    if (onShowDetail) { onShowDetail(); return; }
    if (hasVariants && onShowVariants) onShowVariants();
  };

  const precioInd = product.precioIndividual || 0;
  const hasMayoreo = (product.precioMayoreo || 0) > 0 && (product.minMayoreo || 0) > 0;

  const productSections: string[] = product.sections || [];
  const isNuevo = productSections.includes('novedades') || productSections.includes('nuevos');
  const isSinStock = (product.stock !== undefined && product.stock <= 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.45, delay: Math.min((index || 0) * 0.05, 0.3), ease: [0.25, 0.46, 0.45, 0.94] }}
      className="product-card flex flex-col bg-white h-full scroll-reveal-card group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Image zone ───────────────── */}
      <div
        className="relative w-full aspect-square bg-[#f7f7f7] overflow-hidden cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Badge NUEVO */}
        {isNuevo && <span className="bw-badge-nuevo">NUEVO</span>}

        {/* Badge AGOTADO */}
        {isSinStock && (
          <div className="absolute inset-0 bg-white/40 z-20 flex items-center justify-center p-2 backdrop-blur-[1px]">
            <span className="bg-white/90 border-2 border-red-500 text-red-500 text-[11px] font-black uppercase tracking-tight px-3 py-1.5 rounded-lg shadow-xl scale-110">Agotado</span>
          </div>
        )}

        {/* Mayoreo badge — más estilizado */}
        {hasMayoreo && !isNuevo && (
          <span className="absolute top-2 left-0 bg-gradient-to-r from-[var(--bw-teal)] to-[var(--bw-teal-dark)] text-white text-[8px] font-black uppercase tracking-wider px-2.5 py-1 z-10 rounded-r-full shadow-sm">
            Mayoreo
          </span>
        )}

        {/* Imagen principal */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cldOpt(product.imageUrl, 400) || 'https://placehold.co/400x400/f7f7f7/bbb?text=IMG'}
          alt={product.name}
          loading={index < 4 ? "eager" : "lazy"}
          decoding="async"
          className={`w-full h-full object-contain p-2 transition-all duration-500 ${
            isHovered && secondImage ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          }`}
        />

        {/* Segunda imagen en hover (si existe) */}
        {secondImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cldOpt(secondImage, 400)}
            alt={`${product.name} - vista 2`}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 w-full h-full object-contain p-2 transition-all duration-500 ${
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          />
        )}

      </div>

      {/* ── Info zone ─────────────────── */}
      <div className="p-2.5 pb-3 flex flex-col flex-grow justify-between">
        <div>
          <h3
            className="text-[12px] font-bold text-[#1a1a1a] leading-snug line-clamp-2 cursor-pointer min-h-[34px] group-hover:text-[var(--bw-teal)] transition-colors duration-200"
            onClick={handleCardClick}
            style={{ color: 'var(--bw-text)' }}
          >
            {product.name}
          </h3>

          <div className="flex items-baseline gap-1.5 mt-1.5 mb-1">
            <p className="text-[16px] font-black text-[#1a1a1a]" style={{ color: 'var(--bw-text)' }}>
              {precioInd > 0 ? `$${precioInd.toFixed(2)}` : 'A cotizar'}
            </p>
            {hasMayoreo && (
              <span className="text-[10px] font-bold text-[var(--bw-teal)] bg-[var(--bw-teal)]/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                ${product.precioMayoreo.toFixed(2)} mayoreo
              </span>
            )}
          </div>
        </div>

        {/* Controls row */}
        <div className="mt-auto">
          {hasVariants ? (
            <button
              onClick={handleAddClick}
              className="w-full py-2 rounded-[4px] text-[11px] font-black uppercase tracking-wider text-white hover:brightness-110 transition-all active:scale-[0.97]"
              style={{ background: 'var(--bw-teal)' }}
            >
              Ver detalle
            </button>
          ) : (
            <div className="flex flex-col gap-1.5">
              {/* Qty selector */}
              <div className="flex items-center justify-between border border-gray-200 rounded-full h-[34px] bg-white px-3 w-full group-hover:border-gray-300 transition-colors">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} type="button" className="text-[#1a1a1a] text-base font-bold px-1.5 py-1 leading-none hover:text-[var(--bw-orange)] rounded-full transition-colors">−</button>
                <input
                  type="number" min="1" value={qty}
                  onChange={e => setQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-10 text-center text-[13px] font-bold text-[#1a1a1a] outline-none border-none hide-arrows bg-transparent"
                />
                <button onClick={() => setQty(q => q + 1)} type="button" className="text-[#1a1a1a] text-base font-bold px-1.5 py-1 leading-none hover:text-[var(--bw-orange)] rounded-full transition-colors">+</button>
              </div>
              {/* Add to cart button — full width */}
              <button
                disabled={isSinStock}
                onClick={handleAddClick}
                className={`w-full h-[36px] rounded-full flex items-center justify-center gap-2 text-white text-[11px] font-black uppercase tracking-wide transition-all active:scale-[0.96] ${
                  isSinStock
                    ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed'
                    : added
                      ? 'bg-green-500 shadow-[0_4px_12px_rgba(34,197,94,0.35)]'
                      : 'shadow-[0_4px_12px_rgba(255,127,0,0.3)] hover:brightness-110'
                }`}
                style={!isSinStock && !added ? { background: 'var(--bw-orange)' } : undefined}
                title="Agregar al pedido"
              >
                {added
                  ? <><Check size={14} strokeWidth={3} /> Añadido</>
                  : <><ShoppingCart size={14} strokeWidth={2} /> Agregar</>
                }
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}, (prev, next) => prev.product.id === next.product.id && prev.index === next.index);

