import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
    getFirestore, collection, addDoc, getDocs, doc,
    deleteDoc, updateDoc, query, orderBy, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ─── Firebase ────────────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyBZdMTsbZ9lMPhHAUrqNW3d86WEc8gLdrI",
    authDomain: "articulos-redituables-altos.firebaseapp.com",
    projectId: "articulos-redituables-altos",
    storageBucket: "articulos-redituables-altos.firebasestorage.app",
    messagingSenderId: "38804963664",
    appId: "1:38804963664:web:335c693d68f3bb4eceec55",
    measurementId: "G-J60MQEZXRQ"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Cloudinary — Cloud Name pre-configurado ────────────────────────────────
const DEFAULT_CLOUD_NAME = 'dpkeniork';

function getCloudinaryConfig() {
    return {
        cloudName: localStorage.getItem('cld_cloud_name') || DEFAULT_CLOUD_NAME,
        preset: localStorage.getItem('cld_preset') || ''
    };
}

// Pre-guardar cloud name si no existe
if (!localStorage.getItem('cld_cloud_name')) {
    localStorage.setItem('cld_cloud_name', DEFAULT_CLOUD_NAME);
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
        'editor-visual': 'Editor Visual en Vivo Wix'
    };
    document.getElementById('pageTitle').textContent = titles[tabId] || '';

    if (tabId === 'carrusel') loadSlides();
    if (tabId === 'secciones') loadSecciones();
    if (tabId === 'branding') loadCurrentLogo();
    if (tabId === 'dashboard') loadDashboard();
    if (tabId === 'clientes') loadClients();
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

    const widget = cloudinary.createUploadWidget({
        cloudName: cloudName,
        uploadPreset: preset,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        clientAllowedFormats: ['image'],
        maxImageFileSize: 5000000,
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
            } else if (type === 'bodysection') {
                if (window.addBodySectionImage) window.addBodySectionImage(optimizedUrl);
            } else if (type === 'prefooter') {
                if (window.addPreFooterImage) window.addPreFooterImage(optimizedUrl);
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

window.addVariantField = (name = '', url = '') => {
    variantCount++;
    const vId = variantCount;
    const div = document.createElement('div');
    div.id = `variantBox-${vId}`;
    div.className = 'flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm variant-item';
    div.innerHTML = `
        <div class="w-16 h-16 bg-gray-50 border border-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center cursor-pointer overflow-hidden relative" onclick="openCloudinaryWidget('variant', ${vId})">
            <img id="variantPreview-${vId}" src="${url}" class="w-full h-full object-cover ${url ? '' : 'hidden'}">
            <i id="variantIcon-${vId}" class="fas fa-camera text-gray-300 ${url ? 'hidden' : ''}"></i>
            <input type="hidden" id="variantUrl-${vId}" class="variant-img-val" value="${url}">
        </div>
        <div class="flex-1">
            <input type="text" id="variantName-${vId}" value="${name}" placeholder="Nombre (ej. Azul, Diseño 1)" class="variant-name-val w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-purple-400">
        </div>
        <button type="button" onclick="document.getElementById('variantBox-${vId}').remove()" class="w-10 h-10 flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-100 rounded-lg transition flex-shrink-0">
            <i class="fas fa-trash"></i>
        </button>
    `;
    document.getElementById('variantsContainer').appendChild(div);
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
                addVariantField(v.name, v.imageUrl);
            });
        }
        if (data.extraImages && data.extraImages.length > 0) {
            data.extraImages.forEach(url => {
                addExtraImageField(url);
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
            if (vName || vUrl) {
                variants.push({ name: vName, imageUrl: vUrl });
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

        const productData = {
            name: document.getElementById('productName').value.trim(),
            sku: document.getElementById('productSKU').value.trim().toUpperCase(),
            category: document.getElementById('productCategory').value.trim().toUpperCase(),
            description: document.getElementById('productDesc').value.trim(),
            imageUrl: imageUrl || '',
            extraImages: extraImages,
            variants: variants,
            sections: sections,
            stock: parseInt(document.getElementById('productStock').value) || 0,
            status: document.getElementById('productStatus').value || 'Activo',
            precioIndividual: parseFloat(document.getElementById('priceIndividual').value) || 0,
            precioMayoreo: parseFloat(document.getElementById('priceMayoreo').value) || 0,
            minMayoreo: parseInt(document.getElementById('minMayoreo').value) || 5,
            precioCaja: parseFloat(document.getElementById('priceCaja').value) || 0,
            minCaja: parseInt(document.getElementById('minCaja').value) || 24,
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
    ['slideTitle', 'slideSubtitle', 'slideCtaText', 'slideCtaUrl'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
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
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
    btn.disabled = true;

    try {
        const imageUrl = document.getElementById('slideImageUrl').value;
        const mobileInput = document.getElementById('slideMobileImageUrl');
        const mobileImageUrl = mobileInput ? mobileInput.value : '';

        if (!imageUrl) { showToast('Sube una imagen de PC primero', 'error'); return; }

        await addDoc(collection(db, 'heroCarousel'), {
            imageUrl,
            mobileImageUrl,
            title: document.getElementById('slideTitle').value.trim(),
            subtitle: document.getElementById('slideSubtitle').value.trim(),
            ctaText: document.getElementById('slideCtaText').value.trim(),
            ctaUrl: document.getElementById('slideCtaUrl').value.trim(),
            order: parseInt(document.getElementById('slideOrder').value) || 1,
            createdAt: new Date().toISOString()
        });

        showToast('✓ Slide agregado al carrusel', 'success');
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
                <button onclick='deleteSlide("${d.id}")' class="w-7 h-7 flex items-center justify-center bg-gray-50 text-gray-300 rounded-lg hover:bg-red-50 hover:text-red-400 transition text-xs">
                    <i class="fas fa-trash"></i>
                </button>
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
    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-300 text-sm font-semibold"><i class="fas fa-spinner fa-spin mr-2"></i>Cargando...</td></tr>';
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
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-red-400 text-sm font-semibold">Error cargando clientes</td></tr>';
    }
};

function renderClients(clients) {
    const tbody = document.getElementById('clientsTableBody');
    if (clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-300 text-sm font-semibold"><i class="fas fa-user-slash mr-2"></i>No hay clientes registrados</td></tr>';
        return;
    }
    tbody.innerHTML = clients.map(c => {
        const providerIcon = c.provider === 'google.com'
            ? '<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-500"><i class="fab fa-google text-[10px]"></i> Google</span>'
            : '<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500"><i class="fas fa-envelope text-[10px]"></i> Email</span>';
        const lastLogin = c.lastLogin?.toDate
            ? c.lastLogin.toDate().toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '—';
        const avatar = c.photoURL
            ? `<img src="${c.photoURL}" class="w-8 h-8 rounded-full object-cover border border-gray-200" alt="">`
            : `<div class="w-8 h-8 rounded-full bg-[#0d1b2a] text-white flex items-center justify-center text-[11px] font-black uppercase">${(c.displayName || c.email || '?')[0]}</div>`;
        return `
            <tr class="border-t border-gray-50 hover:bg-gray-50/50 transition">
                <td class="px-6 py-3">
                    <div class="flex items-center gap-3">
                        ${avatar}
                        <span class="text-sm font-bold text-gray-800">${c.displayName || '<span class="text-gray-300 italic">Sin nombre</span>'}</span>
                    </div>
                </td>
                <td class="px-6 py-3 text-sm text-gray-500 font-medium">${c.email || '—'}</td>
                <td class="px-6 py-3">${providerIcon}</td>
                <td class="px-6 py-3 text-xs text-gray-400 font-medium">${lastLogin}</td>
                <td class="px-6 py-3">
                    <button onclick="openClientFacturacion('${c.id}')" class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition">
                        <i class="fas fa-file-invoice"></i> Datos Fiscales
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

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
    const activeSections = snap.exists() ? (snap.data().active || []) : ALL_SECTIONS.map(s => s.id);

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
        bodyBg: '#f8f8f8', btnBg: '#000000', btnText: '#ffffff', accent: '#FF7F00',
        headerBg: '#ffffff', headerText: '#333333', headerBorder: '#e5e7eb',
        navBg: '#f8fafc', navText: '#374151', navActive: '#000000',
        heroOverlay: '#000000', heroTitle: '#ffffff', heroSubtitle: '#e2e8f0',
        cardBg: '#ffffff', cardBorder: '#e5e7eb', cardTitle: '#111827', cardPrice: '#111827',
        footerBg: '#111111', footerText: '#ffffff', footerLink: '#94a3b8', footerDivider: '#374151',
        textMain: '#111827', textMuted: '#6b7280',
    },
    sliders: {
        headerHeight: 72, heroOverlayOpacity: 30, heroFontSize: 40, heroHeight: 420,
        gridCols: 3, gridGap: 16, baseFontSize: 16, letterSpacing: 0, lineHeight: 1.5,
        transitionSpeed: 300, shadowIntensity: 40,
    },
    toggles: {
        headerShadow: false, headerSticky: true, heroAutoplay: true, heroArrows: true,
        cardShadow: false, cardHoverZoom: true, cardBadgeNew: true,
        footerSocial: true, footerMap: false, whatsappFab: true, hideWhatsApp: false, hideFooter: false, glassHeader: false, hideTopBanner: false,
        fadeInAnim: true, hoverLift: true, glassmorphism: false, parallax: false, confetti: false,
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
