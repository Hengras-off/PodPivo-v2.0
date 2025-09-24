const TMDB_API_KEY = '5205b8c031492a75039f7f449c72a948';
const YOUTUBE_API_KEY = 'AIzaSyDmR0HQ9zlYDsema6cM4qT6gxcdy2rC5b4';
const BASE_IMG = 'https://image.tmdb.org/t/p/w500';
const grid = document.querySelector('.grid');

// Получаем YouTube трейлер по названию фильма
async function getYouTubeTrailer(query) {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query + ' трейлер')}&key=${YOUTUBE_API_KEY}&maxResults=1`);
  const data = await res.json();
  if (data.items && data.items.length > 0) {
    return `https://www.youtube.com/embed/${data.items[0].id.videoId}`;
  }
  return 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // заглушка
}

// Загружаем фильмы с TMDb
async function loadMovies() {
  const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=ru-RU&page=1`);
  const data = await res.json();

  for (const movie of data.results) {
    const trailerUrl = await getYouTubeTrailer(movie.title);

    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
      <img src="${BASE_IMG + movie.poster_path}" alt="${movie.title}">
      <h3>${movie.title}</h3>
      <p>${movie.overview}</p>
      <iframe width="100%" height="200" src="${trailerUrl}" frameborder="0" allowfullscreen></iframe>
    `;
    grid.appendChild(card);
  }
}

// Запускаем
loadMovies();
