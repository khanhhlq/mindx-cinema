import { TMDB_API_KEY } from "./config.js";

var searchQuery = new URLSearchParams(location.search);

var movieId = searchQuery.get("id");

if (!movieId) location.href = "./index.html";

var labels = ["data", "casts", "similar"];

(function() {
  // Fetch the movie details, credits, and similar movies in parallel using Promise.all
  Promise.all([
    fetch('https://api.themoviedb.org/3/movie/' + movieId + '?api_key=' + TMDB_API_KEY)
      .then(function(response) { return response.json(); }),
    fetch('https://api.themoviedb.org/3/movie/' + movieId + '/credits?api_key=' + TMDB_API_KEY)
      .then(function(response) { return response.json(); }),
    fetch('https://api.themoviedb.org/3/movie/' + movieId + '/similar?api_key=' + TMDB_API_KEY)
      .then(function(response) { return response.json(); })
  ])
  .then(function(results) {
    // Reduce the results to a final object
    var result = results.reduce(function(final, current, index) {
      if (labels[index] === "data") {
        final[labels[index]] = current;
      } else if (labels[index] === "casts") {
        final[labels[index]] = current.cast
          .filter(function(item) { return item.name && item.character && item.profile_path; })
          .slice(0, 10);
      } else if (labels[index] === "similar") {
        final[labels[index]] = current.results;
      }

      return final;
    }, {});

    console.log(result);

    // Set background image
    document.querySelector(".background-img").style.backgroundImage = 'url("https://image.tmdb.org/t/p/original' + result.data.backdrop_path + '")';

    // Set preview image
    document.querySelector("#preview-img").src = 'https://image.tmdb.org/t/p/w300' + result.data.poster_path;

    // Set movie title and description
    document.querySelector("#movie-title").innerText = result.data.title || result.data.name;
    document.querySelector("#movie-description").innerText = result.data.overview;

    // Set Watch Now button link
    document.querySelector("#watch-now-btn").href = './watch.html?id=' + result.data.id;

    // Set release date if available
    if (result.data.release_date) {
      document.querySelector("#release-date").innerText = 'Release Date: ' + result.data.release_date;
    }

    // Set genres if available
    if (result.data.genres) {
      document.querySelector("#genres").innerHTML = result.data.genres
        .map(function(genres) {
          return '<span>' + genres.name + '</span>';
        })
        .join('');
    }

    // Set cast details if available
    if (result.casts) {
      document.querySelector(".casts-grid").innerHTML = result.casts
        .map(function(item) {
          return '<div>' +
            '<img onload="this.style.opacity = \'1\'" class="fade-in" src="https://image.tmdb.org/t/p/w200' + item.profile_path + '" alt="">' +
            '<p style="text-align: center">' + item.name + '</p>' +
            '<p style="text-align: center; color: var(--orange)">' + item.character + '</p>' +
          '</div>';
        })
        .join('');
    }

    // Set similar movies section if available
    if (result.similar && result.similar.length > 0) {
      document.querySelector("#similar").innerHTML +=
        '<div class="section">' +
          '<h2>Similar</h2>' +
          '<div class="swiper">' +
            '<div class="swiper-wrapper">' +
              result.similar
                .map(function(item) {
                  return '<a href="./info.html?id=' + item.id + '" class="swiper-slide" style="width: 200px !important">' +
                    '<div class="movie-card">' +
                      '<img class="fade-in" onload="this.style.opacity = \'1\'" src="https://image.tmdb.org/t/p/w200' + item.poster_path + '" alt="">' +
                      '<p class="multiline-ellipsis-2">' + (item.title || item.name) + '</p>' +
                    '</div>' +
                  '</a>';
                })
                .join('\n') +
            '</div>' +
            '<div class="swiper-button-prev"></div>' +
            '<div class="swiper-button-next"></div>' +
          '</div>' +
        '</div>';
    }

    // Initialize Swiper
    new Swiper('.swiper', {
      spaceBetween: 30,
      autoplay: { delay: 5000, disableOnInteraction: true },
      slidesPerView: 'auto',
      loop: true,
      slidesPerGroupAuto: true,
      navigation: {
        prevEl: '.swiper-button-prev',
        nextEl: '.swiper-button-next',
      },
    });

    // Hide backdrop
    document.querySelector(".backdrop").classList.add("backdrop-hidden");

    // Set document title
    document.title = (result.data.title || result.data.name) + ' - MindX Cinema';
  })
  .catch(function(error) {
    console.error('Error fetching data:', error);
  });
})();
