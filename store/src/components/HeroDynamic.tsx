import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cldOpt } from '@/lib/utils';

export interface HeroSlide {
  id: string;
  imageUrl: string;
  mobileImageUrl?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  order: number;
}

export function HeroDynamic({
  slides, currentSlide, onNext, onPrev, onDot,
}: {
  slides: HeroSlide[];
  currentSlide: number;
  onNext: () => void;
  onPrev: () => void;
  onDot: (i: number) => void;
  logoUrl: string;
  primaryColor?: string;
}) {
  const slide = slides[currentSlide];

  return (
    <div
      suppressHydrationWarning
      className="relative w-full"
    >
      {/*
        ── CLAVE DE OPTIMIZACIÓN ──────────────────────────────────────────
        Todos los slides se renderizan en el DOM desde el inicio.
        La imagen ACTIVA usa position relative para darle la altura real al contenedor.
        Las imágenes INACTIVAS usan absolute top-0 left-0 encimadas para crossfade.
        Opacity 0/1 cambia sin destruir el DOM, ahorrando requests de red.
        ──────────────────────────────────────────────────────────────────
      */}
      {slides.map((s, i) => {
        const isActive = i === currentSlide;
        return (
          <div
            key={s.id}
            aria-hidden={!isActive}
            className={`w-full flex transition-opacity duration-[650ms] ${isActive ? 'relative opacity-100 z-10' : 'absolute top-0 left-0 opacity-0 z-0'}`}
            style={{
              pointerEvents: isActive ? 'auto' : 'none',
            }}
          >
            <picture className="w-full flex">
              {s.mobileImageUrl && (
                <source media="(max-width: 767px)" srcSet={cldOpt(s.mobileImageUrl, 800)} />
              )}
              <img
                src={cldOpt(s.imageUrl, 1200)}
                alt={s.title || `Slide ${i + 1}`}
                // @ts-ignore
                fetchPriority={i === 0 ? 'high' : 'low'}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding={i === 0 ? 'sync' : 'async'}
                className="w-full h-auto block"
              />
            </picture>

            {/* Gradient overlay */}
            {(s.title || s.subtitle) && (
              <div
                className="absolute inset-0 z-10"
                style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 100%)' }}
              />
            )}
          </div>
        );
      })}

      {/* ── Text Overlay (solo slide activo) ── */}
      {(slide.title || slide.subtitle) && (
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-10 md:pb-12 flex flex-col items-start z-20">
          {slide.title && (
            <p className="text-white font-black text-xl md:text-3xl leading-tight drop-shadow-lg mb-1">
              {slide.title}
            </p>
          )}
          {slide.subtitle && (
            <p className="text-white/85 text-sm md:text-base font-medium drop-shadow mb-3">
              {slide.subtitle}
            </p>
          )}
          {slide.ctaText && (
            <a
              href={slide.ctaUrl || '#catalogo'}
              className="inline-block bg-white text-gray-900 font-black text-xs md:text-sm px-5 py-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors active:scale-95"
            >
              {slide.ctaText}
            </a>
          )}
        </div>
      )}

      {/* ── Flechas nav ── */}
      {slides.length > 1 && (
        <>
          <button
            onClick={onPrev}
            aria-label="Anterior"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center z-30 transition-all hover:scale-105 active:scale-95 shadow-md"
            style={{ background: '#ffffff', color: '#333333' }}
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={onNext}
            aria-label="Siguiente"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center z-30 transition-all hover:scale-105 active:scale-95 shadow-md"
            style={{ background: '#ffffff', color: '#333333' }}
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* ── Dots ── */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => onDot(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                borderRadius: 999,
                width: i === currentSlide ? 22 : 6,
                height: 6,
                background: i === currentSlide ? '#fff' : 'rgba(255,255,255,0.45)',
                border: 'none',
                cursor: 'pointer',
                transition: 'width 0.3s ease, background 0.3s ease',
              }}
            />
          ))}
        </div>
      )}

      {/* ── Barra de progreso ── */}
      {slides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10 z-30">
          <div
            key={`progress-${currentSlide}`}
            className="h-full origin-left"
            style={{
              background: 'rgba(255,255,255,0.5)',
              animation: 'heroProgress 4s linear forwards',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes heroProgress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}