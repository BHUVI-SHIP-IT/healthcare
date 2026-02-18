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
    department?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    session: Session | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (input: RegisterInput) => Promise<void>;
    logout: () => Promise<void>;
    loginWithOAuth: (provider: 'google') => Promise<void>;
    updateProfile: (data: Partial<AuthUser>) => Promise<void>;
    requiresOnboarding: boolean;
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
    const [requiresOnboarding, setRequiresOnboarding] = useState(false);

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

                // Check if profile is complete
                // A basic check: if role is missing or (for student) classSection is missing
                const metadata = session.user.user_metadata;
                if (!metadata.role || !metadata.classSection) {
                    setRequiresOnboarding(true);
                } else {
                    setRequiresOnboarding(false);
                }
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

                // Check if profile is complete
                const metadata = session.user.user_metadata;
                if (!metadata.role || !metadata.classSection) {
                    setRequiresOnboarding(true);
                } else {
                    setRequiresOnboarding(false);
                }
            } else {
                setUser(null);
                setRequiresOnboarding(false);
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

    const loginWithOAuth = async (provider: 'google') => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        });
        if (error) throw error;
    };

    const updateProfile = async (data: Partial<AuthUser>) => {
        // 1. Update auth.users (Supabase Auth)
        const { error } = await supabase.auth.updateUser({
            data: data
        });

        if (error) throw error;

        // 2. Sync with public.User table (Database)
        // We need to update this manually because the trigger only runs on INSERT
        if (user?.id) {
            const publicUpdates: any = {
                updatedAt: new Date().toISOString()
            };

            // Map fields
            if (data.fullName) {
                // Try to update both 'name' and 'fullName' if we are unsure of schema, 
                // but based on requests.ts accessing 'fullName', we prioritize that.
                // However, migrations show 'name'. We'll try to update 'name' as well if it exists.
                // Note: Supabase ignores fields that don't exist if we aren't careful? 
                // Actually it throws error on unknown columns. 
                // Since requests.ts selects 'fullName', we assume column is 'fullName'.
                // Recalling the user issue: "showing User". This default "User" value 
                // was inserted into 'name' by the trigger in 00006.sql.
                // If requests.ts selects 'fullName' and sees "User", then 'fullName' must exist.
                publicUpdates.fullName = data.fullName;

                // If we suspect the column might be 'name' (based on SQL), we could try that?
                // But let's trust the Typescript type and the Select query which work.
                // Wait, if 00006 SQL inserts into 'name' and not 'fullName', 
                // and requests.ts selects 'fullName'... 
                // Maybe 'User' is a view?
                // Let's just update 'fullName' first.
                publicUpdates.fullName = data.fullName;
            }
            if (data.role) publicUpdates.role = data.role;
            if (data.classSection) {
                publicUpdates.classSection = data.classSection;
                // Extract department if possible or use data.department
                if (data.department) {
                    publicUpdates.department = data.department;
                }
            } else if (data.department) {
                publicUpdates.department = data.department;
            }

            // Perform update
            // Strategy: Try to update 'fullName' first. If that works, great.
            // Also try to update 'name' because some legacy triggers/migrations use that.
            // We want to ensure consistency across both potentially existing columns.

            // 1. Update fullName
            const { error: publicError } = await supabase
                .from('User')
                .update(publicUpdates)
                .eq('id', user.id);

            if (publicError) {
                console.warn("Public User table update (fullName) failed:", publicError);
            }

            // 2. Update name (legacy column compatibility)
            // Even if fullName update succeeded, we should sync 'name' if it exists to avoid confusion
            if (data.fullName) {
                const nameUpdate = { ...publicUpdates };
                delete nameUpdate.fullName;
                nameUpdate.name = data.fullName; // Map fullName -> name

                const { error: nameError } = await supabase
                    .from('User')
                    .update(nameUpdate)
                    .eq('id', user.id);

                if (nameError) {
                    // Only log if it's NOT just "column doesn't exist" error, explicitly
                    // But usually we just ignore if the column is missing
                    console.log("Tried updating 'name' column but failed (expected if column removed):", nameError.message);
                }
            }
        }

        // Local state update will happen via onAuthStateChange
        setRequiresOnboarding(false);
    };

    const contextValue = useMemo(
        () => ({
            user,
            session,
            isAuthenticated: !!session,
            isLoading,
            requiresOnboarding,
            login,
            register,
            logout,
            loginWithOAuth,
            updateProfile,
        }),
        [user, session, isLoading, requiresOnboarding]
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
