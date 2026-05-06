import React, { createContext, useContext, useEffect, useState } from "react";

interface AgeGateContextType {
  verified: boolean;
  verify: () => void;
  deny: () => void;
}

const AgeGateContext = createContext<AgeGateContextType>({
  verified: false,
  verify: () => {},
  deny: () => {},
});

export function AgeGateProvider({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState<boolean>(() => {
    return localStorage.getItem("age_verified") === "true";
  });

  const verify = () => {
    localStorage.setItem("age_verified", "true");
    setVerified(true);
  };

  const deny = () => {
    localStorage.removeItem("age_verified");
    setVerified(false);
    window.location.href = "https://www.google.com";
  };

  return (
    <AgeGateContext.Provider value={{ verified, verify, deny }}>
      {children}
    </AgeGateContext.Provider>
  );
}

export function useAgeGate() {
  return useContext(AgeGateContext);
}
