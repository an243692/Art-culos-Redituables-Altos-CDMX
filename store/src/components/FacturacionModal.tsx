import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Check, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

interface FacturacionData {
    rfc: string;
    razonSocial: string;
    cp: string;
    regimenFiscal: string;
    usoCfdi: string;
}

const REGIMENES = [
    { id: '601', name: '601 - General de Ley Personas Morales' },
    { id: '603', name: '603 - Personas Morales con Fines no Lucrativos' },
    { id: '605', name: '605 - Sueldos y Salarios e Ingresos Asimilados a Salarios' },
    { id: '606', name: '606 - Arrendamiento' },
    { id: '608', name: '608 - Demás ingresos' },
    { id: '612', name: '612 - Personas Físicas con Actividades Empresariales y Profesionales' },
    { id: '626', name: '626 - Régimen Simplificado de Confianza (RESICO)' },
];

const USO_CFDI = [
    { id: 'G01', name: 'G01 - Adquisición de mercancias' },
    { id: 'G03', name: 'G03 - Gastos en general' },
    { id: 'S01', name: 'S01 - Sin efectos fiscales' },
];

export function FacturacionModal({ isOpen, onClose, onDataSaved }: { isOpen: boolean; onClose: () => void; onDataSaved?: (data: FacturacionData) => void }) {
    const { user } = useAuth();
    const [data, setData] = useState<FacturacionData>({ rfc: '', razonSocial: '', cp: '', regimenFiscal: '601', usoCfdi: 'G01' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            loadData();
        } else {
            setSuccess(false);
            setError('');
        }
    }, [isOpen, user]);

    const loadData = async () => {
        try {
            setLoading(true);
            const docSnap = await getDoc(doc(db, 'clientes', user!.uid));
            if (docSnap.exists() && docSnap.data().facturacion) {
                setData(docSnap.data().facturacion);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof FacturacionData, value: string) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!data.rfc.trim() || !data.razonSocial.trim() || !data.cp.trim()) {
            setError('Por favor llena los campos requeridos (RFC, Razón Social, CP).');
            return;
        }
        setError('');
        setSaving(true);
        try {
            await setDoc(doc(db, 'clientes', user.uid), {
                facturacion: {
                    rfc: data.rfc.toUpperCase().trim(),
                    razonSocial: data.razonSocial.toUpperCase().trim(),
                    cp: data.cp.trim(),
                    regimenFiscal: data.regimenFiscal,
                    usoCfdi: data.usoCfdi,
                }
            }, { merge: true });
            
            setSuccess(true);
            if (onDataSaved) onDataSaved(data);
            setTimeout(() => {
                onClose();
                setSuccess(false);
            }, 2000);
        } catch (err) {
            console.error(err);
            setError('Ocurrió un error al guardar. Inténtalo de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 z-[60]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-[61] flex items-center justify-center p-4 sm:p-6 pb-20 md:pb-6"
                    >
                        <div className="bg-white border border-gray-100 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-full">
                            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <FileText size={16} />
                                    </div>
                                    <h3 className="text-gray-900 font-black text-sm tracking-widest uppercase">
                                        Datos de Facturación
                                    </h3>
                                </div>
                                <button onClick={onClose} className="text-gray-400 hover:text-black hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-5">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                        <Loader2 size={32} className="animate-spin mb-4" />
                                        <p className="text-xs font-bold tracking-widest uppercase">Cargando...</p>
                                    </div>
                                ) : (
                                    <form id="facturacionForm" onSubmit={handleSave} className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="sm:col-span-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">RFC *</label>
                                                <input type="text" value={data.rfc} onChange={e => handleChange('rfc', e.target.value)}
                                                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-bold uppercase focus:outline-none focus:border-black transition"
                                                    placeholder="ABC123456789" required />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Razón Social *</label>
                                                <input type="text" value={data.razonSocial} onChange={e => handleChange('razonSocial', e.target.value)}
                                                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-bold uppercase focus:outline-none focus:border-black transition"
                                                    placeholder="NOMBRE O EMPRESA SA DE CV" required />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Código Postal *</label>
                                                <input type="text" value={data.cp} onChange={e => handleChange('cp', e.target.value)}
                                                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-black transition"
                                                    placeholder="12345" required maxLength={5} />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Régimen Fiscal *</label>
                                                <select value={data.regimenFiscal} onChange={e => handleChange('regimenFiscal', e.target.value)}
                                                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-black transition" required>
                                                    {REGIMENES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Uso de CFDI *</label>
                                                <select value={data.usoCfdi} onChange={e => handleChange('usoCfdi', e.target.value)}
                                                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-black transition" required>
                                                    {USO_CFDI.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        {error && <p className="text-red-500 text-xs font-bold mt-2">{error}</p>}
                                        {success && <p className="text-green-600 bg-green-50 p-2 rounded-lg text-xs font-bold mt-2 flex items-center justify-center gap-2 border border-green-100"><Check size={14} /> Datos guardados con éxito</p>}
                                    </form>
                                )}
                            </div>

                            <div className="p-5 border-t border-gray-100 bg-gray-50 shrink-0">
                                <button type="submit" form="facturacionForm" disabled={loading || saving}
                                    className="w-full bg-[#0a0a0a] hover:bg-[#1a1a1a] text-white py-3 rounded-xl font-black text-xs tracking-widest uppercase transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : 'Guardar Datos'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
