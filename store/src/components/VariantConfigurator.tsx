import React, { useState } from 'react';
import { Minus, Plus, Check } from 'lucide-react';
import { Product } from '@/context/CartContext';

export function VariantConfigurator({
  product,
  onAdd
}: {
  product: Product;
  onAdd: (qty: number, variant: { name: string, imageUrl: string }) => void
}) {
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(product.variants ? product.variants[0] : null);

  if (!product.variants || product.variants.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* Header Minimalista */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="font-bold text-lg text-gray-900 tracking-tight">Selección</h3>
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Opciones Disponibles
        </span>
      </div>

      <div>
        <h4 className="font-black text-sm text-gray-900 mb-3 tracking-widest uppercase">
          Color / Diseño <span className="text-gray-400 font-bold ml-1">({product.variants.length})</span>
        </h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {product.variants.map((v, i) => {
            const isSelected = selectedVariant === v;
            return (
              <button
                key={i}
                onClick={() => setSelectedVariant(v)}
                className="group flex flex-col items-center gap-2 transition-all duration-300 relative focus:outline-none"
              >
                <div className={`w-full aspect-square rounded-3xl overflow-hidden flex items-center justify-center p-2 transition-all duration-500 relative ${isSelected
                  ? 'ring-2 ring-[#0a0a0a] ring-offset-2 scale-105 bg-white shadow-md'
                  : 'bg-gray-50 hover:bg-gray-100 grayscale hover:grayscale-0'
                  }`}>
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-[#0a0a0a] text-white p-1 rounded-full z-10 shadow-lg">
                      <Check size={10} strokeWidth={4} />
                    </div>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.imageUrl || 'https://placehold.co/100/f5f5f5/ddd?text=IMG'}
                    alt={v.name}
                    className={`object-contain w-full h-full transition-transform duration-500 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}
                  />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest text-center mt-1 px-1 line-clamp-2 transition-colors duration-300 ${isSelected ? 'text-[#0a0a0a]' : 'text-gray-400 group-hover:text-gray-600'}`}>
                  {v.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-6">
        <label className="block font-bold text-xs text-gray-400 mb-3 tracking-widest uppercase">Cantidad</label>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full overflow-hidden bg-gray-50 h-14 flex-shrink-0 w-36 hover:bg-gray-100 transition-colors">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-12 h-full flex items-center justify-center hover:bg-gray-200 transition text-gray-500 active:scale-90"
            >
              <Minus size={16} strokeWidth={2.5} />
            </button>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={e => setQty(Math.max(1, Number(e.target.value) || 1))}
              className="flex-1 bg-transparent text-center text-lg font-bold outline-none text-gray-900 w-0"
            />
            <button
              onClick={() => setQty(q => q + 1)}
              className="w-12 h-full flex items-center justify-center hover:bg-gray-200 transition text-gray-500 active:scale-90"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>

          <button
            onClick={() => selectedVariant && onAdd(qty, selectedVariant)}
            disabled={!selectedVariant}
            className="flex-1 h-14 rounded-full font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 bg-[#0a0a0a] text-white hover:bg-black active:scale-[0.98] hover:shadow-xl hover:shadow-black/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Añadir a Cotización
          </button>
        </div>
      </div>

    </div>
  );
}
