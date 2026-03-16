const fs = require('fs');

const file = fs.readFileSync('src/app/page.tsx', 'utf-8');

function extractBetween(str, start, end) {
    const i = str.indexOf(start);
    if (i === -1) return null;
    const startIdx = i;
    const suffix = str.substring(startIdx + start.length);
    const j = suffix.indexOf(end);
    if (j === -1) return null;
    return str.substring(startIdx, startIdx + start.length + j);
}

const authModal = extractBetween(file, '// ─── Auth Modal (Login / Register)', 'function HeroDynamic');
const heroDynamic = extractBetween(file, 'function HeroDynamic', '// ─── Typewriter effect');
const typewriter = extractBetween(file, '// ─── Typewriter effect', '// ─── Logo3D');
const logo3d = extractBetween(file, '// ─── Logo3D', '// ─── ProductCard');
const productCard = extractBetween(file, '// ─── ProductCard', '// ─── VariantConfigurator');
const variantConfig = file.substring(file.indexOf('// ─── VariantConfigurator'));

const heroSlideType = extractBetween(file, 'interface HeroSlide {', 'interface Category {');

const importsBase = `import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cldOpt } from '@/lib/utils';
`;

fs.writeFileSync('src/components/AuthModal.tsx', `import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export ` + authModal.substring(authModal.indexOf('function AuthModal')));

fs.writeFileSync('src/components/Typewriter.tsx', `import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export ` + typewriter.substring(typewriter.indexOf('function Typewriter')));

fs.writeFileSync('src/components/Logo3D.tsx', `import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cldOpt } from '@/lib/utils';

export ` + logo3d.substring(logo3d.indexOf('function Logo3D')));

fs.writeFileSync('src/components/HeroDynamic.tsx', `import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cldOpt } from '@/lib/utils';
import { Typewriter } from './Typewriter';
import { Logo3D } from './Logo3D';

export ` + heroSlideType + `

export ` + heroDynamic.trim());

fs.writeFileSync('src/components/ProductCard.tsx', `import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, ShoppingCart, Check } from 'lucide-react';
import { Product } from '@/context/CartContext';
import { cldOpt } from '@/lib/utils';

export ` + productCard.substring(productCard.indexOf('const ProductCard')));

fs.writeFileSync('src/components/VariantConfigurator.tsx', `import React, { useState } from 'react';
import { Minus, Plus, Check } from 'lucide-react';
import { Product } from '@/context/CartContext';

export ` + variantConfig.substring(variantConfig.indexOf('function VariantConfigurator')));

let newPage = file.substring(0, file.indexOf('// ─── Auth Modal (Login / Register)'));

// remove cldOpt
const cldOptImpl = extractBetween(newPage, '// ─── Cloudinary image optimizer', '// ─── Apply dynamic theme to document');
newPage = newPage.replace(cldOptImpl, '');

// remove HeroSlide interface
const heroSlideTypeRemoval = extractBetween(newPage, 'interface HeroSlide', 'interface Category');
newPage = newPage.replace(heroSlideTypeRemoval, '');

const newImports = `import { cldOpt } from '@/lib/utils';
import { AuthModal } from '@/components/AuthModal';
import { HeroDynamic, HeroSlide } from '@/components/HeroDynamic';
import { Typewriter } from '@/components/Typewriter';
import { Logo3D } from '@/components/Logo3D';
import { ProductCard } from '@/components/ProductCard';
import { VariantConfigurator } from '@/components/VariantConfigurator';

`;
newPage = newPage.replace("import autoTable from 'jspdf-autotable';\n", "import autoTable from 'jspdf-autotable';\n" + newImports);

// Fix trailing bracket that could be lost
if (!newPage.trim().endsWith('}')) {
    newPage += '}\n';
}

fs.writeFileSync('src/app/page.tsx', newPage);

console.log('Extraction complete');
