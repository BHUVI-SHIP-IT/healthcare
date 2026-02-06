import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Role } from '../types';

interface AuthUser {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    classSection?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    session: Session | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (input: RegisterInput) => Promise<void>;
    logout: () => Promise<void>;
}

interface RegisterInput {
    fullName: string;
    email: string;
    password: string;
    role: Role;
    classSection?: string;
    department?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email!,
                    fullName: session.user.user_metadata.fullName,
                    role: session.user.user_metadata.role,
                    classSection: session.user.user_metadata.classSection,
                });
            }
            setIsLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email!,
                    fullName: session.user.user_metadata.fullName,
                    role: session.user.user_metadata.role,
                    classSection: session.user.user_metadata.classSection,
                });
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const register = async (input: RegisterInput) => {
        const { error } = await supabase.auth.signUp({
            email: input.email,
            password: input.password,
            options: {
                data: {
                    fullName: input.fullName,
                    role: input.role,
                    classSection: input.classSection,
                    department: input.department,
                },
            },
        });

        if (error) throw error;

        // Session will be set automatically via onAuthStateChange
    };

    const login = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // Session will be set automatically via onAuthStateChange
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    const contextValue = useMemo(
        () => ({
            user,
            session,
            isAuthenticated: !!session,
            isLoading,
            login,
            register,
            logout,
        }),
        [user, session, isLoading]
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
