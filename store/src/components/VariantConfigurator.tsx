import React, { useState } from 'react';
import { Minus, Plus, Check } from 'lucide-react';
import { Product, useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export function VariantConfigurator({
  product,
  onAdd,
  onVariantSelect
}: {
  product: Product;
  onAdd: (qty: number, variant?: { name: string, imageUrl: string, sku?: string, description?: string }) => void;
  onVariantSelect?: (variant: { name: string, imageUrl: string, sku?: string, description?: string } | null) => void;
}) {
  // Generamos la lista de opciones incluyendo el producto principal al inicio
  const allOptions = React.useMemo(() => {
    if (!product.variants || product.variants.length === 0) return [];
    return [
      { name: 'Principal / Original', imageUrl: product.imageUrl, sku: product.sku, _isBase: true },
      ...product.variants
    ];
  }, [product]);

  const [qtyPzas, setQtyPzas] = useState(1);
  const [qtyCajas, setQtyCajas] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<any>(allOptions[0]);
  const [selectedExtraOption, setSelectedExtraOption] = useState<any>(product.opcionesExtra && product.opcionesExtra.length > 0 ? product.opcionesExtra[0] : null);

  const { cart } = useCart();
  const { clientData } = useAuth();
  
  const pInd = Number(product.precioIndividual) || 0;
  const mCaja = Number(product.minCaja) || 0;
  const pCaja = Number(product.precioCaja) || 0;
  const mMay = Number(product.minMayoreo) || 0;
  const pMay = Number(product.precioMayoreo) || 0;
  const mEsp = Number(product.minEspecial) || 0;
  const pEsp = Number(product.precioEspecial) || 0;

  const finalQty = qtyPzas + (qtyCajas * (mCaja || 24));

  // Simular estado del carrito DESPUÉS de añadir estas piezas
  const afterTotalUnits = cart.reduce((s, p) => s + Number(p.quantity || 0), 0) + finalQty;
  const afterProductUnits = cart
    .filter(p => p.id === product.id)
    .reduce((s, p) => s + Number(p.quantity || 0), 0) + finalQty;

  // Misma lógica que calcItemPrice en CartContext
  const hasVip = clientData?.precioEspecial === true;
  let unitPrice = pInd;

  if (hasVip && pEsp > 0) {
    unitPrice = pEsp;
  } else if (mEsp > 0 && afterProductUnits >= mEsp && pEsp > 0) {
    unitPrice = pEsp;
  } else if (mCaja > 0 && afterProductUnits >= mCaja && pCaja > 0) {
    unitPrice = pCaja;
  } else if (mMay > 0 && afterTotalUnits >= mMay && pMay > 0) {
    unitPrice = pMay;
  }

  const projectedTotal = unitPrice * finalQty;

  React.useEffect(() => {
    if (onVariantSelect && allOptions.length > 0) {
      // By default, it's the principal product, so we pass null to avoid "Producto - Principal" in titles
      onVariantSelect(null);
    }
  }, [product, onVariantSelect]);

  if (allOptions.length === 0 && (!product.opcionesExtra || product.opcionesExtra.length === 0)) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* Header Minimalista */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="font-bold text-lg text-gray-900 tracking-tight">Selección</h3>
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Opciones Disponibles
        </span>
      </div>

      {allOptions.length > 0 && (
      <div>
        <h4 className="font-black text-sm text-gray-900 mb-3 tracking-widest uppercase">
          Color / Diseño <span className="text-gray-400 font-bold ml-1">({allOptions.length})</span>
        </h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {allOptions.map((v: any, i: number) => {
            const isSelected = selectedVariant === v;
                const isLibreta = (product.category || '').toLowerCase().includes('libreta') || (product.category || '').toLowerCase().includes('cuaderno');
                const isDisabledForBox = isLibreta && qtyCajas > 0;

                return (
                  <button
                    key={i}
                    disabled={isDisabledForBox}
                    onClick={() => {
                      setSelectedVariant(v);
                      if (onVariantSelect) {
                        onVariantSelect(v._isBase ? null : v);
                      }
                    }}
                    className={`group flex flex-col items-center gap-2 transition-all duration-300 relative focus:outline-none ${isDisabledForBox ? 'opacity-30 cursor-not-allowed contrast-50' : ''}`}
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
      )}

      {product.opcionesExtra && product.opcionesExtra.length > 0 && (
        <div className="mt-2">
          <h4 className="font-black text-sm text-gray-900 mb-3 tracking-widest uppercase">
            Formato / Modelo <span className="text-gray-400 font-bold ml-1">({product.opcionesExtra.length})</span>
          </h4>
          <div className="flex flex-wrap gap-3">
            {product.opcionesExtra.map((opt: any, i) => {
              const optName = typeof opt === 'string' ? opt : opt.name;
              const optImg = typeof opt === 'string' ? null : opt.imageUrl;
              const isSelected = selectedExtraOption === opt;
              
              if (optImg) {
                 return (
                  <button
                    key={i}
                    onClick={() => setSelectedExtraOption(opt)}
                    className="group flex flex-col items-center gap-2 transition-all duration-300 relative focus:outline-none w-20"
                  >
                    <div className={`w-full aspect-square rounded-2xl overflow-hidden flex items-center justify-center p-1.5 transition-all duration-500 relative ${isSelected ? 'ring-2 ring-[#0a0a0a] ring-offset-2 scale-105 bg-white shadow-md' : 'bg-gray-50 hover:bg-gray-100 grayscale hover:grayscale-0'}`}>
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-[#0a0a0a] text-white p-0.5 rounded-full z-10 shadow-lg">
                          <Check size={8} strokeWidth={4} />
                        </div>
                      )}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={optImg} alt={optName} className={`object-contain w-full h-full transition-transform duration-500 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`} />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest text-center px-1 line-clamp-2 transition-colors duration-300 ${isSelected ? 'text-[#0a0a0a]' : 'text-gray-400 group-hover:text-gray-600'}`}>
                      {optName}
                    </span>
                  </button>
                 );
              }
              
              return (
                <button
                  key={i}
                  onClick={() => setSelectedExtraOption(opt)}
                  className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                    isSelected
                      ? 'bg-[#0a0a0a] text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800'
                  }`}
                >
                  {optName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 pt-6">
        
        {/* Caja Row (si aplica) */}
        {(product.precioCaja || 0) > 0 && (
          <div className="flex flex-col mb-4">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-blue-600 tracking-widest uppercase">Cajas enteras</label>
              <div className="flex items-center rounded-full overflow-hidden bg-blue-50 h-10 w-32 border border-blue-100">
                <button 
                  onClick={() => {
                    const newQty = Math.max(0, qtyCajas - 1);
                    setQtyCajas(newQty);
                    // Si es libreta y habilitó caja, reseteamos a principal/surtido
                    const isLibreta = (product.category || '').toLowerCase().includes('libreta') || (product.category || '').toLowerCase().includes('cuaderno');
                    if (isLibreta && newQty > 0) {
                        setSelectedVariant(allOptions[0]);
                        if (onVariantSelect) onVariantSelect(null);
                    }
                  }} 
                  className="w-10 h-full text-blue-500 hover:bg-blue-100 transition flex items-center justify-center"
                >
                  <Minus size={14} strokeWidth={2.5} />
                </button>
                <input
                  type="number"
                  min="0"
                  value={qtyCajas}
                  onChange={e => {
                    const val = Math.max(0, Number(e.target.value) || 0);
                    setQtyCajas(val);
                    const isLibreta = (product.category || '').toLowerCase().includes('libreta') || (product.category || '').toLowerCase().includes('cuaderno');
                    if (isLibreta && val > 0) {
                        setSelectedVariant(allOptions[0]);
                        if (onVariantSelect) onVariantSelect(null);
                    }
                  }}
                  className="flex-1 bg-transparent text-center text-sm font-bold outline-none text-blue-900 w-0 hide-arrows"
                />
                <button 
                  onClick={() => {
                    const newQty = qtyCajas + 1;
                    setQtyCajas(newQty);
                    const isLibreta = (product.category || '').toLowerCase().includes('libreta') || (product.category || '').toLowerCase().includes('cuaderno');
                    if (isLibreta && newQty > 0) {
                        setSelectedVariant(allOptions[0]);
                        if (onVariantSelect) onVariantSelect(null);
                    }
                  }} 
                  className="w-10 h-full text-blue-500 hover:bg-blue-100 transition flex items-center justify-center"
                >
                  <Plus size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            {/* Mensaje de Libretas */}
            {(() => {
                 const isLibreta = (product.category || '').toLowerCase().includes('libreta') || (product.category || '').toLowerCase().includes('cuaderno');
                 if (isLibreta && qtyCajas > 0) {
                     return (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-2.5 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <p className="text-[10px] text-orange-700 font-bold leading-tight">
                                ⚠️ Si escoges una caja, esta viene surtida de diseño del modelo que pidió. 
                                Si quiere variadas pida de una en una desde el carrito.
                            </p>
                            <p className="text-[9px] text-orange-500 font-medium mt-1 uppercase tracking-tighter italic">
                                * Selección de diseño bloqueada al llevar caja *
                            </p>
                        </div>
                     );
                 }
                 return null;
            })()}
          </div>
        )}

        {/* Piezas Row */}
        <div className="flex items-center justify-between mb-6">
          <label className="font-bold text-xs text-gray-500 tracking-widest uppercase">Piezas sueltas</label>
          <div className="flex items-center rounded-full overflow-hidden bg-gray-50 h-10 w-32 border border-gray-200">
            <button onClick={() => setQtyPzas(q => Math.max(0, q - 1))} className="w-10 h-full text-gray-500 hover:bg-gray-200 transition flex items-center justify-center">
              <Minus size={14} strokeWidth={2.5} />
            </button>
            <input
              type="number"
              min="0"
              value={qtyPzas}
              onChange={e => setQtyPzas(Math.max(0, Number(e.target.value) || 0))}
              className="flex-1 bg-transparent text-center text-sm font-bold outline-none text-gray-900 w-0 hide-arrows"
            />
            <button onClick={() => setQtyPzas(q => q + 1)} className="w-10 h-full text-gray-500 hover:bg-gray-200 transition flex items-center justify-center">
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              if (allOptions.length > 0 && !selectedVariant) return;
              if (product.opcionesExtra && product.opcionesExtra.length > 0 && !selectedExtraOption) return;
              
              if (finalQty <= 0) return;
              
              // Helper para resolver objeto variant
              const getVariantObj = (isSurtido = false) => {
                 let variantObj: any = undefined;
                 
                 if (isSurtido) {
                     variantObj = { name: "Caja (Surtido Genérico)", imageUrl: product.imageUrl, sku: product.sku };
                 } else if (selectedVariant && !selectedVariant._isBase) {
                     variantObj = { ...selectedVariant };
                 }
                 
                 if (selectedExtraOption) {
                     const optNameStr = typeof selectedExtraOption === 'string' ? selectedExtraOption : selectedExtraOption.name;
                     if (variantObj) {
                         variantObj.name = `${variantObj.name} | Formato: ${optNameStr}`;
                     } else {
                         variantObj = { 
                             name: `Formato: ${optNameStr}`, 
                             imageUrl: product.imageUrl, 
                             sku: product.sku 
                         };
                     }
                 }
                 return variantObj;
              };

              // Aplicar restricción de Surtido Obligatorio
              // @ts-ignore
              const isAssortedBox = product.cajaSurtida === true;
              
              if (isAssortedBox && qtyCajas > 0) {
                  const boxQty = qtyCajas * (mCaja || 24);
                  // Las piezas de caja se van obligatoriamente como surtido
                  onAdd(boxQty, getVariantObj(true));
                  
                  // Si también pidió piezas sueltas, se van como el color/diseño que seleccionó
                  if (qtyPzas > 0) {
                      onAdd(qtyPzas, getVariantObj(false));
                  }
              } else {
                  onAdd(finalQty, getVariantObj(false));
              }
            }}
            disabled={(allOptions.length > 0 && !selectedVariant) || (product.opcionesExtra && product.opcionesExtra.length > 0 && !selectedExtraOption) || (qtyPzas === 0 && qtyCajas === 0)}
            className="w-full h-14 rounded-full font-bold text-[11px] uppercase tracking-widest flex items-center justify-between px-6 transition-all duration-300 text-white bg-[#0a0a0a] hover:bg-black active:scale-[0.98] shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span>Añadir {finalQty} pzs al pedido</span>
            {projectedTotal > 0 && (
              <span className="text-white/90 font-black tracking-normal text-[13px]">${projectedTotal.toFixed(2)}</span>
            )}
          </button>
          
          {(qtyPzas > 0 || qtyCajas > 0) && (
            <div className="flex flex-col items-center mt-2 space-y-1">
              <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Estás llevando: <span className="text-gray-600">{qtyCajas} {qtyCajas === 1 ? 'caja' : 'cajas'}</span> (de {product.minCaja || 24} pzs) y <span className="text-gray-600">{qtyPzas} {qtyPzas === 1 ? 'pieza suelta' : 'piezas sueltas'}</span>.
              </p>
              
              {/* @ts-ignore */}
              {(product.cajaSurtida === true && qtyCajas > 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-2 max-w-sm mx-auto w-full">
                   <p className="text-[10px] font-black text-amber-800 leading-tight text-center uppercase">
                      ⚠️ Nota Importante:
                      <span className="block font-bold normal-case mt-0.5 opacity-90">Al comprar por caja, los modelos/colores se surten genericamente mixtos. El diseño que elegiste en esta pantalla solo aplicará para las piezas sueltas que lleves extras.</span>
                   </p>
                </div>
              )}
              
              {unitPrice < pInd && unitPrice > 0 && (
                <span className="text-[9px] text-[#00A0C6] font-black uppercase tracking-widest bg-[#00A0C6]/10 px-2 py-0.5 rounded mt-2 block w-max mx-auto">
                  ★ Precio {unitPrice <= pCaja && pCaja > 0 ? 'de caja' : 'de mayoreo'} aplicado ★
                </span>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
