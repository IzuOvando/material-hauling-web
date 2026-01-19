"use client";

import { createContext, useContext, ReactNode, useState } from "react";
import type { AppUser } from "@/types/auth";

type UserContextType = {
  user: AppUser | null;
  isOwner: boolean;
  isAdmin: boolean;
  canAccessFrente: (frente: string) => boolean;
  setUser: (user: AppUser | null) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
  children,
  user: initialUser,
}: {
  children: ReactNode;
  user: AppUser | null;
}) {
  const [user, setUser] = useState<AppUser | null>(initialUser);

  const value: UserContextType = {
    user,

    isOwner: user?.role === "owner",
    isAdmin: user?.role === "admin" || user?.role === "owner",

    canAccessFrente: (frente: string) => {
      if (!user) return false;
      if (user.role === "owner") return true;
      return user.frentes.includes(frente);
    },

    setUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
}
