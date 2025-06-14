"use client";

import React from "react";
import { useInitializeCofhejs } from "@/hooks/useCofhejs";

interface CofheProviderProps {
  children: React.ReactNode;
}

const CofheProvider: React.FC<CofheProviderProps> = ({ children }) => {
  // Initialize CoFHE when the component mounts
  useInitializeCofhejs();

  return <>{children}</>;
};

export default CofheProvider;
