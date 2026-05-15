import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Check, Loader2, UploadCloud, Clock, FileCheck } from 'lucide-react';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
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
    { id: '607', name: '607 - Régimen de Enajenación o Adquisición de Bienes' },
    { id: '608', name: '608 - Demás ingresos' },
    { id: '609', name: '609 - Consolidación' },
    { id: '610', name: '610 - Residentes en el Extranjero sin Establecimiento Permanente en México' },
    { id: '611', name: '611 - Ingresos por Dividendos (socios y accionistas)' },
    { id: '612', name: '612 - Personas Físicas con Actividades Empresariales y Profesionales' },
    { id: '614', name: '614 - Ingresos por intereses' },
    { id: '615', name: '615 - Régimen de los ingresos por obtención de premios' },
    { id: '616', name: '616 - Sin obligaciones fiscales' },
    { id: '620', name: '620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos' },
    { id: '621', name: '621 - Incorporación Fiscal' },
    { id: '622', name: '622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
    { id: '623', name: '623 - Opcional para Grupos de Sociedades' },
    { id: '624', name: '624 - Coordinados' },
    { id: '625', name: '625 - Reg. Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
    { id: '626', name: '626 - Régimen Simplificado de Confianza (RESICO)' }
];

const USO_CFDI = [
    { id: 'G01', name: 'G01 - Adquisición de mercancias' },
    { id: 'G02', name: 'G02 - Devoluciones, descuentos o bonificaciones' },
    { id: 'G03', name: 'G03 - Gastos en general' },
    { id: 'I01', name: 'I01 - Construcciones' },
    { id: 'I02', name: 'I02 - Mobilario y equipo de oficina por inversiones' },
    { id: 'I03', name: 'I03 - Equipo de transporte' },
    { id: 'I04', name: 'I04 - Equipo de computo y accesorios' },
    { id: 'I05', name: 'I05 - Dados, troqueles, moldes, matrices y herramental' },
    { id: 'I06', name: 'I06 - Comunicaciones telefónicas' },
    { id: 'I07', name: 'I07 - Comunicaciones satelitales' },
    { id: 'I08', name: 'I08 - Otra maquinaria y equipo' },
    { id: 'D01', name: 'D01 - Honorarios médicos, dentales y gastos hospitalarios' },
    { id: 'D02', name: 'D02 - Gastos médicos por incapacidad o discapacidad' },
    { id: 'D03', name: 'D03 - Gastos funerales' },
    { id: 'D04', name: 'D04 - Donativos' },
    { id: 'D05', name: 'D05 - Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)' },
    { id: 'D06', name: 'D06 - Aportaciones voluntarias al SAR' },
    { id: 'D07', name: 'D07 - Primas por seguros de gastos médicos' },
    { id: 'D08', name: 'D08 - Gastos de transportación escolar obligatoria' },
    { id: 'D09', name: 'D09 - Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones' },
    { id: 'D10', name: 'D10 - Pagos por servicios educativos (colegiaturas)' },
    { id: 'S01', name: 'S01 - Sin efectos fiscales' },
    { id: 'CP01', name: 'CP01 - Pagos' },
    { id: 'CN01', name: 'CN01 - Nómina' },
];

export function FacturacionModal({ isOpen, onClose, onDataSaved }: { isOpen: boolean; onClose: () => void; onDataSaved?: (data: FacturacionData) => void }) {
    const { user } = useAuth();
    const [tab, setTab] = useState<'solicitar' | 'historial'>('solicitar');
    const [data, setData] = useState<FacturacionData>({ rfc: '', razonSocial: '', cp: '', regimenFiscal: '601', usoCfdi: 'G01' });
    const [ticketUrl, setTicketUrl] = useState<string | null>(null);
    const [historial, setHistorial] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            loadData();
            loadHistorial();
        } else {
            setSuccess(false);
            setError('');
            setTicketUrl(null);
            setTab('solicitar');
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

    const loadHistorial = async () => {
        if (!user) return;
        try {
            const q = query(
                collection(db, 'facturas'),
                where('userId', '==', user.uid)
            );
            const querySnapshot = await getDocs(q);
            const docs = querySnapshot.docs.map(d => ({id: d.id, ...d.data()})).sort((a: any, b: any) => {
                const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return timeB - timeA;
            });
            setHistorial(docs);
        } catch(err) {
            console.error("Error cargando historial", err);
        }
    };

    const handleChange = (field: keyof FacturacionData, value: string) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async (e: React.FormEvent | React.MouseEvent) => {
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
            
            let addedInvoice = false;
            
            if (ticketUrl) {

                await addDoc(collection(db, 'facturas'), {
                    userId: user.uid,
                    userEmail: user.email || '',
                    rfc: data.rfc.toUpperCase().trim(),
                    razonSocial: data.razonSocial.toUpperCase().trim(),
                    cp: data.cp.trim(),
                    regimenFiscal: data.regimenFiscal,
                    usoCfdi: data.usoCfdi,
                    ticketUrl: ticketUrl,
                    status: 'Pendiente',
                    createdAt: serverTimestamp()
                });
                setTicketUrl(null);
                addedInvoice = true;
                await loadHistorial();
            }

            setSuccess(true);
            if (onDataSaved) onDataSaved(data);
            setTimeout(() => {
                setSuccess(false);
                if (addedInvoice) {
                    setTab('historial');
                } else {
                    onClose();
                }
            }, 2000);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Ocurrió un error al procesar. Inténtalo de nuevo.');
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
                                <div className="flex gap-4 items-center">
                                    <button onClick={() => {setTab('solicitar'); setError(''); setSuccess(false);}} className={`text-xs sm:text-sm font-black uppercase tracking-widest pb-1 border-b-2 transition-colors ${tab==='solicitar'?'border-black text-black':'border-transparent text-gray-400 hover:text-black'}`}>Solicitar</button>
                                    <button onClick={() => {setTab('historial'); setError(''); setSuccess(false);}} className={`text-xs sm:text-sm font-black uppercase tracking-widest pb-1 border-b-2 transition-colors ${tab==='historial'?'border-black text-black':'border-transparent text-gray-400 hover:text-black'}`}>Historial</button>
                                </div>
                                <button onClick={onClose} className="text-gray-400 hover:text-black hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-5">
                                {loading && tab === 'solicitar' ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                        <Loader2 size={32} className="animate-spin mb-4" />
                                        <p className="text-xs font-bold tracking-widest uppercase">Cargando...</p>
                                    </div>
                                ) : tab === 'solicitar' ? (
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
                                            
                                            <div onClick={() => {
                                                if (typeof window === 'undefined') return;
                                                const cloudinary = (window as any).cloudinary;
                                                if (!cloudinary) {
                                                    setError('Cloudinary aún no carga, espera unos segundos.');
                                                    return;
                                                }
                                                cloudinary.createUploadWidget({
                                                    cloudName: "dpkeniork",
                                                    uploadPreset: "Altos Articulos Redituables",
                                                    sources: ['local', 'camera'],
                                                    multiple: false,
                                                    maxFiles: 1,
                                                    clientAllowedFormats: ['pdf', 'png', 'jpg', 'jpeg'],
                                                    resourceType: 'image',
                                                    language: "es",
                                                    text: {
                                                        es: {
                                                            menu: { files: "Subir Ticket", camera: "Cámara" },
                                                            local: { browse: "Buscar Archivo", dd_title_single: "Arrastra el ticket aquí" }
                                                        }
                                                    }
                                                }, (err: any, result: any) => {
                                                    if (!err && result && result.event === "success") {
                                                        let finalUrl = result.info.secure_url;
                                                        if (finalUrl.includes('/upload/v')) {
                                                            finalUrl = finalUrl.replace('/upload/v', '/upload/fl_attachment/v');
                                                        } else if (finalUrl.includes('/upload/') && !finalUrl.includes('fl_attachment')) {
                                                            finalUrl = finalUrl.replace('/upload/', '/upload/fl_attachment/');
                                                        }
                                                        setTicketUrl(finalUrl);
                                                    }
                                                }).open();
                                            }} className="sm:col-span-2 mt-4 p-5 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center relative cursor-pointer hover:bg-gray-100 transition">
                                                {ticketUrl ? (
                                                    <div className="flex flex-col items-center">
                                                        <FileCheck className="text-green-500 mb-2" size={24} />
                                                        <p className="text-xs font-bold text-gray-800 text-center px-4">Ticket Subido Correctamente</p>
                                                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Clic para reemplazar</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center text-center">
                                                        <UploadCloud className="text-black mb-2" size={24} />
                                                        <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">Subir foto de ticket</p>
                                                        <p className="text-[10px] text-gray-400 mt-1 max-w-[250px]">Sube la foto del ticket para pedir tu factura automáticamente (Opcional si solo guardas tus datos)</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {error && <p className="text-red-500 text-xs font-bold mt-2">{error}</p>}
                                        {success && <p className="text-green-600 bg-green-50 p-2 rounded-lg text-xs font-bold mt-2 flex items-center justify-center gap-2 border border-green-100"><Check size={14} /> Solicitud/Cambios guardados con éxito</p>}
                                    </form>
                                ) : (
                                    <div className="space-y-3">
                                        {historial.length === 0 ? (
                                            <div className="text-center py-10">
                                                <Clock className="mx-auto text-gray-300 mb-3" size={32} />
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">No has solicitado facturas</p>
                                            </div>
                                        ) : (
                                            historial.map((fac, idx) => {
                                                const fixedTicketUrl = fac.ticketUrl?.includes('/image/upload/v') 
                                                    ? fac.ticketUrl.replace('/image/upload/v', '/image/upload/fl_attachment/v') 
                                                    : (fac.ticketUrl || '#');
                                                    
                                                const fixedFacturaUrl = fac.facturaUrl?.includes('/image/upload/v')
                                                    ? fac.facturaUrl.replace('/image/upload/v', '/image/upload/fl_attachment/v')
                                                    : fac.facturaUrl;

                                                return (
                                                <div key={fac.id || idx} className="border border-gray-100 rounded-xl p-4 flex justify-between items-center bg-gray-50 flex-wrap gap-2">
                                                    <div>
                                                        <p className="text-xs font-black uppercase text-black">{fac.rfc}</p>
                                                        <p className="text-[10px] text-gray-500 font-bold mt-1">
                                                            {fac.createdAt ? new Date(fac.createdAt.seconds * 1000).toLocaleDateString() : 'Reciente'} - {' '}
                                                            <a href={fixedTicketUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline ml-1">Ver Ticket</a>
                                                        </p>
                                                        {fixedFacturaUrl && (
                                                            <p className="text-[10px] font-bold mt-1">
                                                                <a 
                                                                  href={fixedFacturaUrl} 
                                                                  download={`Factura_${fac.rfc}.pdf`}
                                                                  target="_blank" 
                                                                  rel="noreferrer" 
                                                                  className="text-green-600 underline"
                                                                >
                                                                    Descargar Factura emitida
                                                                </a>
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${fac.status === 'Pendiente' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>{fac.status}</span>
                                                    </div>
                                                </div>
                                            )})
                                        )}
                                    </div>
                                )}
                            </div>

                            {tab === 'solicitar' && (
                                <div className="p-5 border-t border-gray-100 bg-gray-50 shrink-0">
                                    <button type="button" onClick={handleSave as any} disabled={loading || saving}
                                        className="w-full bg-[#0a0a0a] hover:bg-[#1a1a1a] text-white py-3 rounded-xl font-black text-xs tracking-widest uppercase transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : (ticketUrl ? 'Solicitar Factura' : 'Guardar Datos Fiscales')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
