import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { auth } from "./firebase.js";

export var TMDB_API_KEY = "9b7c3ede447b14c5e0e9d33a137ddac9";

addEventListener("scroll", function () {
  if (window.scrollY === 0) {
    document.querySelector(".navbar").classList.remove("navbar-background-visible");
  } else {
    document.querySelector(".navbar").classList.add("navbar-background-visible");
  }
});

window.handleSignOut = function () {
  signOut(auth);
  location.reload();
};

window.signIn = function () {
  signInWithPopup(auth, new GoogleAuthProvider());
};

onAuthStateChanged(auth, function (user) {
  if (user) {
    var avatarHTML = '<div tabindex="0" class="avatar-action">' +
      '<img src="' + (user.photoURL || 
        'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(user.displayName)) + '" />' +
      '<div class="popup">' +
        '<button class="action-button" onclick="handleSignOut()">' +
          '<i class="fa-solid fa-right-from-bracket"></i>' +
          '<span> Logout</span>' +
        '</button>' +
      '</div>' +
    '</div>';
    document.getElementById("avatar-action-container").innerHTML = avatarHTML;
  } else {
    document.getElementById("avatar-action-container").innerHTML =
      '<i onclick="signIn()" style="cursor: pointer; font-size: 25px" class="fa-solid fa-right-to-bracket"></i>';
  }
});

document.body.innerHTML +=
  '<button class="chatbot-toggler">' +
    '<span class="material-symbols-rounded">mode_comment</span>' +
    '<span class="material-symbols-outlined">close</span>' +
  '</button>' +
  '<div class="chatbot">' +
    '<header>' +
      '<h2>Chatbot</h2>' +
      '<span class="close-btn material-symbols-outlined">close</span>' +
    '</header>' +
    '<ul class="chatbox">' +
      '<li class="chat incoming">' +
        '<span class="material-symbols-outlined">smart_toy</span>' +
        '<p>Hi there 👋<br />How can I help you today?</p>' +
      '</li>' +
    '</ul>' +
    '<div class="chat-input">' +
      '<textarea placeholder="Enter a message..." spellcheck="false" required></textarea>' +
      '<span id="send-btn" class="material-symbols-rounded">send</span>' +
    '</div>' +
  '</div>' +
  '<!-- Google tag (gtag.js) -->' +
  '<script async src="https://www.googvaragmanager.com/gtag/js?id=G-VNJX66Z0YF"></script>' +
  '<script>' +
    'window.dataLayer = window.dataLayer || [];' +
    'function gtag() { dataLayer.push(arguments); }' +
    'gtag("js", new Date());' +
    'gtag("config", "G-VNJX66Z0YF");' +
  '</script>';

var chatbotToggler = document.querySelector(".chatbot-toggler");
var closeBtn = document.querySelector(".close-btn");
var chatbox = document.querySelector(".chatbox");
var chatInput = document.querySelector(".chat-input textarea");
var sendChatBtn = document.querySelector(".chat-input span");

var userMessage = null;
var API_KEY = "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";
var inputInitHeight = chatInput.scrollHeight;

var createChatLi = function (message, className) {
  var chatLi = document.createElement("li");
  chatLi.className = "chat " + className;
  var chatContent = (className === "outgoing")
    ? '<p></p>'
    : '<span class="material-symbols-outlined">smart_toy</span><p></p>';
  chatLi.innerHTML = chatContent;
  chatLi.querySelector("p").textContent = message;
  return chatLi;
};

var generateResponse = function (chatElement) {
  var API_URL = "https://api.openai.com/v1/chat/completions";
  var messageElement = chatElement.querySelector("p");

  var requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + API_KEY
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: userMessage }]
    })
  };

  fetch(API_URL, requestOptions)
    .then(function (res) { return res.json(); })
    .then(function (data) {
      messageElement.textContent = data.choices[0].message.content.trim();
    })
    .catch(function () {
      messageElement.className += " error";
      messageElement.textContent = "Oops! Something went wrong. Please try again.";
    })
    .finally(function () {
      chatbox.scrollTop = chatbox.scrollHeight;
    });
};

var handleChat = function () {
  userMessage = chatInput.value.trim();
  if (!userMessage) return;

  chatInput.value = "";
  chatInput.style.height = inputInitHeight + "px";

  chatbox.appendChild(createChatLi(userMessage, "outgoing"));
  chatbox.scrollTop = chatbox.scrollHeight;

  setTimeout(function () {
    var incomingChatLi = createChatLi("Thinking...", "incoming");
    chatbox.appendChild(incomingChatLi);
    chatbox.scrollTop = chatbox.scrollHeight;
    generateResponse(incomingChatLi);
  }, 600);
};

chatInput.addEventListener("input", function () {
  chatInput.style.height = inputInitHeight + "px";
  chatInput.style.height = chatInput.scrollHeight + "px";
});

chatInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
    e.preventDefault();
    handleChat();
  }
});

sendChatBtn.addEventListener("click", handleChat);

closeBtn.addEventListener("click", function () {
  document.body.className = document.body.className.replace(" show-chatbot", "");
});

chatbotToggler.addEventListener("click", function () {
  if (document.body.className.indexOf("show-chatbot") === -1) {
    document.body.className += " show-chatbot";
  } else {
    document.body.className = document.body.className.replace(" show-chatbot", "");
  }
});
