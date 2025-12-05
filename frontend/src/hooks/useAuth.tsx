"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import authService, { type CurrentUser, type LoginPayload, type RegisterPayload } from "../services/authService";
import { hydrateAccessTokenFromStorage, clearAccessToken } from "../lib/api";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";

type User = CurrentUser | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  login: (payload: LoginPayload, redirectPath?: string) => Promise<void>;
  register: (payload: RegisterPayload, redirectPath?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateUser: (updates: Partial<CurrentUser>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ME_QUERY_KEY = ["me"] as const;

const AuthState: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        // Hydrate token from storage, but that's it.
        // The query for 'me' will determine if the session is valid.
        hydrateAccessTokenFromStorage();
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[auth] bootstrap failed", err);
        }
        clearAccessToken();
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const { data: user, isLoading: loading } = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: authService.getCurrentUser,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !bootstrapping,
  });

  const login = async (payload: LoginPayload, redirectPath?: string) => {
    await authService.login(payload);
    queryClient.setQueryData(ME_QUERY_KEY, null);
    const currentUser = await queryClient.fetchQuery({
      queryKey: ME_QUERY_KEY,
      queryFn: async () => authService.getCurrentUser(),
    });

    // Check if user needs onboarding (no username = new user)
    const needsOnboarding = currentUser && !currentUser.username;
    const finalPath = redirectPath || (needsOnboarding ? "/onboarding" : "/dashboard");

    if (process.env.NODE_ENV !== "production") {
      console.log(`[auth] login successful, navigating to ${finalPath}`, { needsOnboarding, hasUsername: !!currentUser?.username });
    }

    setTimeout(() => {
      router.replace(finalPath);
    }, 100);
  };

  const register = async (payload: RegisterPayload, redirectPath: string = "/login") => {
    await authService.register(payload);
    queryClient.setQueryData(ME_QUERY_KEY, null);
    await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });

    if (process.env.NODE_ENV !== "production") {
      console.log(`[auth] registration successful, navigating to ${redirectPath}`);
    }

    setTimeout(() => {
      router.replace(redirectPath);
    }, 100);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[auth] logout service call failed", error);
      }
    } finally {
      queryClient.setQueryData(ME_QUERY_KEY, null);
      clearAccessToken();
      setTimeout(() => {
        router.push("/login");
      }, 100);
    }
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
  };

  const updateUser = async (updates: Partial<CurrentUser>) => {
    try {
      // Call the API to update user
      const response = await authService.updateCurrentUser(updates);
      // Update the cache with the new user data
      queryClient.setQueryData(ME_QUERY_KEY, response);
    } catch (error) {
      console.error("Failed to update user:", error);
      throw error;
    }
  };

  const isLoading = bootstrapping || (loading && user !== null);

  return (
    <AuthContext.Provider value={{ user: user ?? null, loading: isLoading, login, register, logout, refresh, updateUser }}>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  // Persistence disabled temporarily - packages not in Docker container
  // useEffect(() => {
  //   if (typeof window === "undefined") return;
  //   let cancelled = false;
  //   // ... persistence code
  //   return () => {
  //     cancelled = true;
  //   };
  // }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthState>{children}</AuthState>
    </QueryClientProvider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default useAuth;
