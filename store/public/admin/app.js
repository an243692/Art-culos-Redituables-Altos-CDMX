import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
    getFirestore, collection, addDoc, getDocs, doc,
    deleteDoc, updateDoc, query, orderBy, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ─── Firebase ────────────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyC7k98HTOfgUHt0aFbGG6IVoiA5HowCt-k",
    authDomain: "articulos-redituables.firebaseapp.com",
    databaseURL: "https://articulos-redituables-default-rtdb.firebaseio.com",
    projectId: "articulos-redituables",
    storageBucket: "articulos-redituables.firebasestorage.app",
    messagingSenderId: "281933269770",
    appId: "1:281933269770:web:f4c4c4d63e49b6f80ec8f3",
    measurementId: "G-LVF95RQ4Y7"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Expose to window for inline scripts
window.db = db;
window._fs = { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, orderBy, getDoc, setDoc };

// ─── Cloudinary — Cloud Name pre-configurado ────────────────────────────────
const DEFAULT_CLOUD_NAME = 'dpkeniork';

function getCloudinaryConfig() {
    return {
        cloudName: localStorage.getItem('cld_cloud_name') || DEFAULT_CLOUD_NAME,
        preset: localStorage.getItem('cld_preset') || ''
    };
}

// Pre-guardar cloud name y preset si no existen
if (!localStorage.getItem('cld_cloud_name')) {
    localStorage.setItem('cld_cloud_name', DEFAULT_CLOUD_NAME);
}
if (!localStorage.getItem('cld_preset')) {
    localStorage.setItem('cld_preset', 'Altos Articulos Redituables');
}

window.saveCloudinaryConfig = () => {
    const name = document.getElementById('cfgCloudName').value.trim();
    const preset = document.getElementById('cfgPreset').value.trim();
    if (!name || !preset) { showToast('Completa los dos campos', 'error'); return; }
    localStorage.setItem('cld_cloud_name', name);
    localStorage.setItem('cld_preset', preset);
    document.getElementById('testResult').classList.remove('hidden');
    updateCloudinaryBadge();
    showToast('✓ Cloudinary configurado correctamente', 'success');
};

function updateCloudinaryBadge() {
    const { preset } = getCloudinaryConfig();
    const badge = document.getElementById('cloudinaryBadge');
    badge.classList.toggle('hidden', !preset);
}

// ─── Toggles de UI ────────────────────────────────────────────────────────
window.toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    // Toggle translation class
    sidebar.classList.toggle('-translate-x-full');

    // Toggle overlay visibility
    if (overlay.classList.contains('hidden')) {
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.remove('opacity-0'), 10);
    } else {
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
};

// ─── Toast ───────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 3200);
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
window.switchTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.getElementById(`btn-tab-${tabId}`).classList.add('active');

    // Cerrar sidebar en mobile al cambiar tab
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar && !sidebar.classList.contains('-translate-x-full') && window.innerWidth < 768) {
        window.toggleSidebar();
    }

    const titles = {
        productos: 'Sistema Inventario',
        categorias: 'Gestión de Categorías',
        secciones: 'Secciones del Catálogo',
        carrusel: 'Carrusel Hero',
        branding: 'Logo & Branding',
        clientes: 'Directorio de Clientes',
        pedidos: 'Gestión de Pedidos',
        config: 'Configuración',
        temas: 'Temas de Colores',
        bodysection: 'Imágenes Body Section',
        prefooter: 'Imágenes Before Footer',
        facturas: 'Solicitudes de Facturación',
        'editor-visual': 'Editor Visual en Vivo Wix'
    };
    document.getElementById('pageTitle').textContent = titles[tabId] || '';

    if (tabId === 'carrusel') loadSlides();
    if (tabId === 'secciones') loadSecciones();
    if (tabId === 'branding') loadCurrentLogo();
    if (tabId === 'dashboard') loadDashboard();
    if (tabId === 'clientes') loadClients();
    if (tabId === 'facturas') loadFacturas();
    if (tabId === 'pedidos') loadOrders();
    if (tabId === 'bodysection') loadBodySection();
    if (tabId === 'prefooter') loadPreFooter();
    if (tabId === 'editor-visual') loadVisualSettings();
    if (tabId === 'config') {
        const { cloudName, preset } = getCloudinaryConfig();
        document.getElementById('cfgCloudName').value = cloudName;
        document.getElementById('cfgPreset').value = preset;
        if (preset) document.getElementById('testResult').classList.remove('hidden');
    }
};

window.loadDashboard = async () => {
    try {
        const prodSnap = await getDocs(collection(db, 'productos'));
        const orderSnap = await getDocs(collection(db, 'pedidos'));
        const clientSnap = await getDocs(collection(db, 'clientes'));
        const catSnap = await getDocs(collection(db, 'categorias'));

        document.getElementById('dashTotal').textContent = prodSnap.size;
        document.getElementById('dashOrders').textContent = orderSnap.size;
        document.getElementById('dashClients').textContent = clientSnap.size;
        document.getElementById('dashCats').textContent = catSnap.size;
    } catch (err) {
        console.error(err);
    }
};

const REGIMENES_MAP = {
    '601': 'General Personas Morales', '603': 'Fines no Lucrativos', '605': 'Sueldos y Salarios', '606': 'Arrendamiento',
    '607': 'Enajenación de Bienes', '608': 'Demás ingresos', '609': 'Consolidación', '610': 'Residentes Extranjero',
    '611': 'Dividendos', '612': 'Físicas con Actividades Emp.', '614': 'Ingresos por intereses', '615': 'Obtención de premios',
    '616': 'Sin obligaciones fiscales', '620': 'Coop. de Producción', '621': 'Incorporación Fiscal', '622': 'Agrícolas Ganaderas',
    '623': 'Opcional para Grupos', '624': 'Coordinados', '625': 'Plataformas Tecnológicas', '626': 'RESICO'
};

const USO_CFDI_MAP = {
    'G01': 'Adquisición mercancias', 'G02': 'Dev/desc/bonif', 'G03': 'Gastos general', 'I01': 'Construcciones',
    'I02': 'Mobilario y equipo', 'I03': 'Eq. de transporte', 'I04': 'Eq. de computo', 'I05': 'Dados, troqueles..',
    'I06': 'Coms telefónicas', 'I07': 'Coms satelitales', 'I08': 'Otra maquinaria', 'D01': 'Honorarios médicos',
    'D02': 'Gastos por incapacidad', 'D03': 'Gastos funerales', 'D04': 'Donativos', 'D05': 'Intereses hipotecarios',
    'D06': 'Aportaciones SAR', 'D07': 'Primas seg. medicos', 'D08': 'Transportación escolar', 'D09': 'Cuentas para pensiones',
    'D10': 'Servicios educativos', 'S01': 'Sin efectos fiscales', 'CP01': 'Pagos', 'CN01': 'Nómina'
};

