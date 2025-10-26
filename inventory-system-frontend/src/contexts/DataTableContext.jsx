// DataTableContext.js
import { createContext, useContext } from "react";

export const DataTableContext = createContext(null);

export function DataTableProvider({ value, children }) {
  return (
    <DataTableContext.Provider value={value}>
      {children}
    </DataTableContext.Provider>
  );
}

export function useDataTable() {
  const ctx = useContext(DataTableContext);
  if (!ctx) {
    throw new Error("useDataTable must be used within a DataTableProvider");
  }
  return ctx;
}