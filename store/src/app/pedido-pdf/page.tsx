'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

function PedidoPdfContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    
    getDoc(doc(db as any, 'pedidos', id))
      .then(snap => {
        if (!snap.exists()) { 
          setError('Pedido no encontrado');
          return;
        }
        const data = snap.data();
        if (data.pdfBase64) {
          setPdfData(data.pdfBase64);
        } else if (data.pdfUrl) {
           window.location.href = data.pdfUrl; // Fallback legacy
        } else {
          setError('El PDF no está disponible para este pedido.');
        }
      })
      .catch(err => {
        console.error(err);
        setError('Error al cargar el pedido');
      });
  }, [id]);

  if (error) {
    return <div className="h-screen flex items-center justify-center font-bold text-red-500">{error}</div>;
  }

  if (!pdfData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="font-medium text-gray-600">Cargando PDF del pedido...</p>
      </div>
    );
  }

  return (
    <iframe src={pdfData} className="w-full h-screen border-none" title="PDF del Pedido" />
  );
}

export default function PedidoPdfPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <PedidoPdfContent />
    </Suspense>
  );
}
