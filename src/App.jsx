import { useEffect, useRef, useState } from "react";
import "./App.css";
import StarRating from "./Components/StarRating/StarRating";
const APIKEY = "5ace90c9";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0).toFixed(1);

export default function App() {
  const [movies, setMovies] = useState([]);
  const [watched, setWatched] = useState(() => {
    if (localStorage.getItem("watched"))
      return JSON.parse(localStorage.getItem("watched"));
    else return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const onSelectedMove = function (id) {
    setSelectedId((curentId) => (curentId === id ? null : id));
  };
  const onCloseSelectedMove = function () {
    setSelectedId(null);
  };
  const onAddWatched = function (newMove) {
    setWatched((watched) => [...watched, newMove]);
  };
  const onDeletWathed = function (id) {
    setWatched((watched) => watched.filter((movie) => movie.imdbId !== id));
  };

  // fetch in react
  const requsetApi = async function (nameMove) {
    try {
      setError("");
      setIsLoading(true);
      const res = await fetch(
        `http://www.omdbapi.com/?apikey=${APIKEY}&s=${nameMove}`
      );
      if (!res.ok) throw new Error("Something went wrong with fetching movies");

      const data = await res.json();
      if (data.Response === "False") throw new Error(data.Error);

      // remove item notfind poster
      const validItem = data.Search.filter((item) => item.Poster !== "N/A");

      setMovies(validItem);
    } catch (err) {
      setError(err.message);
      setMovies([]);
    } finally {
      setIsLoading(false);
    }
  };
  // set localStorage

  useEffect(() => {
    localStorage.setItem("watched", JSON.stringify(watched));
  }, [watched]);

  return (
    <>
      <NavBar>
        <Search
          requsetApi={requsetApi}
          onCloseSelectedMove={onCloseSelectedMove}
          selectedId={selectedId}
        />
        <NumResults movies={movies} />
      </NavBar>
      <Main>
        <Box>
          {isLoading && <Loader />}
          {error && <ErrorMessage message={error} />}
          {!isLoading && !error && (
            <MovieList movies={movies} onSelectedMove={onSelectedMove} />
          )}
        </Box>

        <Box>
          {selectedId ? (
            <>
              {error && <ErrorMessage message={error} />}
              {!error && (
                <MoveDetails
                  selectedId={selectedId}
                  onCloseSelectedMove={onCloseSelectedMove}
                  onAddWatched={onAddWatched}
                  watched={watched}
                />
              )}
            </>
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchedMoviesList
                watched={watched}
                onDeletWathed={onDeletWathed}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function ErrorMessage({ message }) {
  return <p className="error">{message} 🩻 ...</p>;
}

function Loader() {
  return <h3 className="loader">loading ....</h3>;
}

function NavBar({ children }) {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function Search({ requsetApi, onCloseSelectedMove, selectedId }) {
  const [query, setQuery] = useState("");

  const inputEl = useRef(null);

  const handleSubmit = function (e) {
    e.preventDefault();
    if (query.length < 3) return;
    requsetApi(query.trim());
    setQuery("");
  };

  const handelCloseSelectedMove = function () {
    selectedId && onCloseSelectedMove();
  };

  useEffect(() => {
    inputEl.current.focus();
  }, []);

  return (
    <form onSubmit={handleSubmit}>
      <input
        ref={inputEl}
        onKeyDown={handelCloseSelectedMove}
        className="search"
        type="text"
        placeholder="Search movies..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  );
}

function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>

      {isOpen && children}
    </div>
  );
}

function MovieList({ movies, onSelectedMove }) {
  return (
    <ul className="list">
      {movies.map((movie) => (
        <Movie
          movie={movie}
          key={movie.imdbID}
          onSelectedMove={onSelectedMove}
        />
      ))}
    </ul>
  );
}

function Movie({ movie, onSelectedMove }) {
  return (
    <li className="list_itme" onClick={() => onSelectedMove(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>📆</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function MoveDetails({
  selectedId,
  onCloseSelectedMove,
  onAddWatched,
  watched,
}) {
  const [movie, setMovie] = useState({});
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [starRating, setStarRating] = useState("");

  const countRef = useRef(0);

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

  const onAdd = function () {
    const newMove = {
      imdbId: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: runtime.split(" ").at(0),
      userRating: starRating,
      countRaTingDecisions: countRef.current,
    };
    onAddWatched(newMove);
    onCloseSelectedMove();
  };

  const hasMovieInWatched = watched.findIndex(
    (item) => item.imdbId === selectedId
  );

  useEffect(() => {
    const getMoveDetails = async function () {
      try {
        setError("");
        setLoading(true);
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${APIKEY}&i=${selectedId}`
        );

        if (!res.ok)
          throw new Error("Something went wrong with fetching movies");
        const data = await res.json();
        if (!data.Poster) throw new Error("move not find");
        setMovie(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    getMoveDetails();
  }, [selectedId]);

  useEffect(() => {
    if (!title) return;
    document.title = `Movie | ${title}`;
    return () => {
      document.title = "usePopcorn";
    };
  }, [title]);

  useEffect(() => {
    const callbak = function (e) {
      if (e.keyCode === 27) onCloseSelectedMove();
    };

    document.addEventListener("keydown", callbak);
    return () => document.removeEventListener("keydown", callbak);
  }, [onCloseSelectedMove]);

  useEffect(() => {
    if (starRating) countRef.current = countRef.current + 1;
  }, [starRating]);

  return (
    <>
      {isLoading && <Loader />}
      {error && <ErrorMessage message={error} />}
      {!isLoading && !error && (
        <div className="details">
          <header>
            <button
              title="بستن انتخاب شده "
              className="btn-back"
              onClick={onCloseSelectedMove}
              aria-label="Go back to previous page"
            >
              ⬅️
            </button>
            <img src={poster} alt={`Poster of ${title} `} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐</span>
                {`${imdbRating} IMDB Rating`}
              </p>
            </div>
          </header>

          <section>
            <div className="rating">
              {hasMovieInWatched === -1 ? (
                <>
                  <StarRating
                    onSetRating={setStarRating}
                    maxRating={10}
                    size={28}
                  />
                  {starRating > 0 && (
                    <button
                      className="btn-add"
                      onClick={onAdd}
                      title="اضافه کردن"
                    >
                      اضافه کردن به مورد علاقه ها
                    </button>
                  )}
                </>
              ) : (
                <h3>
                  You rated with movie {watched[hasMovieInWatched].userRating}{" "}
                  🌟
                </h3>
              )}
            </div>

            <p>
              <em>{plot}</em>
            </p>
            <p>Starring{actors}</p>
            <p>Directed by {director}</p>
          </section>
        </div>
      )}
    </>
  );
}

function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMoviesList({ watched, onDeletWathed }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbId}
          onDeletWathed={onDeletWathed}
        />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, onDeletWathed }) {
  return (
    <li>
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
        <button
          className="btn-delete"
          title="حذف کردن"
          onClick={() => onDeletWathed(movie.imdbId)}
        >
          ✖️
        </button>
      </div>
    </li>
  );
}
