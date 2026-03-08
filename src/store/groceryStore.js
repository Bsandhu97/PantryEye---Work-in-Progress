// src/store/groceryStore.js
// ------------------------------------------------------------
// Lightweight global store: React Context + useReducer.
// All data is persisted to AsyncStorage automatically.
// ------------------------------------------------------------

import React, { createContext, useContext, useReducer, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Shape ───────────────────────────────────────────────────
// pantryItems : [{ id, name, category, quantity, addedAt }]
// shoppingList: [{ id, name, category, quantity, checked }]
// expiryItems : [{ id, name, expiryDate, addedAt, daysLeft }]

const STORAGE_KEY = "@pantry_eye_store";

const initialState = {
  pantryItems:  [],
  shoppingList: [],
  expiryItems:  [],
};

// ─── Reducer ─────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    // Pantry
    case "ADD_PANTRY_ITEMS":
      return { ...state, pantryItems: [...state.pantryItems, ...action.payload] };
    case "REMOVE_PANTRY_ITEM":
      return { ...state, pantryItems: state.pantryItems.filter((i) => i.id !== action.payload) };
    case "CLEAR_PANTRY":
      return { ...state, pantryItems: [] };

    // Shopping list
    case "ADD_TO_SHOPPING_LIST":
      return { ...state, shoppingList: [...state.shoppingList, action.payload] };
    case "TOGGLE_SHOPPING_ITEM":
      return {
        ...state,
        shoppingList: state.shoppingList.map((i) =>
          i.id === action.payload ? { ...i, checked: !i.checked } : i
        ),
      };
    case "REMOVE_SHOPPING_ITEM":
      return { ...state, shoppingList: state.shoppingList.filter((i) => i.id !== action.payload) };
    case "CLEAR_CHECKED":
      return { ...state, shoppingList: state.shoppingList.filter((i) => !i.checked) };

    // Expiry
    case "ADD_EXPIRY_ITEM":
      return { ...state, expiryItems: [...state.expiryItems, action.payload] };
    case "REMOVE_EXPIRY_ITEM":
      return { ...state, expiryItems: state.expiryItems.filter((i) => i.id !== action.payload) };
    case "UPDATE_EXPIRY_ITEM":
      return {
        ...state,
        expiryItems: state.expiryItems.map((i) =>
          i.id === action.payload.id ? { ...i, ...action.payload.data } : i
        ),
      };

    // Hydrate from storage
    case "HYDRATE":
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────
const GroceryContext = createContext(null);

export function GroceryProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) dispatch({ type: "HYDRATE", payload: JSON.parse(raw) });
      } catch (e) {
        console.warn("Failed to load store:", e);
      }
    })();
  }, []);

  // Persist on every change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(console.warn);
  }, [state]);

  return (
    <GroceryContext.Provider value={{ state, dispatch }}>
      {children}
    </GroceryContext.Provider>
  );
}

export function useGroceryStore() {
  const ctx = useContext(GroceryContext);
  if (!ctx) throw new Error("useGroceryStore must be used within GroceryProvider");
  return ctx;
}

// ─── Helper: generate simple unique ID ───────────────────────
export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
