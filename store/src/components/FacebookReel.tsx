import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function FacebookReel() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '200px', // Start loading slightly before it enters the viewport
                threshold: 0,
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div className="w-full flex justify-center py-6 md:py-10 bg-[#f7f7f7]" ref={containerRef}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: isInView ? 1 : 0, scale: isInView ? 1 : 0.95 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col items-center p-4"
                style={{ width: 'auto', minHeight: 430 + 24 }} // height + padding
            >
                <div className="w-full text-center pb-3">
                    <h3 className="text-[10px] font-black tracking-widest uppercase text-gray-400">Novedades</h3>
                    <p className="text-sm font-bold text-gray-800">Conoce nuestros últimos productos</p>
                </div>

                {/* Facebook Iframe Container (Balanced Rectangle) */}
                <div className="w-[320px] h-[430px] rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center relative shadow-inner">
                    {!isInView ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                                <line x1="7" y1="2" x2="7" y2="22"></line>
                                <line x1="17" y1="2" x2="17" y2="22"></line>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <line x1="2" y1="7" x2="7" y2="7"></line>
                                <line x1="2" y1="17" x2="7" y2="17"></line>
                                <line x1="17" y1="17" x2="22" y2="17"></line>
                                <line x1="17" y1="7" x2="22" y2="7"></line>
                            </svg>
                        </div>
                    ) : (
                        <iframe
                            src="https://www.facebook.com/plugins/video.php?height=430&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1237021341377760%2F&show_text=false&width=320&t=0"
                            width="320"
                            height="430"
                            style={{ border: 'none', overflow: 'hidden' }}
                            scrolling="no"
                            frameBorder="0"
                            allowFullScreen={true}
                            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                            title="Facebook Reel"
                            className="w-full h-full border-0"
                        />
                    )}
                </div>
            </motion.div>
        </div>
    );
}
