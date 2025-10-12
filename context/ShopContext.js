'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ShopContext = createContext();

export function ShopProvider({ children }) {
  const [shops, setShops] = useState([]);             // all shops for the user
  const [selectedShop, setSelectedShop] = useState(null); // currently selected shop

  useEffect(() => {
    const loadShops = async () => {
      try {
        const res = await fetch('/api/shop/list');
        const json = await res.json();
        if (res.ok) setShops(json.shops || []);
        else setShops([]);
      } catch (err) {
        setShops([]);
      }
    };

    loadShops();
  }, []);

  return (
    <ShopContext.Provider value={{ shops, setShops, selectedShop, setSelectedShop }}>
      {children}
    </ShopContext.Provider>
  );
}

export const useShop = () => useContext(ShopContext);
