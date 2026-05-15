/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars, no-var */
'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { collection, getDocs, query, orderBy, doc, getDoc, addDoc, where, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
const DB = db as any;
import { Product, useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingCart, Search, ChevronLeft, ChevronRight, ChevronDown,
  Minus, Plus, Trash2, X, Package, Home, Grid3X3, Check,
  User, LogOut, Mail, Lock, UserPlus, Menu, FileText, Info, Filter,
  LayoutGrid, Utensils, Bed, Droplet, Umbrella, PenTool, Gamepad2, Shirt, ShoppingBag, Box, Book, Monitor, Sparkles,
  Pen, Scissors, Ruler, BookOpen, Brush, FlaskConical, Archive, NotebookPen, Stamp, GraduationCap, Share2,
  MapPin, Clock, Phone, Target, Eye
} from 'lucide-react';
import { SeccionesUI } from '@/components/SeccionesUI';
import { motion, AnimatePresence } from 'framer-motion';
import { cldOpt } from '@/lib/utils';
import { AuthModal } from '@/components/AuthModal';
import { FacturacionModal } from '@/components/FacturacionModal';
import { HeroDynamic, HeroSlide } from '@/components/HeroDynamic';
import { Typewriter } from '@/components/Typewriter';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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
        className={`w-full h-7 rounded-lg flex items-center justify-center gap-1.5 mt-2 text-[11px] font-bold transition-all ${justAdded
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

/* ── Sanitize a Google Maps URL to make it embeddable ── */
function sanitizeMapUrl(raw: string, fallbackAddress?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  // Already a valid embed URL
  if (trimmed.includes('google.com/maps/embed')) return trimmed;
  // Extract from iframe tag if user pasted the full HTML
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/);
  if (srcMatch && srcMatch[1].includes('google.com/maps')) return srcMatch[1];
  // Extract @lat,lng coordinates from a regular Google Maps link
  const coordMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) {
    return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d2000!2d${coordMatch[2]}!3d${coordMatch[1]}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses!2smx!4v1`;
  }
  // Short goo.gl URLs or maps.app URLs can't be used in iframes
  if (trimmed.includes('goo.gl') || trimmed.includes('maps.app')) {
    // Fallback to address-based search
    if (fallbackAddress) {
      return `https://www.google.com/maps/embed/v1/place?key=AIzaSyC7k98HTOfgUHt0aFbGG6IVoiA5HowCt-k&q=${encodeURIComponent(fallbackAddress)}`;
    }
    return null;
  }
  // /place/ pattern
  const placeMatch = trimmed.match(/\/place\/([^/@?]+)/);
  if (placeMatch) {
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyC7k98HTOfgUHt0aFbGG6IVoiA5HowCt-k&q=${placeMatch[1]}`;
  }
  // If the url looks like a Google Maps URL at all, try address fallback
  if (fallbackAddress) {
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyC7k98HTOfgUHt0aFbGG6IVoiA5HowCt-k&q=${encodeURIComponent(fallbackAddress)}`;
  }
  return trimmed;
}

