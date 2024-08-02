"use client";
import React, { createContext, useContext, ReactNode, useState } from 'react';

interface UserContextType {
  name: string;
  role: string;
  setUser: (user: { name: string; role: string }) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children, user }: { children: ReactNode; user: { name: string; role: string } }) => {
  const [userState, setUserState] = useState<{ name: string; role: string }>(user);

  const setUser = (newUser: { name: string; role: string }) => {
    setUserState(newUser);
  };

  return (
    <UserContext.Provider value={{ ...userState, setUser }}>
      {children}
    </UserContext.Provider>
  );
};


