/* eslint-disable react-hooks/exhaustive-deps, react-hooks/rules-of-hooks, @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect */
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface Product {
    id: string;
    sku?: string;
    name: string;
    category: string;
    description: string;
    imageUrl: string;
    extraImages?: string[];
    variants?: { name: string; imageUrl: string }[];
    precioIndividual: number;
    precioMayoreo: number;
    minMayoreo: number;
    precioCaja: number;
    minCaja: number;
    precioEspecial: number;
    minEspecial?: number;
    stock?: number;
    sections?: string[];
    flags?: string[];
}

export interface CartItem extends Product {
    quantity: number;
    selectedVariant?: { name: string; imageUrl: string };
    cartItemId?: string; // Para distinguir mismo id con diferente variante
}

interface CartContextProps {
    cart: CartItem[];
    addToCart: (product: Product, qty: number, variant?: { name: string; imageUrl: string }) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, qty: number) => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
    calcItemPrice: (item: CartItem) => number;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cart, setCart] = useState<CartItem[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('altos_cart');
            if (stored) {
                try { setCart(JSON.parse(stored)); } catch { }
            }
        }
    }, []);

    // Guardar en LocalStorage cada vez que cambie
    useEffect(() => {
        localStorage.setItem('altos_cart', JSON.stringify(cart));
    }, [cart]);

    const calcItemPrice = useCallback((item: CartItem): number => {
        let price = Number(item.precioIndividual) || 0;

        // Sumamos TODAS las variantes del MISMO producto dentro del carrito para poder aplicar 
        // precios de mayoreo/caja, incluso si escogen colores diferentes.
        const totalQtyInCart = cart
            .filter(p => p.id === item.id)
            .reduce((sum, p) => sum + Number(p.quantity || 0), 0);

        // Determinamos la cantidad a usar (usamos la cant. actual del item como fallback mínimo)
        const qty = Math.max(Number(item.quantity) || 1, totalQtyInCart);

        const mCaja = Number(item.minCaja) || 0;
        const pCaja = Number(item.precioCaja) || 0;
        const mMay = Number(item.minMayoreo) || 0;
        const pMay = Number(item.precioMayoreo) || 0;
        const mEsp = Number(item.minEspecial) || 0;
        const pEsp = Number(item.precioEspecial) || 0;

        let applicablePrices = [price]; // Empezamos siempre con el individual Base

        if (mMay > 0 && qty >= mMay && pMay > 0) applicablePrices.push(pMay);
        if (mCaja > 0 && qty >= mCaja && pCaja > 0) applicablePrices.push(pCaja);
        if (mEsp > 0 && qty >= mEsp && pEsp > 0) applicablePrices.push(pEsp);

        // Retorna el precio más bajo de entre todos los que hayan "desbloqueado" según la cantidad
        return Math.min(...applicablePrices.filter(p => p > 0));
    }, [cart]);

    const addToCart = useCallback((product: Product, quantity: number, variant?: { name: string; imageUrl: string }) => {
        setCart(prev => {
            const variantHash = variant ? `-${variant.name}` : '';
            const cartItemId = `${product.id}${variantHash}`;

            const existing = prev.find(p => p.cartItemId === cartItemId || (!p.cartItemId && p.id === product.id && !variant));

            if (existing) {
                return prev.map(p =>
                    (p.cartItemId === cartItemId || (!p.cartItemId && p.id === product.id && !variant))
                        ? { ...p, quantity: p.quantity + quantity }
                        : p
                );
            }
            return [...prev, { ...product, quantity, selectedVariant: variant, cartItemId }];
        });
    }, []);

    const removeFromCart = useCallback((cartItemIdOrId: string) => {
        setCart(prev => prev.filter(p => (p.cartItemId || p.id) !== cartItemIdOrId));
    }, []);

    const updateQuantity = useCallback((cartItemIdOrId: string, quantity: number) => {
        if (quantity < 1) {
            setCart(prev => prev.filter(p => (p.cartItemId || p.id) !== cartItemIdOrId));
            return;
        }
        setCart(prev => prev.map(p => (p.cartItemId || p.id) === cartItemIdOrId ? { ...p, quantity } : p));
    }, []);

    const clearCart = useCallback(() => setCart([]), []);

    const cartCount = cart.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
    const cartTotal = cart.reduce((acc, item) => acc + (calcItemPrice(item) * Number(item.quantity || 0)), 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, calcItemPrice }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within CartProvider");
    return ctx;

};

export const useCartTotal = () => {
    const { cartTotal } = useCart();
    return cartTotal;
};
