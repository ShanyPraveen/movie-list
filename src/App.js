import { useState, useEffect, useRef } from "react";
import StarRating from "./StarRating"
import { useMovies } from "./useMovies";
import { useLocalStorageState } from "./useLocalStorageState";
import { useKey } from "./useKey";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY = '5244a731';

export default function App() {
  const [watched, setWatched] = useLocalStorageState([]);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const { movies, isLoading, error } = useMovies(query)

  function handleSelectedId(id) {
    setSelectedId((selected) => selected === id ? null : id)
  }

  function handleClose() {
    setSelectedId(null)
  }

  function handleAddWatched(movie) {
    setWatched((watched) => [...watched, movie])
  }

  function handleRemoveWatched(id) {
    setWatched((watched) => watched.filter(mov => mov.imdbId !== id))
  }

  return (
    <>
      <Navbar>
        <Search setQuery={setQuery} query={query} />
        <NumResults movies={movies} />
      </Navbar>
      <Main>
        <Box>
          {isLoading && <Loader />}
          {error && <ErrorMessage message={error} />}
          {!isLoading && !error && <MovieList setSelectedId={handleSelectedId} movies={movies} />}
        </Box>
        <Box>
          {selectedId ? <SelectedMovie watched={watched} onHandleAddWatched={handleAddWatched} onClose={handleClose} selectedId={selectedId} /> : <>
            <WatchedSummary selectedId={selectedId} watched={watched} />
            <WatchedMoviesList onHandleRemoveWatched={handleRemoveWatched} watched={watched} />
          </>}
        </Box>
      </Main>
    </>
  );
}

export function Main({ children }) {
  return <main className="main">
    {children}
  </main>
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return <div className="box">
    <button
      className="btn-toggle"
      onClick={() => setIsOpen((open) => !open)}
    >
      {isOpen ? "–" : "+"}
    </button>
    {isOpen && children}
  </div>
}

function MovieList({ movies, setSelectedId }) {
  return (
    <ul className="list">
      {movies?.map((movie) => (
        <Movie setSelectedId={() => setSelectedId(movie.imdbID)} movie={movie} key={movie.imdbID} />
      ))}
    </ul>
  )
}

function Movie({ movie, setSelectedId }) {
  return <li onClick={setSelectedId}>
    <img src={movie.Poster} alt={`${movie.Title} poster`} />
    <h3>{movie.Title}</h3>
    <div>
      <p>
        <span>🗓</span>
        <span>{movie.Year}</span>
      </p>
    </div>
  </li>
}

function SelectedMovie({ selectedId, onClose, onHandleAddWatched, watched }) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState(0);

  const count = useRef(0);

  useEffect(() => {
    if (rating) count.current++;
  }, [rating])
  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;

  function handleAdd() {
    const watched = {
      imdbId: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(' ').at(0)),
      userRating: rating,
      count: count.current
    }

    onHandleAddWatched(watched)
    onClose();
  }

  const alreadyWatched = watched.find((mov) => mov.imdbId === selectedId);

  useEffect(() => {
    async function fetchMovieDetails() {
      setIsLoading(true);
      const res = await fetch(`http://www.omdbapi.com?apikey=${KEY}&i=${selectedId}`);

      const data = await res.json();

      setMovie(data);
      setIsLoading(false);
    }

    fetchMovieDetails();
  }, [selectedId])

  useEffect(() => {
    document.title = `Movie | ${title}`;

    return (() => {
      document.title = 'usePopcorn';
    })
  }, [title])

  useKey('escape', onClose);

  return <div className="details">
    {isLoading ? <div className="loader">loading...</div> :
      <>
        <header>
          <button className="btn-back" onClick={onClose}>
            &larr;
          </button>
          <img src={poster} alt={`Poster of ${movie} movie`} />
          <div className="details-overview">
            <h2>{title}</h2>
            <p>
              {released} &bull; {runtime}
            </p>
            <p>{genre}</p>
            <p>
              <span>⭐️</span>
              {imdbRating} IMDb rating
            </p>
          </div>
        </header>

        <section>

          <div className="rating">
            {alreadyWatched ? <p>You rated this movie {alreadyWatched.userRating} <span>⭐</span></p> : <>
              <StarRating
                maxRating={10}
                size={24}
                onSetRating={setRating}
              />
              {rating > 0 && <button className="btn-add" onClick={() => handleAdd(movie)}>
                + Add to list
              </button>}
            </>}
          </div>
          <p>
            <em>{plot}</em>
          </p>
          <p>Starring {actors}</p>
          <p>Directed by {director}</p>
        </section></>}
  </div>
}

function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return <div className="summary">
    <h2>Movies you watched</h2>
    <div>
      <p>
        <span>#️⃣</span>
        <span>{watched.length} movies</span>
      </p>
      <p>
        <span>⭐️</span>
        <span>{avgImdbRating.toFixed(2)}</span>
      </p>
      <p>
        <span>🌟</span>
        <span>{avgUserRating.toFixed(2)}</span>
      </p>
      <p>
        <span>⏳</span>
        <span>{avgRuntime} min</span>
      </p>
    </div>
  </div>
}

function WatchedMoviesList({ watched, onHandleRemoveWatched }) {
  return <ul className="list">
    {watched.map((movie) => (
      <WatchedMovie onHandleRemoveWatched={onHandleRemoveWatched} movie={movie} key={movie.imdbID} />
    ))}
  </ul>
}

function WatchedMovie({ movie, onHandleRemoveWatched }) {
  return <li>
    <img src={movie.poster} alt={`${movie.title} poster`} />
    <h3>{movie.title}</h3>
    <div>
      <p>
        <span>⭐️</span>
        <span>{movie.imdbRating}</span>
      </p>
      <p>
        <span>🌟</span>
        <span>{movie.userRating}</span>
      </p>
      <p>
        <span>⏳</span>
        <span>{movie.runtime} min</span>
      </p>
      <button className="btn-delete" onClick={() => onHandleRemoveWatched(movie.imdbId)}>
        X
      </button>
    </div>
  </li>
}

function Loader() {
  return <p className="loader">Loading....</p>
}

function ErrorMessage({ message }) {
  return <p className="loader">
    <span>⛔</span> {message}
  </p>
}


function Navbar({ children }) {
  return <nav className="nav-bar">
    <Logo />
    {children}
  </nav>
}


function Logo() {
  return <div className="logo">
    <span role="img">🍿</span>
    <h1>usePopcorn</h1>
  </div>
}

function Search({ query, setQuery }) {
  const inputEl = useRef(null);
  // const testState = useRef(0);

  // console.log(testState)
  // useEffect(() => {
  //   console.log('runs')
  //   testState.current++
  // }, [setQuery])

  useKey('enter', () => {
    // document.addEventListener('keydown', callback)
    inputEl.current.focus();
  });


  // useEffect(() => {
  //   function callback(e) {
  //     if (e.code === 'Enter') inputEl.current.focus();
  //   }

  //   document.addEventListener('keydown', callback)
  //   inputEl.current.focus();

  //   return () => document.removeEventListener('keydown', callback)
  // }, [setQuery])

  return <>
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      ref={inputEl}
      onChange={(e) => setQuery(e.target.value)}
    />
  </>
}

function NumResults({ movies }) {
  return <p className="num-results">
    Found <strong>{movies.length}</strong> results
  </p>
}