window.loadFacturas = async () => {
    const tbody = document.getElementById('facturasTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="px-5 py-12 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-2xl text-[#00b4d8]"></i></td></tr>';

    try {
        const q = query(collection(db, 'facturas'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        
        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-5 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Sin facturas solicitadas</td></tr>';
            return;
        }

        let html = '';
        snap.forEach(d => {
            const f = d.data();
            f.id = d.id;
            const date = f.createdAt ? new Date(f.createdAt.seconds * 1000).toLocaleString() : 'Reciente';
            
            let statusBadge = f.status === 'Pendiente'
                ? `<span class="bg-orange-50 text-orange-600 border border-orange-200 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Pendiente</span>`
                : `<span class="bg-green-50 text-green-600 border border-green-200 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Completada</span>`;

            html += `
            <tr class="hover:bg-gray-50/60 transition-colors facturas-row">
                <td class="px-6 py-4 text-xs font-bold text-gray-500">${date}</td>
                <td class="px-6 py-4">
                    <p class="text-sm font-black text-black uppercase factura-email">${f.userEmail}</p>
                </td>
                <td class="px-6 py-4 text-xs text-gray-600">
                    <p class="font-bold text-black uppercase factura-rfc">${f.rfc}</p>
                    <p>${f.razonSocial}</p>
                    <p>CP: ${f.cp} | Reg: ${f.regimenFiscal} - ${REGIMENES_MAP[f.regimenFiscal] || 'Desconocido'} | Uso: ${f.usoCfdi} - ${USO_CFDI_MAP[f.usoCfdi] || 'Desconocido'}</p>
                </td>
                <td class="px-6 py-4">
                    <a href="${f.ticketUrl || '#'}" target="_blank" onclick="return confirm('¿Deseas abrir la imagen/archivo del ticket subida por este cliente?');" class="w-8 h-8 flex flex-col items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition group relative ${!f.ticketUrl ? 'opacity-50 pointer-events-none' : ''}" title="Ver Ticket">
                        <i class="fas fa-image"></i>
                    </a>
                </td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4">
                    ${f.status === 'Pendiente' ? 
                        `<button onclick="completarFactura('${f.id}')" class="bg-black hover:bg-gray-800 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition"><i class="fas fa-upload mr-1"></i> Subir Factura PDF</button>`
                        : `<span class="text-xs text-green-600 font-bold"><i class="fas fa-check"></i> Lista</span>`
                    }
                </td>
            </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch(err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="6" class="px-5 py-12 text-center text-red-500 font-bold">Error cargando facturas</td></tr>';
    }
};

window.completarFactura = async (id) => {
    // Para brincarnos la restricción de Cloudinary que bloquea lectura de PDFs en cuentas gratis (Error 401)
    // subimos las facturas de tamaño normal (hasta 900KB) codificadas seguras hacia Firebase Firestore.
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/pdf';
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 900 * 1024) {
            showToast('El archivo PDf es demasiado grande. Máximo permitido: 900 KB.', 'error');
            return;
        }
        
        showToast('Guardando factura PDF segura...', 'info');
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const base64Pdf = reader.result;
                await updateDoc(doc(db, 'facturas', id), { 
                    status: 'Completada', 
                    facturaUrl: base64Pdf,
                    updatedAt: new Date().toISOString() 
                });
                showToast('Factura subida con éxito', 'success');
                loadFacturas();
            } catch (err) {
                console.error(err);
                if(err.message.includes('exceeds')) {
                     showToast('Error: Documento excede el límite de Firestore', 'error');
                } else showToast('Ocurrió un error al guardar', 'error');
            }
        };
        reader.readAsDataURL(file);
    };
    fileInput.click();
};

window.filterFacturas = () => {
    const q = document.getElementById('facturasSearch').value.toLowerCase();
    document.querySelectorAll('.facturas-row').forEach(row => {
        const email = row.querySelector('.factura-email')?.textContent?.toLowerCase() || '';
        const rfc = row.querySelector('.factura-rfc')?.textContent?.toLowerCase() || '';
        if(email.includes(q) || rfc.includes(q)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
};

// ─── Cloudinary Widget Upload ────────────────────────────────────────────────────────
window.openCloudinaryWidget = (type, extraId = null) => {
    // Check if Cloudinary script has loaded
    if (typeof cloudinary === 'undefined' || !cloudinary.createUploadWidget) {
        showToast('⏳ Cloudinary aún está cargando, intenta en unos segundos...', 'error');
        return;
    }

    const { cloudName, preset } = getCloudinaryConfig();
    if (!preset) {
        showToast('⚠ Agrega tu Upload Preset en la sección Cloudinary', 'error');
        return;
    }

    const isFactura = type === 'factura';
    const widget = cloudinary.createUploadWidget({
        cloudName: cloudName,
        uploadPreset: preset,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        clientAllowedFormats: isFactura ? ['pdf', 'png', 'jpg', 'jpeg'] : ['image'],
        resourceType: 'image',
        maxFileSize: 10000000,
        theme: 'minimal'
    }, (error, result) => {
        if (!error && result && result.event === "success") {
            const secureUrl = result.info.secure_url;
            const optimizedUrl = secureUrl.replace('/upload/', '/upload/f_auto,q_auto:good/');

            if (type === 'product') {
                document.getElementById('productImageUrl').value = optimizedUrl;
                const prev = document.getElementById('imgPreview');
                prev.src = optimizedUrl;
                prev.classList.remove('hidden');
                document.getElementById('uploadIcon').classList.add('hidden');
                document.getElementById('uploadLabel').textContent = 'Imagen lista';
            } else if (type === 'factura' && extraId !== null) {
                // Evitar error 401/404 al visualizar PDF en Chrome forzando descarga con fl_attachment
                let finalUrl = secureUrl;
                if (finalUrl.includes('/image/upload/v')) {
                    finalUrl = finalUrl.replace('/image/upload/v', '/image/upload/fl_attachment/v');
                } else if (finalUrl.includes('/image/upload/') && !finalUrl.includes('fl_attachment')) {
                    finalUrl = finalUrl.replace('/image/upload/', '/image/upload/fl_attachment/');
                }

                updateDoc(doc(db, 'facturas', extraId), { 
                    status: 'Completada', 
                    facturaUrl: finalUrl,
                    updatedAt: new Date().toISOString() 
                }).then(() => {
                    showToast('Factura PDF subida y enviada al cliente', 'success');
                    loadFacturas();
                }).catch(e => {
                    console.error(e);
                    showToast('Error al guardar link del PDF', 'error');
                });
            } else if (type === 'extraImage' && extraId !== null) {
                document.getElementById(`extraImageUrl-${extraId}`).value = optimizedUrl;
                const prev = document.getElementById(`extraImagePreview-${extraId}`);
                prev.src = optimizedUrl;
                prev.classList.remove('hidden');
                document.getElementById(`extraImageIcon-${extraId}`).classList.add('hidden');
            } else if (type === 'slide') {
                document.getElementById('slideImageUrl').value = optimizedUrl;
                const prev = document.getElementById('slideImgPreview');
                prev.src = optimizedUrl;
                prev.classList.remove('hidden');
                document.getElementById('slideUploadIcon').classList.add('hidden');
            } else if (type === 'slideMobile') {
                document.getElementById('slideMobileImageUrl').value = optimizedUrl;
                const prev = document.getElementById('slideImgMobilePreview');
                prev.src = optimizedUrl;
                prev.classList.remove('hidden');
                document.getElementById('slideMobileUploadIcon').classList.add('hidden');
            } else if (type === 'logo') {
                document.getElementById('newLogoUrl').value = optimizedUrl;
                const prev = document.getElementById('newLogoPreview');
                prev.src = optimizedUrl;
                prev.classList.remove('hidden');
                document.getElementById('logoUploadIcon').classList.add('hidden');
                document.getElementById('logoUploadLabel').textContent = 'Logo listo para guardar';
            } else if (type === 'logo2') {
                document.getElementById('newLogo2Url').value = optimizedUrl;
                const prev = document.getElementById('newLogo2Preview');
                prev.src = optimizedUrl;
                prev.classList.remove('hidden');
                document.getElementById('logo2UploadIcon').classList.add('hidden');
                document.getElementById('logo2UploadLabel').textContent = 'Logo secundario listo para guardar';
            } else if (type === 'variant' && extraId !== null) {
                document.getElementById(`variantUrl-${extraId}`).value = optimizedUrl;
                const prev = document.getElementById(`variantPreview-${extraId}`);
                prev.src = optimizedUrl;
                prev.classList.remove('hidden');
                document.getElementById(`variantIcon-${extraId}`).classList.add('hidden');
            } else if (type === 'opcionExtra' && extraId !== null) {
                document.getElementById(`opcionExtraUrl-${extraId}`).value = optimizedUrl;
                const prev = document.getElementById(`opcionExtraPreview-${extraId}`);
                prev.src = optimizedUrl;
                prev.classList.remove('hidden');
                document.getElementById(`opcionExtraIcon-${extraId}`).classList.add('hidden');
            } else if (type === 'bodysection') {
                if (window.addBodySectionImage) window.addBodySectionImage(optimizedUrl);
            } else if (type === 'prefooter') {
                if (window.addPreFooterImage) window.addPreFooterImage(optimizedUrl);
            } else if (type === 'nosotros') {
                if (window.handleNosotrosImageSuccess) window.handleNosotrosImageSuccess(optimizedUrl);
            }
        } else if (error && error !== 'Widget is completely closed.') {
            console.error('Widget upload error', error);
            if (error.status !== 'close') {
                showToast('Error cargando imagen', 'error');
            }
        }
    });

    widget.open();
}

window.openClientFacturacion = (clientId) => {
    const client = allClients.find(c => c.id === clientId);
    if (!client) return;

    const fact = client.facturacion || {};
    document.getElementById('factClientId').value = clientId;
    document.getElementById('factRFC').value = fact.rfc || '';
    document.getElementById('factRazon').value = fact.razonSocial || '';
    document.getElementById('factCP').value = fact.cp || '';
    document.getElementById('factUso').value = fact.usoCfdi || '';

    const el = document.getElementById('clientFacturacionModal');
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
    el.querySelector('.modal-box').style.transform = 'scale(1)';
};

window.saveClientFacturacion = async () => {
    const clientId = document.getElementById('factClientId').value;
    const rfc = document.getElementById('factRFC').value.trim().toUpperCase();
    const razonSocial = document.getElementById('factRazon').value.trim().toUpperCase();
    const cp = document.getElementById('factCP').value.trim();
    const usoCfdi = document.getElementById('factUso').value.trim().toUpperCase();

    if (!rfc) { showToast('El RFC es obligatorio', 'error'); return; }

    try {
        await updateDoc(doc(db, 'clientes', clientId), {
            facturacion: { rfc, razonSocial, cp, usoCfdi, updatedAt: new Date().toISOString() }
        });
        showToast('✓ Datos de facturación actualizados', 'success');
        closeModal('clientFacturacionModal');
        loadClients();
    } catch (err) {
        console.error(err);
        showToast('Error al guardar datos fiscales', 'error');
    }
};

// ─── Modales ──────────────────────────────────────────────────────────────────
function openModal(id) {
    const el = document.getElementById(id);
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
    el.querySelector('.modal-box').style.transform = 'scale(1)';
}

function closeModal(id) {
    const el = document.getElementById(id);
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
    el.querySelector('.modal-box').style.transform = 'scale(0.96)';
}

window.openModal = openModal;
window.closeModal = closeModal;

// ════════════════════════════════════════════════════════════════════════════
//  PRODUCTOS
// ════════════════════════════════════════════════════════════════════════════
let editProductId = null;
let variantCount = 0;
let extraImageCount = 0;

window.addExtraImageField = (url = '') => {
    extraImageCount++;
    const eId = extraImageCount;
    const div = document.createElement('div');
    div.id = `extraImageBox-${eId}`;
    div.className = 'extra-image-item bg-gray-50 border border-gray-200 rounded-xl flex flex-col items-center justify-center relative overflow-hidden h-24 group';
    div.innerHTML = `
        <div class="w-full h-full cursor-pointer flex items-center justify-center p-2" onclick="openCloudinaryWidget('extraImage', ${eId})">
            <img id="extraImagePreview-${eId}" src="${url}" class="w-full h-full object-contain ${url ? '' : 'hidden'}">
            <i id="extraImageIcon-${eId}" class="fas fa-plus text-gray-300 text-xl ${url ? 'hidden' : ''}"></i>
            <input type="hidden" id="extraImageUrl-${eId}" class="extra-img-val" value="${url}">
        </div>
        <button type="button" onclick="document.getElementById('extraImageBox-${eId}').remove()" class="absolute top-1 right-1 w-6 h-6 bg-white/90 text-red-500 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <i class="fas fa-times text-xs"></i>
        </button>
    `;
    document.getElementById('extraImagesContainer').appendChild(div);
};

window.addVariantField = (name = '', url = '', sku = '', description = '') => {
    variantCount++;
    const vId = variantCount;
    const div = document.createElement('div');
    div.id = `variantBox-${vId}`;
    div.className = 'flex flex-col md:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm variant-item';
    div.innerHTML = `
        <div class="w-16 h-16 bg-gray-50 border border-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center cursor-pointer overflow-hidden relative" onclick="openCloudinaryWidget('variant', ${vId})">
            <img id="variantPreview-${vId}" src="${url}" class="w-full h-full object-cover ${url ? '' : 'hidden'}">
            <i id="variantIcon-${vId}" class="fas fa-camera text-gray-300 ${url ? 'hidden' : ''}"></i>
            <input type="hidden" id="variantUrl-${vId}" class="variant-img-val" value="${url}">
        </div>
        <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
            <input type="text" id="variantName-${vId}" value="${name}" placeholder="Nombre (ej. Azul, Diseño 1)" class="variant-name-val w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-purple-400">
            <input type="text" id="variantSku-${vId}" value="${sku}" placeholder="SKU opcional (ej. VAR-001)" class="variant-sku-val w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-purple-400 uppercase">
            <input type="text" id="variantDesc-${vId}" value="${description}" placeholder="Descripción extra (opcional)" class="variant-desc-val w-full md:col-span-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-purple-400">
        </div>
        <button type="button" onclick="document.getElementById('variantBox-${vId}').remove()" class="w-10 h-10 flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-100 rounded-lg transition flex-shrink-0 mt-2 md:mt-0">
            <i class="fas fa-trash"></i>
        </button>
    `;
    document.getElementById('variantsContainer').appendChild(div);
};

let opcionExtraCount = 0;
window.addOpcionExtraField = (name = '', url = '') => {
    opcionExtraCount++;
    const oId = opcionExtraCount;
    const div = document.createElement('div');
    div.id = `opcionExtraBox-${oId}`;
    div.className = 'flex flex-col md:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm opcionExtra-item';
    div.innerHTML = `
        <div class="w-16 h-16 bg-gray-50 border border-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center cursor-pointer overflow-hidden relative" onclick="openCloudinaryWidget('opcionExtra', ${oId})">
            <img id="opcionExtraPreview-${oId}" src="${url}" class="w-full h-full object-cover ${url ? '' : 'hidden'}">
            <i id="opcionExtraIcon-${oId}" class="fas fa-camera text-gray-300 ${url ? 'hidden' : ''}"></i>
            <input type="hidden" id="opcionExtraUrl-${oId}" class="opcionExtra-img-val" value="${url}">
        </div>
        <div class="flex-1 w-full flex items-center gap-2">
            <input type="text" id="opcionExtraName-${oId}" value="${name}" placeholder="Formato / Diseño (Ej. Raya, Libreta azul)" class="opcionExtra-name-val w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-400">
        </div>
        <button type="button" onclick="document.getElementById('opcionExtraBox-${oId}').remove()" class="w-10 h-10 flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-100 rounded-lg transition flex-shrink-0 mt-2 md:mt-0">
            <i class="fas fa-trash"></i>
        </button>
    `;
    document.getElementById('opcionesExtraContainer').appendChild(div);
};

window.openProductModal = (id = null, data = null) => {
    editProductId = id;
    document.getElementById('productModalTitle').textContent = id ? 'Editar Artículo' : 'Nuevo Artículo';
    document.getElementById('productForm').reset();
    document.getElementById('imgPreview').classList.add('hidden');
    document.getElementById('uploadIcon').classList.remove('hidden');
    document.getElementById('uploadLabel').textContent = 'Haz clic o arrastra una imagen aquí';
    document.getElementById('productImageUrl').value = '';

    document.getElementById('variantsContainer').innerHTML = '';
    document.getElementById('extraImagesContainer').innerHTML = '';
    document.getElementById('opcionesExtraContainer').innerHTML = '';

    // Se cargan dinámicamente desde los productos existentes en loadProducts()
    if (id && data) {
        document.getElementById('productName').value = data.name || '';
        document.getElementById('productSKU').value = data.sku || '';
        document.getElementById('productCategory').value = data.category || '';
        document.getElementById('productDesc').value = data.description || '';
        document.getElementById('productStock').value = data.stock ?? '';
        document.getElementById('productStatus').value = data.status || 'Activo';
        document.getElementById('priceIndividual').value = data.precioIndividual || '';
        document.getElementById('priceMayoreo').value = data.precioMayoreo || '';
        document.getElementById('minMayoreo').value = data.minMayoreo || 5;
        document.getElementById('priceCaja').value = data.precioCaja || '';
        document.getElementById('minCaja').value = data.minCaja || 24;
        document.getElementById('cajaSurtida').checked = data.cajaSurtida === true;
        document.getElementById('priceEspecial').value = data.precioEspecial || '';
        document.getElementById('minEspecial').value = data.minEspecial || 50;
        document.getElementById('productImageUrl').value = data.imageUrl || '';

        if (data.imageUrl) {
            const prev = document.getElementById('imgPreview');
            prev.src = data.imageUrl;
            prev.classList.remove('hidden');
            document.getElementById('uploadIcon').classList.add('hidden');
        }

        if (data.variants && data.variants.length > 0) {
            data.variants.forEach(v => {
                addVariantField(v.name, v.imageUrl, v.sku || '', v.description || '');
            });
        }
        if (data.extraImages && data.extraImages.length > 0) {
            data.extraImages.forEach(url => {
                addExtraImageField(url);
            });
        }
        if (data.opcionesExtra && data.opcionesExtra.length > 0) {
            data.opcionesExtra.forEach(opt => {
                const nameStr = typeof opt === 'string' ? opt : opt.name;
                const imgStr = typeof opt === 'string' ? '' : opt.imageUrl;
                addOpcionExtraField(nameStr, imgStr);
            });
        }
        // Restore sections
        const savedSections = data.sections || [];
        document.querySelectorAll('.section-check').forEach(cb => {
            cb.checked = savedSections.includes(cb.value);
        });
    } else {
        // Clear all section checks for new product
        document.querySelectorAll('.section-check').forEach(cb => cb.checked = false);
    }
    openModal('productModal');
};

window.closeProductModal = () => closeModal('productModal');

window.editProduct = (id) => {
    // This function will be called from the table row.
    // We need to fetch the product data first.
    getDoc(doc(db, 'productos', id)).then(d => {
        if (d.exists()) {
            openProductModal(d.id, d.data());
        } else {
            showToast('Artículo no encontrado', 'error');
        }
    }).catch(err => {
        console.error('Error fetching product for edit:', err);
        showToast('Error al cargar artículo para editar', 'error');
    });
};

window.saveProduct = async () => {
    const btn = document.getElementById('saveProductBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    btn.disabled = true;

    try {
        const imageUrl = document.getElementById('productImageUrl').value;

        // Recopilar variantes
        const variants = [];
        document.querySelectorAll('.variant-item').forEach(el => {
            const vName = el.querySelector('.variant-name-val').value.trim();
            const vUrl = el.querySelector('.variant-img-val').value.trim();
            const vSku = el.querySelector('.variant-sku-val')?.value.trim() || '';
            const vDesc = el.querySelector('.variant-desc-val')?.value.trim() || '';
            if (vName || vUrl) {
                variants.push({ name: vName, imageUrl: vUrl, sku: vSku, description: vDesc });
            }
        });

        // Recopilar imágenes extra
        const extraImages = [];
        document.querySelectorAll('.extra-img-val').forEach(el => {
            const eUrl = el.value.trim();
            if (eUrl) extraImages.push(eUrl);
        });

        // Collect sections
        const sections = [];
        document.querySelectorAll('.section-check').forEach(cb => {
            if (cb.checked) sections.push(cb.value);
        });

        const opcionesExtra = [];
        document.querySelectorAll('.opcionExtra-item').forEach(el => {
            const oName = el.querySelector('.opcionExtra-name-val').value.trim();
            const oUrl = el.querySelector('.opcionExtra-img-val').value.trim();
            if (oName || oUrl) {
                opcionesExtra.push({ name: oName, imageUrl: oUrl });
            }
        });

        const productData = {
            name: document.getElementById('productName').value.trim(),
            sku: document.getElementById('productSKU').value.trim().toUpperCase(),
            category: document.getElementById('productCategory').value.trim().toUpperCase(),
            description: document.getElementById('productDesc').value.trim(),
            imageUrl: imageUrl || '',
            extraImages: extraImages,
            variants: variants,
            sections: sections,
            opcionesExtra: opcionesExtra,
            stock: parseInt(document.getElementById('productStock').value) || 0,
            status: document.getElementById('productStatus').value || 'Activo',
            precioIndividual: parseFloat(document.getElementById('priceIndividual').value) || 0,
            precioMayoreo: parseFloat(document.getElementById('priceMayoreo').value) || 0,
            minMayoreo: parseInt(document.getElementById('minMayoreo').value) || 5,
            precioCaja: parseFloat(document.getElementById('priceCaja').value) || 0,
            minCaja: parseInt(document.getElementById('minCaja').value) || 24,
            cajaSurtida: document.getElementById('cajaSurtida').checked,
            precioEspecial: parseFloat(document.getElementById('priceEspecial').value) || 0,
            minEspecial: parseInt(document.getElementById('minEspecial').value) || 50,
            updatedAt: new Date().toISOString()
        };

        if (!productData.name || !productData.category || productData.precioIndividual === 0) {
            showToast('Completa nombre, categoría y precio individual', 'error'); return;
        }

        if (editProductId) {
            await updateDoc(doc(db, 'productos', editProductId), productData);
            showToast('✓ Artículo actualizado', 'success');
        } else {
            productData.createdAt = new Date().toISOString();
            await addDoc(collection(db, 'productos'), productData);
            showToast('✓ Artículo agregado al catálogo', 'success');
        }

        closeProductModal();
        loadProducts();
    } catch (err) {
        console.error(err);
        showToast('Error guardando artículo', 'error');
    } finally {
        btn.innerHTML = '<i class="fas fa-save"></i> <span>Guardar</span>';
        btn.disabled = false;
    }
};

window.deleteProduct = async (id) => {
    if (!confirm('¿Eliminar este artículo del catálogo?')) return;
    await deleteDoc(doc(db, 'productos', id));
    showToast('Artículo eliminado', 'success');
    loadProducts();
};

window.generateProductSheet = async (productId) => {
    showToast('Generando ficha de producto (funcionalidad en desarrollo)', 'info');
    // Placeholder for actual PDF generation logic
    console.log(`Generating product sheet for product ID: ${productId}`);
};

async function loadProducts() {
    const container = document.getElementById('productsCategoriesContainer');
    if (!container) return; // fail-safe if the UI is missing
    container.innerHTML = `<div class="py-12 text-center text-gray-300"><i class="fas fa-spinner fa-spin text-xl"></i></div>`;

    // Fetch everything in parallel
    const [snap, orderSnap, clientSnap, catSnap] = await Promise.all([
        getDocs(collection(db, 'productos')),
        getDocs(collection(db, 'pedidos')),
        getDocs(collection(db, 'clientes')),
        getDocs(collection(db, 'categorias')),
    ]);

    // Update stat cards
    const dashTotal = document.getElementById('dashTotal');
    if (dashTotal) dashTotal.textContent = snap.size;
    const dashOrders = document.getElementById('dashOrders');
    if (dashOrders) dashOrders.textContent = orderSnap.size;
    const dashClients = document.getElementById('dashClients');
    if (dashClients) dashClients.textContent = clientSnap.size;
    const dashCats = document.getElementById('dashCats');
    if (dashCats) dashCats.textContent = catSnap.size;

    if (snap.empty) {
        container.innerHTML = `<div class="py-12 text-center text-gray-300 font-semibold tracking-widest uppercase text-xs">Sin artículos todavía</div>`;
        return;
    }

    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const categoriesMap = {};

    snap.forEach(d => {
        const p = d.data();
        p.id = d.id;
        const stock = p.stock || 0;
        const costo = p.precioIndividual || 0;
        const catName = (p.category || 'SIN CATEGORÍA').trim().toUpperCase() || 'SIN CATEGORÍA';

        totalStockValue += (stock * costo);
        if (stock === 0) outOfStockCount++;
        else if (stock < 5) lowStockCount++;

        if (!categoriesMap[catName]) categoriesMap[catName] = [];
        categoriesMap[catName].push(p);
    });

    const categoryListElement = document.getElementById('categoryList');
    if (categoryListElement) {
        let optionsHtml = '';
        Object.keys(categoriesMap).forEach(cat => {
            if (cat !== 'SIN CATEGORÍA') optionsHtml += `<option value="${cat}">`;
        });
        categoryListElement.innerHTML = optionsHtml;
    }

    let html = '';

    for (const [catName, products] of Object.entries(categoriesMap)) {
        const catIdSafe = catName.replace(/[^a-zA-Z0-9]/g, '-');
        html += `
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden category-pile">
            <button onclick="toggleCategoryAccordion('${catIdSafe}')" class="w-full px-6 py-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-black rounded-xl justify-center items-center flex text-white shadow-sm flex-shrink-0">
                        <i class="fas fa-tags"></i>
                    </div>
                    <div class="text-left">
                        <h4 class="font-black text-[#0d1b2a] text-lg uppercase tracking-tight leading-tight">${catName}</h4>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">${products.length} producto${products.length > 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 transition-transform" id="icon-cat-${catIdSafe}">
                    <i class="fas fa-chevron-down"></i>
                </div>
            </button>
            <div id="content-cat-${catIdSafe}" class="hidden">
                <div class="overflow-x-auto border-t border-gray-100">
                    <table class="w-full text-left">
                        <thead class="table-header">
                            <tr>
                                <th class="px-6 py-4">ARTÍCULO</th>
                                <th class="px-6 py-4">SKU</th>
                                <th class="px-6 py-4">STOCK</th>
                                <th class="px-6 py-4 hidden md:table-cell text-right">PRECIO</th>
                                <th class="px-6 py-4">ESTADO</th>
                                <th class="px-6 py-4 text-center">GESTIÓN</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-50">
        `;

        products.forEach(p => {
            const stock = p.stock || 0;
            const status = p.status || 'Activo';

            let statusBadge = status === 'Activo'
                ? `<span class="bg-green-50 text-green-600 border border-green-200 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Activo</span>`
                : `<span class="bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Inactivo</span>`;

            let stockText = `<span class="font-black text-gray-700">${stock}</span>`;
            if (stock === 0) stockText = `<span class="font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-md">0</span>`;
            else if (stock < 5) stockText = `<span class="font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md">${stock}</span>`;

            const img = p.imageUrl || 'https://placehold.co/48x48/f5f5f5/ddd?text=IMG';
            
            html += `
            <tr class="hover:bg-gray-50/60 transition-colors group product-row">
                <td class="px-5 py-3.5">
                    <div class="flex items-center gap-3">
                        <img src="${img}" class="w-10 h-10 rounded-lg object-contain bg-gray-50 border border-gray-100" onerror="this.src='https://placehold.co/48x48/f5f5f5/ddd?text=IMG'">
                        <div>
                            <p class="font-bold text-[#0a0a0a] text-sm leading-tight product-name">${p.name}</p>
                            <p class="text-xs text-gray-300 truncate max-w-[160px] mt-0.5">${p.description || '—'}</p>
                        </div>
                    </div>
                </td>
                <td class="px-5 py-3.5"><span class="product-sku text-xs text-gray-500 font-bold uppercase tracking-widest">${p.sku || 'N/A'}</span></td>
                <td class="px-5 py-3.5 text-sm">${stockText}</td>
                <td class="px-5 py-3.5 text-sm hidden md:table-cell">
                    <span class="font-black text-[#0a0a0a] block">$${parseFloat(p.precioIndividual || 0).toFixed(2)}</span>
                    <span class="text-[9px] text-gray-400 font-bold uppercase">Costo: $${parseFloat(p.costo || 0).toFixed(2)}</span>
                </td>
                <td class="px-5 py-3.5 text-sm">${statusBadge}</td>
                <td class="px-6 py-4 flex items-center justify-center gap-2">
                    <button onclick="editProduct('${p.id}')" title="Editar"
                        class="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition">
                        <i class="fas fa-edit text-xs"></i>
                    </button>
                    <button onclick="generateProductSheet('${p.id}')"
                        class="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 transition" title="Generar Ficha Catálogo">
                        <i class="fas fa-file-pdf text-xs"></i>
                    </button>
                    <button onclick="deleteProduct('${p.id}')" title="Eliminar"
                        class="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 rounded-lg text-red-500 transition">
                        <i class="fas fa-trash-alt text-xs"></i>
                    </button>
                </td>
            </tr>`;
        });

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;
    }

    container.innerHTML = html;
}

window.toggleCategoryAccordion = function(catIdSafe) {
    const content = document.getElementById(`content-cat-${catIdSafe}`);
    const icon = document.getElementById(`icon-cat-${catIdSafe}`);
    if (!content || !icon) return;
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.style.transform = 'rotate(180deg)';
        icon.classList.replace('bg-gray-100', 'bg-black');
        icon.classList.replace('text-gray-400', 'text-white');
    } else {
        content.classList.add('hidden');
        icon.style.transform = 'rotate(0deg)';
        icon.classList.replace('bg-black', 'bg-gray-100');
        icon.classList.replace('text-white', 'text-gray-400');
    }
};

document.getElementById('searchInput').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    
    // Si hay búsqueda, expandimos temporalmente todos, si no lo restauramos pero sin colapsar lo que ya estaba abierto manualmente.
    // Una búsqueda filtra filas individualmente
    document.querySelectorAll('.product-row').forEach(row => {
        const name = row.querySelector('.product-name')?.textContent?.toLowerCase() || '';
        const sku = row.querySelector('.product-sku')?.textContent?.toLowerCase() || '';
        
        if (!q || name.includes(q) || sku.includes(q)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });

    // Expandir las categorías que tienen resultados visibles si hay término de búsqueda, ocultar las que no
    if (q) {
        document.querySelectorAll('.category-pile').forEach(pile => {
            const visibleRows = pile.querySelectorAll('.product-row:not([style*="display: none"])').length;
            const content = pile.querySelector('[id^="content-cat-"]');
            const icon = pile.querySelector('[id^="icon-cat-"]');
            
            if (visibleRows > 0) {
                pile.style.display = '';
                if (content && content.classList.contains('hidden')) {
                    content.classList.remove('hidden');
                    icon.style.transform = 'rotate(180deg)';
                    icon.classList.replace('bg-gray-100', 'bg-black');
                    icon.classList.replace('text-gray-400', 'text-white');
                }
            } else {
                pile.style.display = 'none';
            }
        });
    } else {
        // Restaurar estado visual general
        document.querySelectorAll('.category-pile').forEach(pile => {
            pile.style.display = '';
        });
    }
});

