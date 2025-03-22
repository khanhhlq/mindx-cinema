import { TMDB_API_KEY } from "./config.js";

(async () => {
  var HomeAPIRoutes = {
    "Trending Movies": { url: "/trending/movie/week" },
    "Popular Movies": { url: "/movie/popular" },
    "Top Rated Movies": { url: "/movie/top_rated" },
    "Now Playing at Theatres": { url: "/movie/now_playing" },
    "Upcoming Movies": { url: "/movie/upcoming" },
  };

  var promises = await Promise.all(
    Object.keys(HomeAPIRoutes).map(function(item) {
      return fetch(
        'https://api.themoviedb.org/3' + HomeAPIRoutes[item].url + '?api_key=' + TMDB_API_KEY
      )
      .then(function(response) {
        return response.json();
      });
    })
  );
  
  var data = promises.reduce(function(final, current, index) {
    final[Object.keys(HomeAPIRoutes)[index]] = current.results;
    return final;
  }, {});

  var trending = data["Trending Movies"];

  var main = trending[new Date().getDate() % trending.length];

  document.querySelector(
    "#hero-image"
  ).src = `https://image.tmdb.org/t/p/original${main.backdrop_path}`;
  document.querySelector(
    "#hero-preview-image"
  ).src = `https://image.tmdb.org/t/p/w300${main.poster_path}`;
  document.querySelector("#hero-title").innerText = main.title || main.name;
  document.querySelector("#hero-description").innerText = main.overview;
  document.querySelector("#watch-now-btn").href = `./watch.html?id=${main.id}`;
  document.querySelector("#view-info-btn").href = `./info.html?id=${main.id}`;

  Object.keys(data).map(function(key, index) {
    var htmlContent = '<div class="section">';
    htmlContent += '<h2>' + key + '</h2>';
  
    htmlContent += '<div class="swiper-' + index + ' swiper">';
    htmlContent += '<div class="swiper-wrapper">';
  
    var items = data[key].map(function(item) {
      return (
        '<a href="./info.html?id=' + item.id + '" class="swiper-slide" style="width: 200px !important">' +
          '<div class="movie-card">' +
            '<img class="fade-in" onload="this.style.opacity = \'1\'" src="https://image.tmdb.org/t/p/w200' + item.poster_path + '" alt="">' +
            '<p class="multiline-ellipsis-2">' + (item.title || item.name) + '</p>' +
          '</div>' +
        '</a>'
      );
    }).join("\n");
  
    htmlContent += items;
    htmlContent += '</div>';
    htmlContent += '<div class="swiper-button-prev"></div>';
    htmlContent += '<div class="swiper-button-next"></div>';
    htmlContent += '</div>';
    htmlContent += '</div>';
  
    document.querySelector("main").innerHTML += htmlContent;
  });
  

  document.querySelector(".backdrop").classList.add("backdrop-hidden");

  Object.keys(data).map(function(key, index) {
    new Swiper(`.swiper-${index}`, {
      spaceBetween: 30,
      autoplay: { delay: 5000, disableOnInteraction: true },
      slidesPerView: "auto",
      loop: true,
      slidesPerGroupAuto: true,
      navigation: {
        prevEl: `.swiper-button-prev`,
        nextEl: `.swiper-button-next`,
      },
    });
  });
})();
