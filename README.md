# Altos Artículos - Sistema Integral de Catálogo y Ventas 🚀

**Ubicación:** Mesones 123 y Plaza Izazaga en el Centro CDMX, Altos Artículos Redituables.

Este proyecto es una plataforma robusta diseñada para la distribución mayorista de artículos (estilo Betterware / Lumen). Incluye una tienda moderna para usuarios finales y un panel administrativo avanzado con editor en tiempo real.

## 🌟 Características Principales

### 🛒 Tienda (Storefront)
- **Diseño Premium**: Interfaz moderna, rápida y responsiva inspirada en Betterware.
- **Chatbot con IA**: Integración con Google Gemini AI que conoce todo tu catálogo y asiste a los clientes.
- **Estructura de Precios por Volumen**: Manejo automático de precios Individual, Mayoreo, Caja y Especial.
- **Carrito de Compras Optimizadas**: Proceso de pedido fluido con envío directo a WhatsApp.
- **Buscador y Filtros**: Navegación intuitiva por categorías y secciones especiales (Novedades, Ofertas).
- **Generación de Catálogo PDF**: Los clientes pueden descargar el catálogo completo en formato PDF con un clic.

### 🛠️ Panel Administrativo
- **Gestión de Inventario**: Control total sobre productos, imágenes (Cloudinary), SKUs y stock.
- **Editor Visual "Wix-Style"**: Personaliza colores, fuentes, botones y layouts de la tienda con vista previa en vivo.
- **Control de Pedidos**: Gestión y seguimiento de pedidos recibidos por los clientes.
- **Directorio de Clientes**: Base de datos de clientes con sus detalles fiscales para facturación.
- **Carrusel Hero**: Editor de slides publicitarios con soporte para imágenes distintas en móvil y PC.

## 🛠️ Tecnologías Usadas

### Frontend (Tienda)
- **Next.js 15+** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS** (Estilización dinámica)
- **Framer Motion** (Animaciones fluidas)
- **Lucide React** (Iconografía)

### Panel Admin
- **Vanilla JavaScript / HTML5 / CSS3**
- **Firebase SDK**
- **Cloudinary Upload Widget**

### Backend & Servicios
- **Firebase Firestore**: Base de datos NoSQL en tiempo real.
- **Firebase Hosting**: Despliegue de la aplicación.
- **Google Gemini AI**: Inteligencia artificial para el chatbot.
- **Cloudinary**: Gestión y optimización de imágenes en la nube.
- **jsPDF**: Generación dinámica de catálogos y fichas técnicas.

## 🚀 Guía de Instalación y Despliegue

### 1. Requisitos Previos
- Node.js instalado.
- Cuenta en Firebase.
- Cuenta en Cloudinary (para el panel admin).

### 2. Configuración de la Tienda
```bash
cd store
npm install
npm run dev # Para desarrollo local
npm run build # Para preparar producción
```

### 3. Despliegue de la Tienda (Firebase)
1. Instala Firebase Tools: `npm install -g firebase-tools`
2. Inicia sesión: `firebase login`
3. Inicializa (si es necesario): `firebase init`
4. Despliega: `firebase deploy --only hosting`

### 4. Configuración del Panel Admin
El panel admin se encuentra en la carpeta `/admin`. Puede subirse a cualquier servicio de hosting estático (Netlify, Vercel, o el mismo Firebase Hosting en un subdirectorio).
- Asegúrate de configurar tus credenciales de Firebase en `admin/app.js`.

## 📦 Estructura del Proyecto

- `/admin`: Código fuente del panel de administración (HTML/JS/CSS).
- `/store`: Aplicación Next.js del storefront.
- `/.gitignore`: Configuración de archivos excluidos.
- `firebase.json`: Configuración de despliegue y cabeceras de seguridad.

---
Desarrollado para **Altos Artículos Redituables CDMX**.
