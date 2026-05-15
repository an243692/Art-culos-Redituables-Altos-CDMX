'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
    updatePassword,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    linkWithCredential,
    EmailAuthProvider,
    ConfirmationResult,
    User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';

/** Derives a consistent virtual email from a +52XXXXXXXXXX phone string */
export function phoneToEmail(phone: string): string {
    const digits = phone.replace(/\D/g, ''); // e.g. 528137074669
    const local = digits.startsWith('52') ? digits.slice(2) : digits; // 8137074669
    return `p${local}@altos.tel`;
}

interface AuthContextType {
    user: User | null;
    clientData: any | null;
    loading: boolean;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    registerWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    /** Send OTP to a phone number (invisible reCAPTCHA) */
    sendPhoneOtp: (phone: string) => Promise<ConfirmationResult>;
    /** Confirm OTP. If password is provided, links email+password credential (new user) or updates it (existing). */
    confirmPhoneOtp: (confirmation: ConfirmationResult, otp: string, displayName: string, password: string) => Promise<void>;
    /** Login with phone+password without OTP (returning users) */
    loginWithPhone: (phone: string, password: string) => Promise<void>;
    /** Register with phone+password without OTP */
    registerWithPhoneOnly: (phone: string, password: string, displayName: string) => Promise<void>;
    /** After OTP verification for reset, update password on current user */
    resetPhonePassword: (confirmation: ConfirmationResult, otp: string, newPassword: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

async function syncUserToFirestore(u: User, extra?: Record<string, any>) {
    try {
        await setDoc(doc(db, 'clientes', u.uid), {
            uid: u.uid,
            email: u.email || '',
            displayName: u.displayName || '',
            photoURL: u.photoURL || '',
            phone: u.phoneNumber || '',
            provider: u.providerData[0]?.providerId || 'phone',
            lastLogin: serverTimestamp(),
            ...extra,
        }, { merge: true });
    } catch (e) {
        console.error('Error syncing user to Firestore:', e);
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [clientData, setClientData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (u) {
                await syncUserToFirestore(u);
                try {
                    const snap = await getDoc(doc(db, 'clientes', u.uid));
                    if (snap.exists()) setClientData(snap.data());
                } catch (err) {
                    console.error('Error fetching client data:', err);
                }
            } else {
                setClientData(null);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    // ── Email/Password ──────────────────────────────────────────────
    const loginWithEmail = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const registerWithEmail = async (email: string, password: string, displayName: string) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
        await syncUserToFirestore({ ...cred.user, displayName } as User);
    };

    const loginWithGoogle = async () => {
        await signInWithPopup(auth, googleProvider);
    };

    // ── Phone / reCAPTCHA ───────────────────────────────────────────
    const setupRecaptcha = () => {
        if (typeof window === 'undefined') return;

        // Limpiar cualquier instancia previa
        if ((window as any).recaptchaVerifier) {
            try { (window as any).recaptchaVerifier.clear(); } catch (_) {}
            (window as any).recaptchaVerifier = null;
        }

        let container = document.getElementById('recaptcha-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'recaptcha-container';
            document.body.appendChild(container);
        }
        container.innerHTML = '';

        try {
            (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: () => { /* solved */ },
            });
        } catch (err) {
            console.error('Error inicializando RecaptchaVerifier:', err);
        }
    };

    const sendPhoneOtp = async (phone: string): Promise<ConfirmationResult> => {
        setupRecaptcha();
        const verifier = (window as any).recaptchaVerifier;
        if (!verifier) throw new Error('No se pudo inicializar la verificación de seguridad.');

        try {
            return await signInWithPhoneNumber(auth, phone, verifier);
        } catch (err: any) {
            console.error('Error en signInWithPhoneNumber:', err);
            // Si falla, limpiar para reintentar
            try { verifier.clear(); } catch (_) {}
            (window as any).recaptchaVerifier = null;
            throw err;
        }
    };

    /**
     * Called after the user enters the OTP.
     * - Confirms the OTP with Firebase Phone Auth.
     * - If `password` is given, links (or updates) the email+password credential
     *   so future logins can skip OTP.
     */
    const confirmPhoneOtp = async (
        confirmation: ConfirmationResult,
        otp: string,
        displayName: string,
        password: string,
    ) => {
        const result = await confirmation.confirm(otp);
        const u = result.user;

        if (displayName && !u.displayName) {
            await updateProfile(u, { displayName });
        }

        if (password) {
            const derivedEmail = phoneToEmail(u.phoneNumber || '');
            const emailCred = EmailAuthProvider.credential(derivedEmail, password);

            // Check if email provider already linked
            const hasEmail = u.providerData.some(p => p.providerId === 'password');
            if (!hasEmail) {
                try {
                    await linkWithCredential(u, emailCred);
                } catch (linkErr: any) {
                    // auth/email-already-in-use → account already linked in a previous session
                    if (linkErr.code !== 'auth/email-already-in-use' && linkErr.code !== 'auth/provider-already-linked') {
                        throw linkErr;
                    }
                }
            } else {
                await updatePassword(u, password);
            }
        }

        await syncUserToFirestore(
            { ...u, displayName: u.displayName || displayName } as User,
        );
    };

    /**
     * Login with phone number + password (no OTP).
     * Requires the account to have been previously linked.
     */
    const loginWithPhone = async (phone: string, password: string) => {
        const derivedEmail = phoneToEmail(phone);
        await signInWithEmailAndPassword(auth, derivedEmail, password);
    };

    /**
     * Register with phone number + password (no OTP SMS).
     */
    const registerWithPhoneOnly = async (phone: string, password: string, displayName: string) => {
        const derivedEmail = phoneToEmail(phone);
        const cred = await createUserWithEmailAndPassword(auth, derivedEmail, password);
        await updateProfile(cred.user, { displayName });
        await syncUserToFirestore(cred.user, { displayName, phone });
    };

    /**
     * Called after OTP verification in the "forgot password" flow.
     * Confirms OTP (to take ownership of the phone session), then updates the password.
     */
    const resetPhonePassword = async (
        confirmation: ConfirmationResult,
        otp: string,
        newPassword: string,
    ) => {
        const result = await confirmation.confirm(otp);
        const u = result.user;
        const derivedEmail = phoneToEmail(u.phoneNumber || '');
        const emailCred = EmailAuthProvider.credential(derivedEmail, newPassword);

        const hasEmail = u.providerData.some(p => p.providerId === 'password');
        if (!hasEmail) {
            await linkWithCredential(u, emailCred);
        } else {
            await updatePassword(u, newPassword);
        }
        await syncUserToFirestore(u);
    };

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{
            user, clientData, loading,
            loginWithEmail, registerWithEmail, loginWithGoogle,
            sendPhoneOtp, confirmPhoneOtp, loginWithPhone, registerWithPhoneOnly, resetPhonePassword,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