/* ── Ubicaciones Section ── */
function UbicacionesSection({ ubicaciones }: { ubicaciones: any[] }) {
  if (ubicaciones.length === 0) return null;
  return (
    <section id="ubicaciones-section" className="py-16 scroll-mt-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-px bg-gray-200" />
        <h2 className="text-[18px] font-black text-[#0a0a0a] uppercase tracking-tighter flex items-center gap-2">
          <MapPin size={22} className="text-[#f26522]" />
          Visita nuestras sucursales
        </h2>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-1">
        {ubicaciones.map((loc) => {
          const embedUrl = sanitizeMapUrl(loc.mapUrl, loc.direccion);
          return (
            <div key={loc.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              {embedUrl ? (
                <div className="h-48 w-full overflow-hidden bg-gray-50 border-b border-gray-100">
                  <iframe
                    src={embedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title={loc.nombre || 'Mapa'}
                  />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center text-gray-400 border-b border-gray-100 gap-2">
                  <MapPin size={32} className="opacity-30" />
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">Mapa no disponible</span>
                </div>
              )}
              <div className="p-6">
                <h3 className="text-[17px] font-black text-[#0a0a0a] mb-2 leading-tight">{loc.nombre}</h3>
                <div className="space-y-2">
                  <p className="text-[13px] text-gray-500 font-medium flex items-start gap-2 leading-snug">
                    <MapPin size={14} className="mt-0.5 text-[#f26522] flex-shrink-0" />
                    {loc.direccion}
                  </p>
                  {loc.horario && (
                    <p className="text-[13px] text-gray-500 font-medium flex items-center gap-2">
                      <Clock size={14} className="text-[#f26522] flex-shrink-0" />
                      {loc.horario}
                    </p>
                  )}
                  {loc.telefono && (
                    <p className="text-[13px] text-gray-500 font-medium flex items-center gap-2">
                      <Phone size={14} className="text-[#f26522] flex-shrink-0" />
                      {loc.telefono}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── Nosotros Section Premium ── */
function NosotrosSection({ data }: { data: any }) {
  if (!data) return null;

  const gridStyle = data.fondoCuadricula ? {
    backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)`,
    backgroundSize: '40px 40px',
    backgroundColor: 'transparent'
  } : {
    backgroundColor: 'transparent'
  };

  return (
    <section id="nosotros-section" className="py-12 md:py-24 relative overflow-hidden" style={gridStyle}>
      {/* Elemento de fondo decorativo general */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 opacity-70 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3 opacity-70 pointer-events-none" />

      <div className="max-w-screen-xl mx-auto px-4 md:px-10 relative z-10">
        
        {/* Encabezado Principal */}
        <div className="text-center mb-10 md:mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="flex items-center justify-center gap-4 mb-6"
          >
             <div className="h-px bg-[#1d4ed8]/20 w-16 md:w-24"></div>
             <i className="fas fa-building text-2xl text-[#1d4ed8]"></i>
             <div className="h-px bg-[#1d4ed8]/20 w-16 md:w-24"></div>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="text-[44px] md:text-[64px] font-black leading-[1.05] tracking-tight max-w-4xl mx-auto flex flex-wrap justify-center gap-x-4 gap-y-2"
          >
            {data.titulo1 || data.titulo2 ? (
              <>
                <span style={{ color: data.color1 || '#111827' }}>{data.titulo1}</span>
                {data.titulo2 && (
                   <span className="relative inline-block pb-2">
                      <span className="relative z-10" style={{ color: data.color2 || '#1d4ed8' }}>{data.titulo2}</span>
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[4px] z-0 rounded-full" style={{ backgroundColor: data.color2 || '#1d4ed8' }}></span>
                   </span>
                )}
              </>
            ) : (
              <span className="text-[#1a1a1a]">{data.titulo || 'Artículos Redituables Altos'}</span>
            )}
          </motion.h2>
          
          {data.lema && (
            <motion.p 
              initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="mt-8 text-[18px] md:text-[22px] font-medium text-gray-500 max-w-3xl mx-auto leading-relaxed"
            >
              {data.lema}
            </motion.p>
          )}
        </div>

        {/* ── Contenedor Principal (Imagen Arriba, Texto y Cards abajo) ── */}
        <div className="flex flex-col gap-6 md:gap-8">
          
          {/* Bloque: Imagen Grande (Sin texto superpuesto para evitar recortes) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="w-full relative rounded-[32px] overflow-hidden shadow-2xl shadow-black/10 bg-white group h-[250px] sm:h-[350px] md:h-[500px]"
          >
            <img
              src={data.imageUrl || 'https://placehold.co/1200x800/f5f5f5/ccc?text=FOTO+DEL+EQUIPO'}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-105 ease-out"
              alt="Instalaciones de la empresa"
            />
            {/* Solo un brillo sutil, nada que oscurezca por completo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none" />
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
            
            {/* Descripción (Historia) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} transition={{ delay: 0.3 }}
              className="xl:col-span-7 rounded-[32px] p-8 md:p-12 border flex flex-col justify-center transition-all duration-300"
              style={{
                background: data.colorHistoria ? `linear-gradient(to bottom right, #ffffff, ${data.colorHistoria}15)` : '#ffffff',
                borderColor: data.colorHistoria ? `${data.colorHistoria}30` : '#f3f4f6',
                boxShadow: data.colorHistoria ? `0 20px 25px -5px ${data.colorHistoria}10` : '0 20px 25px -5px rgba(0,0,0,0.05)'
              }}
            >
              <h3 className="text-[28px] font-black text-[#1a1a1a] mb-8 flex items-center gap-4 tracking-tight">
                <div className="w-2.5 h-10 rounded-full shadow-sm" style={{ backgroundColor: data.colorHistoria || '#f26522' }} />
                Quiénes Somos
              </h3>
              <div className="text-[17px] md:text-[18px] text-gray-600 font-medium leading-[1.85] whitespace-pre-wrap">
                {data.descripcion || data.historia || 'Agrega la descripción de tu empresa desde el panel administrativo para contarle a tus clientes quiénes son y qué hacen detalladamente.'}
              </div>
            </motion.div>

            {/* Misión y Visión (Stack Lateral) */}
            <div className="xl:col-span-5 flex flex-col gap-6 md:gap-8">
              
              {/* Misión Box */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: 0.1 }} transition={{ delay: 0.4 }}
                className="flex-1 rounded-[32px] p-8 border flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
                style={{
                  background: data.colorMision ? `linear-gradient(to bottom right, #ffffff, ${data.colorMision}15)` : 'linear-gradient(to bottom right, #ffffff, rgba(249, 115, 22, 0.1))',
                  borderColor: data.colorMision ? `${data.colorMision}30` : 'rgba(249, 115, 22, 0.2)',
                  boxShadow: data.colorMision ? `0 20px 25px -5px ${data.colorMision}20` : '0 20px 25px -5px rgba(249, 115, 22, 0.1)'
                }}
              >
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-[40px] pointer-events-none transition-all duration-500 opacity-20 group-hover:opacity-40" style={{ backgroundColor: data.colorMision || '#f97316' }} />
                <div className="w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center mb-6 text-white transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 relative z-10" style={{ background: `linear-gradient(to bottom right, ${data.colorMision || '#f26522'}, ${data.colorMision || '#f97316'})` }}>
                  <Target size={28} strokeWidth={2.5} />
                </div>
                <h3 className="text-[28px] font-black text-gray-900 mb-4 tracking-tight relative z-10">Misión</h3>
                <p className="text-gray-600 font-medium leading-[1.7] text-[16px] relative z-10">
                  {data.mision || 'Escribe la misión de tu empresa para que todos la conozcan.'}
                </p>
              </motion.div>

              {/* Visión Box */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: 0.1 }} transition={{ delay: 0.5 }}
                className="flex-1 rounded-[32px] p-8 border flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
                style={{
                  background: data.colorVision ? `linear-gradient(to bottom right, #ffffff, ${data.colorVision}15)` : 'linear-gradient(to bottom right, #ffffff, rgba(6, 182, 212, 0.15))',
                  borderColor: data.colorVision ? `${data.colorVision}30` : 'rgba(6, 182, 212, 0.2)',
                  boxShadow: data.colorVision ? `0 20px 25px -5px ${data.colorVision}20` : '0 20px 25px -5px rgba(6, 182, 212, 0.1)'
                }}
              >
                <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full blur-[40px] pointer-events-none transition-all duration-500 opacity-20 group-hover:opacity-40" style={{ backgroundColor: data.colorVision || '#00A0C6' }} />
                
                <div className="w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center mb-6 text-white transform group-hover:-rotate-12 group-hover:scale-110 transition-all duration-300 relative z-10" style={{ background: `linear-gradient(to bottom right, ${data.colorVision || '#00A0C6'}, ${data.colorVision || '#00c9f1'})` }}>
                  <Eye size={28} strokeWidth={2.5} />
                </div>
                <h3 className="text-[28px] font-black text-gray-900 mb-4 tracking-tight relative z-10">Visión</h3>
                <p className="text-gray-600 font-medium leading-[1.7] text-[16px] relative z-10">
                  {data.vision || 'Plantea tu visión a futuro y cómo esperas crecer junto con tus clientes.'}
                </p>
              </motion.div>

            </div>
          </div>

          {/* ── Líneas de Productos ── */}
          {data.lineas?.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} transition={{ delay: 0.45 }}
              className="w-full mt-4"
            >
              <h3 className="text-[24px] md:text-[28px] font-black text-[#1a1a1a] mb-6 flex items-center gap-3 tracking-tight">
                <i className="fas fa-star text-[#f26522]"></i>
                Líneas de Productos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {data.lineas.map((l: any, i: number) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ delay: 0.1 * i }}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group flex items-start gap-4"
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                      style={{ background: `${l.color || '#3b82f6'}15` }}
                    >
                      <i 
                        className={`${l.icono || 'fas fa-box'} text-[20px]`}
                        style={{ color: l.color || '#3b82f6' }}
                      ></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[16px] font-black text-[#1a1a1a] tracking-tight">{l.titulo}</h4>
                      {l.desc && <p className="text-[13px] text-gray-500 font-medium mt-1">{l.desc}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Valores Corporativos ── */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} transition={{ delay: 0.5 }}
            className="w-full mt-4"
          >
            <div className="text-center mb-10 md:mb-14">
              <h3 
                className="text-[32px] md:text-[42px] font-black text-[#1a1a1a] tracking-tight"
                style={{ fontFamily: data.valoresTitleFont && data.valoresTitleFont !== 'font-sans' ? data.valoresTitleFont : 'inherit' }}
              >
                Nuestros Valores Corporativos
              </h3>
              <p className="mt-3 text-[16px] md:text-[18px] text-gray-500 font-medium max-w-2xl mx-auto">
                Comprometidos con la excelencia en cada aspecto de nuestro servicio
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {(() => {
                const defaultValores = [
                  { icono: 'fas fa-award', texto: 'Calidad Garantizada', desc: 'Productos seleccionados de las mejores marcas del mercado', color: '#3b82f6' },
                  { icono: 'fas fa-chart-line', texto: 'Mejores Precios', desc: 'Precios competitivos en mayoreo y menudeo', color: '#22c55e' },
                  { icono: 'fas fa-headset', texto: 'Atención Profesional', desc: 'Servicio personalizado y asesoría especializada', color: '#f26522' },
                  { icono: 'fas fa-truck-fast', texto: 'Cobertura Nacional', desc: 'Envíos a toda la República Mexicana', color: '#ef4444' },
                ];
                const items = data.valores?.length > 0 
                  ? data.valores.map((v: any) => ({ ...v, desc: v.desc || '', color: v.color || '#3b82f6' }))
                  : defaultValores;
                return items.map((v: any, i: number) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ delay: 0.15 * i }}
                    className="bg-white rounded-[24px] p-7 md:p-8 shadow-lg shadow-black/[0.03] border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
                  >
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                      style={{ background: `${v.color || '#3b82f6'}15` }}
                    >
                      <i 
                        className={`${v.icono} text-[22px]`} 
                        style={{ color: v.color || '#3b82f6' }}
                      ></i>
                    </div>
                    <h4 className="text-[17px] font-black text-[#1a1a1a] mb-2 tracking-tight">
                      {v.texto}
                    </h4>
                    {v.desc && (
                      <p className="text-[14px] text-gray-500 font-medium leading-relaxed">
                        {v.desc}
                      </p>
                    )}
                  </motion.div>
                ));
              })()}
            </div>
          </motion.div>

          {/* ── Nuestro Compromiso (Dark Banner) ── */}
          {(data.compromisoTitulo || data.compromisoTexto) && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }} transition={{ delay: 0.6 }}
              className="w-full bg-gradient-to-br from-[#0d1b2a] to-[#1b2d45] rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden text-white mt-4"
            >
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay pointer-events-none" />
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="relative z-10">
                <h3 className="text-[28px] md:text-[36px] font-black mb-5 flex items-center gap-4 tracking-tight">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-shield-halved text-[20px] text-white/80"></i>
                  </div>
                  {data.compromisoTitulo || 'Nuestro Compromiso'}
                </h3>
                {data.compromisoTexto && (
                  <p className="text-[17px] md:text-[19px] text-white/70 font-medium leading-[1.8] max-w-4xl whitespace-pre-wrap">
                    {data.compromisoTexto}
                  </p>
                )}
                {data.compromisoTags?.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-8">
                    {data.compromisoTags.map((tag: string, i: number) => (
                      <span key={i} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 text-white/90 text-[13px] font-bold px-4 py-2 rounded-full">
                        <i className="fas fa-circle-check text-green-400 text-[12px]"></i>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Contacto ── */}
          {(data.telefono || data.email || data.instagram || data.facebook) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.7 }}
              className="w-full bg-gradient-to-br from-[#00A0C6] to-[#007b99] rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden text-white mt-4"
            >
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.25] mix-blend-overlay pointer-events-none" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[60px] pointer-events-none" />
              
              <h3 className="text-[22px] font-black mb-8 relative z-10 flex items-center gap-3">
                <div className="w-2 h-6 bg-[#f26522] rounded-full shadow-sm" />
                Conecta con nosotros
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                {data.telefono && (
                  <a href={`https://wa.me/52${data.telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-white/10 hover:bg-white/20 p-4 rounded-2xl border border-white/10 transition-colors backdrop-blur-sm group">
                    <div className="w-10 h-10 rounded-full bg-white text-[#00A0C6] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Phone size={18} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">WhatsApp</span>
                      <span className="font-bold text-[14px] truncate tracking-wide">{data.telefono}</span>
                    </div>
                  </a>
                )}
                {data.email && (
                  <a href={`mailto:${data.email}`} className="flex items-center gap-4 bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 transition-colors backdrop-blur-sm group">
                    <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Mail size={18} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Email</span>
                      <span className="font-bold text-[13px] truncate">{data.email}</span>
                    </div>
                  </a>
                )}
                {data.instagram && (
                  <a href={data.instagram.includes('http') ? data.instagram : `https://instagram.com/${data.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 transition-colors backdrop-blur-sm group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <i className="fab fa-instagram text-lg"></i>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Instagram</span>
                      <span className="font-bold text-[13px] truncate">@{data.instagram.replace('https://instagram.com/', '').replace('@','')}</span>
                    </div>
                  </a>
                )}
                {data.facebook && (
                  <a href={data.facebook.includes('http') ? data.facebook : `https://facebook.com/${data.facebook.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 transition-colors backdrop-blur-sm group">
                    <div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <i className="fab fa-facebook-f text-lg"></i>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Facebook</span>
                      <span className="font-bold text-[13px] truncate">@{data.facebook.replace('https://facebook.com/', '').replace('@','')}</span>
                    </div>
                  </a>
                )}
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </section>
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
  const [activeVariant, setActiveVariant] = useState<{ name: string, imageUrl: string, sku?: string, description?: string } | null>(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const [detailQtyPzas, setDetailQtyPzas] = useState(1);
  const [detailQtyCajas, setDetailQtyCajas] = useState(0);

  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [nosotrosData, setNosotrosData] = useState<any>(null);

  useGSAP(() => {
    if (loading) return; // Esperar a que cargue todo

    // Animación de Header y Hero
    gsap.from('.gsap-header', { y: -50, opacity: 0, duration: 1.2, ease: 'power4.out' });
    gsap.from('.gsap-hero', { opacity: 0, scale: 0.92, duration: 1.5, delay: 0.1, ease: 'expo.out' });

    // Animación Flotante infinita
    gsap.to('.gsap-float', { y: -8, duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1 });

    // Animación de Categorías — Pop-in escalonado ultra premium
    if (document.querySelector('.gsap-categories-wrapper')) {
      const pills = document.querySelectorAll('.gsap-category-pill');
      const circles = document.querySelectorAll('.cat-circle');

      // Estado inicial: invisible, abajo, pequeño
      gsap.set(pills, { opacity: 0, y: 80, scale: 0.4, rotation: -12 });

      // Entrada: pop con bounce, escalonado
      const tl = gsap.timeline({
        scrollTrigger: { trigger: '.gsap-categories-wrapper', start: 'top 85%', once: true }
      });
      tl.to(pills, {
        opacity: 1, y: 0, scale: 1, rotation: 0,
        stagger: { each: 0.09, from: 'start', ease: 'power1.inOut' },
        duration: 0.7,
        ease: 'back.out(1.8)'
      });

      // Pulso suave después de que cada círculo aparece (efecto "latido")
      circles.forEach((circle, i) => {
        gsap.to(circle, {
          scale: 1.05,
          duration: 1.6,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: 0.7 + i * 0.12
        });
      });

      // Hover: escala premium con GSAP
      pills.forEach((pill) => {
        const circle = pill.querySelector('.cat-circle') as HTMLElement | null;
        if (!circle) return;
        pill.addEventListener('mouseenter', () => {
          gsap.killTweensOf(circle); // pausa el pulso
          gsap.to(circle, { scale: 1.18, duration: 0.22, ease: 'back.out(2)' });
        });
        pill.addEventListener('mouseleave', () => {
          gsap.to(circle, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.inOut',
            onComplete: () => {
              // Reanuda pulso suave
              gsap.to(circle, { scale: 1.05, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
            }
          });
        });
      });
    }

    // Secciones que aparecen suavemente
    gsap.utils.toArray('.gsap-section').forEach((sec: any) => {
      gsap.from(sec, {
        scrollTrigger: { trigger: sec, start: 'top 85%' },
        opacity: 0,
        y: 50,
        duration: 1,
        ease: 'power3.out'
      });
    });

    // "Destacados" / Scroll horizontal items staggered
    gsap.utils.toArray('.gsap-horizontal-scroll').forEach((scrollContainer: any) => {
      const items = scrollContainer.querySelectorAll('.snap-start');
      if(items.length > 0) {
        gsap.from(items, {
          scrollTrigger: { trigger: scrollContainer, start: 'top 85%' },
          opacity: 0,
          x: 50,
          stagger: 0.1,
          duration: 0.8,
          ease: 'power3.out'
        });
      }
    });

    // Gran Botón de "Explorar Todo"
    if (document.querySelector('.gsap-big-btn')) {
      gsap.from('.gsap-big-btn', {
        scrollTrigger: { trigger: '.gsap-big-btn', start: 'top 90%' },
        opacity: 0,
        scale: 0.9,
        rotationX: -20,
        transformPerspective: 500,
        duration: 1,
        ease: 'back.out(1.7)'
      });
    }

  }, { dependencies: [loading, categories, products], revertOnUpdate: true });

  useEffect(() => {
    setActiveVariant(null);
    setDetailImageIndex(0);
    setDetailQtyPzas(1);
    setDetailQtyCajas(0);
  }, [selectedProductForDetail?.id]);


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
  const [userHasPrecioEspecial, setUserHasPrecioEspecial] = useState(false);

  const [generatingOrderPDF, setGeneratingOrderPDF] = useState(false);


  // Filtering & Sorting State
  const [sortBy, setSortBy] = useState('Destacados');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortAnchorRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number; width: number } | null>(null);

  // Calcular posición del dropdown cuando se abre
  useEffect(() => {
    if (!sortDropdownOpen || !sortAnchorRef.current) { setDropdownPos(null); return; }
    const calc = () => {
      if (!sortAnchorRef.current) return;
      const rect = sortAnchorRef.current.getBoundingClientRect();
      const W = 260;
      const maxH = Math.min(320, window.innerHeight - 60);
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const openUp = spaceBelow < 200 && rect.top > 200;
      setDropdownPos({
        top: openUp ? rect.top - maxH - 4 : rect.bottom + 4,
        right: Math.max(8, window.innerWidth - rect.right),
        width: Math.max(W, rect.width),
      });
    };
    calc();
  }, [sortDropdownOpen]);

  // Cerrar dropdown al hacer scroll (comportamiento estándar)
  useEffect(() => {
    if (!sortDropdownOpen) return;
    const close = () => setSortDropdownOpen(false);
    window.addEventListener('scroll', close, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', close, { capture: true });
  }, [sortDropdownOpen]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterAvailability, setFilterAvailability] = useState<{ available: boolean, unavailable: boolean }>({ available: false, unavailable: false });
  const [priceRange, setPriceRange] = useState<number>(2000);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [leftMenuOpen, setLeftMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'home' | 'ubicaciones' | 'nosotros'>('home');
  const [activeSections, setActiveSections] = useState<string[]>([]);
  const [displayCount, setDisplayCount] = useState(24);
  const [catalogButtonEnabled, setCatalogButtonEnabled] = useState(false);
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const CATALOG_PAGE_SIZE = 24;

  const { user, logout } = useAuth();

  // Cargar si el usuario actual tiene precio especial habilitado
  useEffect(() => {
    if (!user) { setUserHasPrecioEspecial(false); return; }
    import('firebase/firestore').then(({ getDoc, doc }) => {
      getDoc(doc(DB, 'clientes', user.uid)).then(snap => {
        if (snap.exists()) {
          setUserHasPrecioEspecial(!!snap.data().precioEspecial);
        } else {
          setUserHasPrecioEspecial(false);
        }
      }).catch(() => setUserHasPrecioEspecial(false));
    });
  }, [user]);

  // Cargar Ubicaciones y Configuración de Empresa
  useEffect(() => {
    import('firebase/firestore').then(({ getDocs, collection, onSnapshot, doc }) => {
      // Ubicaciones
      onSnapshot(collection(DB, 'ubicaciones'), (snap) => {
        setUbicaciones(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      // Nosotros
      onSnapshot(doc(DB, 'config', 'nosotros'), (snap) => {
        if (snap.exists()) setNosotrosData(snap.data());
      });
    });
  }, []);

  const { cart, cartCount, cartTotal, updateQuantity, removeFromCart,
    addToCart, calcItemPrice, clearCart } = useCart();

  const generateOrderPDF = async (order: any, shouldUpload: boolean = false, skipImages: boolean = false): Promise<{ url: string | null; blob: Blob | null }> => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const pdfDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

      // ── Colores del diseño minimalista ────────────────────────────────
      const ACCENT = { r: 255, g: 127, b: 0 }; // naranja marca
      const GRAY_DARK = { r: 40, g: 40, b: 40 };
      const GRAY_MID = { r: 120, g: 120, b: 120 };
      const GRAY_LIGHT = { r: 200, g: 200, b: 200 };

      // ── Cargar logo (solo si no estamos en modo rápido) ───────────────
      let pdfLogoB64: string | null = null;
      if (!skipImages) {
        // Primero intentamos logo desde Cloudinary (porque nos permite redimensionarlo y optimizarlo)
        if (logoUrl) {
          try {
            const optimizedUrl = cldOpt(logoUrl, 300).replace('f_auto', 'f_jpg').replace('q_auto:best', 'q_auto:low');
            const r = await fetch(optimizedUrl);
            if (r.ok) {
              const blob = await r.blob();
              pdfLogoB64 = await new Promise<string>(resolve => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
            }
          } catch { }
        }

        // Fallback al logo local si no hay de Cloudinary
        if (!pdfLogoB64) {
          try {
            const r = await fetch('/logo-altos.png');
            if (r.ok) {
              const blob = await r.blob();
              pdfLogoB64 = await new Promise<string>(resolve => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
            }
          } catch { }
        }
      }

      // ── Cargar imágenes de productos (solo si no estamos en modo rápido) ─
      const imagesMap = new Map<string, string>();
      if (!skipImages) {
        await Promise.all(order.items.map(async (item: any) => {
          if (!item.imageUrl) return;
          try {
            const url = cldOpt(item.imageUrl, 120).replace('f_auto', 'f_jpg').replace('q_auto:best', 'q_auto:low');
            const r = await fetch(url);
            if (!r.ok) return;
            const blob = await r.blob();
            const b64 = await new Promise<string>(resolve => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            imagesMap.set(item.imageUrl, b64);
          } catch { }
        }));
      }

      // ── FONDO blanco limpio ──────────────────────────────────────────
      pdfDoc.setFillColor(255, 255, 255);
      pdfDoc.rect(0, 0, 210, 297, 'F');

      // ── Línea de acento superior (naranja, fina) ─────────────────────
      pdfDoc.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b);
      pdfDoc.rect(0, 0, 210, 1.5, 'F');

      // ── HEADER minimalista ───────────────────────────────────────────
      const headerY = 12;
      if (pdfLogoB64) {
        try {
          pdfDoc.addImage(pdfLogoB64, 'JPEG', 15, headerY, 24, 20, undefined, 'FAST');
        } catch (e) {
          // Fallback a PNG si falló como JPEG
          try { pdfDoc.addImage(pdfLogoB64, 'PNG', 15, headerY, 24, 20, undefined, 'FAST'); } catch (e2) {}
        }
      }

      // @ts-ignore
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.setTextColor(GRAY_DARK.r, GRAY_DARK.g, GRAY_DARK.b);
      pdfDoc.setFontSize(14);
      pdfDoc.text('Comprobante de Pedido', 45, headerY + 8);

      // @ts-ignore
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(GRAY_MID.r, GRAY_MID.g, GRAY_MID.b);
      pdfDoc.text('Articulos Redituables Altos', 45, headerY + 14);

      // Pedido ID y Fecha — alineados a la derecha
      // @ts-ignore
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.setFontSize(9);
      pdfDoc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b);
      pdfDoc.text(`#${order.id?.slice(-8).toUpperCase() || 'NUEVO'}`, 198, headerY + 6, { align: 'right' });

      // @ts-ignore
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.setFontSize(7.5);
      pdfDoc.setTextColor(GRAY_MID.r, GRAY_MID.g, GRAY_MID.b);
      pdfDoc.text(new Date(order.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }), 198, headerY + 12, { align: 'right' });

      // ── Separador fino ───────────────────────────────────────────────
      pdfDoc.setDrawColor(GRAY_LIGHT.r, GRAY_LIGHT.g, GRAY_LIGHT.b);
      pdfDoc.setLineWidth(0.3);
      pdfDoc.line(15, 38, 195, 38);

      // ── Info del cliente ─────────────────────────────────────────────
      // @ts-ignore
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.setFontSize(7.5);
      pdfDoc.setTextColor(GRAY_MID.r, GRAY_MID.g, GRAY_MID.b);
      pdfDoc.text('CLIENTE', 15, 44);

      // @ts-ignore
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.setFontSize(10);
      pdfDoc.setTextColor(GRAY_DARK.r, GRAY_DARK.g, GRAY_DARK.b);
      pdfDoc.text(order.userName || 'Cliente', 15, 50);

      if (order.requiereFactura) {
        // @ts-ignore
        pdfDoc.setFont('helvetica', 'bold');
        pdfDoc.setFontSize(7.5);
        pdfDoc.setTextColor(0, 112, 200);
        pdfDoc.text('REQUIERE FACTURA', 198, 50, { align: 'right' });
      }

      // ── TABLA de productos ───────────────────────────────────────────
      const tableBody = order.items.map((item: any) => {
        // Formatear el nombre para que las opciones extra / variantes destaquen más detalladas
        const detailedName = item.name.split(' | ').join('\n • ').split(' — ').join('\n • ');
        return [
          { content: '', styles: { cellPadding: 1.5 } },
          detailedName,
          item.sku || '-',
          item.quantity.toString(),
          `$${item.price.toFixed(2)}`,
          `$${(item.price * item.quantity).toFixed(2)}`,
          imagesMap.get(item.imageUrl || '') || null
        ];
      });

      autoTable(pdfDoc, {
        startY: 56,
        head: [['', 'Producto', 'SKU', 'Cant.', 'Precio', 'Subtotal']],
        body: tableBody.map((row: any) => row.slice(0, 6)),
        columnStyles: {
          0: { cellWidth: 16 },
          1: { cellWidth: 72 },
          2: { cellWidth: 22 },
          3: { cellWidth: 16, halign: 'center' },
          4: { cellWidth: 26, halign: 'right' },
          5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
        },
        headStyles: {
          fillColor: [250, 250, 250],
          textColor: [GRAY_MID.r, GRAY_MID.g, GRAY_MID.b],
          fontSize: 7,
          fontStyle: 'bold',
          lineColor: [GRAY_LIGHT.r, GRAY_LIGHT.g, GRAY_LIGHT.b],
          lineWidth: 0.2
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 5,
          textColor: [GRAY_DARK.r, GRAY_DARK.g, GRAY_DARK.b],
          lineColor: [240, 240, 240],
          lineWidth: 0.1
        },
        alternateRowStyles: { fillColor: [252, 252, 252] },
        margin: { left: 15, right: 15 },
        didDrawCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 0) {
            const imgB64 = tableBody[data.row.index]?.[6];
            if (imgB64) {
              try {
                pdfDoc.addImage(imgB64, 'JPEG', data.cell.x + 1, data.cell.y + 1, 12, 12, undefined, 'FAST');
              } catch (e) {
                // Ignore if it fails to add image natively
              }
            }
          }
        }
      });

      // ── TOTAL minimalista ────────────────────────────────────────────
      // @ts-ignore
      const finalY = (pdfDoc as any).lastAutoTable?.finalY || 200;

      pdfDoc.setDrawColor(GRAY_LIGHT.r, GRAY_LIGHT.g, GRAY_LIGHT.b);
      pdfDoc.setLineWidth(0.3);
      pdfDoc.line(120, finalY + 6, 195, finalY + 6);

      // @ts-ignore
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.setFontSize(9);
      pdfDoc.setTextColor(GRAY_MID.r, GRAY_MID.g, GRAY_MID.b);
      pdfDoc.text('TOTAL', 125, finalY + 14);

      // @ts-ignore
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.setFontSize(16);
      pdfDoc.setTextColor(GRAY_DARK.r, GRAY_DARK.g, GRAY_DARK.b);
      pdfDoc.text(`$${order.total.toFixed(2)}`, 195, finalY + 14, { align: 'right' });

      // @ts-ignore
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(GRAY_MID.r, GRAY_MID.g, GRAY_MID.b);
      pdfDoc.text('MXN', 195, finalY + 20, { align: 'right' });

      // ── FOOTER minimalista ───────────────────────────────────────────
      pdfDoc.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b);
      pdfDoc.rect(0, 289, 210, 1, 'F');

      pdfDoc.setTextColor(GRAY_LIGHT.r, GRAY_LIGHT.g, GRAY_LIGHT.b);
      // @ts-ignore
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.setFontSize(6.5);
      pdfDoc.text('Articulos Redituables Altos  -  WhatsApp: +52 55 7217 7485  -  Comprobante de pedido', 105, 286, { align: 'center' });

      const fileName = `Pedido_Altos_${order.id?.slice(-8).toUpperCase() || Date.now().toString().slice(-6)}.pdf`;
      if (shouldUpload && order.id) {
        try {
          const pdfDataUri = pdfDoc.output('datauristring');
          await updateDoc(doc(DB, 'pedidos', order.id), { pdfBase64: pdfDataUri });
          return { url: `${window.location.origin}/pedido-pdf?id=${order.id}`, blob: pdfDoc.output('blob') };
        } catch (err) {
          console.error('Error guardando PDF en Firestore:', err);
          return { url: null, blob: pdfDoc.output('blob') };
        }
      }

      pdfDoc.save(fileName);
      return { url: null, blob: null };
    } catch (e) {
      console.error('Error generating PDF:', e);
      return { url: null, blob: null };
    }
  };

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
          getDocs(collection(DB, 'productos')),
          getDocs(query(collection(DB, 'heroCarousel'), orderBy('order', 'asc'))),
          getDocs(query(collection(DB, 'categorias'), orderBy('order', 'asc'))),
          getDoc(doc(DB, 'config', 'branding')),
          getDoc(doc(DB, 'config', 'theme')),
          getDoc(doc(DB, 'config', 'secciones')),
          getDoc(doc(DB, 'config', 'bodySection')),
          getDoc(doc(DB, 'config', 'preFooter')),
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
          setCatalogButtonEnabled(data.catalogButtonEnabled === true);
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
        const vSnap = await getDoc(doc(db as any, 'settings', 'storeDesign'));
        if (vSnap.exists()) {
          setVisualSettings(vSnap.data());
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  // Handle direct order link (?pedido=ID)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('pedido');
    if (orderId) {
      import('firebase/firestore').then(async ({ getDoc, doc }) => {
        try {
          const snap = await getDoc(doc(db as any, 'pedidos', orderId));
          if (snap.exists()) {
            const o = { id: snap.id, ...snap.data() };
            setUserOrders([o]);
            setOrdersModalOpen(true);
            window.history.replaceState({}, '', window.location.pathname);
          }
        } catch (e) {
          console.error('Error loading order from URL:', e);
        }
      });
    }
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
    }, 2500);
    return () => clearInterval(timer);
  }, [visualSettings?.sliders?.annTexts]);

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
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
        { r: 0, g: 188, b: 212 },  // cyan
        { r: 233, g: 30, b: 99 },  // pink
        { r: 76, g: 175, b: 80 },  // green
        { r: 255, g: 193, b: 7 },  // yellow/gold
        { r: 103, g: 58, b: 183 },  // purple
        { r: 3, g: 169, b: 244 },  // light blue
        { r: 244, g: 67, b: 54 },  // red
        { r: 0, g: 150, b: 136 },  // teal
        { r: 30, g: 30, b: 30 },  // near-black
      ];

      // Función para dibujar franjas verticales de colores
      const drawVerticalStripes = (x: number, y: number, totalW: number, h: number) => {
        const stripeW = totalW / COLORS.length;
        COLORS.forEach((c, i) => {
          doc.setFillColor(c.r, c.g, c.b);
          doc.rect(x + i * stripeW, y, stripeW, h, 'F');
        });
      };

      // ── Descargar imágenes de productos y variantes ─────────────────────────────
      const imagesMap = new Map<string, string>();
      const allUrls = products.flatMap(p => {
        const urls = [p.imageUrl];
        if (p.variants && p.variants.length > 0) {
          urls.push(...p.variants.map(v => v.imageUrl));
        }
        return urls;
      }).filter(Boolean);

      const uniqueUrls = Array.from(new Set(allUrls));
      await Promise.all(uniqueUrls.map(async url => {
        try {
          // Usar resolución mayor 800px para evitar imágenes borrosas y forzar f_jpg (jsPDF no soporta WebP)
          const urlStr = cldOpt(url, 800).replace('f_auto', 'f_jpg');
          const res = await fetch(urlStr);
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

      // ── Agrupar por categoría (incluyendo variantes) ────────────────────────
      const categoriesMap = new Map<string, any[]>();
      products.forEach(p => {
        const cat = p.category || 'General';
        if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);

        // Siempre cargar el producto original
        categoriesMap.get(cat)!.push({
          name: p.name,
          sku: p.sku,
          imageUrl: p.imageUrl,
          precioIndividual: p.precioIndividual,
          precioMayoreo: p.precioMayoreo,
          precioCaja: p.precioCaja,
          minMayoreo: p.minMayoreo,
          minCaja: p.minCaja,
        });

        // Adicionalmente, si tiene variantes, listarlas también
        if (p.variants && p.variants.length > 0) {
          p.variants.forEach((v: any) => {
            categoriesMap.get(cat)!.push({
              name: v.name ? `${p.name} - ${v.name}` : p.name,
              sku: v.sku || p.sku,
              imageUrl: v.imageUrl || p.imageUrl,
              precioIndividual: p.precioIndividual,
              precioMayoreo: p.precioMayoreo,
              precioCaja: p.precioCaja,
              minMayoreo: p.minMayoreo,
              minCaja: p.minCaja,
            });
          });
        }
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
            // Fondo blanco limpio para la imagen
            doc.setFillColor(255, 255, 255);
            doc.rect(imgX, imgY, IMG_SIZE, IMG_SIZE, 'F');
            try {
              doc.addImage(b64, 'JPEG', imgX, imgY, IMG_SIZE, IMG_SIZE, undefined, 'FAST');
            } catch (e) { }
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
          doc.text(titleLines, textX + textBlockW / 2, imgY + 12, { align: 'center' });

          let py = imgY + 12 + titleHeight;

          // SKUs o Subtítulo
          doc.setTextColor(0, 0, 0);
          // @ts-ignore
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          if (prod.sku) {
            py += 2;
            doc.text(`SKU: ${prod.sku}`, textX + textBlockW / 2, py, { align: 'center' });
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

      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Catalogo_Altos.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'Alfabéticamente, Z-A':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'Precio Más Bajo Al Más Alto':
        result.sort((a, b) => a.precioIndividual - b.precioIndividual);
        break;
      case 'Precio Más Alto Al Más Bajo':
        result.sort((a, b) => b.precioIndividual - a.precioIndividual);
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

    let facturacionText = '';
    if (requiereFactura) {
      const docSnap = await getDoc(doc(DB, 'clientes', user.uid));
      const factData = docSnap.exists() ? docSnap.data().facturacion : null;

      if (!factData || !factData.rfc) {
        setCartOpen(false);
        setFacturacionModalOpen(true);
        return;
      }
      facturacionText = `\n\n--- DATOS DE FACTURACION ---\nRFC: ${factData.rfc}\nRazon Social: ${factData.razonSocial}\nCP: ${factData.cp}\nUso CFDI: ${factData.usoCfdi}\n\nPor favor adjunta tu Constancia de Situacion Fiscal actualizada.`;
    }

    const orderItems = cart.map(item => {
      const price = calcItemPrice(item);
      const finalName = item.selectedVariant ? `${item.name} — ${item.selectedVariant.name}` : item.name;
      const finalImageUrl = item.selectedVariant?.imageUrl || item.imageUrl;

      return {
        id: item.id,
        name: finalName,
        sku: item.selectedVariant?.sku || item.sku || '',
        quantity: item.quantity,
        price: price,
        imageUrl: finalImageUrl
      };
    });

    // Save to Firestore
    let orderId = '';
    const orderData = {
      userId: user.uid,
      userName: user.displayName || user.email || user.phoneNumber,
      items: orderItems,
      total: cartTotal,
      requiereFactura,
      status: 'Pendiente',
      createdAt: new Date().toISOString()
    };

    try {
      const orderRef = await addDoc(collection(DB, 'pedidos'), orderData);
      orderId = orderRef.id;
    } catch (err) {
      console.error("Error saving order:", err);
    }

    // Generar PDF CON imágenes y subirlo para obtener el link
    setGeneratingOrderPDF(true);
    const pdfResult = await generateOrderPDF({ ...orderData, id: orderId }, true, false);
    setGeneratingOrderPDF(false);

    // Construir mensaje de texto del pedido
    const fechaPedido = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    let msg = `NUEVO PEDIDO - ARTICULOS REDITUABLES ALTOS\n\n`;
    msg += `Cliente: ${orderData.userName || 'Sin nombre'}\n`;
    msg += `Pedido: #${orderId ? orderId.slice(-6).toUpperCase() : 'N/A'}\n`;
    msg += `Fecha: ${fechaPedido}\n`;
    if (requiereFactura) {
      msg += `Requiere Factura: Si\n`;
    }
    msg += `\nPRODUCTOS:\n\n`;

    orderItems.forEach((item, idx) => {
      const subtotal = (item.price * item.quantity).toFixed(2);
      msg += `${idx + 1}. ${item.name}\n`;
      if (item.sku) msg += `   SKU: ${item.sku}\n`;
      msg += `   Cant: ${item.quantity} pza(s)\n`;
      msg += `   Precio: $${item.price.toFixed(2)}\n`;
      msg += `   Subtotal: $${subtotal}\n\n`;
    });

    msg += `TOTAL: $${cartTotal.toFixed(2)} MXN\n\n`;

    if (pdfResult.url) {
      msg += `PDF del pedido: ${pdfResult.url}\n\n`;
    } else if (orderId) {
      msg += `Enlace del pedido: ${window.location.origin}/?pedido=${orderId}\n\n`;
    }

    msg += `Hola, me gustaria realizar este pedido.${facturacionText}`;

    // Abrir WhatsApp con el link del PDF incluido
    clearCart();
    window.open(`https://wa.me/525572177485?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col gsap-container">


      {/* ── HEADER WRAPPER COMPLETO (Sticky & Unified Color) ─── */}
      <div className="sticky top-0 left-0 right-0 z-[60] flex flex-col w-full shadow-sm transition-all duration-300 gsap-header"
        style={{ background: visualSettings?.colors?.annBarBg || 'var(--bw-teal)' }}>

        {/* ── ANNOUNCEMENT BAR — Betterware style ─── */}
        {!visualSettings?.toggles?.hideTopBanner && (
          <div className="relative z-10 flex items-center justify-center px-4 overflow-hidden w-full"
            style={{
              height: visualSettings?.sliders?.annBarHeight ? `${visualSettings.sliders.annBarHeight}px` : '22.5px'
            }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={annIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="text-center w-full uppercase font-bold text-white"
                style={{
                  fontSize: visualSettings?.sliders?.annBarFontSize ? `${visualSettings.sliders.annBarFontSize}px` : '10px',
                  letterSpacing: '1px'
                }}
              >
                {visualSettings?.sliders?.annTexts?.split('\n').filter(Boolean)?.[annIndex] || 'DESCUBRE LOS MEJORES ARTÍCULOS PARA TU NEGOCIO'}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* ── HEADER PRINCIPAL ─── */}
        <header className="relative z-10 w-full flex-shrink-0">

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* ── Van Gogh — Orilla IZQUIERDA (solo desktop) ── */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/vangogh-left.jpg"
              alt=""
              aria-hidden="true"
              className="hidden md:block absolute left-0 top-0 h-full w-auto max-w-[240px] object-cover object-left opacity-100 z-0"
              style={{ mixBlendMode: 'screen' }}
            />

            {/* ── Van Gogh — Orilla DERECHA (solo desktop) ── */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/vangogh-right.jpg"
              alt=""
              aria-hidden="true"
              className="hidden md:block absolute right-0 top-0 h-full w-auto max-w-[240px] object-cover object-right opacity-100 z-0"
              style={{ mixBlendMode: 'screen', transform: 'scaleX(-1)' }}
            />
          </div>

          <div className="flex items-center justify-between px-4 md:px-10 h-[75px] max-w-screen-xl mx-auto w-full relative z-10">

            {/* Menú y Logo */}
            <div className="flex items-center gap-3 md:gap-4">
              {/* Botón menú lateral */}
              <button
                onClick={() => setLeftMenuOpen(true)}
                className="text-white/90 hover:text-white transition flex-shrink-0"
              >
                <Menu size={28} strokeWidth={1.5} />
              </button>

              {/* Logo prominente */}
              <div 
                className="flex items-center flex-shrink-0 ml-1 cursor-pointer"
                onClick={() => { setViewMode('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cldOpt(logoUrl, 300) || '/logo.jpg'}
                  alt="Logo"
                  className="h-[64px] sm:h-[72px] w-auto object-contain py-1.5 drop-shadow-sm"
                />
              </div>
            </div>

            {/* User + Cart buttons + Facturación*/}
            <div className="flex items-center gap-3.5 md:gap-5 flex-shrink-0">
              {/* Link de Facturación minimalista */}
              <button
                onClick={() => {
                  if (!user) {
                    setAuthModalOpen(true);
                  } else {
                    setFacturacionModalOpen(true);
                  }
                }}
                className="text-[10px] md:text-[11px] font-black tracking-[0.15em] text-white/80 hover:text-white transition-all uppercase pt-1 hidden sm:block mr-3"
              >
                Facturación
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
                      <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-[26px] h-[26px] rounded-full object-cover border-2 border-white/40" />
                    ) : (
                      <div className="w-[26px] h-[26px] rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-[10px] font-black uppercase text-white">
                        {user.displayName?.[0] || user.email?.[0] || 'U'}
                      </div>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="text-white/80 transition-all hover:text-white"
                  title="Entrar"
                >
                  <User size={26} strokeWidth={1.5} />
                </button>
              )}

              {/* Cart / Bag outline */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative text-white/80 transition-all hover:text-white"
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

          {/* Search Row — Clean & Centered */}
          <div className="w-full px-4 md:px-10 pb-3 pt-0 transition-all">
            <div className="max-w-screen-xl mx-auto w-full">
              <div className="flex items-center border border-white/20 rounded-[24px] px-3.5 py-1.5 bg-white/90 backdrop-blur-sm overflow-hidden focus-within:bg-white focus-within:border-white/40 transition-all h-[42px]">
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
          </div>
        </header>
      </div>

      {viewMode === 'home' && visualSettings?.toggles?.showAviso && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 min-h-[70vh] w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="w-full max-w-screen-lg"
          >
            <style>{`
                  @keyframes avisoFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
                  @keyframes avisoSpin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
                  @keyframes avisoBar   { from{width:0%} to{width:78%} }
                  @keyframes avParticle { 0%{transform:translateY(0) scale(1);opacity:.7} 100%{transform:translateY(-80px) scale(0);opacity:0} }
                  @keyframes avGlow { 0%,100%{box-shadow:0 0 40px rgba(249,115,22,.35)} 50%{box-shadow:0 0 80px rgba(239,68,68,.5)} }
            `}</style>
            <div
                  className="relative w-full overflow-hidden rounded-[28px] md:rounded-[36px]"
                  style={{
                    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 45%, #24243e 100%)',
                    animation: 'avGlow 3s ease-in-out infinite',
                  }}
                >
                  {/* ── Partículas flotantes decorativas ── */}
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        width: `${8 + (i % 3) * 6}px`,
                        height: `${8 + (i % 3) * 6}px`,
                        background: i % 2 === 0 ? '#f97316' : '#ef4444',
                        left: `${10 + i * 11}%`,
                        bottom: `${10 + (i % 4) * 15}px`,
                        opacity: 0,
                        animation: `avParticle ${2 + i * 0.4}s ease-out infinite`,
                        animationDelay: `${i * 0.3}s`,
                      }}
                    />
                  ))}

                  {/* ── Orbes de fondo ── */}
                  <div className="absolute top-[-40%] left-[-10%] w-[280px] h-[280px] rounded-full bg-orange-500/10 blur-[60px] pointer-events-none" />
                  <div className="absolute bottom-[-40%] right-[-5%] w-[220px] h-[220px] rounded-full bg-red-500/10 blur-[50px] pointer-events-none" />

                  {/* ── Rueda dentada decorativa (SVG) ── */}
                  <div
                    className="hidden md:block absolute right-10 top-1/2 -translate-y-1/2 opacity-10"
                    style={{ animation: 'avisoSpin 12s linear infinite' }}
                  >
                    <svg width="130" height="130" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.8">
                      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
                    </svg>
                  </div>

                  {/* ── Contenido principal ── */}
                  <div className="relative z-10 px-6 md:px-12 py-10 md:py-14 flex flex-col md:flex-row items-center gap-8 md:gap-12">

                    {/* Ícono animado */}
                    <div
                      className="flex-shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-3xl flex items-center justify-center text-5xl md:text-6xl shadow-xl border border-white/10"
                      style={{
                        background: 'linear-gradient(135deg, rgba(249,115,22,.25), rgba(239,68,68,.2))',
                        animation: 'avisoFloat 3s ease-in-out infinite',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      🛠️
                    </div>

                    {/* Texto y barra de progreso */}
                    <div className="flex-1 text-center md:text-left">
                      <span className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-400/30 text-orange-300 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-4">
                        <span className="w-2 h-2 bg-orange-400 rounded-full" style={{ animation: 'avParticle 1s ease-in-out infinite alternate, avisoFloat 1s ease-in-out infinite' }} />
                        En Desarrollo
                      </span>

                      <h2 className="text-white font-black text-[22px] sm:text-[28px] md:text-[34px] leading-tight tracking-tight mb-3">
                        {visualSettings?.sliders?.avisoTexto
                          ? visualSettings.sliders.avisoTexto
                          : <>
                              Página <span className="text-orange-400">en Construcción</span><br />
                              <span className="text-white/60 text-[16px] font-semibold">Estamos trabajando para ti</span>
                            </>}
                      </h2>

                      <p className="text-white/50 text-[14px] font-medium mb-6 max-w-lg">
                        El catálogo se encuentra temporalmente deshabilitado mientras realizamos mejoras en nuestra plataforma. Agradecemos tu paciencia. ¡Volveremos pronto!
                      </p>

                      {/* Barra de progreso animada */}
                      <div className="max-w-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Progreso</span>
                          <span className="text-[11px] font-black text-orange-400">78%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              background: 'linear-gradient(90deg, #f97316, #ef4444)',
                              width: '78%',
                              animation: 'avisoBar 2s cubic-bezier(0.4,0,0.2,1) forwards',
                              boxShadow: '0 0 12px rgba(249,115,22,.6)',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
            </div>
          </motion.div>
        </div>
      )}

      {viewMode === 'home' && !visualSettings?.toggles?.showAviso && (
        <>
      {/* ── HERO ──────────────────────────────────── */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="pt-2 md:pt-4 bg-white px-4 md:px-10 pb-4 gsap-hero"
      >
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
              onCtaClick={async (url) => {
                if (url === '#catalogo') {
                  const el = document.getElementById('catalogo');
                  if (el) {
                    const offset = 80;
                    const bodyRect = document.body.getBoundingClientRect().top;
                    const elementRect = el.getBoundingClientRect().top;
                    const elementPosition = elementRect - bodyRect;
                    const offsetPosition = elementPosition - offset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                  }
                } else if (url === '#descargar-pdf') {
                  if (window.confirm('¿Deseas generar y descargar el catálogo en formato PDF? (Puede tomar unos segundos)')) {
                    handleDownloadPDF();
                  }
                } else if (url === '#facturacion') {
                  if (!user) setAuthModalOpen(true);
                  else setFacturacionModalOpen(true);
                } else if (url === '#perfil') {
                  if (!user) setAuthModalOpen(true);
                  else setUserMenuOpen(true);
                } else if (url === '#pedidos') {
                  if (!user) {
                    setAuthModalOpen(true);
                  } else {
                    const q = query(collection(DB, 'pedidos'), where('userId', '==', user.uid));
                    getDocs(q).then(snap => {
                       const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
                       orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                       // @ts-ignore
                       setUserOrders?.(orders);
                       // @ts-ignore
                       setOrdersModalOpen?.(true);
                    });
                  }
                } else if (url.toLowerCase().endsWith('.pdf')) {
                  if (window.confirm('¿Estás seguro que deseas abrir o descargar este documento PDF?')) {
                    window.open(url, '_blank');
                  }
                } else if (url.startsWith('http')) {
                  window.open(url, '_blank');
                } else {
                  window.location.href = url;
                }
              }}
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
      </motion.section>



      {/* ── CATÁLOGO ─────────────────────────────────── */}
      <main className="flex-1" style={{ background: '#ffffff' }}>
        {(!activeSection && (!activeCategory || activeCategory === '__loading__') && !searchQuery) ? (
          <div>
            {/* ── Destacados del Mes ── */}
            {!loading && products.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-screen-xl mx-auto pt-8 pb-4"
              >
                <h2 className="text-center font-extrabold text-[17px] mb-5 text-[#0a0a0a] tracking-tight">Destacados del Mes</h2>
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 md:px-10 pb-4 items-stretch gsap-horizontal-scroll" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
              </motion.div>
            )}



            {/* Cabecera del catálogo y Secciones */}
            <div className="max-w-screen-xl mx-auto px-5 md:px-10 pt-6 md:pt-10 pb-6 gsap-section">
              {/* ── Botón Explorar Catálogo (FULL WIDTH COLORIDO Y RESPONSIVO) ── */}
              {catalogButtonEnabled && !loading && (
                <div className="mb-10 lg:mb-14 mt-4 relative group w-full animate-in fade-in zoom-in duration-500 gsap-big-btn">
                  {/* Sombra Glow Colorida */}
                  <div className="absolute -inset-2 md:-inset-3 lg:-inset-4 bg-gradient-to-r from-[#FF0076] via-[#590FB7] to-[#00A0C6] rounded-[24px] md:rounded-[36px] blur-xl lg:blur-2xl opacity-40 group-hover:opacity-75 transition-opacity duration-500"></div>
                  
                  <button
                    onClick={() => { setCatalogPage(1); setCatalogModalOpen(true); }}
                    className="relative w-full flex items-center justify-between gap-3 md:gap-8 px-5 md:px-12 lg:px-14 py-4 md:py-6 lg:py-7 rounded-[20px] md:rounded-[30px] bg-gradient-to-br from-[#FF0076] via-[#7B2CBF] to-[#00A0C6] text-white overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Ondas / Destellos de fondo */}
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                    <div className="absolute top-[-50%] right-[-10%] w-40 md:w-80 h-40 md:h-80 rounded-full bg-white/20 blur-2xl lg:blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                    
                    <div className="flex items-center gap-4 md:gap-8 relative z-10 w-full">
                      {/* Icono vibrante */}
                      <div className="bg-white/20 p-2.5 md:p-4 lg:p-5 rounded-[14px] md:rounded-[20px] backdrop-blur-md border border-white/30 group-hover:rotate-12 transition-transform duration-300 flex-shrink-0 shadow-lg">
                        <LayoutGrid className="w-7 h-7 md:w-10 md:h-10 lg:w-12 lg:h-12 text-white drop-shadow-md" strokeWidth={2.5} />
                      </div>

                      {/* Textos fluidos responsive */}
                      <div className="flex flex-col items-start text-left flex-1">
                        <span className="font-extrabold text-[17px] md:text-[30px] lg:text-[36px] leading-none tracking-tight text-white drop-shadow-lg">
                          Explorar Todo El Catálogo
                        </span>
                        
                        {/* Descripción adicional solo visible en desktop */}
                        <div className="hidden md:flex items-center gap-2 mt-2 opacity-90">
                          <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#FFD166] rounded-full"></span>
                          <span className="text-[14px] lg:text-[15px] font-bold text-gray-100 uppercase tracking-widest">Descubre Ofertas Exclusivas</span>
                        </div>

                        {/* Tag de cantidad de artículos (móvil y desktop) */}
                        <div className="flex items-center mt-0.5 md:mt-2 lg:mt-3">
                          <span className="inline-flex items-center gap-1.5 px-2 md:px-4 py-0.5 md:py-1.5 lg:py-2 bg-[#FFD166] text-black text-[10px] md:text-[14px] lg:text-[16px] font-black rounded-md md:rounded-lg lg:rounded-xl uppercase tracking-wider relative overflow-hidden shadow-sm hover:scale-105 transition-transform">
                            <span className="relative z-10">{products.length} Artículos Disponibles</span>
                            <div className="absolute inset-0 bg-white/40 left-[-100%] animate-[shine_2s_infinite]"></div>
                          </span>
                        </div>
                      </div>

                      {/* Flecha derecha */}
                      <div className="w-10 h-10 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-white text-[#7B2CBF] flex items-center justify-center flex-shrink-0 shadow-xl group-hover:scale-110 group-hover:translate-x-2 transition-all duration-300">
                        <ChevronRight className="w-6 h-6 md:w-10 md:h-10 lg:w-12 lg:h-12" strokeWidth={3.5} />
                      </div>
                    </div>

                    {/* Efecto de brillo de lado a lado */}
                    <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg] group-hover:left-[100%] transition-all duration-700"></div>
                  </button>
                </div>
              )}

              {/* ── Categorías Visuales (Betterware Style) ── */}
              {!loading && combinedCategories.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                  className="mb-10"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-gray-200" />
                    <h2 className="text-[15px] font-extrabold text-[#0a0a0a] tracking-tight">Categorías</h2>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>


                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 py-4 px-2 place-items-center gsap-categories-wrapper">
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

                      if (n.includes('libreta') || n.includes('cuaderno')) { icon = <NotebookPen className="w-1/2 h-1/2" strokeWidth={1.5} />; }
                      else if (n.includes('plum') || n.includes('marcador') || n.includes('pluma')) { icon = <Pen className="w-1/2 h-1/2" strokeWidth={1.5} />; }
                      else if (n.includes('tijera') || n.includes('recort')) { icon = <Scissors className="w-1/2 h-1/2" strokeWidth={1.5} />; }
                      else if (n.includes('regla') || n.includes('geom')) { icon = <Ruler className="w-1/2 h-1/2" strokeWidth={1.5} />; }
                      else if (n.includes('libro') || n.includes('texto')) { icon = <BookOpen className="w-1/2 h-1/2" strokeWidth={1.5} />; }
                      else if (n.includes('pintura') || n.includes('acuarela') || n.includes('color')) { icon = <Brush className="w-1/2 h-1/2" strokeWidth={1.5} />; }
                      else if (n.includes('ciencia') || n.includes('laborator') || n.includes('quim')) { icon = <FlaskConical className="w-1/2 h-1/2" strokeWidth={1.5} />; }
                      else if (n.includes('folder') || n.includes('archiv') || n.includes('carpeta')) { icon = <Archive className="w-1/2 h-1/2" strokeWidth={1.5} />; }
                      else if (n.includes('agenda') || n.includes('planif') || n.includes('diario')) { icon = <FileText className="w-1/2 h-1/2" strokeWidth={1.5} />; }
                      else if (n.includes('escuela') || n.includes('papeler') || n.includes('oficina')) { icon = <GraduationCap className="w-1/2 h-1/2" strokeWidth={1.5} />; }
                      else if (n.includes('sello') || n.includes('stamp')) { icon = <Stamp className="w-1/2 h-1/2" strokeWidth={1.5} />; }
                      else if (n.includes('bolig') || n.includes('lapiz') || n.includes('lápiz')) { icon = <PenTool className="w-1/2 h-1/2" strokeWidth={1.5} />; }
                      else { icon = <Package className="w-1/2 h-1/2" strokeWidth={1.5} />; }

                      const isActive = activeCategory === cat;

                      return (
                        <button
                          key={cat}
                          onClick={() => { setActiveCategory(cat); setActiveSection(null); }}
                          className="group flex flex-col items-center gap-2 active:scale-95 gsap-category-pill cursor-pointer"
                        >
                          <div
                            className={`cat-circle w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] md:w-[160px] md:h-[160px] lg:w-[180px] lg:h-[180px] rounded-full flex items-center justify-center transition-all duration-300 relative overflow-hidden mx-auto text-white ${
                              isActive
                                ? 'scale-105'
                                : ''
                            }`}
                            style={{
                              backgroundColor: themeColor,
                              boxShadow: isActive
                                ? `0 0 0 5px ${themeColor}66, 0 16px 40px ${themeColor}66`
                                : `0 8px 28px ${themeColor}55`,
                            }}
                          >
                            {/* Gradiente 3D premium */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-white/5 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/20 to-transparent" />
                            {/* Brillo superior tipo esfera */}
                            <div className="absolute top-[8%] left-[15%] w-[40%] h-[25%] bg-white/25 rounded-full blur-sm" />
                            {isActive && <div className="absolute inset-0 bg-black/10" />}
                            <div className="relative z-10 drop-shadow-lg w-[52%] h-[52%] flex items-center justify-center">
                              {icon}
                            </div>
                          </div>
                          <span
                            className="text-[12px] sm:text-[14px] lg:text-[16px] font-black text-center leading-tight px-1 mt-1"
                            style={{
                              color: isActive ? themeColor : '#222',
                              fontWeight: isActive ? 900 : 700,
                            }}
                          >
                            {cat}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
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

            <motion.div 
              id="body-section" 
              className="max-w-screen-xl mx-auto px-3 md:px-10 pb-4"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            >
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
                              src={url}
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
            </motion.div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-0 animate-in fade-in">
            {/* Orange Header Category View */}
            <div className="w-full bg-[#f26522] text-white text-center py-4 shadow-sm border-b-4 border-[#d15316]">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-wide">
                {activeSection
                  ? ({ 'novedades': 'Novedades', 'masVendidos': 'Más vendidos', 'ofertas': 'Ofertas', 'destacados': 'Destacados', 'mayoreo': 'Mayoreo', 'piezasUnicas': 'Piezas únicas', 'remates': 'Remates', 'exclusivo': 'Exclusivo online', 'temporada': 'Ofertas de temporada', 'nuevos': 'Recién llegados' }[activeSection] || activeSection)
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
                    ? ({ 'novedades': 'Novedades', 'masVendidos': 'Más vendidos', 'ofertas': 'Ofertas', 'destacados': 'Destacados', 'mayoreo': 'Mayoreo', 'piezasUnicas': 'Piezas únicas', 'remates': 'Remates', 'exclusivo': 'Exclusivo online', 'temporada': 'Ofertas de temporada', 'nuevos': 'Recién llegados' }[activeSection] || activeSection)
                    : (activeCategory !== '__loading__' && activeCategory ? activeCategory : (searchQuery ? `Resultados` : 'Catálogo'))}
                </span>
              </div>

              <h3 className="text-[20px] md:text-[22px] font-black text-[#1a1a1a] mb-5 tracking-tight">
                Ver todo {activeSection
                  ? ({ 'novedades': 'Novedades', 'masVendidos': 'Más vendidos', 'ofertas': 'Ofertas', 'destacados': 'Destacados', 'mayoreo': 'Mayoreo', 'piezasUnicas': 'Piezas únicas', 'remates': 'Remates', 'exclusivo': 'Exclusivo online', 'temporada': 'Ofertas de temporada', 'nuevos': 'Recién llegados' }[activeSection] || activeSection)
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
                <div className="relative flex-1" ref={sortAnchorRef}>
                  <button
                    onClick={() => setSortDropdownOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition min-h-[48px] shadow-sm"
                  >
                    <div className="flex flex-col text-left justify-center">
                      <span className="text-[#666] font-normal text-[10px] leading-tight">Mostrar Por</span>
                      <span className="font-bold text-[#1a1a1a] text-[13px] leading-tight mt-[1px] truncate max-w-[120px] md:max-w-none">{sortBy}</span>
                    </div>
                    <ChevronRight size={16} className={`text-gray-400 transition-transform ${sortDropdownOpen ? '-rotate-90' : 'rotate-90'}`} />
                  </button>

                  {/* Portal: se renderiza en <body>, SIEMPRE por encima de todo */}
                  {sortDropdownOpen && dropdownPos && typeof document !== 'undefined' && createPortal(
                    <>
                      <div
                        className="fixed inset-0 z-[99998]"
                        onClick={() => setSortDropdownOpen(false)}
                      />
                      <div
                        className="fixed z-[99999] bg-white border border-gray-200 shadow-2xl rounded-xl overflow-hidden"
                        style={{
                          top: dropdownPos.top,
                          right: dropdownPos.right,
                          width: dropdownPos.width,
                          maxHeight: 320,
                          overflowY: 'auto',
                        }}
                      >
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Mostrar Por</span>
                        </div>
                        {['Destacados', 'Nuestros Favoritos', 'Alfabéticamente, A-Z', 'Alfabéticamente, Z-A', 'Precio Más Bajo Al Más Alto', 'Precio Más Alto Al Más Bajo'].map(option => (
                          <div
                            key={option}
                            onClick={() => { setSortBy(option); setSortDropdownOpen(false); }}
                            className={`flex items-center gap-2 px-4 py-3.5 text-[14px] font-semibold cursor-pointer border-b border-gray-50 last:border-0 transition-colors ${
                              sortBy === option ? 'text-[#f26522] bg-orange-50' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              sortBy === option ? 'border-[#f26522] bg-[#f26522]' : 'border-gray-300'
                            }`}>
                              {sortBy === option && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            {option}
                          </div>
                        ))}
                      </div>
                    </>,
                    document.body
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

        {/* ══ IMAGE BEFORE FOOTER CARRUSEL (Igual que bodySection) ══════════════ */}
        {preFooterUrls.length > 0 && (
          <div className="max-w-screen-xl mx-auto px-3 md:px-10 mb-8">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-sm flex items-center justify-center" style={{ aspectRatio: '16/7' }}>
              {/* Todos los slides siempre en DOM — CSS opacity, cero requests al cambiar */}
              {preFooterUrls.map((url, i) => {
                const isActive = i === preFooterIndex;
                return (
                  <div
                    key={url}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    style={{
                      pointerEvents: isActive ? 'auto' : 'none',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="Banner Inferior"
                      loading={i === 0 ? 'eager' : 'lazy'}
                      decoding={i === 0 ? 'sync' : 'async'}
                      className="w-full h-full object-cover block"
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
      </>
      )}


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
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
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
                            <div 
                              className="relative flex-shrink-0 cursor-pointer"
                              onClick={() => { setCartOpen(false); setSelectedProductForDetail(item as any); }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={cldOpt(itemImgUrl, 120) || 'https://placehold.co/80x80/f5f5f5/ccc?text=IMG'}
                                alt={item.name}
                                className="w-[80px] h-[80px] object-contain bg-gray-50 rounded-md transition-transform hover:scale-105"
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
                              <p 
                                className="font-bold text-[13px] text-gray-900 leading-snug line-clamp-2 cursor-pointer hover:text-[#FF7F00] transition-colors"
                                onClick={() => { setCartOpen(false); setSelectedProductForDetail(item as any); }}
                              >
                                {item.name}
                              </p>
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
                                className="w-full h-[80px] object-cover rounded-lg bg-gray-50 cursor-pointer transition-transform hover:scale-105"
                                onClick={() => { setCartOpen(false); setSelectedProductForDetail(p); }}
                              />
                              <p 
                                className="text-[11px] font-bold text-gray-800 mt-1 line-clamp-2 leading-tight cursor-pointer hover:text-[#FF7F00] transition-colors"
                                onClick={() => { setCartOpen(false); setSelectedProductForDetail(p); }}
                              >
                                {p.name}
                              </p>
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
                        const textLines = cart.map(item => {
                          const fullName = item.selectedVariant ? `${item.name} — ${item.selectedVariant.name}` : item.name;
                          return `${item.quantity}x ${fullName} (- $${calcItemPrice(item).toFixed(2)} c/u)`;
                        });
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

                {/* INICIO */}
                <button
                  onClick={() => { setViewMode('home'); setLeftMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 text-[13px] font-bold tracking-widest uppercase text-gray-800 hover:bg-gray-50 transition-colors text-left w-full"
                >
                  <Home size={16} className="text-[#000]" />
                  INICIO
                </button>

                {/* NUEVOS */}
                <button
                  onClick={() => { 
                    setViewMode('home');
                    setActiveSection('novedades'); 
                    setLeftMenuOpen(false); 
                    setTimeout(() => window.scrollTo({ top: document.getElementById('body-section')?.offsetTop || 600, behavior: 'smooth' }), 100); 
                  }}
                  className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 text-[13px] font-bold tracking-widest uppercase text-gray-800 hover:bg-gray-50 transition-colors text-left"
                >
                  NUEVOS
                </button>

                {/* OFERTAS */}
                <button
                  onClick={() => { 
                    setViewMode('home');
                    setActiveSection('ofertas'); 
                    setLeftMenuOpen(false); 
                    setTimeout(() => window.scrollTo({ top: document.getElementById('body-section')?.offsetTop || 600, behavior: 'smooth' }), 100); 
                  }}
                  className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 text-[13px] font-bold tracking-widest uppercase text-gray-800 hover:bg-gray-50 transition-colors text-left"
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

                {/* UBICACIONES */}
                <button
                  onClick={() => {
                    setLeftMenuOpen(false);
                    setViewMode('ubicaciones');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 text-[13px] font-bold tracking-widest uppercase text-gray-800 hover:bg-gray-50 transition-colors text-left w-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#00b4d8] flex-shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  VISITA NUESTRAS SUCURSALES
                </button>

                {/* NUESTRA EMPRESA */}
                <button
                  onClick={() => {
                    setLeftMenuOpen(false);
                    setViewMode('nosotros');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 text-[13px] font-bold tracking-widest uppercase text-gray-800 hover:bg-gray-50 transition-colors text-left w-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#7c3aed] flex-shrink-0"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  NUESTRA EMPRESA
                </button>

              </nav>

            </motion.aside>
          </>
        )}
      </AnimatePresence>


      {/* ── PRODUCT DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedProductForDetail && (
          <>
            {/* Dark backdrop */}
            <motion.div
              key="detail-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedProductForDetail(null)}
            />
            {/* Modal wrapper */}
            <motion.div
              key="detail-modal"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="fixed inset-0 z-[95] flex items-center justify-center p-0 md:p-6 pointer-events-none"
            >
              <div
                className="relative bg-white w-full h-full md:h-[750px] md:max-w-[1250px] md:rounded-3xl overflow-hidden flex flex-col pointer-events-auto shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                {/* X Close button */}
                <button
                  onClick={() => setSelectedProductForDetail(null)}
                  className="absolute top-4 right-4 z-[100] w-9 h-9 bg-white/95 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-gray-900 hover:shadow-lg transition-all"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>

                {/* Mobile top bar */}
                <div className="md:hidden sticky top-0 left-0 right-0 h-12 bg-white/90 backdrop-blur-md z-30 flex items-center px-4 border-b border-gray-100 shrink-0">
                  <button onClick={() => setSelectedProductForDetail(null)} className="w-9 h-9 flex items-center justify-center text-gray-700 mr-2">
                    <ChevronLeft size={22} />
                  </button>
                  <span className="text-sm font-black uppercase tracking-widest text-gray-900 truncate">
                    {selectedProductForDetail.name}
                  </span>
                </div>

                {/* ── Main body: image | info ── */}
                <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-y-auto md:overflow-hidden">

                  {/* LEFT: Image panel */}
                  <div className="bg-[#f8f9fa] md:w-[48%] shrink-0 flex flex-col p-4 md:p-8 md:overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    {(() => {
                      /* eslint-disable @typescript-eslint/no-explicit-any */
                      const allImages: string[] = [
                        activeVariant?.imageUrl || selectedProductForDetail.imageUrl,
                        ...((selectedProductForDetail as any).extraImages || [])
                      ].filter(Boolean);
                      const hasMultipleImages = allImages.length > 1;
                      return (
                        <div className="flex flex-col gap-3 h-full">
                          {/* Main image */}
                          <div className="relative rounded-2xl overflow-hidden bg-white border border-gray-100 aspect-square flex items-center justify-center shadow-sm flex-1">
                            <img
                              src={cldOpt(allImages[detailImageIndex] || selectedProductForDetail.imageUrl, 800) || 'https://placehold.co/800'}
                              alt={selectedProductForDetail.name}
                              className="w-full h-full object-contain p-6"
                            />
                            {/* Zoom */}
                            <button
                              onClick={() => setZoomedImage(cldOpt(allImages[detailImageIndex] || selectedProductForDetail.imageUrl, 1200) || 'https://placehold.co/1200')}
                              className="absolute bottom-3 right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-gray-900 transition"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                            </button>
                            {/* Mobile nav arrows */}
                            {hasMultipleImages && (
                              <div className="md:hidden">
                                <button onClick={() => setDetailImageIndex(i => (i - 1 + allImages.length) % allImages.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full shadow flex items-center justify-center text-gray-700 z-10"><ChevronLeft size={18} /></button>
                                <button onClick={() => setDetailImageIndex(i => (i + 1) % allImages.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full shadow flex items-center justify-center text-gray-700 z-10"><ChevronRight size={18} /></button>
                              </div>
                            )}
                          </div>
                          {/* Thumbnail strip */}
                          {hasMultipleImages && (
                            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                              {allImages.map((img, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setDetailImageIndex(idx)}
                                  className={`w-14 h-14 shrink-0 rounded-xl border-2 overflow-hidden transition-all ${idx === detailImageIndex ? 'border-[#ff5722] opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
                                >
                                  <img src={cldOpt(img, 150) || 'https://placehold.co/150'} alt="" className="w-full h-full object-cover bg-white" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* RIGHT: Info panel */}
                  <div className="flex flex-col flex-1 md:overflow-y-auto bg-white" style={{ scrollbarWidth: 'thin' }}>
                    <div className="flex-1 px-5 md:px-7 py-5 md:py-6 space-y-5">

                      {/* Title & price */}
                      <div>
                        {(activeVariant?.sku || selectedProductForDetail.sku) && (
                          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-widest mb-1">
                            SKU #{activeVariant?.sku || selectedProductForDetail.sku}
                          </p>
                        )}
                        <h2 className="text-[20px] md:text-[26px] font-black text-[#0d1b2a] leading-tight tracking-tight mt-1">
                          {activeVariant?.name ? `${selectedProductForDetail.name} — ${activeVariant.name}` : selectedProductForDetail.name}
                        </h2>
                        <p className="text-[30px] font-black text-[#1a1a1a] mt-2 mb-4 leading-none">
                          ${(selectedProductForDetail.precioIndividual || 0).toFixed(2)}
                        </p>

                        {/* ADD TO CART ROW (Desktop) */}
                        {!((selectedProductForDetail.variants && selectedProductForDetail.variants.length > 0) || (selectedProductForDetail.opcionesExtra && selectedProductForDetail.opcionesExtra.length > 0)) && (
                          <div className="flex flex-col mb-6">
                            
                            {/* Caja Row */}
                            {(selectedProductForDetail.precioCaja || 0) > 0 && (
                              <div className="flex flex-col mb-4">
                                <div className="flex items-center justify-between">
                                  <label className="font-bold text-xs text-blue-600 tracking-widest uppercase">Cajas enteras</label>
                                  <div className="flex items-center rounded-full overflow-hidden bg-blue-50 h-11 w-36 border border-blue-100">
                                    <button onClick={() => setDetailQtyCajas(q => Math.max(0, q - 1))} className="w-12 h-full text-blue-500 hover:bg-blue-100 transition flex items-center justify-center">
                                      <Minus size={16} strokeWidth={2.5} />
                                    </button>
                                    <input
                                      type="number" min="0" value={detailQtyCajas}
                                      onChange={e => setDetailQtyCajas(Math.max(0, Number(e.target.value) || 0))}
                                      className="flex-1 bg-transparent text-center text-sm font-bold outline-none text-blue-900 w-0 hide-arrows"
                                    />
                                    <button onClick={() => setDetailQtyCajas(q => q + 1)} className="w-12 h-full text-blue-500 hover:bg-blue-100 transition flex items-center justify-center">
                                      <Plus size={16} strokeWidth={2.5} />
                                    </button>
                                  </div>
                                </div>
                                {(() => {
                                  const isLibreta = (selectedProductForDetail.category || '').toLowerCase().includes('libreta') || 
                                                  (selectedProductForDetail.category || '').toLowerCase().includes('cuaderno');
                                  if (isLibreta && detailQtyCajas > 0) {
                                    return (
                                      <p className="text-[10px] text-orange-600 font-bold leading-tight mt-2 bg-orange-50 p-2 rounded-lg border border-orange-100">
                                        ⚠️ Si escoges una caja, esta viene surtida de diseño del modelo que pidió. Si quiere variadas pida de una en una desde el carrito.
                                      </p>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            )}

                            {/* Piezas Row */}
                            <div className="flex items-center justify-between mb-6">
                              <label className="font-bold text-xs text-gray-500 tracking-widest uppercase">Piezas sueltas</label>
                              <div className="flex items-center rounded-full overflow-hidden bg-gray-50 h-11 w-36 border border-gray-200">
                                <button onClick={() => setDetailQtyPzas(q => Math.max(0, q - 1))} className="w-12 h-full text-gray-500 hover:bg-gray-200 transition flex items-center justify-center">
                                  <Minus size={16} strokeWidth={2.5} />
                                </button>
                                <input
                                  type="number" min="0" value={detailQtyPzas}
                                  onChange={e => setDetailQtyPzas(Math.max(0, Number(e.target.value) || 0))}
                                  className="flex-1 bg-transparent text-center text-sm font-bold outline-none text-gray-900 w-0 hide-arrows"
                                />
                                <button onClick={() => setDetailQtyPzas(q => q + 1)} className="w-12 h-full text-gray-500 hover:bg-gray-200 transition flex items-center justify-center">
                                  <Plus size={16} strokeWidth={2.5} />
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 w-full mt-2">
                              <button
                                disabled={detailQtyPzas === 0 && detailQtyCajas === 0}
                                onClick={() => {
                                  const finalQty = detailQtyPzas + (detailQtyCajas * (selectedProductForDetail.minCaja || 24));
                                  if(finalQty <= 0) return;
                                  addToCart(selectedProductForDetail, finalQty);
                                  setSelectedProductForDetail(null);
                                  setCartOpen(true);
                                }}
                                className="w-full h-12 rounded-full text-white font-black text-[15px] tracking-wide flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:brightness-105 active:scale-[0.98] bg-[#0a0a0a] disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                Añadir {detailQtyPzas + (detailQtyCajas * (selectedProductForDetail.minCaja || 24))} pzs al pedido
                              </button>

                              {(detailQtyPzas > 0 || detailQtyCajas > 0) && (
                                <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                                  Estás llevando: <span className="text-gray-600">{detailQtyCajas} {detailQtyCajas === 1 ? 'caja' : 'cajas'}</span> (de {selectedProductForDetail.minCaja || 24} pzs) y <span className="text-gray-600">{detailQtyPzas} {detailQtyPzas === 1 ? 'pieza suelta' : 'piezas sueltas'}</span>.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tabs Detalles */}
                      <div className="px-5 mb-6">
                        <div className="flex border-b border-gray-200 gap-8">
                          <button className="pb-3 text-[14px] font-black text-gray-900 border-b-[3px] border-[#ff5722]">Detalles</button>
                          <button className="pb-3 text-[14px] font-bold text-gray-400 hover:text-gray-900 transition">Especificaciones</button>
                        </div>
                        <div className="mt-5">
                          <p className={`text-[14px] text-gray-500 leading-relaxed font-medium ${!detailDescExpanded ? 'line-clamp-4' : ''}`}>
                            {activeVariant?.description || (selectedProductForDetail as any).description || `${selectedProductForDetail.name} - Artículo de papelería de alta calidad. Perfecto para uso cotidiano, cuenta con un diseño ergonómico y materiales de excelente durabilidad.`}
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
                        <h4 className="text-[14px] font-black text-gray-900 mb-3 uppercase tracking-wider">Escala de Precios</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {/* Individual — siempre visible */}
                          <div className="bg-white border border-gray-200 rounded-2xl p-3 flex flex-col justify-center shadow-sm">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">INDIVIDUAL</span>
                            <span className="text-[18px] font-black text-[#1a1a1a] leading-none mb-1">
                              ${(selectedProductForDetail.precioIndividual || 0).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-gray-500 font-bold">1 pza</span>
                          </div>

                          {/* Mayoreo — solo se colorea si el total en carrito alcanza */}
                          {(selectedProductForDetail.precioMayoreo || 0) > 0 && (() => {
                            const totalInCart = cart.reduce((s: number, p: any) => s + Number(p.quantity || 0), 0);
                            const active = totalInCart >= (selectedProductForDetail.minMayoreo || 5);
                            return (
                              <div className={`rounded-2xl p-3 flex flex-col justify-center shadow-sm border ${active ? 'bg-green-50/50 border-green-300 ring-1 ring-green-200' : 'bg-white border-gray-200'}`}>
                                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${active ? 'text-green-600' : 'text-gray-400'}`}>MAYOREO</span>
                                <span className={`text-[18px] font-black leading-none mb-1 ${active ? 'text-green-700' : 'text-gray-600'}`}>
                                  ${(selectedProductForDetail.precioMayoreo || 0).toFixed(2)}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block w-max ${active ? 'bg-green-200/50 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                                  {selectedProductForDetail.minMayoreo || 5} pzas min.
                                </span>
                              </div>
                            );
                          })()}

                          {/* Caja — solo se colorea si lleva >= minCaja de este producto */}
                          {(selectedProductForDetail.precioCaja || 0) > 0 && (() => {
                            const productInCart = cart.filter((p: any) => p.id === selectedProductForDetail.id).reduce((s: number, p: any) => s + Number(p.quantity || 0), 0);
                            const active = productInCart >= (selectedProductForDetail.minCaja || 24);
                            return (
                              <div className={`rounded-2xl p-3 flex flex-col justify-center shadow-sm border ${active ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-200' : 'bg-white border-gray-200'}`}>
                                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${active ? 'text-blue-600' : 'text-gray-400'}`}>POR CAJA</span>
                                <span className={`text-[18px] font-black leading-none mb-1 ${active ? 'text-blue-700' : 'text-gray-600'}`}>
                                  ${(selectedProductForDetail.precioCaja || 0).toFixed(2)}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block w-max ${active ? 'bg-blue-200/50 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                                  {selectedProductForDetail.minCaja || 24} pzas min.
                                </span>
                              </div>
                            );
                          })()}

                          {/* VIP / Especial  — se muestra siempre que el usuario tenga precio especial habilitado */}
                          {userHasPrecioEspecial && (
                            <div className={`rounded-2xl p-3 flex flex-col justify-center shadow-sm border ${(selectedProductForDetail.precioEspecial || 0) > 0
                                ? 'bg-purple-50/50 border-purple-100'
                                : 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100'
                              }`}>
                              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">✦ VIP</span>
                              {(selectedProductForDetail.precioEspecial || 0) > 0 ? (
                                <>
                                  <span className="text-[18px] font-black text-purple-700 leading-none mb-1">
                                    ${(selectedProductForDetail.precioEspecial || 0).toFixed(2)}
                                  </span>
                                  <span className="text-[10px] bg-purple-200/50 text-purple-800 font-bold px-1.5 py-0.5 rounded-md inline-block w-max">
                                    {selectedProductForDetail.minEspecial || 50} pzas min.
                                  </span>
                                </>
                              ) : (
                                <span className="text-[11px] text-amber-700 font-bold leading-tight">
                                  Precio negociable — contáctanos
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Share buttons */}
                      <div className="px-5 mt-5 flex gap-2">
                        <button onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Mira este producto: ' + selectedProductForDetail.name + ' ' + window.location.href)}`, '_blank')} className="flex items-center gap-2 py-2 px-4 rounded-xl border border-gray-200 text-gray-600 text-[12px] font-bold hover:bg-gray-50 transition-all w-max">
                          <svg width="14" height="14" fill="#25D366" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                          Compartir por WhatsApp
                        </button>
                      </div>

                      {/* Variant & Options Section */}
                      {((selectedProductForDetail.variants && selectedProductForDetail.variants.length > 0) || (selectedProductForDetail.opcionesExtra && selectedProductForDetail.opcionesExtra.length > 0)) && (
                        <div className="px-5 mt-6 border-t border-gray-100 pt-6">
                          <VariantConfigurator
                            product={selectedProductForDetail}
                            onVariantSelect={setActiveVariant}
                            onAdd={(qty, variant) => {
                              addToCart(selectedProductForDetail, qty, variant);
                              setSelectedProductForDetail(null);
                              setCartOpen(true);
                            }}
                          />
                        </div>
                      )}

                      {/* Related Products */}
                      {products.length > 1 && (
                        <div className="px-5 mt-6 border-t border-gray-50 pt-6">
                          <h3 className="text-[15px] font-black text-gray-900 mb-3">Productos Relacionados</h3>
                          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                            {[...products].filter(p => p.id !== selectedProductForDetail.id && p.category === selectedProductForDetail.category)
                              .concat([...products].filter(p => p.id !== selectedProductForDetail.id && p.category !== selectedProductForDetail.category))
                              .slice(0, 4)
                              .map(p => (
                                <RelatedProductCard key={p.id} product={p} onAdd={(prod) => addToCart(prod, 1)} onShowDetail={() => setSelectedProductForDetail(p)} />
                              ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mobile sticky bottom CTA */}
                    {!(selectedProductForDetail.variants && selectedProductForDetail.variants.length > 0) && (
                      <div className="md:hidden p-4 bg-white border-t border-gray-100 shrink-0 sticky bottom-0 z-20">
                        <button
                          onClick={() => { addToCart(selectedProductForDetail, 1); setSelectedProductForDetail(null); setCartOpen(true); }}
                          className="w-full h-[56px] rounded-full text-white font-black text-[16px] tracking-wide flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98]"
                          style={{ background: 'var(--bw-orange, #ff5722)' }}
                        >
                          <ShoppingCart size={20} />
                          <span>Añadir Al Carrito</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
          onClick={() => { setViewMode('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-gray-500 hover:text-[#00A0C6] transition"
        >
          <Home size={20} strokeWidth={1.8} />
          Inicio
        </button>
        <button
          onClick={() => {
            if (!user) {
              setAuthModalOpen(true);
            } else {
              setFacturacionModalOpen(true);
            }
          }}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-gray-500 hover:text-[#00A0C6] transition"
        >
          <FileText size={20} strokeWidth={1.8} />
          Facturas
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

      {/* ══ SECCIONES DINÁMICAS (Ubicaciones + Nosotros) separadas ══ */}
      {viewMode === 'ubicaciones' && (
        <div className="max-w-screen-xl mx-auto px-4 md:px-10 min-h-[60vh] py-10 animate-in fade-in duration-500">
          <UbicacionesSection ubicaciones={ubicaciones} />
        </div>
      )}

      {viewMode === 'nosotros' && (
        <div className="w-full min-h-[60vh] animate-in fade-in duration-500">
          <NosotrosSection data={nosotrosData} />
        </div>
      )}

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
                    const q = query(collection(DB, 'pedidos'), where('userId', '==', user.uid));
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
                  <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                </a>
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
              <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase mt-4 text-center md:text-right">
                Desarrollador Andre HM
              </p>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider mt-1.5 text-center md:text-right">
                © Derechos Reservados Artículos Redituables Altos 2026 
              </p>
            </div>

          </div>

        </div>
      </footer>



      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* ── Perfil Centrado Global (Fuera de headers) ── */}
      <AnimatePresence>
        {userMenuOpen && user && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setUserMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="relative w-full max-w-[360px] bg-white rounded-[32px] shadow-2xl overflow-hidden ring-1 ring-black/5"
            >
              {/* ── Premium Glass Header ── */}
              <div className="relative px-5 md:px-7 py-6 md:py-8 overflow-hidden">
                <div className="absolute inset-0 bg-white">
                  <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_top_left,rgba(0,160,198,0.15)_0%,transparent_50%)]" />
                  <div className="absolute bottom-[-30%] right-[-20%] w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_bottom_right,rgba(123,44,191,0.15)_0%,transparent_50%)]" />
                  <div className="absolute top-[20%] right-[-10%] w-[80%] h-[80%] bg-[radial-gradient(circle,rgba(255,0,118,0.1)_0%,transparent_50%)]" />
                </div>
                
                <div className="relative filter backdrop-blur-3xl flex flex-col items-center">
                  <div className="relative mb-4 group cursor-pointer">
                      <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#00A0C6] to-[#7B2CBF] rounded-full blur-[6px] opacity-60 group-hover:opacity-100 transition duration-500 animate-pulse-slow"></div>
                      <div className="absolute -inset-0.5 bg-gradient-to-tr from-[#00A0C6] to-[#7B2CBF] rounded-full"></div>
                      {user.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="relative z-10 w-[72px] h-[72px] rounded-full object-cover border-4 border-white shadow-xl bg-white" />
                      ) : (
                        <div className="relative z-10 w-[72px] h-[72px] rounded-full bg-gradient-to-br from-white to-gray-50 border-4 border-white flex items-center justify-center text-[28px] font-black uppercase text-gray-800 shadow-xl">
                          {user.displayName?.[0] || user.email?.[0] || 'U'}
                        </div>
                      )}
                  </div>

                  <div className="text-center w-full">
                    <p className="text-gray-900 text-[18px] font-black w-full truncate leading-tight tracking-tight">{user.displayName || 'Usuario Altos'}</p>
                    <p className="text-gray-500 text-[12px] font-bold w-full truncate mt-0.5">{user.email}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                      <div className="bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-gray-600 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-white flex items-center gap-1.5">
                          {user.providerData && user.providerData[0]?.providerId === 'google.com' ? (
                            <><svg width="10" height="10" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg> Autenticado</>
                          ) : (
                            <><Mail size={10} className="text-[#00A0C6]" /> Verificado</>
                          )}
                      </div>
                      {user.metadata?.creationTime && (
                          <div className="bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-gray-500 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-white">
                              Desde {new Date(user.metadata.creationTime).getFullYear()}
                          </div>
                      )}
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
              </div>

              {/* ── Premium Menu Actions ── */}
              <div className="p-3 bg-[#fafbfc]">
                <button
                  onClick={() => {
                    setFacturacionModalOpen(true);
                    setUserMenuOpen(false);
                  }}
                  className="group relative w-full flex items-center gap-4 p-3 hover:bg-white rounded-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#00A0C6] group-hover:bg-[#00A0C6] group-hover:text-white transition-colors duration-300 shadow-inner">
                      <FileText size={18} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 text-left">
                      <span className="block text-[14px] font-black text-gray-900">Datos de Facturación</span>
                      <span className="block text-[11px] font-medium text-gray-400 mt-0.5">Gestiona tus RFCs y recibos</span>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 group-hover:bg-blue-50 text-gray-400 group-hover:text-[#00A0C6] transition-colors">
                      <ChevronRight size={16} strokeWidth={2.5} />
                  </div>
                </button>
                
                <button
                  onClick={async () => {
                    setUserMenuOpen(false);
                    const q = query(collection(DB, 'pedidos'), where('userId', '==', user.uid));
                    const snap = await getDocs(q);
                    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
                    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    setUserOrders(orders);
                    setOrdersModalOpen(true);
                  }}
                  className="group relative w-full flex items-center gap-4 p-3 hover:bg-white rounded-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#7B2CBF] group-hover:bg-[#7B2CBF] group-hover:text-white transition-colors duration-300 shadow-inner">
                      <Package size={18} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 text-left">
                      <span className="block text-[14px] font-black text-gray-900">Historial de Pedidos</span>
                      <span className="block text-[11px] font-medium text-gray-400 mt-0.5">Rastrea tus últimas compras</span>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 group-hover:bg-purple-50 text-gray-400 group-hover:text-[#7B2CBF] transition-colors">
                      <ChevronRight size={16} strokeWidth={2.5} />
                  </div>
                </button>
              </div>

              {/* ── Minimalist Logout ── */}
              <div className="p-4 bg-white border-t border-gray-100 flex justify-center">
                  <button
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }}
                    className="group flex items-center gap-2 px-5 py-2.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 text-[11px] font-black tracking-[0.15em] transition-all duration-300 active:scale-95 border border-transparent hover:border-red-100"
                  >
                    <LogOut size={14} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" /> 
                    CERRAR SESIÓN
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                            <button
                              onClick={() => generateOrderPDF(order)}
                              className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-[#FF7F00] hover:text-white transition-colors"
                            >
                              <FileText size={10} /> PDF
                            </button>
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


      {/* ══════════════════════════════════════════════════════
           MODAL: CATÁLOGO COMPLETO PAGINADO
      ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {catalogModalOpen && (() => {
          const totalCatalogPages = Math.ceil(products.length / CATALOG_PAGE_SIZE);
          const start = (catalogPage - 1) * CATALOG_PAGE_SIZE;
          const pageProducts = products.slice(start, start + CATALOG_PAGE_SIZE);

          // Pagination numbers to render (max 7 visible)
          const getPaginationNums = () => {
            const pages: (number | '...')[] = [];
            if (totalCatalogPages <= 7) {
              for (let i = 1; i <= totalCatalogPages; i++) pages.push(i);
              return pages;
            }
            pages.push(1);
            if (catalogPage > 3) pages.push('...');
            for (let i = Math.max(2, catalogPage - 1); i <= Math.min(totalCatalogPages - 1, catalogPage + 1); i++) {
              pages.push(i);
            }
            if (catalogPage < totalCatalogPages - 2) pages.push('...');
            pages.push(totalCatalogPages);
            return pages;
          };

          return (
            <motion.div
              key="catalog-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[200] bg-[#f5f5f5] flex flex-col overflow-hidden"
              style={{ top: '0px' }}
            >
              {/* Header del modal — Diseñado Premium */}
              <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10 flex-shrink-0">
                <div className="max-w-screen-xl mx-auto px-4 md:px-10 h-[70px] md:h-[85px] flex items-center justify-between relative">

                  {/* Izquierda: Botón Volver */}
                  <div className="flex items-center gap-3 z-10">
                    <button
                      onClick={() => setCatalogModalOpen(false)}
                      className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-all active:scale-95 border border-gray-100"
                    >
                      <ChevronLeft size={22} strokeWidth={2.5} />
                    </button>
                    <div className="hidden sm:block">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Volver</p>
                      <p className="text-[13px] font-black text-gray-900 leading-none">A la tienda</p>
                    </div>
                  </div>

                  {/* Centro: Logo y Título */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-16 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cldOpt(logoUrl, 250) || '/logo.jpg'}
                      alt="Logo"
                      className="h-8 md:h-11 w-auto object-contain mb-1.5"
                    />
                    <div className="hidden md:flex flex-col items-center">
                      <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-[0.25em] leading-none mb-1">Catálogo Completo</h2>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                        Página {catalogPage} de {totalCatalogPages} · {products.length} productos
                      </p>
                    </div>
                    {/* Versión móvil compacta */}
                    <div className="flex md:hidden flex-col items-center">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                        Pág. {catalogPage} / {totalCatalogPages}
                      </p>
                    </div>
                  </div>

                  {/* Derecha: Botón Cerrar */}
                  <div className="z-10">
                    <button
                      onClick={() => setCatalogModalOpen(false)}
                      className="w-10 h-10 rounded-full bg-gray-50 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-all active:scale-95 border border-gray-100"
                    >
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>

                </div>
              </div>

              {/* Grid de productos */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-screen-xl mx-auto px-3 md:px-10 py-6">
                  <motion.div
                    key={catalogPage}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4"
                  >
                    {pageProducts.map(p => (
                      <div
                        key={p.id}
                        className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer group border border-gray-50"
                        onClick={() => { setCatalogModalOpen(false); setSelectedProductForDetail(p); }}
                      >
                        {/* Imagen */}
                        <div className="relative aspect-square overflow-hidden bg-gray-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cldOpt(p.imageUrl, 400) || 'https://placehold.co/400x400/f5f5f5/ccc?text=IMG'}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {/* Flags */}
                          {(p as any).flags?.includes('nuevo') && (
                            <span className="absolute top-2 left-2 bg-[#fff100] text-black text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wide z-10">Nuevo</span>
                          )}
                          {(p as any).flags?.includes('oferta') && (
                            <span className="absolute top-2 right-2 bg-[#f26522] text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wide z-10">Oferta</span>
                          )}
                          {/* Quick add */}
                          <button
                            onClick={(e) => { e.stopPropagation(); addToCart(p, 1, undefined); }}
                            className="absolute bottom-2 right-2 w-9 h-9 bg-[#f26522] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#d15316] hover:scale-110 active:scale-95 transition-all z-10 opacity-0 group-hover:opacity-100"
                          >
                            <ShoppingCart size={16} strokeWidth={2} />
                          </button>
                        </div>
                        {/* Info */}
                        <div className="p-3">
                          <p className="text-[12px] font-bold text-gray-900 line-clamp-2 leading-tight mb-1.5">{p.name}</p>
                          {p.sku && <p className="text-[10px] text-gray-400 font-medium mb-1">SKU: {p.sku}</p>}
                          <p className="text-[15px] font-black text-gray-900">${(p.precioIndividual || 0).toFixed(2)}</p>
                          {(p.precioMayoreo || 0) > 0 && (
                            <p className="text-[10px] text-[#f26522] font-bold">Mayoreo: ${p.precioMayoreo.toFixed(2)} ({p.minMayoreo}+)</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </motion.div>

                  {/* ── Paginación estilo Pornhub ── */}
                  {totalCatalogPages > 1 && (
                    <div className="flex items-center justify-center gap-1.5 mt-10 mb-6 flex-wrap">
                      {/* Anterior */}
                      <button
                        onClick={() => { setCatalogPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                        disabled={catalogPage === 1}
                        className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        <ChevronLeft size={16} strokeWidth={2.5} />
                      </button>

                      {/* Números */}
                      {getPaginationNums().map((num, i) => (
                        num === '...' ? (
                          <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 font-bold text-sm">…</span>
                        ) : (
                          <button
                            key={num}
                            onClick={() => { setCatalogPage(num as number); window.scrollTo(0, 0); }}
                            className={`w-9 h-9 rounded-xl text-sm font-black transition-all shadow-sm ${catalogPage === num
                                ? 'bg-[#0a0a0a] text-white scale-105 shadow-md'
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                              }`}
                          >
                            {num}
                          </button>
                        )
                      ))}

                      {/* Siguiente */}
                      <button
                        onClick={() => { setCatalogPage(p => Math.min(totalCatalogPages, p + 1)); window.scrollTo(0, 0); }}
                        disabled={catalogPage === totalCatalogPages}
                        className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                      >
                        <ChevronRight size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

    </div>


  );
}

export default memo(Storefront);
