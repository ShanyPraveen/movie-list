import { useEffect, useState } from "react";

const KEY = '5244a731';

export function useMovies(query) {
  const [isLoading, setIsLoading] = useState(false);
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState("");

  const controller = new AbortController();

  useEffect(() => {
    async function fetchMovies() {
      try {
        setIsLoading(true);
        setError("")
        const res = await fetch(`http://www.omdbapi.com?apikey=${KEY}&s=${query}`, { signal: controller.signal });

        if (!res.ok) throw new Error(`Something went wrong`);

        const data = await res.json();

        if (!data.Search) throw new Error(`Movie not found`);

        setMovies(data.Search)
        setIsLoading(false)
        setError("")
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (query.length < 3) {
      setMovies([]);
      setError("");

      return;
    }

    fetchMovies();

    return (() => controller.abort())
  }, [query])

  return { movies, isLoading, error }
}