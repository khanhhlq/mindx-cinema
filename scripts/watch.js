import { TMDB_API_KEY } from "./config.js";
import { auth, db } from "./firebase.js";
import {
  query,
  collection,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

var calculateElapsedTime = function(timeCreated) {
  var created = new Date(timeCreated).getTime();
  var periods = {
    year: 365 * 30 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    minute: 60 * 1000
  };
  var diff = Date.now() - created;
  
  for (var key in periods) {
    if (periods.hasOwnProperty(key)) {
      if (diff >= periods[key]) {
        var result = Math.floor(diff / periods[key]);
        return result + " " + (result === 1 ? key : key + "s") + " ago";
      }
    }
  }
  
  return "Just now";
};

var searchQuery = new URLSearchParams(window.location.search);
var movieId = searchQuery.get("id");

if (!movieId) {
  window.location.href = "./index.html";
}

var labels = ["data", "similar"];

(function() {
  try {
    Promise.all([
      fetch('https://api.themoviedb.org/3/movie/' + movieId + '?api_key=' + TMDB_API_KEY).then(function(res) { return res.json(); }),
      fetch('https://api.themoviedb.org/3/movie/' + movieId + '/similar?api_key=' + TMDB_API_KEY).then(function(res) { return res.json(); })
    ]).then(function(results) {
      var result = results.reduce(function(final, current, index) {
        if (labels[index] === "data") {
          final[labels[index]] = current;
        } else if (labels[index] === "similar") {
          final[labels[index]] = current.results;
        }
        return final;
      }, {});

      console.log(result);

      // Set iframe to play video
      document.querySelector("iframe").src = 'https://www.2embed.cc/embed/' + result.data.id;

      // Set movie details
      document.querySelector("#movie-title").innerText = result.data.title || result.data.name;
      document.querySelector("#movie-description").innerText = result.data.overview;
      if (result.data.release_date) {
        document.querySelector("#release-date").innerText = 'Release Date: ' + result.data.release_date;
      }

      // Set similar movies
      if (result.similar && result.similar.length > 0) {
        var similarHTML = '<h1 class="text-xl">Similar Movies</h1>';
        result.similar.forEach(function(item) {
          similarHTML += 
            '<a href="./info.html?id=' + item.id + '">' +
              '<div>' +
                '<img onload="this.style.opacity = \'1\'" alt="" src="https://image.tmdb.org/t/p/w200' + item.poster_path + '" />' +
                '<div><p>' + item.title + '</p></div>' +
              '</div>' +
            '</a>';
        });
        document.querySelector("#similar").innerHTML = similarHTML;
      }

      // Comment section
      onAuthStateChanged(auth, function(user) {
        var avatarSrc = user ? 
          (user.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(user.displayName)) : 
          './assets/default-avatar.png';
        
        var commentPlaceholder = user ? 'Comment as ' + user.displayName : 'Sign in to comment';
        var commentDisabled = user ? '' : 'style="pointer-events: none"';
        var buttonDisplay = user ? '' : 'style="display: none"';
        var formOnClick = !user ? 'style="cursor: pointer" onclick="signIn()"' : '';
        
        document.querySelector("#comment-box-container").innerHTML = 
          '<form ' + formOnClick + ' class="comment-form" autocomplete="off">' +
            '<img src="' + avatarSrc + '" />' +
            '<div>' +
              '<input required type="text" placeholder="' + commentPlaceholder + '" id="comment" name="comment" ' + commentDisabled + ' />' +
              '<button type="submit" ' + buttonDisplay + '><i class="fa-solid fa-paper-plane"></i></button>' +
            '</div>' +
          '</form>';

        var form = document.querySelector("form");
        form.addEventListener("submit", function(e) {
          e.preventDefault();
          var title = e.target.comment.value.trim();
          e.target.comment.value = "";

          addDoc(collection(db, 'movie-comments-' + movieId), {
            title: title,
            user: {
              uid: auth.currentUser.uid,
              displayName: auth.currentUser.displayName,
              photoURL: auth.currentUser.photoURL,
              email: auth.currentUser.email,
            },
            createdAt: serverTimestamp(),
          }).catch(function(err) {
            console.log(err);
            alert("Failed to comment", err);
          });
        });
      });

      // Fetch and display comments
      var q = query(
        collection(db, 'movie-comments-' + movieId),
        orderBy("createdAt", "desc")
      );

      onSnapshot(q, function(querySnapshot) {
        var comments = [];
        querySnapshot.forEach(function(doc) {
          comments.push({ id: doc.id, data: doc.data() });
        });

        var out = "";
        comments.forEach(function(comment) {
          var userPhoto = comment.data.user.photoURL || 
            'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(comment.data.user.displayName);
          
          out +=
            '<div class="comment-item">' +
              '<img src="' + userPhoto + '" />' +
              '<div>' +
                '<div>' +
                  '<strong>' + comment.data.user.displayName + '</strong>' +
                  '<p>' + comment.data.title + '</p>' +
                '</div>' +
                '<p>' + calculateElapsedTime(comment.data.createdAt && comment.data.createdAt.seconds ? 
                  comment.data.createdAt.seconds * 1000 : Date.now()) + '</p>' +
              '</div>' +
            '</div>';
        });

        document.querySelector("#comments").innerHTML = out;
      });

      // Hide backdrop
      document.querySelector(".backdrop").classList.add("backdrop-hidden");

      // Set document title
      document.title = 'Watch ' + (result.data.title || result.data.name) + ' - MindX Cinema';
    }).catch(function(error) {
      console.error('Error fetching data:', error);
      alert('Something went wrong. Please try again later.');
    });
  } catch (error) {
    console.error('Error:', error);
    alert('Something went wrong. Please try again later.');
  }
})();