import React, { createContext, ReactNode, useContext, useState } from "react";
import "viem/window";

const BurnerAccountContext = createContext(null);

export const BurnerAccountProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [burnerAccountClient, setBurnerAccountClient] = useState(null); // Adjust type as needed

  return (
    <BurnerAccountContext.Provider
      value={{ burnerAccountClient, setBurnerAccountClient }}
    >
      {children}
    </BurnerAccountContext.Provider>
  );
};

export const useBurnerAccount = () => {
  const context = useContext(BurnerAccountContext);
  if (!context) {
    throw new Error(
      "useBurnerAccount must be used within a BurnerAccountProvider"
    );
  }
  return context;
};
