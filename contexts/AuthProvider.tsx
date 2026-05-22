"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback,
} from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { authService } from "@/lib/api";

type AuthUser = any;

type AuthContextValue = {
    user: AuthUser;
    setUser: (user: AuthUser) => void;
    refreshUser: (options?: { force?: boolean }) => Promise<AuthUser>;
    cookiesReady: boolean;
    isJwtToken: boolean;
    logout: () => Promise<void>;
};

type RefreshQueueItem = {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
};

// ===== Module-level cache (shared in client runtime intentionally) =====
let cachedSessionUser: AuthUser = null;
let isRefreshing = false;
let refreshQueue: RefreshQueueItem[] = [];

// ===== Helpers =====
const calculateTokenExpiry = (expFromToken?: number) => {
    if (expFromToken) return expFromToken * 1000;

    const ttlSeconds = process.env.NEXT_PUBLIC_ACCESS_TOKEN_TTL
        ? parseInt(process.env.NEXT_PUBLIC_ACCESS_TOKEN_TTL, 10)
        : 15 * 60;

    return Date.now() + ttlSeconds * 1000;
};

const normalizeUserPayload = (payload: any) => {
    if (!payload) return null;

    // Direct JWT payload
    if (payload.iat && payload.exp) {
        return {
            ...payload,
            _id: payload.id || payload._id,
            tokenExpiry: calculateTokenExpiry(payload.exp),
            _isJwtToken: true,
        };
    }

    // Nested API response
    const userData = payload.data?.user || payload.user || payload.data || payload;

    if (!userData) return null;

    return {
        ...userData,
        _id: userData._id || userData.id,
        tokenExpiry: calculateTokenExpiry(userData.exp),
        _isJwtToken: Boolean(userData.accessToken || userData.iat),
    };
};

// Prevent unnecessary rerenders
const isSameUser = (a: any, b: any) => {
    if (!a && !b) return true;
    if (!a || !b) return false;

    return (
        a._id === b._id &&
        a.tokenExpiry === b.tokenExpiry &&
        a.role === b.role &&
        a.email === b.email
    );
};

const AuthContext = createContext<AuthContextValue>({
    user: null,
    setUser: () => { },
    refreshUser: async () => null,
    cookiesReady: false,
    isJwtToken: false,
    logout: async () => { },
});

