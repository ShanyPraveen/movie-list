import { useEffect, useState } from "react";

export function useLocalStorageState(initialState) {
  const [value, setValue] = useState(() => {
    return JSON.parse(localStorage.getItem('value')) || initialState
  });

  useEffect(() => {
    localStorage.setItem('value', JSON.stringify(value))
  }, [value])
  return [value, setValue]
}