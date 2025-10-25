import { createContext, useContext } from "react";

const InventoryContext = createContext();

export function InventoryProvider({ value, children }) {
  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  return useContext(InventoryContext);
}