"use client";
import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";

interface UserContextType {
  name: string;
  role: string;
  setUser: (user: { name: string; role: string }) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({
  children,
  user,
}: {
  children: ReactNode;
  user: { name: string; role: string };
}) => {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);

  const setUser = (newUser: { name: string; role: string }) => {
    setName(newUser.name);
    setRole(newUser.role);
  };

  useEffect(() => {
    setUser(user);
  }, [user]);

  return (
    <UserContext.Provider value={{ name, role, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