// ════════════════════════════════════════════════════════════════════════════
//  CARRUSEL HERO
// ════════════════════════════════════════════════════════════════════════════
    window.openSlideModal = () => {
    document.getElementById('slideId').value = '';
    document.getElementById('slideModalTitle').textContent = 'Nuevo Slide Hero';
    ['slideTitle', 'slideSubtitle', 'slideCtaText', 'slideCtaUrl'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    const typeEl = document.getElementById('slideCtaType');
    if (typeEl) typeEl.value = '#catalogo';
    if (window.toggleSlideCtaUrl) window.toggleSlideCtaUrl();
    document.getElementById('slideOrder').value = '1';
    
    // Reset Desktop Image
    document.getElementById('slideImageUrl').value = '';
    const prev = document.getElementById('slideImgPreview');
    if (prev) { prev.src = ''; prev.classList.add('hidden'); }
    const icon = document.getElementById('slideUploadIcon');
    if (icon) icon.classList.remove('hidden');

    // Reset Mobile Image
    const mobInput = document.getElementById('slideMobileImageUrl');
    if (mobInput) mobInput.value = '';
    const prevM = document.getElementById('slideImgMobilePreview');
    if (prevM) { prevM.src = ''; prevM.classList.add('hidden'); }
    const iconM = document.getElementById('slideMobileUploadIcon');
    if (iconM) iconM.classList.remove('hidden');

    openModal('slideModal');
};
window.closeSlideModal = () => closeModal('slideModal');



window.saveSlide = async () => {
    const btn = document.getElementById('saveSlideBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    btn.disabled = true;

    try {
        const slideId = document.getElementById('slideId').value;
        const imageUrl = document.getElementById('slideImageUrl').value;
        const mobileInput = document.getElementById('slideMobileImageUrl');
        const mobileImageUrl = mobileInput ? mobileInput.value : '';

        if (!imageUrl) { showToast('Sube una imagen de PC primero', 'error'); return; }

        let finalCtaUrl = '';
        const ctaType = document.getElementById('slideCtaType') ? document.getElementById('slideCtaType').value : '#catalogo';
        if (ctaType !== 'url') {
            finalCtaUrl = ctaType;
        } else {
            finalCtaUrl = document.getElementById('slideCtaUrl').value.trim();
        }

        const slideData = {
            imageUrl,
            mobileImageUrl,
            title: document.getElementById('slideTitle').value.trim(),
            subtitle: document.getElementById('slideSubtitle').value.trim(),
            ctaText: document.getElementById('slideCtaText').value.trim(),
            ctaUrl: finalCtaUrl,
            order: parseInt(document.getElementById('slideOrder').value) || 1,
            updatedAt: new Date().toISOString()
        };

        if (slideId) {
            await updateDoc(doc(db, 'heroCarousel', slideId), slideData);
            showToast('✓ Slide actualizado', 'success');
        } else {
            slideData.createdAt = new Date().toISOString();
            await addDoc(collection(db, 'heroCarousel'), slideData);
            showToast('✓ Slide agregado al carrusel', 'success');
        }

        closeSlideModal();
        loadSlides();
    } catch (err) {
        console.error(err);
        showToast('Error guardando slide', 'error');
    } finally {
        btn.innerHTML = '<i class="fas fa-save"></i> Guardar Slide';
        btn.disabled = false;
    }
};

window.editSlide = async (id) => {
    try {
        const d = await getDoc(doc(db, 'heroCarousel', id));
        if (!d.exists()) return;
        const s = d.data();
        
        document.getElementById('slideId').value = id;
        document.getElementById('slideModalTitle').textContent = 'Editar Slide Hero';
        document.getElementById('slideTitle').value = s.title || '';
        document.getElementById('slideSubtitle').value = s.subtitle || '';
        document.getElementById('slideCtaText').value = s.ctaText || '';
        
        const typeEl = document.getElementById('slideCtaType');
        const urlEl = document.getElementById('slideCtaUrl');
        if (['#catalogo', '#descargar-pdf', '#facturacion', '#perfil', '#pedidos'].includes(s.ctaUrl)) {
            if (typeEl) typeEl.value = s.ctaUrl;
            if (urlEl) urlEl.value = '';
        } else {
            if (typeEl) typeEl.value = 'url';
            if (urlEl) urlEl.value = s.ctaUrl || '';
        }
        if (window.toggleSlideCtaUrl) window.toggleSlideCtaUrl();
        document.getElementById('slideOrder').value = s.order || 1;
        
        // Desktop Image
        document.getElementById('slideImageUrl').value = s.imageUrl || '';
        const prev = document.getElementById('slideImgPreview');
        if (s.imageUrl) {
            prev.src = s.imageUrl;
            prev.classList.remove('hidden');
            document.getElementById('slideUploadIcon').classList.add('hidden');
        } else {
            prev.classList.add('hidden');
            document.getElementById('slideUploadIcon').classList.remove('hidden');
        }

        // Mobile Image
        document.getElementById('slideMobileImageUrl').value = s.mobileImageUrl || '';
        const prevM = document.getElementById('slideImgMobilePreview');
        if (s.mobileImageUrl) {
            prevM.src = s.mobileImageUrl;
            prevM.classList.remove('hidden');
            document.getElementById('slideMobileUploadIcon').classList.add('hidden');
        } else {
            prevM.classList.add('hidden');
            document.getElementById('slideMobileUploadIcon').classList.remove('hidden');
        }

        openModal('slideModal');
    } catch (err) {
        console.error(err);
        showToast('Error al cargar slide', 'error');
    }
};

async function loadSlides() {
    const grid = document.getElementById('slidesGrid');
    grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-300"><i class="fas fa-spinner fa-spin text-xl"></i></div>`;

    const snap = await getDocs(query(collection(db, 'heroCarousel'), orderBy('order', 'asc')));
    if (snap.empty) {
        grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-300 font-semibold text-sm uppercase tracking-widest">Sin slides todavía. Agrega el primero con el botón de arriba.</div>`;
        return;
    }

    let html = '';
    snap.forEach(d => {
        const s = d.data();
        const ctaBadge = s.ctaText
            ? `<span class="text-[9px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-wider">${s.ctaText}</span>`
            : '';
        const mobileBadge = s.mobileImageUrl
            ? `<span class="bg-blue-50 text-blue-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-blue-100" title="Contiene versión Móvil"><i class="fas fa-mobile-alt"></i> MÓVIL</span>`
            : '';
        html += `
        <div class="slide-card bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm group">
            <div class="relative h-44 bg-gray-100 overflow-hidden">
                <img src="${s.imageUrl}" alt="${s.title || 'Slide'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                ${s.mobileImageUrl ? `<div class="absolute top-2 left-2 z-10">${mobileBadge}</div>` : ''}
                <div class="absolute bottom-3 left-3 right-3 z-10">
                    ${s.title ? `<p class="text-white font-black text-sm leading-tight drop-shadow">${s.title}</p>` : ''}
                    ${s.subtitle ? `<p class="text-white/70 text-[10px] mt-0.5">${s.subtitle}</p>` : ''}
                </div>
                <div class="absolute top-2 right-2">
                    <span class="bg-black/50 text-white text-[9px] font-black px-2 py-1 rounded-full">#${s.order}</span>
                </div>
            </div>
            <div class="p-3 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    ${ctaBadge}
                    ${!ctaBadge ? `<span class="text-[9px] text-gray-300 font-semibold">Sin botón CTA</span>` : ''}
                </div>
                <div class="flex items-center gap-2">
                    <button onclick='editSlide("${d.id}")' class="w-7 h-7 flex items-center justify-center bg-gray-50 text-gray-400 rounded-lg hover:bg-blue-50 hover:text-blue-500 transition text-xs" title="Editar Slide">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick='deleteSlide("${d.id}")' class="w-7 h-7 flex items-center justify-center bg-gray-50 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-400 transition text-xs" title="Eliminar Slide">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>`;
    });
    grid.innerHTML = html;
}

window.deleteSlide = async (id) => {
    if (!confirm('¿Eliminar este slide?')) return;
    await deleteDoc(doc(db, 'heroCarousel', id));
    showToast('Slide eliminado', 'success');
    loadSlides();
};

// ─── Cargar al iniciar ─────────────────────────────────────────────────────
updateCloudinaryBadge();
loadProducts();

// ════════════════════════════════════════════════════════════════════════════
//  BRANDING / LOGO
// ════════════════════════════════════════════════════════════════════════════
async function loadCurrentLogo() {
    const preview = document.getElementById('currentLogoPreview');
    const status = document.getElementById('currentLogoStatus');
    const preview2 = document.getElementById('currentLogo2Preview');
    const status2 = document.getElementById('currentLogo2Status');

    try {
        const snap = await getDoc(doc(db, 'config', 'branding'));
        const data = snap.exists() ? snap.data() : {};

        if (data.logoUrl) {
            preview.src = data.logoUrl;
            document.getElementById('adminSidebarLogo').src = data.logoUrl;
            status.textContent = 'Logo cargado desde Cloudinary ✓';
            status.className = 'text-xs text-green-500 mt-2 font-semibold';
        } else {
            preview.src = 'https://placehold.co/96x96/1a1a1a/333?text=SIN+LOGO';
            document.getElementById('adminSidebarLogo').src = 'logo.jpg';
            status.textContent = 'No hay logo principal configurado';
            status.className = 'text-xs text-orange-400 mt-2 font-semibold';
        }

        if (data.logo2Url) {
            preview2.src = data.logo2Url;
            status2.textContent = 'Logo tipográfico cargado ✓';
            status2.className = 'text-xs text-green-500 mt-2 font-semibold';
        } else {
            preview2.src = 'https://placehold.co/128x64/f5f5f5/ccc?text=VACIO';
            status2.textContent = 'No hay logo secundario configurado';
            status2.className = 'text-xs text-orange-400 mt-2 font-semibold';
        }
    } catch (err) {
        console.error('Error loading logos:', err);
        status.textContent = 'Error cargando logos';
        status2.textContent = 'Error cargando logos';
    }
}

window.saveLogo = async () => {
    const logoUrl = document.getElementById('newLogoUrl').value;
    const logo2Url = document.getElementById('newLogo2Url').value;

    if (!logoUrl && !logo2Url) {
        showToast('⚠ Sube al menos un logo primero', 'error');
        return;
    }

    const updateData = { updatedAt: new Date().toISOString() };
    if (logoUrl) updateData.logoUrl = logoUrl;
    if (logo2Url) updateData.logo2Url = logo2Url;

    try {
        await setDoc(doc(db, 'config', 'branding'), updateData, { merge: true });
        showToast('✓ Logos guardados correctamente', 'success');
        loadCurrentLogo();

        // Reset upload zone 1
        if (logoUrl) {
            document.getElementById('newLogoPreview').classList.add('hidden');
            document.getElementById('logoUploadIcon').classList.remove('hidden');
            document.getElementById('logoUploadLabel').textContent = 'Haz clic para subir el logo principal';
            document.getElementById('newLogoUrl').value = '';
        }
        // Reset upload zone 2
        if (logo2Url) {
            document.getElementById('newLogo2Preview').classList.add('hidden');
            document.getElementById('logo2UploadIcon').classList.remove('hidden');
            document.getElementById('logo2UploadLabel').textContent = 'Haz clic para subir el logo secundario';
            document.getElementById('newLogo2Url').value = '';
        }
    } catch (err) {
        console.error('Error saving logos:', err);
        showToast('Error guardando logos', 'error');
    }
};

// ════════════════════════════════════════════════════════════════════════════
//  BODY SECTION (Empty State Images)
// ════════════════════════════════════════════════════════════════════════════
let bodySectionUrls = [];

window.renderBodySectionImages = () => {
    const container = document.getElementById('bodySectionImagesContainer');
    if (!container) return;
    container.innerHTML = bodySectionUrls.map((url, i) => `
        <div class="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-32 md:h-40">
            <img src="${url}" class="w-full h-full object-cover">
            <button onclick="removeBodySectionImage(${i})" class="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-600"><i class="fas fa-trash text-xs"></i></button>
        </div>
    `).join('');
};

window.removeBodySectionImage = (index) => {
    bodySectionUrls.splice(index, 1);
    window.renderBodySectionImages();
};

window.loadBodySection = async () => {
    try {
        const snap = await getDoc(doc(db, 'config', 'bodySection'));
        if (snap.exists() && snap.data().imageUrls) {
            bodySectionUrls = snap.data().imageUrls;
        } else if (snap.exists() && snap.data().imageUrl) {
            bodySectionUrls = [snap.data().imageUrl]; // compatibilidad previa
        } else {
            bodySectionUrls = [];
        }
        window.renderBodySectionImages();
    } catch (err) {
        console.error('Error loading body section image:', err);
    }
};

window.saveBodySection = async () => {
    const btn = document.getElementById('saveBodySectionBtn');
    if(btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...'; btn.disabled = true; }
        
    try {
        await setDoc(doc(db, 'config', 'bodySection'), {
            imageUrls: bodySectionUrls,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        showToast('✓ Imágenes guardadas correctamente', 'success');
        loadBodySection();
    } catch (err) {
        console.error('Error saving body section:', err);
        showToast('Error guardando imágenes', 'error');
    } finally {
        if(btn) { btn.innerHTML = '<i class="fas fa-save"></i> Guardar Imágenes'; btn.disabled = false; }
    }
};

// ════════════════════════════════════════════════════════════════════════════
//  CLIENTES / DIRECTORIO
// ════════════════════════════════════════════════════════════════════════════
let allClients = [];

window.loadClients = async function () {
    const tbody = document.getElementById('clientsTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-300 text-sm font-semibold"><i class="fas fa-spinner fa-spin mr-2"></i>Cargando...</td></tr>';
    try {
        const snap = await getDocs(collection(db, 'clientes'));
        allClients = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort by lastLogin descending
        allClients.sort((a, b) => {
            const ta = a.lastLogin?.toDate?.() || new Date(0);
            const tb = b.lastLogin?.toDate?.() || new Date(0);
            return tb - ta;
        });
        document.getElementById('clientCount').textContent = allClients.length;
        renderClients(allClients);
    } catch (err) {
        console.error('Error loading clients:', err);
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-red-400 text-sm font-semibold">Error cargando clientes</td></tr>';
    }
};

function renderClients(clients) {
    const tbody = document.getElementById('clientsTableBody');
    if (clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-300 text-sm font-semibold"><i class="fas fa-user-slash mr-2"></i>No hay clientes registrados</td></tr>';
        return;
    }
    tbody.innerHTML = clients.map(c => {
        let providerDisplay = 'Email';
        let providerIconTag = '<i class="fas fa-envelope text-[10px]"></i>';
        let providerColor = 'text-gray-500';

        if (c.provider === 'google.com') {
            providerDisplay = 'Google';
            providerIconTag = '<i class="fab fa-google text-[10px]"></i>';
            providerColor = 'text-blue-500';
        } else if (c.provider === 'phone') {
            providerDisplay = 'Teléfono';
            providerIconTag = '<i class="fas fa-phone text-[10px]"></i>';
            providerColor = 'text-green-500';
        }

        const providerIcon = `<span class="inline-flex items-center gap-1 text-[11px] font-semibold ${providerColor}">${providerIconTag} ${providerDisplay}</span>`;
        
        const lastLogin = c.lastLogin?.toDate
            ? c.lastLogin.toDate().toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '—';
        const avatar = c.photoURL
            ? `<img src="${c.photoURL}" class="w-8 h-8 rounded-full object-cover border border-gray-200" alt="">`
            : `<div class="w-8 h-8 rounded-full bg-[#0d1b2a] text-white flex items-center justify-center text-[11px] font-black uppercase">${(c.displayName || c.email || c.phone || '?')[0]}</div>`;
        
        const isEspecial = c.precioEspecial === true;

        let contactInfo = c.email || '—';
        if (c.provider === 'phone' || c.phone) {
            let formattedPhone = c.phone || '';
            let country = '';
            if (formattedPhone.startsWith('+52')) {
                formattedPhone = formattedPhone.replace('+52', '');
                country = '🇲🇽 México (+52)';
            }
            contactInfo = `
                <div class="flex flex-col">
                    <span class="font-bold text-gray-800 tracking-wide">${formattedPhone}</span>
                    <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">${country}</span>
                </div>
            `;
        }

        return `
            <tr class="border-t border-gray-50 hover:bg-gray-50/50 transition">
                <td class="px-6 py-3">
                    <div class="flex items-center gap-3">
                        ${avatar}
                        <span class="text-sm font-bold text-gray-800">${c.displayName || '<span class="text-gray-300 italic">Sin nombre completo</span>'}</span>
                    </div>
                </td>
                <td class="px-6 py-3 text-sm text-gray-500 font-medium">${contactInfo}</td>
                <td class="px-6 py-3">${providerIcon}</td>
                <td class="px-6 py-3 text-xs text-gray-400 font-medium">${lastLogin}</td>
                <td class="px-6 py-3">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-black uppercase tracking-widest ${isEspecial ? 'text-purple-600' : 'text-gray-300'}">${isEspecial ? 'Activo' : 'Inactivo'}</span>
                        <button onclick="togglePrecioEspecial('${c.id}', ${isEspecial})"
                            class="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${isEspecial ? 'bg-purple-600' : 'bg-gray-200'}">
                            <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${isEspecial ? 'translate-x-5' : 'translate-x-0'}"></span>
                        </button>
                    </div>
                </td>
                <td class="px-6 py-3">
                    <button onclick="openClientFacturacion('${c.id}')" class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition">
                        <i class="fas fa-file-invoice"></i> Datos Fiscales
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

window.togglePrecioEspecial = async (clientId, currentState) => {
    try {
        await updateDoc(doc(db, 'clientes', clientId), {
            precioEspecial: !currentState
        });
        showToast(`✓ Precio especial ${!currentState ? 'habilitado' : 'deshabilitado'}`, 'success');
        loadClients();
    } catch (err) {
        console.error(err);
        showToast('Error al actualizar precio especial', 'error');
    }
};

window.filterClients = function () {
    const q = (document.getElementById('clientSearch').value || '').toLowerCase();
    if (!q) { renderClients(allClients); return; }
    const filtered = allClients.filter(c =>
        (c.displayName || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
    );
    renderClients(filtered);
};

// ════════════════════════════════════════════════════════════════════════════
//  SECCIONES DEL CATÁLOGO
// ════════════════════════════════════════════════════════════════════════════

// Secciones predefinidas (siempre disponibles para asignar a productos)
const ALL_SECTIONS = [
    { id: 'novedades', label: 'Novedades', icon: '<i class="fas fa-sparkles"></i>', color: '#4f46e5' },
    { id: 'masVendidos', label: 'Más vendidos', icon: '<i class="fas fa-fire"></i>', color: '#dc2626' },
    { id: 'ofertas', label: 'Ofertas especiales', icon: '<i class="fas fa-tag"></i>', color: '#d97706' },
    { id: 'destacados', label: 'Destacados del mes', icon: '<i class="fas fa-star"></i>', color: '#7c3aed' },
    { id: 'mayoreo', label: 'Mayoreo', icon: '<i class="fas fa-box-open"></i>', color: '#0891b2' },
    { id: 'piezasUnicas', label: 'Piezas únicas', icon: '<i class="fas fa-gem"></i>', color: '#be185d' },
    { id: 'remates', label: 'Remates', icon: '<i class="fas fa-bolt"></i>', color: '#b45309' },
    { id: 'exclusivo', label: 'Exclusivo online', icon: '<i class="fas fa-lock"></i>', color: '#064e3b' },
    { id: 'temporada', label: 'Ofertas de temporada', icon: '<i class="fas fa-calendar-alt"></i>', color: '#1d4ed8' },
    { id: 'nuevos', label: 'Recién llegados', icon: '<i class="fas fa-rocket"></i>', color: '#065f46' },
];

async function loadSecciones() {
    const grid = document.getElementById('seccionesGrid');
    if (!grid) return;
    grid.innerHTML = `<div class="col-span-full text-center py-10 text-gray-300"><i class="fas fa-spinner fa-spin text-xl"></i></div>`;

    // Load which sections are active from Firestore
    const snap = await getDoc(doc(db, 'config', 'secciones'));
    const data = snap.exists() ? snap.data() : {};
    const activeSections = data.active || ALL_SECTIONS.map(s => s.id);
    const catalogBtnEnabled = data.catalogButtonEnabled === true;

    // Render the catalog button toggle state
    const statusLabel = document.getElementById('catalogBtnStatusLabel');
    const toggle = document.getElementById('catalogBtnToggle');
    const thumb = document.getElementById('catalogBtnThumb');
    if (statusLabel && toggle && thumb) {
        statusLabel.textContent = catalogBtnEnabled ? 'Visible' : 'Oculto';
        statusLabel.className = `text-[10px] font-black uppercase tracking-widest ${catalogBtnEnabled ? 'text-emerald-500' : 'text-gray-300'}`;
        toggle.className = `relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${catalogBtnEnabled ? 'bg-emerald-500' : 'bg-gray-200'}`;
        thumb.className = `absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${catalogBtnEnabled ? 'translate-x-5' : 'translate-x-0'}`;
    }

    // Count products per section
    const prodSnap = await getDocs(collection(db, 'productos'));
    const countMap = {};
    prodSnap.forEach(d => {
        const sections = d.data().sections || [];
        sections.forEach(s => { countMap[s] = (countMap[s] || 0) + 1; });
    });

    grid.innerHTML = ALL_SECTIONS.map(s => {
        const isActive = activeSections.includes(s.id);
        const count = countMap[s.id] || 0;
        return `
        <div class="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm">
            <div class="flex items-center gap-4">
                <div class="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm" style="background:${s.color}18">
                    ${s.icon}
                </div>
                <div>
                    <p class="font-black text-sm text-gray-800">${s.label}</p>
                    <p class="text-[11px] text-gray-400">${count} producto${count !== 1 ? 's' : ''} asignado${count !== 1 ? 's' : ''}</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-500' : 'text-gray-300'}">${isActive ? 'Visible' : 'Oculta'}</span>
                <button onclick="toggleSeccion('${s.id}', ${isActive})"
                    class="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${isActive ? 'bg-emerald-500' : 'bg-gray-200'}">
                    <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${isActive ? 'translate-x-5' : 'translate-x-0'}"></span>
                </button>
            </div>
        </div>`;
    }).join('');
}

window.toggleCatalogButton = async () => {
    const snap = await getDoc(doc(db, 'config', 'secciones'));
    const data = snap.exists() ? snap.data() : {};
    const current = data.catalogButtonEnabled === true;
    await setDoc(doc(db, 'config', 'secciones'), { catalogButtonEnabled: !current }, { merge: true });
    showToast(`✓ Botón de catálogo ${!current ? 'activado' : 'desactivado'}`, 'success');
    loadSecciones();
};

window.toggleSeccion = async (id, currentlyActive) => {
    const snap = await getDoc(doc(db, 'config', 'secciones'));
    let active = snap.exists() ? (snap.data().active || []) : ALL_SECTIONS.map(s => s.id);
    if (currentlyActive) {
        active = active.filter(s => s !== id);
    } else {
        if (!active.includes(id)) active.push(id);
    }
    await setDoc(doc(db, 'config', 'secciones'), { active }, { merge: true });
    showToast(`✓ Sección ${currentlyActive ? 'ocultada' : 'activada'}`, 'success');
    loadSecciones();
};


// ════════════════════════════════════════════════════════════════════════════
//  THEMES / COLOR CUSTOMIZATION
// ════════════════════════════════════════════════════════════════════════════

const THEME_PRESETS = {
    // ★ OFICIAL — Negro y Blanco original
    official: { primary: '#0a0a0a', accent: '#ffffff', bg: '#f8f8f8', text: '#0a0a0a', gradient: null },
    // Sólidos
    night: { primary: '#0a0a0a', accent: '#00b4d8', bg: '#f8f8f8', text: '#0a0a0a', gradient: null },
    royal: { primary: '#1a237e', accent: '#ffd600', bg: '#e8eaf6', text: '#1a237e', gradient: null },
    emerald: { primary: '#064e3b', accent: '#34d399', bg: '#ecfdf5', text: '#064e3b', gradient: null },
    wine: { primary: '#4a0010', accent: '#f87171', bg: '#fff1f2', text: '#4a0010', gradient: null },
    sol: { primary: '#78350f', accent: '#fbbf24', bg: '#fffbeb', text: '#78350f', gradient: null },
    galaxy: { primary: '#2e1065', accent: '#c084fc', bg: '#faf5ff', text: '#2e1065', gradient: null },
    coral: { primary: '#9a3412', accent: '#fb923c', bg: '#fff7ed', text: '#9a3412', gradient: null },
    silver: { primary: '#1e293b', accent: '#94a3b8', bg: '#f8fafc', text: '#1e293b', gradient: null },
    // Gradientes
    aurora: { primary: '#0f2027', accent: '#48cae4', bg: '#f0f9ff', text: '#0f2027', gradient: 'linear-gradient(135deg,#0f2027,#203a43,#2c5364)' },
    sunset: { primary: '#dd2476', accent: '#ff512f', bg: '#fff0f3', text: '#7c0030', gradient: 'linear-gradient(135deg,#ff512f,#dd2476)' },
    ocean: { primary: '#0052d4', accent: '#6fb1fc', bg: '#eff6ff', text: '#0052d4', gradient: 'linear-gradient(135deg,#0052d4,#4364f7,#6fb1fc)' },
    gemini: { primary: '#4285f4', accent: '#d96570', bg: '#f5f3ff', text: '#2e1065', gradient: 'linear-gradient(135deg,#4285f4,#9b72cb,#d96570)' },
    mint: { primary: '#11998e', accent: '#38ef7d', bg: '#ecfdf5', text: '#064e3b', gradient: 'linear-gradient(135deg,#11998e,#38ef7d)' },
    rosegold: { primary: '#b76e79', accent: '#f5d0c1', bg: '#fff5f5', text: '#7c2d3e', gradient: 'linear-gradient(135deg,#b76e79,#e8a0a0,#f5d0c1)' },
    midnight: { primary: '#141e30', accent: '#6fb1fc', bg: '#f0f4ff', text: '#141e30', gradient: 'linear-gradient(135deg,#141e30,#243b55)' },
    lava: { primary: '#6f0000', accent: '#ff6b6b', bg: '#fff1f2', text: '#6f0000', gradient: 'linear-gradient(135deg,#200122,#6f0000)' },
    candy: { primary: '#b91d73', accent: '#f953c6', bg: '#fdf2f8', text: '#701a4a', gradient: 'linear-gradient(135deg,#f953c6,#b91d73)' },
    forrest: { primary: '#134e5e', accent: '#71b280', bg: '#f0fdf4', text: '#134e5e', gradient: 'linear-gradient(135deg,#134e5e,#71b280)' },
    luxury: { primary: '#0f0c29', accent: '#c084fc', bg: '#faf5ff', text: '#0f0c29', gradient: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' },
    titanium: { primary: '#283048', accent: '#859398', bg: '#f8fafc', text: '#283048', gradient: 'linear-gradient(135deg,#283048,#859398)' },
    peach: { primary: '#c45e2a', accent: '#ffb347', bg: '#fff7ed', text: '#7c2d12', gradient: 'linear-gradient(135deg,#ed8966,#ffb347)' },
    cyber: { primary: '#0a0a0a', accent: '#f4f400', bg: '#f0f0ff', text: '#0a0a0a', gradient: 'linear-gradient(135deg,#0a0a0a,#1a1a2e,#16213e)' },
    arctic: { primary: '#0f3460', accent: '#48cae4', bg: '#eff6ff', text: '#0f3460', gradient: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)' },
    // ── NUEVOS (×16) ─────────────────────────────────────────────────────────
    neon: { primary: '#0d0d0d', accent: '#39ff14', bg: '#f0fff4', text: '#0d0d0d', gradient: 'linear-gradient(135deg,#0d0d0d,#003300)' },
    cherry: { primary: '#c62a47', accent: '#ff6b6b', bg: '#fff5f7', text: '#6b0017', gradient: 'linear-gradient(135deg,#360033,#0b8793)' },
    dusk: { primary: '#2b1055', accent: '#ff9a9e', bg: '#ffecd2', text: '#2b1055', gradient: 'linear-gradient(135deg,#2b1055,#7597de)' },
    matrix: { primary: '#001f00', accent: '#00ff41', bg: '#f0fff4', text: '#001f00', gradient: 'linear-gradient(135deg,#000000,#001f00,#003300)' },
    volcanic: { primary: '#1a0000', accent: '#ff4500', bg: '#fff5f0', text: '#7c1500', gradient: 'linear-gradient(135deg,#1a0000,#7c1500,#ff4500)' },
    cotton: { primary: '#f6a7c1', accent: '#84d8f5', bg: '#fdf0f8', text: '#5e2750', gradient: 'linear-gradient(135deg,#fccb90,#d57eeb)' },
    electric: { primary: '#3d0066', accent: '#bf00ff', bg: '#f9f0ff', text: '#3d0066', gradient: 'linear-gradient(135deg,#3d0066,#7b00d4,#bf00ff)' },
    golden: { primary: '#7b4f00', accent: '#f7c948', bg: '#fffaeb', text: '#7b4f00', gradient: 'linear-gradient(135deg,#f7971e,#ffd200)' },
    nordic: { primary: '#1b2a4a', accent: '#76d7ea', bg: '#f0faff', text: '#1b2a4a', gradient: 'linear-gradient(135deg,#1b2a4a,#2e6b8a,#76d7ea)' },
    bloom: { primary: '#6d1b4e', accent: '#f9a8d4', bg: '#fff0f9', text: '#6d1b4e', gradient: 'linear-gradient(135deg,#ff9a9e,#fad0c4,#ffecd2)' },
    thunder: { primary: '#1c1c2e', accent: '#a78bfa', bg: '#f5f3ff', text: '#1c1c2e', gradient: 'linear-gradient(135deg,#1c1c2e,#2d2b55,#3d3870)' },
    holographic: { primary: '#0d1b2a', accent: '#00f5ff', bg: '#f0ffff', text: '#0d1b2a', gradient: 'linear-gradient(135deg,#667eea,#764ba2,#f093fb,#f5576c)' },
    obsidian: { primary: '#0a0a0a', accent: '#64748b', bg: '#f8fafc', text: '#0a0a0a', gradient: 'linear-gradient(135deg,#0a0a0a,#1a1a2e,#16213e,#0f3460)' },
    paradise: { primary: '#005c4b', accent: '#00d2a8', bg: '#f0fdf9', text: '#005c4b', gradient: 'linear-gradient(135deg,#00b09b,#96c93d)' },
    blazing: { primary: '#7c2d12', accent: '#fb923c', bg: '#fff7ed', text: '#7c2d12', gradient: 'linear-gradient(135deg,#f83600,#f9d423)' },
    abyss: { primary: '#080016', accent: '#818cf8', bg: '#f0f0ff', text: '#080016', gradient: 'linear-gradient(135deg,#080016,#150025,#1e003b,#3b0070)' },
    tropical: { primary: '#064e3b', accent: '#34d399', bg: '#f0fdf9', text: '#064e3b', gradient: 'linear-gradient(135deg,#11998e,#38ef7d,#00b4d8)' },
};



function setColorInputs(colors) {
    document.getElementById('colorPrimary').value = colors.primary;
    document.getElementById('colorPrimaryHex').value = colors.primary;
    document.getElementById('colorAccent').value = colors.accent;
    document.getElementById('colorAccentHex').value = colors.accent;
    document.getElementById('colorBg').value = colors.bg;
    document.getElementById('colorBgHex').value = colors.bg;
    document.getElementById('colorText').value = colors.text;
    document.getElementById('colorTextHex').value = colors.text;
}

function getColorInputs() {
    return {
        primary: document.getElementById('colorPrimary').value,
        accent: document.getElementById('colorAccent').value,
        bg: document.getElementById('colorBg').value,
        text: document.getElementById('colorText').value,
    };
}

function updatePreviewBar(colors) {
    const bar = document.getElementById('themePreviewBar');
    const btn = document.getElementById('themePreviewBtn');
    const title = document.getElementById('themePreviewTitle');
    const sub = document.getElementById('themePreviewSub');

    if (!bar) return;
    bar.style.background = colors.gradient || colors.primary;
    btn.style.background = colors.primary;
    btn.style.borderColor = colors.accent;
    btn.style.color = '#fff';
    title.style.color = '#ffffff';
    sub.style.color = 'rgba(255,255,255,0.4)';
}

function highlightActivePreset(name) {
    document.querySelectorAll('.theme-preset-btn').forEach(btn => {
        const isActive = btn.dataset.theme === name;
        btn.style.borderColor = isActive ? '#0d1b2a' : 'transparent';
        btn.style.boxShadow = isActive ? '0 0 0 3px rgba(13,27,42,0.2)' : 'none';
    });
}

// Store active gradient for saving
let _activeGradient = null;

window.applyPreset = function (name) {
    const colors = THEME_PRESETS[name];
    if (!colors) return;
    _activeGradient = colors.gradient || null;
    setColorInputs(colors);
    updatePreviewBar(colors);
    highlightActivePreset(name);
};

window.previewCustomTheme = function () {
    const colors = getColorInputs();
    // Sync hex inputs
    document.getElementById('colorPrimaryHex').value = colors.primary;
    document.getElementById('colorAccentHex').value = colors.accent;
    document.getElementById('colorBgHex').value = colors.bg;
    document.getElementById('colorTextHex').value = colors.text;
    updatePreviewBar(colors);
    // Clear active preset selection (custom)
    highlightActivePreset('__none__');
};

window.syncColorFromText = function (colorId, hexId) {
    const val = document.getElementById(hexId).value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        document.getElementById(colorId).value = val;
        previewCustomTheme();
    }
};

window.saveTheme = async function () {
    const colors = getColorInputs();
    try {
        await setDoc(doc(db, 'config', 'theme'), {
            ...colors,
            gradient: _activeGradient || null,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        const result = document.getElementById('themeSaveResult');
        result.classList.remove('hidden');
        setTimeout(() => result.classList.add('hidden'), 3500);
        showToast('✓ Tema guardado correctamente', 'success');
    } catch (err) {
        console.error('Error saving theme:', err);
        showToast('Error guardando tema', 'error');
    }
};

async function loadCurrentTheme() {
    try {
        const snap = await getDoc(doc(db, 'config', 'theme'));
        if (snap.exists()) {
            const colors = snap.data();
            setColorInputs({
                primary: colors.primary || '#0a0a0a',
                accent: colors.accent || '#00b4d8',
                bg: colors.bg || '#f8f8f8',
                text: colors.text || '#0a0a0a',
            });
            updatePreviewBar(colors);
        }
    } catch (err) {
        console.error('Error loading theme:', err);
    }
}

// ── Body Section & Pre-Footer Images Management ──────────────────────────────
window.currentBodySectionImages = [];
window.currentPreFooterImages = [];

window.addBodySectionImage = (url) => {
    window.currentBodySectionImages.push(url);
    window.renderBodySectionImages();
};

window.addPreFooterImage = (url) => {
    window.currentPreFooterImages.push(url);
    window.renderPreFooterImages();
};

window.renderBodySectionImages = () => {
    const container = document.getElementById('bodySectionImagesContainer');
    if (!container) return;
    container.innerHTML = window.currentBodySectionImages.map((url, idx) => `
        <div class="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
            <img src="${url}" class="w-full h-full object-cover">
            <button onclick="removeBodySectionImage(${idx})" class="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg">
                <i class="fas fa-trash-alt text-xs"></i>
            </button>
        </div>
    `).join('');
};

window.removeBodySectionImage = (idx) => {
    window.currentBodySectionImages.splice(idx, 1);
    window.renderBodySectionImages();
};

window.loadBodySection = async () => {
    const snap = await getDoc(doc(db, 'config', 'bodySection'));
    if (snap.exists()) {
        const data = snap.data();
        window.currentBodySectionImages = data.imageUrls || (data.imageUrl ? [data.imageUrl] : []);
    } else {
        window.currentBodySectionImages = [];
    }
    window.renderBodySectionImages();
};

window.saveBodySection = async () => {
    const btn = document.getElementById('saveBodySectionBtn');
    if (btn) btn.disabled = true;
    try {
        await setDoc(doc(db, 'config', 'bodySection'), { imageUrls: window.currentBodySectionImages }, { merge: true });
        showToast('✓ Imágenes Body Section guardadas', 'success');
    } catch (err) {
        console.error(err);
        showToast('Error al guardar', 'error');
    } finally {
        if (btn) btn.disabled = false;
    }
};

window.renderPreFooterImages = () => {
    const container = document.getElementById('preFooterImagesContainer');
    if (!container) return;
    container.innerHTML = window.currentPreFooterImages.map((url, idx) => `
        <div class="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
            <img src="${url}" class="w-full h-full object-cover">
            <button onclick="removePreFooterImage(${idx})" class="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg">
                <i class="fas fa-trash-alt text-xs"></i>
            </button>
        </div>
    `).join('');
};

window.removePreFooterImage = (idx) => {
    window.currentPreFooterImages.splice(idx, 1);
    window.renderPreFooterImages();
};

window.loadPreFooter = async () => {
    const snap = await getDoc(doc(db, 'config', 'preFooter'));
    if (snap.exists()) {
        const data = snap.data();
        window.currentPreFooterImages = data.imageUrls || [];
    } else {
        window.currentPreFooterImages = [];
    }
    window.renderPreFooterImages();
};

window.savePreFooter = async () => {
    const btn = document.getElementById('savePreFooterBtn');
    if (btn) btn.disabled = true;
    try {
        await setDoc(doc(db, 'config', 'preFooter'), { imageUrls: window.currentPreFooterImages }, { merge: true });
        showToast('✓ Imágenes Pre-Footer guardadas', 'success');
    } catch (err) {
        console.error(err);
        showToast('Error al guardar', 'error');
    } finally {
        if (btn) btn.disabled = false;
    }
};

// Load theme when switching (hook into switchTab wrapper)
const _origSwitchTab = window.switchTab;
window.switchTab = function (tabId) {
    _origSwitchTab(tabId);
    if (tabId === 'temas') loadCurrentTheme();
    if (tabId === 'bodysection') loadBodySection();
    if (tabId === 'prefooter') loadPreFooter();
    if (tabId === 'editor-visual') {
        const frame = document.getElementById('wixPreviewFrame');
        if (frame) {
            const doSend = () => setTimeout(() => wixSendToFrame(), 400);
            try {
                if (frame.contentDocument && frame.contentDocument.readyState === 'complete') doSend();
                else frame.addEventListener('load', doSend, { once: true });
            } catch(e) { doSend(); }
        }
        loadVisualSettings();
    }
};

// ════════════════════════════════════════════════════════════════════════════
//  PEDIDOS
// ════════════════════════════════════════════════════════════════════════════
window.loadOrders = async () => {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="px-8 py-12 text-center text-gray-300 font-bold uppercase tracking-widest text-xs"><i class="fas fa-spinner fa-spin mr-2"></i>Cargando pedidos...</td></tr>';

    try {
        const snap = await getDocs(query(collection(db, 'pedidos'), orderBy('createdAt', 'desc')));
        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-8 py-12 text-center text-gray-300 font-bold uppercase tracking-widest text-xs">No hay pedidos registrados</td></tr>';
            return;
        }

        tbody.innerHTML = snap.docs.map(d => {
            const o = d.data();
            const itemsHtml = o.items.map(it => `<div class="text-[11px] font-bold text-gray-700 leading-tight">▪ ${it.name} <span class="text-gray-400">×${it.quantity}</span></div>`).join('');
            const date = new Date(o.createdAt).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

            let statusClass = 'bg-gray-100 text-gray-500';
            if (o.status === 'Pendiente') statusClass = 'bg-amber-100 text-amber-600';
            if (o.status === 'Enviado') statusClass = 'bg-blue-100 text-blue-600';
            if (o.status === 'Completado') statusClass = 'bg-emerald-100 text-emerald-600';

            return `
            <tr class="border-b border-gray-50 hover:bg-gray-50/50 transition">
                <td class="px-8 py-4">
                    <p class="text-xs font-black text-gray-900 leading-none mb-1">ID: ${d.id.slice(-6).toUpperCase()}</p>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">${date}</p>
                </td>
                <td class="px-8 py-4">
                    <p class="text-xs font-black text-[#0d1b2a]">${o.userName || 'Usuario'}</p>
                    ${o.requiereFactura ? '<span class="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">Factura</span>' : ''}
                </td>
                <td class="px-8 py-4 space-y-1">${itemsHtml}</td>
                <td class="px-8 py-4 text-sm font-black text-gray-900">$${o.total.toFixed(2)}</td>
                <td class="px-8 py-4">
                    <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${statusClass}">${o.status}</span>
                </td>
                <td class="px-8 py-4">
                    <div class="flex gap-2">
                        <select onchange="updateOrderStatus('${d.id}', this.value)" class="text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400">
                            <option value="Pendiente" ${o.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="Enviado" ${o.status === 'Enviado' ? 'selected' : ''}>Enviado</option>
                            <option value="Completado" ${o.status === 'Completado' ? 'selected' : ''}>Completado</option>
                            <option value="Cancelado" ${o.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                    </div>
                </td>
            </tr>`;
        }).join('');
    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="6" class="px-8 py-12 text-center text-red-500 font-bold uppercase tracking-widest text-xs">Error al cargar pedidos</td></tr>';
    }
};

window.updateOrderStatus = async (id, newStatus) => {
    try {
        await updateDoc(doc(db, 'pedidos', id), { status: newStatus });
        showToast(`✓ Estado del pedido actualizado a ${newStatus}`, 'success');
        loadOrders();
    } catch (err) {
        console.error(err);
        showToast('Error al actualizar estado', 'error');
    }
};

window.generateProductSheet = async (id) => {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    const docPDF = new jspdf.jsPDF({ orientation: 'landscape', unit: 'px', format: [600, 420] });

    // Background Split
    docPDF.setFillColor(245, 209, 209); // Pinkish
    docPDF.rect(0, 0, 300, 420, 'F');
    docPDF.setFillColor(200, 233, 240); // Blueish
    docPDF.rect(300, 0, 300, 420, 'F');

    // SKU
    docPDF.setFont('helvetica', 'bold');
    docPDF.setFontSize(50);
    docPDF.setTextColor(0, 0, 0);
    docPDF.text(p.sku || 'SIN SKU', 450, 70, { align: 'center' });

    // Name
    docPDF.setFontSize(22);
    docPDF.text(p.name, 450, 100, { align: 'center' });

    // Specifications Label
    docPDF.setFontSize(14);
    docPDF.text('ESPECIFICACIONES', 350, 160);
    docPDF.setDrawColor(0, 0, 0);
    docPDF.line(350, 165, 550, 165);

    // Table
    const specs = [
        ['Tipo', p.category || '—'],
        ['Interior', p.description?.slice(0, 20) || '—'],
        ['Tamaño', 'A5 15.5x20.5'],
        ['Precio Mayoreo', `$${p.priceMayoreo || p.price}`],
        ['Precio por caja', `$${p.priceCaja || '—'}`],
        ['Cantidad pzas/caja', p.stock?.toString() || '—']
    ];

    let y = 190;
    specs.forEach(([label, value]) => {
        docPDF.setFontSize(11);
        docPDF.setFont('helvetica', 'bold');
        docPDF.text(label, 350, y);
        docPDF.setFont('helvetica', 'normal');
        docPDF.text(value.toString(), 550, y, { align: 'right' });
        docPDF.setDrawColor(200, 200, 200);
        docPDF.line(350, y + 5, 550, y + 5);
        y += 22;
    });

    // Images
    if (p.imageUrl) {
        try {
            const img = await loadImage(p.imageUrl);
            docPDF.addImage(img, 'WEBP', 30, 30, 240, 200);
        } catch (e) { console.error(e); }
    }

    // Footer Social
    docPDF.setFontSize(10);
    docPDF.text('articulos_redituables7', 90, 395);
    docPDF.text('Articulos Redituables', 280, 395);
    docPDF.text('5572177485\n5521428105', 520, 390, { align: 'right' });

    docPDF.save(`Ficha-${p.name}.pdf`);
};

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

// ════════════════════════════════════════════════════════════════════════════
// EDITOR VISUAL EN VIVO — WIX STYLE (v2)
// ════════════════════════════════════════════════════════════════════════════

// ── Estado global del editor ─────────────────────────────────────────────
let _wixState = {
    colors: {
        bodyBg: '#f8f8f8', bodyBg2: '#e0eafc',
        btnBg: '#000000', btnBg2: '#E91E63', btnText: '#ffffff',
        accent: '#FF7F00', accentBg2: '#ff0080',
        headerBg: '#ffffff', headerBg2: '#0d1b2a', headerText: '#333333', headerBorder: '#e5e7eb',
        navBg: '#f8fafc', navText: '#374151', navActive: '#000000',
        heroOverlay: '#000000', heroTitle: '#ffffff', heroSubtitle: '#e2e8f0',
        cardBg: '#ffffff', cardBorder: '#e5e7eb', cardTitle: '#111827', cardPrice: '#111827',
        footerBg: '#111111', footerBg2: '#1a237e', footerText: '#ffffff', footerLink: '#94a3b8', footerDivider: '#374151',
        textMain: '#111827', textMuted: '#6b7280',
        annBarBg: '#00a0c6', annBarBg2: '#8e24aa',
    },
    sliders: {
        headerHeight: 72, heroOverlayOpacity: 30, heroFontSize: 40, heroHeight: 420,
        annBarFontSize: 10, annBarHeight: 22.5,
        gridCols: 3, gridGap: 16, baseFontSize: 16, letterSpacing: 0, lineHeight: 1.5,
        transitionSpeed: 300, shadowIntensity: 40,
        avisoTexto: '🚧 Página en construcción — Estamos trabajando para ofrecerte una mejor experiencia. ¡Pronto disponible!',
    },
    toggles: {
        headerShadow: false, headerSticky: true, heroAutoplay: true, heroArrows: true,
        cardShadow: false, cardHoverZoom: true, cardBadgeNew: true, cardSquare: false, cardHideBorder: false,
        footerSocial: true, footerMap: false, whatsappFab: true, hideWhatsApp: false, hideFooter: false, glassHeader: false, hideTopBanner: false,
        fadeInAnim: true, hoverLift: true, glassmorphism: false, parallax: false, confetti: false,
        // Gradient toggles
        btnGradient: false, bodyGradient: false, headerGradient: false, footerGradient: false,
        annBarGradient: false, accentGradient: false,
        // Gradient directions (stored in toggles for simplicity)
        btnGradDir: '135deg', bodyGradDir: '135deg', headerGradDir: '90deg',
        footerGradDir: '135deg', annBarGradDir: '90deg', accentGradDir: '135deg',
        // Button shape toggles
        pillButtons: false, flatSearch: false, boldTitles: false,
        // Aviso banner (página en construcción)
        showAviso: false,
    },
    font: "'Outfit', sans-serif",
    borderRadius: '8px',
};
let _wixHasChanges = false;
let _wixDevice = 'desktop';
let _wixDebounceTimer = null;

// Backwards-compat aliases for old code still referencing these
window.changeEditorRadius = (r) => wixSetRadius(r, null);
window.updateLivePreview = () => wixSendToFrame();
window.getVisualSettings = () => _wixState;
window.saveVisualSettings = () => wixSaveSettings();
window.resetLivePreview = () => wixRestoreSettings();

// ── Section switcher ────────────────────────────────────────────────────────
window.switchWixSec = (secId, btn) => {
    document.querySelectorAll('.wix-sec-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.wix-sec-btn').forEach(b => b.classList.remove('active'));
    const sec = document.getElementById('wixSec-' + secId);
    if (sec) sec.classList.add('active');
    if (btn) btn.classList.add('active');
};

// ── Color controls ───────────────────────────────────────────────────────────
window.wixColorChange = (key, val) => {
    _wixState.colors[key] = val;
    const preview = document.getElementById('swp-' + key);
    if (preview) preview.style.background = val;
    const hex = document.getElementById('hex-' + key);
    if (hex) hex.value = val;
    // Also sync secondary accent pickers
    if (key === 'accent') {
        const p2 = document.getElementById('swp-accent2');
        if (p2) p2.style.background = val;
        const h2 = document.getElementById('hex-accent2');
        if (h2) h2.value = val;
    }
    _wixUpdateBtnPreview();
    _wixMarkUnsaved();
    _wixDebounce(() => wixSendToFrame());
};

window.wixHexChange = (key, val) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(val)) return;
    _wixState.colors[key] = val;
    const preview = document.getElementById('swp-' + key);
    if (preview) preview.style.background = val;
    
    // El input tipo color requiere minúsculas para funcionar
    const safeHex = val.toLowerCase();
    
    // Sync the color picker input
    document.querySelectorAll('input[type=color]').forEach(inp => {
        if (inp.getAttribute('oninput') && inp.getAttribute('oninput').includes(`'${key}'`)) {
            inp.value = safeHex;
        }
    });
    _wixMarkUnsaved();
    _wixDebounce(() => wixSendToFrame());
};

// ── Slider controls ─────────────────────────────────────────────────────────
window.wixSliderChange = (key, val, unit) => {
    _wixState.sliders[key] = parseFloat(val);
    const label = document.getElementById('slv-' + key);
    if (label) label.textContent = val + unit;
    _wixMarkUnsaved();
    _wixDebounce(() => wixSendToFrame());
};

// ── Text controls ────────────────────────────────────────────────────────────
window.wixTextChange = (key, val) => {
    _wixState.sliders[key] = val;
    _wixMarkUnsaved();
    _wixDebounce(() => wixSendToFrame());
};

// ── Toggle controls ──────────────────────────────────────────────────────────
window.wixToggleChange = (key, val) => {
    _wixState.toggles[key] = val;
    _wixMarkUnsaved();
    _wixDebounce(() => wixSendToFrame());
};

// ── Border radius ────────────────────────────────────────────────────────────
window.wixSetRadius = (radius, btn) => {
    _wixState.borderRadius = radius;
    document.querySelectorAll('.wix-radius-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    else {
        document.querySelectorAll('.wix-radius-btn').forEach(b => {
            if (b.getAttribute('data-r') === radius) b.classList.add('active');
        });
    }
    _wixMarkUnsaved();
    _wixDebounce(() => wixSendToFrame());
};

// ── Font ─────────────────────────────────────────────────────────────────────
window.wixFontChange = (val) => {
    _wixState.font = val;
    _wixMarkUnsaved();
    _wixDebounce(() => wixSendToFrame());
};

// ── Gradient toggle ───────────────────────────────────────────────────────────
window.wixGradientToggle = (element, enabled) => {
    const controlsId = element + 'GradControls';
    const toggleKey = element + 'Gradient';
    const controls = document.getElementById(controlsId);
    if (controls) controls.style.display = enabled ? 'block' : 'none';
    _wixState.toggles[toggleKey] = enabled;
    _wixUpdateGradientPreview(element);
    _wixUpdateBtnPreview();
    _wixMarkUnsaved();
    _wixDebounce(() => wixSendToFrame());
};

// ── Gradient direction ────────────────────────────────────────────────────────
window.wixGradientDir = (element, dir) => {
    const dirKey = element + 'GradDir';
    _wixState.toggles[dirKey] = dir;
    _wixUpdateGradientPreview(element);
    _wixUpdateBtnPreview();
    _wixMarkUnsaved();
    _wixDebounce(() => wixSendToFrame());
};

// ── Update gradient preview swatch ───────────────────────────────────────────
function _wixUpdateGradientPreview(element) {
    const preview = document.getElementById('grad-preview-' + element);
    if (!preview) return;
    const c = _wixState.colors;
    const t = _wixState.toggles;
    const colorMap = {
        btn: [c.btnBg, c.btnBg2, t.btnGradDir || '135deg'],
        body: [c.bodyBg, c.bodyBg2, t.bodyGradDir || '135deg'],
        header: [c.headerBg, c.headerBg2, t.headerGradDir || '90deg'],
        footer: [c.footerBg, c.footerBg2, t.footerGradDir || '135deg'],
        annBar: [c.annBarBg, c.annBarBg2, t.annBarGradDir || '90deg'],
        accent: [c.accent, c.accentBg2, t.accentGradDir || '135deg'],
    };
    const entry = colorMap[element];
    if (entry) preview.style.background = `linear-gradient(${entry[2]},${entry[0]},${entry[1]})`;
}

// ── Update live button preview ────────────────────────────────────────────────
function _wixUpdateBtnPreview() {
    const c = _wixState.colors;
    const t = _wixState.toggles;
    const btn = document.getElementById('btnLivePreview');
    const acc = document.getElementById('btnLivePreview2');
    if (btn) {
        btn.style.background = t.btnGradient
            ? `linear-gradient(${t.btnGradDir || '135deg'},${c.btnBg},${c.btnBg2})`
            : c.btnBg;
        btn.style.color = c.btnText || '#fff';
        btn.style.borderRadius = _wixState.borderRadius || '12px';
    }
    if (acc) {
        acc.style.background = t.accentGradient
            ? `linear-gradient(${t.accentGradDir || '135deg'},${c.accent},${c.accentBg2})`
            : c.accent;
    }
}

// ── Device selector ──────────────────────────────────────────────────────────
window.wixSetDevice = (device) => {
    _wixDevice = device;
    const wrap = document.getElementById('wixPreviewWrap');
    if (wrap) {
        wrap.className = `wix-preview-iframe-wrap device-${device}`;
    }
    ['desktop', 'tablet', 'mobile'].forEach(d => {
        const btn = document.getElementById('devBtn-' + d);
        if (btn) btn.classList.toggle('active', d === device);
    });
};

// ── Unsaved indicator ────────────────────────────────────────────────────────
function _wixMarkUnsaved() {
    _wixHasChanges = true;
    const badge = document.getElementById('wix-unsaved-indicator');
    const dot = document.getElementById('wix-unsaved-dot');
    if (badge) badge.classList.remove('hidden');
    if (dot) dot.classList.remove('hidden');
}
function _wixClearUnsaved() {
    _wixHasChanges = false;
    const badge = document.getElementById('wix-unsaved-indicator');
    const dot = document.getElementById('wix-unsaved-dot');
    if (badge) badge.classList.add('hidden');
    if (dot) dot.classList.add('hidden');
}

// ── Debounce helper ──────────────────────────────────────────────────────────
function _wixDebounce(fn, ms = 120) {
    clearTimeout(_wixDebounceTimer);
    _wixDebounceTimer = setTimeout(fn, ms);
}

// ── Send settings to iframe via postMessage ──────────────────────────────────
function wixSendToFrame() {
    const frame = document.getElementById('wixPreviewFrame') || document.getElementById('storePreviewFrame');
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage({ type: 'UPDATE_VISUAL_SETTINGS', payload: _wixState }, '*');
}

// ── Populate UI from state ───────────────────────────────────────────────────
function _wixPopulateUI(data) {
    // Colors
    if (data.colors) {
        Object.entries(data.colors).forEach(([key, val]) => {
            _wixState.colors[key] = val;
            const preview = document.getElementById('swp-' + key);
            if (preview) preview.style.background = val;
            const hex = document.getElementById('hex-' + key);
            if (hex) hex.value = val;
            // Sync native color inputs (MUST be exactly 7 chars lowercase #rrggbb for browser to accept)
            let safeHex = val;
            if (safeHex && safeHex.startsWith('#') && safeHex.length === 7) {
                safeHex = safeHex.toLowerCase();
            } else {
                safeHex = '#000000'; // fallback
            }
            document.querySelectorAll('input[type=color]').forEach(inp => {
                if (inp.getAttribute('oninput') && inp.getAttribute('oninput').includes(`'${key}'`)) {
                    inp.value = safeHex;
                }
            });
        });
    }
    // Sliders
    if (data.sliders) {
        Object.entries(data.sliders).forEach(([key, val]) => {
            _wixState.sliders[key] = val;
            const slider = document.getElementById('sl-' + key);
            if (slider) slider.value = val;
            // Get unit from oninput attribute
            let unit = '';
            if (slider) {
                const oi = slider.getAttribute('oninput') || '';
                const m = oi.match(/'([^']*)'\)/);
                if (m) unit = m[1];
            }
            const label = document.getElementById('slv-' + key);
            if (label) label.textContent = val + unit;
        });
    }
    // Toggles
    if (data.toggles) {
        Object.entries(data.toggles).forEach(([key, val]) => {
            _wixState.toggles[key] = val;
            const tog = document.getElementById('tog-' + key);
            if (tog) tog.checked = val;
        });
    }
    // Font
    if (data.font) {
        _wixState.font = data.font;
        const sel = document.getElementById('editorFontFamily');
        if (sel) sel.value = data.font;
    }
    // Border radius
    if (data.borderRadius) {
        wixSetRadius(data.borderRadius, null);
    }
    // Specific text areas/inputs
    if (data.sliders && data.sliders.annTexts) {
        const area = document.getElementById('editorAnnTexts');
        if (area) area.value = data.sliders.annTexts;
    }
    // Aviso de producción
    if (data.sliders && data.sliders.avisoTexto !== undefined) {
        const avisoInput = document.getElementById('editorAvisoTexto');
        if (avisoInput) avisoInput.value = data.sliders.avisoTexto;
    }
    // Show/hide aviso text wrap based on toggle state
    if (data.toggles && data.toggles.showAviso !== undefined) {
        const wrap = document.getElementById('avisoTextoWrap');
        if (wrap) wrap.style.display = data.toggles.showAviso ? 'block' : 'none';
    }
    // Restore gradient control panels and previews
    const gradElements = ['btn', 'body', 'header', 'footer', 'annBar', 'accent'];
    gradElements.forEach(el => {
        const toggleKey = el + 'Gradient';
        const isOn = _wixState.toggles[toggleKey] || false;
        const controls = document.getElementById(el + 'GradControls');
        if (controls) controls.style.display = isOn ? 'block' : 'none';
        const tog = document.getElementById('tog-' + el + 'Gradient');
        if (tog) tog.checked = isOn;
        _wixUpdateGradientPreview(el);
    });
    _wixUpdateBtnPreview();
}

// ── Save to Firestore ────────────────────────────────────────────────────────
window.wixSaveSettings = async () => {
    const btn = document.getElementById('wixSaveBtn');
    const orig = btn ? btn.innerHTML : '';
    if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...'; btn.disabled = true; }

    try {
        // Only save colors/font/radius — no sliders/toggles that could break layout
        const safePayload = {
            colors: { ..._wixState.colors },
            font: _wixState.font,
            borderRadius: _wixState.borderRadius,
            toggles: { ..._wixState.toggles },
            sliders: { ..._wixState.sliders }
        };
        await setDoc(doc(db, 'settings', 'storeDesign'), safePayload, { merge: false });
        _wixClearUnsaved();
        showToast('✓ Diseño guardado en la tienda', 'success');
    } catch (err) {
        console.error('Error saving wix design:', err);
        showToast('Error al guardar el diseño', 'error');
    } finally {
        if (btn) { btn.innerHTML = orig; btn.disabled = false; }
    }
};

// ── Load from Firestore ──────────────────────────────────────────────────────
window.loadVisualSettings = async () => {
    try {
        const snap = await getDoc(doc(db, 'settings', 'storeDesign'));
        if (snap.exists()) {
            const data = snap.data();
            _wixPopulateUI(data);
            setTimeout(() => wixSendToFrame(), 800); // wait for iframe to load
        }
    } catch (err) {
        console.error('Error loading wix settings:', err);
    }
};

// ── Cargar último guardado ────────────────────────────────────────────────────
window.wixLoadLastSaved = async () => {
    await loadVisualSettings();
    _wixClearUnsaved();
    showToast('Cargado desde el último guardado', 'success');
};

// ── Reset Total — quita todos los estilos del editor de la tienda ─────────────
window.wixFullResetStore = async () => {
    if (!confirm('¿Seguro? Esto borrará TODOS los estilos del Editor Visual de la tienda y volverá al diseño original.')) return;
    try {
        // Save a reset marker to Firestore (ThemeListener ignores _reset docs)
        await setDoc(doc(db, 'settings', 'storeDesign'), { _reset: true });
        // Tell the iframe to clear all dynamic styles immediately
        const frame = document.getElementById('wixPreviewFrame');
        if (frame && frame.contentWindow) {
            frame.contentWindow.postMessage({ type: 'RESET_VISUAL_SETTINGS' }, '*');
        }
        _wixClearUnsaved();
        showToast('✓ Tienda restaurada a su diseño original', 'success');
    } catch (err) {
        console.error('Error resetting store:', err);
        showToast('Error al restaurar', 'error');
    }
};

// Backwards compat
window.wixRestoreSettings = window.wixLoadLastSaved;

// ── Re-send on iframe load ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const frame = document.getElementById('wixPreviewFrame');
    if (frame) {
        frame.addEventListener('load', () => {
            setTimeout(() => wixSendToFrame(), 300);
        });
    }
});

// ═════════════════════════════════════════════════════════════
// ══ UBICACIONES ══════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════
let _editUbicacionId = null;

window.openUbicacionModal = (id = null, data = null) => {
    _editUbicacionId = id;
    document.getElementById('ubicacionModalTitle').textContent = id ? 'Editar Ubicación' : 'Nueva Ubicación';
    document.getElementById('ubicNombre').value = data?.nombre || '';
    document.getElementById('ubicDireccion').value = data?.direccion || '';
    document.getElementById('ubicTelefono').value = data?.telefono || '';
    document.getElementById('ubicHorario').value = data?.horario || '';
    document.getElementById('ubicMapUrl').value = data?.mapUrl || '';
    openModal('ubicacionModal');
};

// ── Convierte cualquier URL de Google Maps al formato embed ──
function convertToEmbedUrl(raw) {
    if (!raw) return '';
    raw = raw.trim();
    // Already an embed URL
    if (raw.includes('maps/embed')) return raw;
    // Short URLs like maps.app.goo.gl — can't auto-convert, warn user
    if (raw.includes('goo.gl') || raw.includes('maps.app.goo.gl')) {
        return 'NEEDS_PLACE_ID'; // signal to show help
    }
    // Extract coordinates from /place/ or @lat,lng links
    const coordMatch = raw.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
        const lat = coordMatch[1], lng = coordMatch[2];
        return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d2000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses!2smx!4v1`;
    }
    // Embed via place name/address query as fallback
    const qMatch = raw.match(/[?&]q=([^&]+)/);
    if (qMatch) {
        return `https://www.google.com/maps/embed/v1/place?key=AIzaSyC7k98HTOfgUHt0aFbGG6IVoiA5HowCt-k&q=${qMatch[1]}`;
    }
    // Extract search query from /place/ path
    const placeMatch = raw.match(/\/place\/([^/@?]+)/);
    if (placeMatch) {
        return `https://www.google.com/maps/embed/v1/place?key=AIzaSyC7k98HTOfgUHt0aFbGG6IVoiA5HowCt-k&q=${placeMatch[1]}`;
    }
    return raw; // return as-is if unknown
}

window.saveUbicacion = async () => {
    const rawUrl = document.getElementById('ubicMapUrl').value.trim();
    let mapUrl = convertToEmbedUrl(rawUrl);
    if (mapUrl === 'NEEDS_PLACE_ID') {
        showToast('URL corta detectada. Ve a Google Maps → Compartir → "Insertar mapa" y copia el src del iframe', 'error');
        // Show inline help
        const helpEl = document.getElementById('ubicMapUrlHelp');
        if (helpEl) helpEl.classList.remove('hidden');
        return;
    }
    const data = {
        nombre: document.getElementById('ubicNombre').value.trim(),
        direccion: document.getElementById('ubicDireccion').value.trim(),
        telefono: document.getElementById('ubicTelefono').value.trim(),
        horario: document.getElementById('ubicHorario').value.trim(),
        mapUrl,
        updatedAt: new Date().toISOString()
    };
    if (!data.nombre || !data.direccion) { showToast('Completa nombre y dirección', 'error'); return; }
    try {
        if (_editUbicacionId) {
            await updateDoc(doc(db, 'ubicaciones', _editUbicacionId), data);
        } else {
            await addDoc(collection(db, 'ubicaciones'), { ...data, createdAt: new Date().toISOString() });
        }
        showToast('Ubicación guardada ✓', 'success');
        closeModal('ubicacionModal');
        window.loadUbicaciones();
    } catch(e) { console.error(e); showToast('Error guardando ubicación: ' + e.message, 'error'); }
};


window.deleteUbicacion = async (id) => {
    if (!confirm('¿Eliminar esta ubicación?')) return;
    try {
        await deleteDoc(doc(db, 'ubicaciones', id));
        showToast('Ubicación eliminada', 'success');
        window.loadUbicaciones();
    } catch(e) { showToast('Error: ' + e.message, 'error'); }
};

window.autoFixMapUrl = async (id, encodedUrl) => {
    const fixedUrl = decodeURIComponent(encodedUrl);
    if (!fixedUrl || !id) return;
    try {
        await updateDoc(doc(db, 'ubicaciones', id), { mapUrl: fixedUrl, updatedAt: new Date().toISOString() });
        showToast('✓ URL corregida y guardada', 'success');
        window.loadUbicaciones();
    } catch(e) { showToast('Error al corregir: ' + e.message, 'error'); }
};

window.loadUbicaciones = async () => {
    const container = document.getElementById('ubicacionesList');
    if (!container) return;
    container.innerHTML = '<div class="col-span-full text-center py-12"><i class="fas fa-spinner fa-spin text-2xl text-[#00b4d8]"></i></div>';
    try {
        const snap = await getDocs(collection(db, 'ubicaciones'));
        if (snap.empty) {
            container.innerHTML = '<div class="col-span-full text-center py-16 text-gray-400"><i class="fas fa-map-marker-alt text-4xl mb-3 block opacity-40"></i><p class="font-bold text-sm">No hay ubicaciones registradas</p><p class="text-xs mt-1">Agrega tu primera sucursal con el botón de arriba</p></div>';
            return;
        }
        container.innerHTML = '';
        snap.forEach(d => {
            const loc = { id: d.id, ...d.data() };
            const card = document.createElement('div');
            card.className = 'panel p-0 overflow-hidden';
            const isEmbedUrl = loc.mapUrl && loc.mapUrl.includes('maps/embed');
            const tryFixUrl = loc.mapUrl ? convertToEmbedUrl(loc.mapUrl) : '';
            const canAutoFix = tryFixUrl && tryFixUrl !== 'NEEDS_PLACE_ID' && tryFixUrl !== loc.mapUrl && tryFixUrl.includes('maps/embed');
            
            let mapSection = '';
            if (!loc.mapUrl) {
                mapSection = '<div class="h-[140px] bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center text-gray-300 gap-1"><i class="fas fa-map text-2xl"></i><span class="text-[9px] font-bold uppercase tracking-wider">Sin mapa</span></div>';
            } else if (isEmbedUrl) {
                mapSection = `<div class="h-[140px] overflow-hidden"><iframe src="${loc.mapUrl}" width="100%" height="100%" style="border:0;display:block;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`;
            } else {
                mapSection = `<div class="h-[100px] bg-amber-50 flex flex-col items-center justify-center gap-1.5 px-4 text-center">
                    <i class="fas fa-exclamation-triangle text-amber-400 text-lg"></i>
                    <p class="text-[10px] font-bold text-amber-700 leading-tight">URL inválida — Edita y pega la URL de "Insertar mapa"</p>
                    ${canAutoFix ? `<button onclick="autoFixMapUrl('${loc.id}','${encodeURIComponent(tryFixUrl)}')" class="text-[9px] font-black bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-lg transition"><i class="fas fa-magic mr-1"></i>Auto-corregir</button>` : ''}
                   </div>`;
            }
            
            card.innerHTML = `
                ${mapSection}
                <div class="p-4 space-y-2">
                    <p class="font-black text-gray-900 text-[14px] leading-tight">${loc.nombre}</p>
                    <div class="space-y-1.5">
                        <p class="text-[11px] text-gray-500 font-medium flex items-start gap-1.5 leading-snug">
                            <i class="fas fa-map-marker-alt text-[#00b4d8] mt-0.5 text-[10px] flex-shrink-0"></i>
                            <span>${loc.direccion}</span>
                        </p>
                        ${loc.horario ? `<p class="text-[11px] text-gray-500 font-medium flex items-center gap-1.5"><i class="fas fa-clock text-[#00b4d8] text-[10px]"></i>${loc.horario}</p>` : ''}
                        ${loc.telefono ? `<p class="text-[11px] text-gray-500 font-medium flex items-center gap-1.5"><i class="fas fa-phone text-[#00b4d8] text-[10px]"></i>${loc.telefono}</p>` : ''}
                    </div>
                    <div class="flex gap-2 pt-2 border-t border-gray-100">
                        <button onclick="openUbicacionModal('${loc.id}', JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(loc))}')))" class="flex-1 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-[11px] font-black text-gray-600 transition flex items-center justify-center gap-1.5">
                            <i class="fas fa-pen text-[9px]"></i> Editar
                        </button>
                        <button onclick="deleteUbicacion('${loc.id}')" class="py-2 px-3 bg-red-50 hover:bg-red-100 rounded-xl text-[11px] font-black text-red-500 transition">
                            <i class="fas fa-trash text-[10px]"></i>
                        </button>
                    </div>
                </div>`;
            container.appendChild(card);
        });
    } catch(e) { console.error(e); container.innerHTML = `<div class="col-span-full text-center py-8 text-red-400">Error: ${e.message}</div>`; }
};


// ═════════════════════════════════════════════════════════════
// ══ NOSOTROS ═════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════
let currentNosotrosImageUrl = '';

window.loadNosotros = async () => {
    try {
        const snap = await getDoc(doc(db, 'config', 'nosotros'));
        if (!snap.exists()) return;
        const d = snap.data();
        
        currentNosotrosImageUrl = d.imageUrl || '';
        const prev = document.getElementById('nosotrosImgPreview');
        const ph = document.getElementById('nosotrosImgPlaceholder');
        const btnRm = document.getElementById('btnRemoveNosotrosImg');
        if (currentNosotrosImageUrl) {
            prev.src = currentNosotrosImageUrl;
            prev.classList.remove('hidden');
            ph.classList.add('hidden');
            btnRm.classList.remove('hidden');
        } else {
            prev.src = '';
            prev.classList.add('hidden');
            ph.classList.remove('hidden');
            btnRm.classList.add('hidden');
        }
        document.getElementById('nosotrosTitulo1').value = d.titulo1 || 'Acerca de';
        document.getElementById('nosotrosColor1').value = d.color1 || '#111827';
        document.getElementById('nosotrosTitulo2').value = d.titulo2 || 'Nuestra Empresa';
        document.getElementById('nosotrosColor2').value = d.color2 || '#1d4ed8';
        document.getElementById('nosotrosFondoCuadricula').checked = d.fondoCuadricula !== undefined ? d.fondoCuadricula : false;
        
        document.getElementById('nosotrosLema').value = d.lema || '';
        document.getElementById('nosotrosDescripcion').value = d.descripcion || '';
        document.getElementById('nosotrosColorHistoria').value = d.colorHistoria || '#ffffff';
        document.getElementById('nosotrosMision').value = d.mision || '';
        document.getElementById('nosotrosColorMision').value = d.colorMision || '#f97316';
        document.getElementById('nosotrosVision').value = d.vision || '';
        document.getElementById('nosotrosColorVision').value = d.colorVision || '#06b6d4';
        document.getElementById('nosotrosTelefono').value = d.telefono || '';
        document.getElementById('nosotrosEmail').value = d.email || '';
        document.getElementById('nosotrosInstagram').value = d.instagram || '';
        document.getElementById('nosotrosFacebook').value = d.facebook || '';

        // Valores corporativos
        const fontSel = document.getElementById('nosotrosValoresTitleFont');
        if (fontSel) fontSel.value = d.valoresTitleFont || 'font-sans';

        const container = document.getElementById('nosotrosValoresContainer');
        if (container) { container.innerHTML = ''; }
        (d.valores || []).forEach(v => window.addNosotrosValor(v.icono || 'fas fa-star', v.texto || '', v.desc || '', v.color || '#3b82f6'));

        // Líneas de productos
        const lineasC = document.getElementById('nosotrosLineasContainer');
        if (lineasC) { lineasC.innerHTML = ''; }
        (d.lineas || []).forEach(l => window.addNosotrosLinea(l.icono || 'fas fa-box', l.titulo || '', l.desc || '', l.color || '#3b82f6'));

        // Compromiso
        document.getElementById('nosotrosCompromisoTitulo').value = d.compromisoTitulo || '';
        document.getElementById('nosotrosCompromisoTexto').value = d.compromisoTexto || '';
        document.getElementById('nosotrosCompromisoTags').value = (d.compromisoTags || []).join(', ');

        window.updateNosotrosPreview();
    } catch(e) { console.error(e); }
};

window.handleNosotrosImageSuccess = (url) => {
    currentNosotrosImageUrl = url;
    const prev = document.getElementById('nosotrosImgPreview');
    prev.src = url;
    prev.classList.remove('hidden');
    document.getElementById('nosotrosImgPlaceholder').classList.add('hidden');
    document.getElementById('btnRemoveNosotrosImg').classList.remove('hidden');
    window.updateNosotrosPreview();
};

window.removeNosotrosImage = () => {
    currentNosotrosImageUrl = '';
    const prev = document.getElementById('nosotrosImgPreview');
    prev.src = '';
    prev.classList.add('hidden');
    document.getElementById('nosotrosImgPlaceholder').classList.remove('hidden');
    document.getElementById('btnRemoveNosotrosImg').classList.add('hidden');
    window.updateNosotrosPreview();
};

window.saveNosotros = async () => {
    // Valores corporativos
    const valores = [];
    document.querySelectorAll('.nosotros-valor-item').forEach(row => {
        const icono = row.querySelector('.valor-icono')?.value?.trim() || '';
        const texto = row.querySelector('.valor-texto')?.value?.trim() || '';
        const desc = row.querySelector('.valor-desc')?.value?.trim() || '';
        const color = row.querySelector('.valor-color')?.value?.trim() || '#3b82f6';
        if (texto) valores.push({ icono, texto, desc, color });
    });

    // Líneas de productos
    const lineas = [];
    document.querySelectorAll('.nosotros-linea-item').forEach(row => {
        const icono = row.querySelector('.linea-icono')?.value?.trim() || '';
        const titulo = row.querySelector('.linea-titulo')?.value?.trim() || '';
        const desc = row.querySelector('.linea-desc')?.value?.trim() || '';
        const color = row.querySelector('.linea-color')?.value?.trim() || '#3b82f6';
        if (titulo) lineas.push({ icono, titulo, desc, color });
    });

    // Compromiso tags
    const tagsRaw = document.getElementById('nosotrosCompromisoTags').value.trim();
    const compromisoTags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    const data = {
        titulo1: document.getElementById('nosotrosTitulo1').value.trim(),
        color1: document.getElementById('nosotrosColor1').value.trim(),
        titulo2: document.getElementById('nosotrosTitulo2').value.trim(),
        color2: document.getElementById('nosotrosColor2').value.trim(),
        fondoCuadricula: document.getElementById('nosotrosFondoCuadricula').checked,
        lema: document.getElementById('nosotrosLema').value.trim(),
        descripcion: document.getElementById('nosotrosDescripcion').value.trim(),
        colorHistoria: document.getElementById('nosotrosColorHistoria').value.trim() || '#ffffff',
        mision: document.getElementById('nosotrosMision').value.trim(),
        colorMision: document.getElementById('nosotrosColorMision').value.trim() || '#f97316',
        vision: document.getElementById('nosotrosVision').value.trim(),
        colorVision: document.getElementById('nosotrosColorVision').value.trim() || '#06b6d4',
        telefono: document.getElementById('nosotrosTelefono').value.trim(),
        email: document.getElementById('nosotrosEmail').value.trim(),
        instagram: document.getElementById('nosotrosInstagram').value.trim(),
        facebook: document.getElementById('nosotrosFacebook').value.trim(),
        imageUrl: currentNosotrosImageUrl,
        valores,
        lineas,
        compromisoTitulo: document.getElementById('nosotrosCompromisoTitulo').value.trim(),
        compromisoTexto: document.getElementById('nosotrosCompromisoTexto').value.trim(),
        compromisoTags,
        valoresTitleFont: document.getElementById('nosotrosValoresTitleFont')?.value || 'font-sans',
        updatedAt: new Date().toISOString()
    };
    try {
        await setDoc(doc(db, 'config', 'nosotros'), data);
        showToast('Información guardada ✓', 'success');
    } catch(e) { console.error(e); showToast('Error guardando: ' + e.message, 'error'); }
};

let _valorCounter = 0;
window.addNosotrosValor = (icono = 'fas fa-star', texto = '', desc = '', color = '#3b82f6') => {
    _valorCounter++;
    const id = _valorCounter;
    const div = document.createElement('div');
    div.className = 'nosotros-valor-item bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2';
    div.id = `valorItem-${id}`;
    div.innerHTML = `
        <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100" style="background:${color}10">
                <i class="${icono} text-lg" style="color:${color}"></i>
            </div>
            <div class="flex-1 space-y-2.5">
                <div class="grid grid-cols-2 gap-2.5">
                    <input type="text" value="${texto}" placeholder="Título (Ej. Calidad)" class="valor-texto w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#00b4d8] shadow-sm transition" oninput="updateNosotrosPreview()">
                    <input type="text" value="${icono}" placeholder="Ícono (ej. fas fa-star)" class="valor-icono w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#00b4d8] shadow-sm transition" oninput="updateValorPreviewIcon(this)">
                </div>
                <div class="flex items-center gap-2.5">
                    <input type="text" value="${desc}" placeholder="Breve descripción..." class="valor-desc flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12px] font-medium text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00b4d8] shadow-sm transition">
                    <input type="color" value="${color}" class="valor-color w-9 h-9 rounded-lg border border-gray-200 cursor-pointer flex-shrink-0 p-0 shadow-sm" oninput="updateValorPreviewIcon(this.closest('.nosotros-valor-item').querySelector('.valor-icono'))">
                    <button onclick="document.getElementById('valorItem-${id}').remove();updateNosotrosPreview();" title="Eliminar valor" class="w-9 h-9 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg flex items-center justify-center text-[13px] transition shadow-sm flex-shrink-0"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('nosotrosValoresContainer')?.appendChild(div);
};

let _lineaCounter = 0;
window.addNosotrosLinea = (icono = 'fas fa-box', titulo = '', desc = '', color = '#3b82f6') => {
    _lineaCounter++;
    const id = _lineaCounter;
    const div = document.createElement('div');
    div.className = 'nosotros-linea-item bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2';
    div.id = `lineaItem-${id}`;
    div.innerHTML = `
        <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100" style="background:${color}10">
                <i class="${icono} text-lg" style="color:${color}"></i>
            </div>
            <div class="flex-1 space-y-2.5">
                <div class="grid grid-cols-2 gap-2.5">
                    <input type="text" value="${titulo}" placeholder="Título (Ej. Foami)" class="linea-titulo w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#00b4d8] shadow-sm transition">
                    <input type="text" value="${icono}" placeholder="Ícono (ej. fas fa-box)" class="linea-icono w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#00b4d8] shadow-sm transition" oninput="updateValorPreviewIcon(this)">
                </div>
                <div class="flex items-center gap-2.5">
                    <input type="text" value="${desc}" placeholder="Breve descripción..." class="linea-desc flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12px] font-medium text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00b4d8] shadow-sm transition">
                    <input type="color" value="${color}" class="linea-color w-9 h-9 rounded-lg border border-gray-200 cursor-pointer flex-shrink-0 p-0 shadow-sm" oninput="updateValorPreviewIcon(this.closest('.nosotros-linea-item').querySelector('.linea-icono'))">
                    <button onclick="document.getElementById('lineaItem-${id}').remove();" title="Eliminar línea" class="w-9 h-9 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg flex items-center justify-center text-[13px] transition shadow-sm flex-shrink-0"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('nosotrosLineasContainer')?.appendChild(div);
};

window.updateValorPreviewIcon = (input) => {
    const item = input.closest('.nosotros-valor-item') || input.closest('.nosotros-linea-item');
    if (!item) return;
    const iconEl = item.querySelector('.w-9 i');
    const colorInput = item.querySelector('[type="color"]');
    const iconInput = item.querySelector('.valor-icono') || item.querySelector('.linea-icono');
    if (iconEl && iconInput) {
        iconEl.className = iconInput.value;
        if (colorInput) {
            iconEl.style.color = colorInput.value;
            iconEl.parentElement.style.background = colorInput.value + '15';
        }
    }
};

window.updateNosotrosPreview = () => {
    const t = document.getElementById('nosotrosTitulo')?.value || 'Altos Artículos';
    const l = document.getElementById('nosotrosLema')?.value || 'Tu mayorista de confianza';
    const d = document.getElementById('nosotrosDescripcion')?.value || 'Escribe tu descripción aquí...';
    const pt = document.getElementById('previewTitulo');
    const pl = document.getElementById('previewLema');
    const pd = document.getElementById('previewDesc');
    const pv = document.getElementById('previewValores');
    if (pt) pt.textContent = t;
    if (pl) pl.textContent = l;
    if (pd) pd.textContent = d.slice(0, 120) + (d.length > 120 ? '...' : '');
    if (pv) {
        pv.innerHTML = '';
        document.querySelectorAll('.nosotros-valor-item').forEach(row => {
            const icono = row.querySelector('.valor-icono')?.value || 'fas fa-star';
            const texto = row.querySelector('.valor-texto')?.value || '';
            const color = row.querySelector('.valor-color')?.value || '#3b82f6';
            if (texto) {
                const badge = document.createElement('span');
                badge.className = 'text-[10px] bg-white/10 text-white/80 rounded-full px-2 py-1 inline-flex items-center gap-1';
                badge.innerHTML = `<i class="${icono}" style="color:${color}"></i> ${texto}`;
                pv.appendChild(badge);
            }
        });
    }
};

// ── Patch switchTab to lazy-load data ─────────────────────────────────────
const _origSwitchForUbi = window.switchTab;
window.switchTab = function(tab) {
    if (_origSwitchForUbi) _origSwitchForUbi(tab);
    if (tab === 'ubicaciones') window.loadUbicaciones();
    if (tab === 'nosotros') window.loadNosotros();
};

// ── Live preview wiring (run after DOM is ready) ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    ['nosotrosTitulo', 'nosotrosLema', 'nosotrosDescripcion'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', window.updateNosotrosPreview);
    });
});
