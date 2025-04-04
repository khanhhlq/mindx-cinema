import { TMDB_API_KEY } from "./config.js";

(function() {
  var HomeAPIRoutes = {
    "Trending Movies": { url: "/trending/movie/week" },
    "Popular Movies": { url: "/movie/popular" },
    "Top Rated Movies": { url: "/movie/top_rated" },
    "Now Playing at Theatres": { url: "/movie/now_playing" },
    "Upcoming Movies": { url: "/movie/upcoming" }
  };

  var routeKeys = Object.keys(HomeAPIRoutes);
  var promises = [];

  for (var i = 0; i < routeKeys.length; i++) {
    (function(item) {
      promises.push(
        new Promise(function(resolve, reject) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', 'https://api.themoviedb.org/3' + HomeAPIRoutes[item].url + '?api_key=' + TMDB_API_KEY);
          xhr.onload = function() {
            if (xhr.status === 200) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error(xhr.statusText));
            }
          };
          xhr.onerror = function() {
            reject(new Error("Network Error"));
          };
          xhr.send();
        })
      );
    })(routeKeys[i]);
  }

  function executeAllPromises(promises) {
    return new Promise(function(resolve, reject) {
      var results = [];
      var completed = 0;

      for (var i = 0; i < promises.length; i++) {
        (function(index) {
          promises[index].then(function(result) {
            results[index] = result;
            completed++;
            if (completed === promises.length) {
              resolve(results);
            }
          }).catch(function(error) {
            reject(error);
          });
        })(i);
      }
    });
  }

  executeAllPromises(promises)
    .then(function(results) {
      var data = {};
      for (var i = 0; i < routeKeys.length; i++) {
        data[routeKeys[i]] = results[i].results;
      }

      var trending = data["Trending Movies"];
      var main = trending[new Date().getDate() % trending.length];

      document.getElementById("hero-image").src =
        'https://image.tmdb.org/t/p/original' + (main.backdrop_path || '');
      document.getElementById("hero-preview-image").src =
        'https://image.tmdb.org/t/p/w300' + (main.poster_path || '');
      document.getElementById("hero-title").textContent = main.title || main.name || '';
      document.getElementById("hero-description").textContent = main.overview || '';
      document.getElementById("watch-now-btn").href =
        './watch.html?id=' + (main.id || '');
      document.getElementById("view-info-btn").href =
        './info.html?id=' + (main.id || '');

      var mainElement = document.querySelector("main");

      for (var j = 0; j < routeKeys.length; j++) {
        var key = routeKeys[j];
        var htmlContent = '<div class="section">';
        htmlContent += '<h2>' + key + '</h2>';
        htmlContent += '<div class="swiper-' + j + ' swiper">';
        htmlContent += '<div class="swiper-wrapper">';

        var items = data[key];
        for (var k = 0; k < items.length; k++) {
          var item = items[k];
          htmlContent +=
            '<a href="./info.html?id=' + item.id + '" class="swiper-slide" style="width: 200px !important">' +
              '<div class="movie-card">' +
                '<img class="fade-in" onload="this.style.opacity = \'1\'" ' +
                'src="https://image.tmdb.org/t/p/w200' + (item.poster_path || '') + '" alt="">' +
                '<p class="multiline-ellipsis-2">' + (item.title || item.name || '') + '</p>' +
              '</div>' +
            '</a>';
        }

        htmlContent += '</div>';
        htmlContent += '<div class="swiper-button-prev"></div>';
        htmlContent += '<div class="swiper-button-next"></div>';
        htmlContent += '</div>';
        htmlContent += '</div>';

        mainElement.innerHTML += htmlContent;
      }

      document.querySelector(".backdrop").classList.add("backdrop-hidden");

      for (var l = 0; l < routeKeys.length; l++) {
        (function(index) {
          if (typeof Swiper === 'function') {
            new Swiper('.swiper-' + index, {
              spaceBetween: 30,
              autoplay: { delay: 5000, disableOnInteraction: true },
              slidesPerView: "auto",
              loop: true,
              slidesPerGroupAuto: true,
              navigation: {
                prevEl: '.swiper-button-prev',
                nextEl: '.swiper-button-next'
              }
            });
          }
        })(l);
      }
    })
    .catch(function(error) {
      console.log('Error:', error);
      var errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.textContent = 'Failed to load movie data. Please try again later.';
      document.querySelector("main").prepend(errorElement);
    });
})();