import bot from '/assets/bot.svg';
import user from '/assets/user.svg';
import speechUtteranceChunker from './chunkify';
//Global variables
let loadInterval;

//Global constants
const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
const mic = document.querySelector('#microphone');
const micAnime = document.querySelector('#animation');

const speechRecognition = window.speechRecognition || window.webkitSpeechRecognition;
const recognition = new speechRecognition();

const speechSynthesis = window.speechSynthesis;
// const mute = document.querySelector('#mute');

//Microphone events
mic.addEventListener("click", () => {
  mic.style.display = "none";
  micAnime.style.display = "block";
  recognition.lang = "en-GB";

  recognition.interimResults = false;
  recognition.start();
  recognition.onend = function () {
    mic.style.display = "block";
    micAnime.style.display = "none";
  };
  recognition.onresult = async (event) => {
    const last = event.results.length - 1;
    const text = event.results[last][0].transcript;

    chatContainer.innerHTML += chatStripe(false, text);

    //generate bot's chatStripe
    let uniqueId = generateUniqueId();
    chatContainer.innerHTML += chatStripe(true, " ", uniqueId);

    chatContainer.scrollTop = chatContainer.scrollHeight;

    const messageDiv = document.getElementById(uniqueId);

    loader(messageDiv);

    //fetch data from server -> bot's response
    const response = await fetch('https://codex-4yg3.onrender.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: text
      })
    });

    clearInterval(loadInterval);

    messageDiv.innerHTML = '';

    if (response.ok) {
      let data = await response.json();
      let parsedData = data.bot.trim();

      typeText(messageDiv, parsedData);

      if ('speechSynthesis' in window) {
        let speech = new SpeechSynthesisUtterance(parsedData);
        speech.lang = 'en-GB';

        speechUtteranceChunker(speech, {
          chunkLength: 120
        }, function () {
          console.log('done');
        });
      } else {
        alert('Your browser does not support Web Speech API');
      }
    } else {
      const err = await response.text();
      messageDiv.innerHTML = "Something went wrong";
      alert(err);
    }
  }
});

micAnime.addEventListener("click", () => {
  recognition.abort();
  speechSynthesis.cancel();

  mic.style.display = "block";
  micAnime.style.display = "none";
});

// Functions
function loader(element) {
  element.textContent = '';

  loadInterval = setInterval(() => {
    element.textContent += '.';

    if (element.textContent === '....') {
      element.textContent = '';
    }
  }, 300);
}

function typeText(element, text) {
  let index = 0

  let interval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index)
      index++
    } else {
      clearInterval(interval)
    }
  }, 20)
}

function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe(isAi, value, uniqueId) {
  return (
    `
    <div class = "wrapper ${isAi && 'ai'}">
      <div class = "chat">
        <div class = "profile">
          <img src=${isAi ? bot : user} alt="${isAi ? 'bot' : 'user'}"/>
        </div>
        <div class = "message" id=${uniqueId}>${value}</div>
      </div>
    </div>
    `
  );
}

const handleSubmit = async (event) => {
  event.preventDefault();

  const data = new FormData(form);

  //generate user's chatStripe
  chatContainer.innerHTML += chatStripe(false, data.get('prompt'));
  form.reset();

  //generate bot's chatStripe
  let uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatStripe(true, " ", uniqueId);

  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueId);

  loader(messageDiv);

  //fetch data from server -> bot's response
  const response = await fetch('https://codex-4yg3.onrender.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: data.get('prompt')
    })
  });

  clearInterval(loadInterval);

  messageDiv.innerHTML = '';

  if (response.ok) {
    let data = await response.json();
    let parsedData = data.bot.trim();

    typeText(messageDiv, parsedData);

    if ('speechSynthesis' in window) {
      let speech = new SpeechSynthesisUtterance(parsedData);
      speech.lang = 'en-GB';

      speechUtteranceChunker(speech, {
        chunkLength: 120
      }, function () {
        console.log('done');
      });
    } else {
      alert('Your browser does not support Web Speech API');
    }
  } else {
    const err = await response.text();
    messageDiv.innerHTML = "Something went wrong";
    alert(err);
  }
}

form.addEventListener('submit', handleSubmit);
// form.addEventListener('keyup', (event) => {
//   if(event.keyCode  === '13'){
//     handleSubmit(event);
//   }
// });