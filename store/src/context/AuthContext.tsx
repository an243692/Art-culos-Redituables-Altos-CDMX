'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
    User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    registerWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Save/update user profile in Firestore for admin directory
async function syncUserToFirestore(u: User) {
    try {
        await setDoc(doc(db, 'clientes', u.uid), {
            uid: u.uid,
            email: u.email || '',
            displayName: u.displayName || '',
            photoURL: u.photoURL || '',
            provider: u.providerData[0]?.providerId || 'email',
            lastLogin: serverTimestamp(),
        }, { merge: true });
    } catch (e) {
        console.error('Error syncing user to Firestore:', e);
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
            // Sync to Firestore on every auth state change (login)
            if (u) syncUserToFirestore(u);
        });
        return unsub;
    }, []);

    const loginWithEmail = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const registerWithEmail = async (email: string, password: string, displayName: string) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
        // Force sync with updated displayName
        await syncUserToFirestore({ ...cred.user, displayName } as User);
    };

    const loginWithGoogle = async () => {
        await signInWithPopup(auth, googleProvider);
    };

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithEmail, registerWithEmail, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
