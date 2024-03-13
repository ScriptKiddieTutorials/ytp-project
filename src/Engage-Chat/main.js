// Made by YTP Team 「」


// Disable logging
// console.log = function() {};

// Constants
const DEBUG_FLAG = false;
const ENABLE_GRAMMAR_CHECK_FLAG = true;
const NUM_SUG_COL = 3;


const CHAT_API_TOKEN = "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";
const UNSPLASH_API = 'https://api.unsplash.com/search/photos?query=';
const ACCESS_KEY = 'QhEewquI6zhU5QLTBs2-501xfkNYZ7FfXXEm1WOs6EM';
const USER_AVA_URL = "https://raw.githubusercontent.com/AllenMuenLee/Engage/main/User-avatar.png";
const BOT_AVA_URL = "https://raw.githubusercontent.com/AllenMuenLee/Engage/main/Bot-avatar.png";
const DICT_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const WIKI_API_URL = "https://en.wiktionary.org/api/rest_v1";
const TRANSLATE_API_URL = "https://api.mymemory.translated.net/get?q=";

const r = document.querySelector(':root');

// DOM Elements
const inputField = document.getElementById("input");
const hint = document.getElementById("input-hint");
const messagesContainer = document.getElementById("chat-history");
// const modelList = document.getElementById("model-list");
const levelList = document.getElementById("level-list");
const strikeNum = document.getElementById("strike-num");
const imgArea = document.getElementById("img-area");
const sendBtn = document.getElementById("send-button");
const leaveBtn = document.getElementById("leave-button");
const nextInfoBtn = document.getElementById("info-nxt-btn");
const closeInfoBtn = document.getElementById("info-x-btn");
const suggestionBtn = document.getElementById("suggestions-area");
const fillBtn = document.getElementById("fill-area");
const transBtn = document.getElementById("trans-area");
const pics = document.getElementById("img-area");
const def = document.getElementById("definition");
const defText = document.getElementById("definition-text");
const defTitle = document.getElementById("definition-vocab");
const resetBtn = document.getElementById("reset-button");
const infoBox = document.getElementById("info-box1");
const infoBoxText = document.getElementById("info-box1-text");

const sugContainer = document.getElementById("suggestions");

// Local Storage
var vocabs = localStorage.getItem("vocabs");
var lastlogin = localStorage.getItem("loginTime");
var input_hist = localStorage.getItem("input_hist");
var output_hist = localStorage.getItem("output_hist");
var iconsrc = localStorage.getItem("image");
var hist_limit = 10;
var fontSize = localStorage.getItem('fontSize');
var strike_num = document.getElementById("strike-num");

const insFocusElemId = [
  "input", "suggestions-area", "fill-area", "trans-area",
];

const instructions = [
  `說 "Hi" 進入對話！`,
  `當突然不知道要接什麼時，可以點【建議】喔~`,
  `當你不確定句中的詞彙時，可以選取它並點【填空】喔~`,
  `最後，如果你有某個詞彙只會用中文打的話，可以選取它並按【英譯】~\n\nGL&HF!`
];

// Global Config
var globalConfig = {
  status: 200,
  lastInput: "",
  lastOutput: "",
  inputUpdated: false,
  curFillSug: null,
  curFillSugIdx: -1,
  timeoutHandle: null,
  curInsIdx: -1,
  curModelId: 1,
  curSugId: 0,
  mode: 0,
};

// Text-to-Speech
var speech;
var models = [];


class Model0 { // Dummy model for testing
  constructor() {

  }
  clear() {

  }
  up() {

  }
  get(msg) {

  }
  send(msg) {
    console.log(msg);
  }
}

class Model1 { // Blenderbot model
  constructor() {
    this.API_URL = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill";
    this.in_hist = input_hist;
    this.out_hist = output_hist;
    this.LIMIT = 10;
  }

  clear() {
    this.in_hist = [];
    this.out_hist = [];
  }