function AuthContextWrapper({
    children,
    initialUser,
}: {
    children: React.ReactNode;
    initialUser?: any;
}) {
    const { data: session } = useSession();

    const normalizedInitialUser = useMemo(
        () => normalizeUserPayload(initialUser),
        [initialUser]
    );

    const [cookiesReady, setCookiesReady] = useState(false);

    const [userState, setUserState] = useState<AuthUser>(
        normalizedInitialUser ?? cachedSessionUser ?? null
    );

    const [isJwtToken, setIsJwtToken] = useState<boolean>(
        Boolean(
            (normalizedInitialUser ?? cachedSessionUser)?._isJwtToken
        )
    );

    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Local ref instead of dangerous global fetch flag
    const hasFetchedRef = useRef(false);

    const sessionUserId =
        session?.user &&
        ((session.user as any).id ||
            (session.user as any)._id ||
            (session.user as any).email);

    // ===== Timer Management =====
    const clearTimers = useCallback(() => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

        refreshTimerRef.current = null;
        inactivityTimerRef.current = null;
    }, []);

    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            clearTimers();

            cachedSessionUser = null;
            hasFetchedRef.current = false;

            setUserState(null);
            setIsJwtToken(false);

            if (typeof window !== "undefined") {
                localStorage.removeItem("auth_token");
            }
        }
    }, [clearTimers]);

    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        inactivityTimerRef.current = setTimeout(() => {
            logout();
        }, 90 * 60 * 1000); // 90 min
    }, [logout]);

    const setupTokenRefresh = useCallback(
        (user: any) => {
            if (!user?.tokenExpiry) return;

            const timeUntilExpiry = user.tokenExpiry - Date.now();

            // Ignore extremely long expiry
            if (timeUntilExpiry > 6 * 24 * 60 * 60 * 1000) return;

            const buffer = 5 * 60 * 1000;
            const refreshTime = Math.max(timeUntilExpiry - buffer, 10000);

            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
            }

            refreshTimerRef.current = setTimeout(() => {
                refreshUser({ force: true });
            }, refreshTime);
        },
        []
    );

    // ===== Stable setUser =====
    const setUser = useCallback(
        (value: any) => {
            const normalized = normalizeUserPayload(value);

            if (isSameUser(cachedSessionUser, normalized)) {
                return;
            }

            cachedSessionUser = normalized;

            setUserState(normalized);
            setIsJwtToken(Boolean(normalized?._isJwtToken));

            clearTimers();

            if (normalized) {
                setupTokenRefresh(normalized);
                resetInactivityTimer();
            }
        },
        [clearTimers, resetInactivityTimer, setupTokenRefresh]
    );

    // ===== Refresh User =====
    const refreshUser = useCallback(
        async ({ force = false }: { force?: boolean } = {}) => {
            if (isRefreshing && !force) {
                return new Promise((resolve, reject) => {
                    refreshQueue.push({ resolve, reject });
                });
            }

            if (!force && hasFetchedRef.current) {
                return cachedSessionUser;
            }

            isRefreshing = true;

            try {
                const res = await authService.getCurrentUser();
                console.log(res,'getCurrentUser')
                const fetchedUser = normalizeUserPayload(res?.data);
                console.log(fetchedUser, 'getCurrentUser1')

                hasFetchedRef.current = true;

                if (!isSameUser(cachedSessionUser, fetchedUser)) {
                    setUser(fetchedUser);
                }

                refreshQueue.forEach(({ resolve }) => resolve(fetchedUser));
                refreshQueue = [];

                return fetchedUser;
            } catch (err: any) {
                hasFetchedRef.current = true;

                if (
                    err?.response?.status === 401 ||
                    err?.response?.status === 403
                ) {
                    setUser(null);
                }

                refreshQueue.forEach(({ reject }) => reject(err));
                refreshQueue = [];

                return null;
            } finally {
                isRefreshing = false;
            }
        },
        [setUser]
    );

    // ===== Session + Initial Sync =====
    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            // Priority 1: Server user with JWT token - fetch full details
            if (normalizedInitialUser) {
                // If it's a JWT token, fetch full user details from backend
                if (normalizedInitialUser._isJwtToken) {
                    await refreshUser();
                } else {
                    hasFetchedRef.current = true;
                    setUser(normalizedInitialUser);
                }

                if (mounted) {
                    setCookiesReady(true);
                }

                return;
            }

            // Priority 2: NextAuth session
            if (session?.user) {
                setUser(session.user);

                try {
                    await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/social-set-cookies`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            credentials: "include",
                            body: JSON.stringify({
                                accessToken: (session.user as any).accessToken,
                                refreshToken: (session.user as any).refreshToken,
                                role: (session.user as any).role,
                            }),
                        }
                    );
                } catch (error) {
                    console.error("Cookie sync failed:", error);
                } finally {
                    if (mounted) {
                        setCookiesReady(true);
                    }
                }

                return;
            }

            // Priority 3: API fetch - always fetch full user details
            if (!hasFetchedRef.current) {
                await refreshUser();
            }

            if (mounted) {
                setCookiesReady(true);
            }
        };

        initializeAuth();

        return () => {
            mounted = false;
        };
    }, [sessionUserId, normalizedInitialUser, refreshUser, setUser]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearTimers();
        };
    }, [clearTimers]);

    // ===== Memoized Context =====
    const contextValue = useMemo<AuthContextValue>(
        () => ({
            user: userState,
            setUser,
            refreshUser,
            cookiesReady,
            isJwtToken,
            logout,
        }),
        [userState, setUser, refreshUser, cookiesReady, isJwtToken, logout]
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export function AuthProvider({
    children,
    initialUser,
}: {
    children: React.ReactNode;
    initialUser?: any;
}) {
    return (
        <SessionProvider refetchOnWindowFocus={false}>
            <AuthContextWrapper initialUser={initialUser}>
                {children}
            </AuthContextWrapper>
        </SessionProvider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}