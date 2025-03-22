import { TMDB_API_KEY } from "./config.js";

var searchQuery = new URLSearchParams(location.search);

var query = searchQuery.get("q")?.trim();

(function() {
  if (query) {
    fetch('https://api.themoviedb.org/3/search/movie?query=' + encodeURIComponent(query) + '&api_key=' + TMDB_API_KEY)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        console.log(data);

        // Hide the form and show the movie grid
        document.querySelector("form").style.display = "none";
        document.querySelector("#movie-grid").style.display = "grid";

        // Update the movie grid with the search results
        var movieGridHTML = '<h1 class="text-2xl mb-8">Search result for \'' + query + '\'</h1>';
        movieGridHTML += '<div>';

        movieGridHTML += data.results
          .map(function(item) {
            return (
              '<a href="./info.html?id=' + item.id + '">' +
                '<div class="movie-card">' +
                  '<img style="width: auto; height: auto; aspect-ratio: 2/3" class="fade-in" onload="this.style.opacity = \'1\'" src="https://image.tmdb.org/t/p/w200' + item.poster_path + '" alt=""/>' +
                  '<p class="multiline-ellipsis-2">' + (item.title || item.name) + '</p>' +
                '</div>' +
              '</a>'
            );
          })
          .join('');

        movieGridHTML += '</div>';

        document.querySelector("#movie-grid").innerHTML = movieGridHTML;
      })
      .catch(function(error) {
        console.error('Error fetching movie data:', error);
      });
  }

  // Hide the backdrop after the content is loaded
  document.querySelector(".backdrop").classList.add("backdrop-hidden");
})();