  get(msg) {
    return fetch(this.API_URL, {
      "headers": {
        "Authorization": "Bearer " + CHAT_API_TOKEN,
        "content-type": "application/json",
      },
      "body": JSON.stringify(
        {
          // inputs: {
          //   "generated_responses": this.out_hist,
          //   "past_user_inputs": this.in_hist,
          //   "text": msg,
          // },
          "inputs": msg,
          "parameters": {},
        }),
      "method": "POST",
    }).catch((err) => {
      console.log("Chabot server internal error:");
      console.log(err);
    });
  }

  up() {
    return this.get("DUMMY");
  }

  send(msg) {
    this.get(msg)
      .then((response) => response.json())
      .then((res) => addChatbotReply(msg, res));
  }
}

// Helper functions
function logCaller() {
  if (!DEBUG_FLAG) return;
  console.log(`${logCaller.caller.name}() called`);
}

function validateSuggestion(str) {
  return /^([a-zA-Z\-\.\?\!\ \'\,])*$/.test(str);
}

function containsChinese(str) {
  return /[\u3400-\u9FBF]/.test(str);
}

function getNextMsg() {
  return "";
}

function getNextSug(typ) {
  return "";
}

function getRandSeed() {
  return Math.floor(Math.random() * 100);
}

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

function exit(evt) {
  hideElem(evt.currentTarget.hideElemId);
}

function showElem(id) {
  const target = document.getElementById(id);
  target.style.visibility = "visible";
}

function hideElem(id) {
  const target = document.getElementById(id);
  target.style.visibility = "hidden";
}


// Initialize everything
function initAll() {
  buildDOMElements();
  restoreHistory();
  addPrevChatHistory();
  addEventListeners();
  initModels();
  // setDefaultModel();
  initSpeech();
  setInterval(monitorServerStatus, 15000);
}

function buildDOMElements() {
  initSuggestions();
}

function restoreHistory() {
  if (input_hist !== null) {
    // console.log(input_hist);
    input_hist = JSON.parse(input_hist);
  } else {
    getNextInfo();
    showElem("info-box1");
    input_hist = [];
  }

  if (output_hist !== null) {
    output_hist = JSON.parse(output_hist);
  } else {
    output_hist = [];
  }

  var currtime = new Date();

  if (lastlogin !== null) {
    lastlogin = JSON.parse(lastlogin);
    var nextd = new Date(lastlogin[0]);
    nextd.setDate(nextd.getDate() + 1);
    if (currtime.getUTCFullYear() == nextd.getUTCFullYear() && currtime.getUTCMonth() == nextd.getUTCMonth() && currtime.getUTCDate() == nextd.getUTCDate()) {
      lastlogin[1]++;
    }
    lastlogin[0] = currtime;
  } else {
    lastlogin = [currtime, 1];
  }

  localStorage.setItem("loginTime", JSON.stringify(lastlogin));

  if (vocabs !== null) {
    vocabs = JSON.parse(vocabs);
  } else {
    vocabs = {};
  }

  strike_num.innerHTML = lastlogin[1];

  if (iconsrc == null) {
    iconsrc = 'https://raw.githubusercontent.com/AllenMuenLee/Engage/main/User-avatar.png';
  }

  if (fontSize == null) {
    fontSize = 1;
    localStorage.setItem('fontSize', fontSize);
  } else {
    fontSize = localStorage.getItem('fontSize');
  }
  r.style.setProperty('--fontAddSize', fontSize);
}

function addPrevChatHistory() {
  for (var i = 0; i < output_hist.length; i++) {
    addChatEntry(input_hist[i], "User");
    addChatEntry(output_hist[i], "Bot");
  }
}

function addEventListeners() {
  // Upper toolbar
  // modelList.addEventListener("change", updateSelectedModel);
  levelList.addEventListener("change", updateEnglishLevel);
  resetBtn.addEventListener("click", clearHistory);

  // Definitions
  leaveBtn.addEventListener("click", exit);
  leaveBtn.hideElemId = "definition";

  // Tutorial
  nextInfoBtn.addEventListener("click", getNextInfo);
  closeInfoBtn.addEventListener("click", exitInfo);

  // Message bar
  inputField.addEventListener("click", resolveSuggestion);
  inputField.addEventListener("keydown", resolveSuggestion);
  inputField.addEventListener("keydown", handleEnter);

  sendBtn.addEventListener("click", sendMsg);

  // Buttom toolbar
  suggestionBtn.addEventListener("click", addAllSuggestions);
  fillBtn.addEventListener("click", addFillSuggestions);
  transBtn.addEventListener("click", addTransSuggestions);

  // Automatic Grammar check
  if (ENABLE_GRAMMAR_CHECK_FLAG) {
    inputField.addEventListener("keydown", updateGrammarSuggestions);
  }
}

function initModels() {
  models.push(new Model0());
  models.push(new Model1());
}

// function setDefaultModel() {
//   var defaultModel = modelList.querySelector(`option[value='${globalConfig.curModelId}']`);
//   defaultModel.selected = "selected";
// }

function initSpeech() {
  speech = new SpeechSynthesisUtterance();
  speech.lang = "en";
  voices = window.speechSynthesis.getVoices();
  speech.voice = voices[0];
}


function updateEnglishLevel(evt) {
  let target = evt.currentTarget;
  setEnglishLevel(target.options[target.selectedIndex].value);
}

function setEnglishLevel(id) {
  globalConfig.mode = id > 0 ? id - 1 : 0;
}

function clearHistory() {
  models[globalConfig.curModelId].clear();
  messagesContainer.innerHTML = "";
  localStorage.clear();
}


function selectText(start, end) {
  inputField.select();
  inputField.focus();
  inputField.setSelectionRange(start, end);
}

function deleteSelectedText(txtArea = inputField) {
  if (txtArea.selectionStart != undefined) {
    var startPos = txtArea.selectionStart;
    var endPos = txtArea.selectionEnd;
    txtArea.value = txtArea.value.slice(0, startPos) + txtArea.value.slice(endPos);
  }
}

// Event Listeners
function initSuggestions() {
  sugContainer.replaceChildren();
  for (let i = 0; i < NUM_SUG_COL; i++) {
    const elem = document.createElement("div");
    elem.classList.add("sug-col");
    // elem.style.width = `${100/NUM_SUG_COL}%`;
    elem.id = `sug-col-${i}`;
    sugContainer.appendChild(elem);
  }
}

function getNextInfo() {
  let idx = globalConfig.curInsIdx;
  if (idx >= insFocusElemId.length) return;

  if (idx >= 0) {
    const prevElem = document.getElementById(insFocusElemId[idx]);
    prevElem.classList.remove("focusedBtn");
  }
  globalConfig.curInsIdx++;
  idx++;
  if (idx < insFocusElemId.length) {
    infoBoxText.innerText = `(${idx + 1}\/${insFocusElemId.length})\n${instructions[idx]}`;
    const curElem = document.getElementById(insFocusElemId[idx]);
    curElem.classList.add("focusedBtn");
  }
  else {
    hideElem("info-box1");
  }
}

function exitInfo() {
  let idx = globalConfig.curInsIdx;
  if (idx < insFocusElemId.length) {
    const curElem = document.getElementById(insFocusElemId[idx]);
    curElem.classList.remove("focusedBtn");
  }
  globalConfig.curInsIdx = insFocusElemId.length;
  hideElem("info-box1");
}

function resolveSuggestion() {
  globalConfig.curFillSug = null;
  globalConfig.curFillSugIdx = -1;
}

function handleEnter(e) {
  if (e.keyCode === 13 && !e.shiftKey) {
    sendMsg();
    e.preventDefault();
  }
}

function sendMsg() {
  var inputText = inputField.value;
  if (!inputText) return;
  inputField.value = "";
  speech.text = "";
  initSuggestions();
  reply(inputText);
}

function addAllSuggestions() {
  logCaller();
  if (!inputField.value.trim()) return;

  initSuggestions();
  let lastResponse = "";
  if (output_hist.length > 0) {
    lastResponse = output_hist[output_hist.length - 1] + " ";
  }
  addPredSuggestions(lastResponse + inputField.value);
}

async function addPredSuggestions(text) {
  logCaller();
  var inputText = inputField.value;

  for (let sid = 0; sid < NUM_SUG_COL; ++sid) {
    let output = getNextSug("pred");
    if (!output) {
      while (true) {
        const res = await fetch("https://api-inference.huggingface.co/models/bigscience/bloom", {
          headers: {
            "Authorization": "Bearer " + CHAT_API_TOKEN,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "inputs": text,
            "parameters": {
              "seed": getRandSeed(),
              "early_stopping": false,
              "length_penalty": 10000,
              "max_new_tokens": 4,
              "top_p": 0.9,
              "do_sample": false,
            }
          }),
          method: "POST",
        });
        const dat = await res.json();

        output = dat[0]['generated_text'];
        output = output.substring(text.length);
        output = output.replaceAll('\n', ' ');
        output = output.split(/[.?!]+/, 1)[0];
        output = output.trim();
        if (output.length > 0 && validateSuggestion(output)) break;
      }
    }
    addSuggestion("..." + output, inputText.trimEnd() + " " + output);
  }
}

async function addFillSuggestions() {
  logCaller();
  let prevText = inputField.value;
  let fromIndex = inputField.selectionStart;
  let toIndex = inputField.selectionEnd;

  let fillText = getNextSug("fill");
  if (!fillText) {

    let maskText = prevText.substring(0, fromIndex) + "<mask>" + prevText.substring(toIndex);

    if (!globalConfig.curFillSug) {
      const res = await fetch("https://api-inference.huggingface.co/models/FacebookAI/roberta-base", {
        "headers": {
          "Authorization": "Bearer " + CHAT_API_TOKEN,
          "Content-Type": "application/json",
        },
        "body": JSON.stringify(
          {
            inputs: maskText,
          }),
        "method": "POST",
      });

      if (!res.ok) return null;
      globalConfig.curFillSug = await res.json();
    }
    var dat = globalConfig.curFillSug;
    console.log(dat);

    globalConfig.curFillSugIdx++;
    globalConfig.curFillSugIdx %= dat.length;

    fillText = dat[globalConfig.curFillSugIdx]['token_str'].trim();
  }

  let start = fromIndex;
  let end = start + fillText.length;

  inputField.value = prevText.substring(0, fromIndex) + fillText + prevText.substring(toIndex);
  selectText(start, end);
}

async function addTransSuggestions() {
  logCaller();
  let arg = inputField.value;
  var fromIndex = inputField.selectionStart;
  var toIndex = inputField.selectionEnd;
  var selText = arg.substring(fromIndex, toIndex);

  if (containsChinese(selText)) {
    let transText = getNextSug("trans");
    if (!transText) transText = await translate(selText, true);
    var start = fromIndex;
    var end = start + transText.length;
    deleteSelectedText();
    inputField.value = arg.substring(0, fromIndex) + transText + arg.substring(toIndex);
    selectText(start, end);
  }
}

function updateGrammarSuggestions() {
  if (globalConfig.timeoutHandle) {
    clearTimeout(globalConfig.timeoutHandle);
  }
  globalConfig.timeoutHandle = window.setTimeout(addGrammarSuggestions, 3000);
}

async function addGrammarSuggestions() {
  logCaller();

  var input = inputField.value;
  if (!input.trim()) return;

  var output = getNextSug("gram");
  if (!output) {
    const res = await fetch("https://api-inference.huggingface.co/models/grammarly/coedit-large", {
      "headers": {
        "Authorization": "Bearer " + CHAT_API_TOKEN,
        "Content-Type": "application/json",
      },
      "body": JSON.stringify(
        {
          inputs: "Fix grammar: " + input,
          parameters: {},
        }),
      "method": "POST",
    });
    const dat = await res.json();
    output = dat[0]['generated_text'];
  }

  if (input.trim() === output.trim()) return;
  initSuggestions();
  addSuggestion(`Fix the grammar: "${output}"`, output);
}

//speech-to-text
function StT() {
  var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
  var recognition = new SpeechRecognition();

  recognition.onstart = function() {
    inputField.placeholder = "聆聽中...";
  };

  recognition.onspeechend = function() {
    console.log("end");
    inputField.placeholder = "輸入你的訊息";
    recognition.stop();
  }

  recognition.onresult = function(event) {
    var transcript = event.results[0][0].transcript;
    inputField.innerHTML = transcript;
  };

  recognition.start();
}

function myTrim(str) {
  str = str.trim();
  if (str.endsWith(".") || str.endsWith("?") || str.endsWith("!") || str.endsWith(",") || str.endsWith(";")) {
    str = str.substring(0, str.length - 1);
  }
  return str.trim();
}

async function translate(text, reverse = false) {
  let apiURL = TRANSLATE_API_URL + text + "&langpair=" + (reverse ? "zh|en" : "en|zh");
  return fetch(apiURL).then(res => res.json()).then(data => {
    console.log(data.responseData.translatedText);
    return data.responseData.translatedText;
  });
}

async function getDefs0(text, lim = 3) {
  const ret = [];

  if (!vocabs.hasOwnProperty(text)) {
    vocabs[text] = 0;
    localStorage.setItem("vocabs", JSON.stringify(vocabs));
    console.log(vocabs);
  }

  const res = await fetch(DICT_API_URL + text);
  if (res.ok) {
    data = await res.json();
    for (const word of data) {
      const l = [];
      for (const def of word["meanings"][0]["definitions"]) {
        if (l.length > lim) break;
        l.push(def["definition"]);
      }
      ret.push(l);
    }
  }

  return ret;
}

function removeTags(input) {
  return input.replace(/<\/?[^>]+(>|$)/g, "");
}

async function getDefs1(word, lim = 3) {
  const ret = [];

  const res = await fetch(WIKI_API_URL + `/page/definition/${word}`);

  if (res.ok) {
    const all_data = await res.json();
    data = all_data["en"];
    console.log(data);
    for (const part of data) {
      const l = [];
      for (const def of part['definitions']) {
        let defHTML = def['definition'];
        if (defHTML.length == 0) continue;
        if (l.length > lim) break;
        l.push(removeTags(defHTML));
      }
      ret.push(l);
    }
  }
  return ret;
}


function addClick(phrase) {
  if (vocabs.hasOwnProperty(phrase.innerText)) {
    vocabs[phrase.innerText] += 14;
    localStorage.setItem("vocabs", JSON.stringify(vocabs));
    // console.log("exist");
    // console.log(vocabs);
  }
  phrase.addEventListener("mouseout", (event) => {
    event.target.classList.remove("highlighted");
  });

  phrase.addEventListener("mouseover", (event) => {
    event.target.classList.add("highlighted");
  });
  phrase.addEventListener("click", (event) => {
    let text = myTrim(event.target.innerText);
    delete vocabs[text];
    localStorage.setItem("vocabs", JSON.stringify(vocabs));

    if (!vocabs.hasOwnProperty(text)) {
      vocabs[text] = 0;
      localStorage.setItem("vocabs", JSON.stringify(vocabs));
      console.log(vocabs);
    }
    getDefs1(text).then(
      (data2D) => {
        console.log(data2D);
        defText.innerHTML = "";
        if (data2D.length == 0) {
          defText.innerHTML = "No Definitions Found!";
          return;
        }
        for (const part of data2D) {
          for (const def of part) {
            defText.innerHTML += " - " + def + "<br><br>";
          }
          defText.innerHTML += "<br>";
        }
      }
    );
    translate(text).then((trans) => {
      defTitle.innerHTML = text + " (" + trans + ")";
    });
    displayImages(text);

    def.style.visibility = "visible";
  });
}

function displayImages(query, n = 1) {
  fetch(UNSPLASH_API + query, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Client-ID " + ACCESS_KEY
    },
  }).then((response) => {
    return response.json();
  }
  ).then((data) => {
    while (pics.lastElementChild) {
      pics.removeChild(pics.lastElementChild);
    }
    for (let i = 0; i < n; i++) {
      pic = document.createElement("img");
      pic.setAttribute("src", data['results'][i]['urls']['full']);
      console.log(pic);
      pic.setAttribute("width", "50%");
      pic.setAttribute("height", "50%");
      pics.appendChild(pic);
    }
  })
    .catch((err) => {
      console.log(err);
    });
}

function addChatEntry(input, id, clickable = true) {
  // hideElem("info-box1");
  let userDiv = document.createElement("div");
  userDiv.classList.add("phrase");
  userDiv.classList.add(id);

  if (id == "User") {
    userDiv.innerHTML += "<div class = 'user-img'><img id = 'user-avatar' src ='" + iconsrc + "'/></div>";
  } else {
    userDiv.innerHTML += "<div class = 'bot-img'><img id = 'bot-avatar' src = 'https://raw.githubusercontent.com/AllenMuenLee/Engage/main/Bot-avatar.png'/></div>"
  }

  var tokens = input.split(" ");
  let par = document.createElement("p");
  par.classList.add("phrasespace");
  for (const token of tokens) {
    let phrase = document.createElement("span");
    phrase.innerHTML = token;
    if (clickable) {
      addClick(phrase);
    }
    par.append(phrase);
    par.append(" ");
  }
  userDiv.append(par);

  messagesContainer.appendChild(userDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight - messagesContainer.clientHeight;
}

function reply(msg) {
  logCaller();
  addChatEntry(msg, "User", false);
  hint.style.visibility = 'visible';
  models[globalConfig.curModelId].send(msg);
}

function addChatbotReply(msg, dat) {
  var data = dat[0];
  // console.log("Chatbot replied: ");
  // console.log(data);

  if (data) {
    let res = getNextMsg();
    if (!res) res = data['generated_text'];
    if (!res) return;
    output_hist.push(res);
    input_hist.push(msg);
    if (output_hist.length > hist_limit) {
      output_hist.shift();
    }
    if (input_hist.length > hist_limit) {
      input_hist.shift();
    }
    localStorage.setItem("output_hist", JSON.stringify(output_hist));
    localStorage.setItem("input_hist", JSON.stringify(input_hist));
    addChatEntry(res, "Bot", true);
    speech.text = res;
    window.speechSynthesis.speak(speech);
  }
}

// function updateSelectedModel(evt) {
//   let target = evt.currentTarget;
//   setSelectedModel(target.options[target.selectedIndex].value);
// }

// function setSelectedModel(id) {
//   if (globalConfig.curModelId != id) {
//     clearHistory();
//     globalConfig.curModelId = id;
//   }
// }

function advSuggestionId() {
  res = globalConfig.curSugId;
  globalConfig.curSugId++;
  globalConfig.curSugId %= NUM_SUG_COL;
  return res;
}

function addSuggestion(displayText, newContent) {
  const listItem = document.getElementById(`sug-col-${advSuggestionId()}`);
  listItem.innerHTML = displayText;
  listItem.setAttribute("onclick", `applySuggestion("${newContent}")`);
}

function applySuggestion(text) {
  inputField.value = text;
  initSuggestions();
}


async function monitorServerStatus() {
  const res = await models[globalConfig.curModelId].up();
  globalConfig.status = res.status;
  if (res.status == 200) {
    console.log("Server is up!");
  }
  else {
    console.log("Server is overloaded or down!");
  }
}

