var vocabDict = localStorage.getItem("vocabs");
var lastlogin = localStorage.getItem("loginTime");

lastlogin = JSON.parse(lastlogin);

if (vocabDict != null) {
  vocabDict = JSON.parse(vocabDict);
} else {
  vocabDict = {};
}

const pics = document.getElementById("img-area");
const leave_btn = document.getElementById("leave-button");
const vocabArea = document.getElementById("vocab-area");

const dict_api = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const UNSPLASH_API = 'https://api.unsplash.com/search/photos?query=';
const ACCESS_KEY = 'QhEewquI6zhU5QLTBs2-501xfkNYZ7FfXXEm1WOs6EM';

var strike_num = document.getElementById("strike-num");

strike_num.innerHTML = lastlogin[1];

function myTrim(str) {
  str = str.trim();
  if (str.endsWith(".") || str.endsWith("?") || str.endsWith("!") || str.endsWith(",") || str.endsWith(";")) {
    str = str.substring(0, str.length - 1);
  }
  return str.trim();
}

leave_btn.addEventListener("click", hide, false);
leave_btn.hideElemId = "definition";

function hide(evt) {
  hideElem(evt.currentTarget.hideElemId);
}

function hideElem(id) {
  const target = document.getElementById(id);
  target.style.visibility = "hidden";
}

function displayImages(query, n = 3) {
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
      pic.setAttribute("width", "100px");
      pic.setAttribute("height", "100px");
      pics.appendChild(pic);
    }
  })
    .catch((err) => {
      console.log(err);
    });
}

function blocksImage(query, block) {
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
    src = data['results'][0]['urls']['full'];
    block.setAttribute("src", data['results'][0]['urls']['full']);
  }).catch((err) => {
    console.log(err);
  });
}

function createsblocks(vocabb, progress) {
  var VocabBlock = document.createElement("div");
  var VocabImg = document.createElement("img");
  var VocabText = document.createElement("div");
  var VocabProg = document.createElement("div");
  var Progfill = document.createElement("div");
  VocabBlock.setAttribute("class", "vocab-block");
  VocabImg.setAttribute("class", "vocab-img");
  blocksImage(vocabb, VocabImg);
  VocabText.setAttribute("class", "vocab-text");
  VocabText.innerHTML = vocabb;
  VocabProg.setAttribute("class", "vocab-progress");
  Progfill.setAttribute("class", "vocab-progress-fill");
  Progfill.setAttribute("style", "width:" + progress + ";");
  VocabBlock.appendChild(VocabImg);
  VocabBlock.appendChild(VocabText);
  VocabProg.appendChild(Progfill);
  VocabBlock.appendChild(VocabProg);
  vocabArea.appendChild(VocabBlock);
  return VocabBlock;
}

function addblocks(vocabb) {
  vocabb.addEventListener("click", (event) => {
    var text = myTrim(event.target.querySelector(".vocab-text").innerHTML);
    vocabDict[text] += 14;
    if (vocabDict[text] > 100) {
      vocabDict[text] = 100;
      delete vocabDict[text];
      localStorage.setItem("vocabs", JSON.stringify(vocabDict));
      vocabb.remove();
    }
    var prog = event.target.querySelector(".vocab-progress-fill");
    prog.setAttribute("style", "width:" + vocabDict[text] + "%;");
    localStorage.setItem("vocabs", JSON.stringify(vocabDict));
    url = dict_api + event.target.innerText;

    fetch(url).then((response) => {
      return response.json();
    }).then((data) => {
      var def_text = document.getElementById("definition-text");
      if (data[0]["title"] == "No Definitions Found") {
        def_text.innerHTML = "No Definitions Found";
      } else {
        def_text.innerHTML = "";
        for (const word of data) {
          for (const def of word["meanings"][0]["definitions"]) {
            def_text.innerHTML += "<br><br>  -" + def['definition'];
          }
        }
      }
    }).catch((err) => {
      var def_text = document.getElementById("definition-text");
      def_text.innerHTML = "Definition not found!";
      alert("error");
    });
    var def_title = document.getElementById("definition-vocab");
    def_title.innerHTML = event.target.innerText;
    displayImages(event.target.innerText);
    var show = document.getElementById("definition");
    show.style.visibility = "visible";
  });
}

for (let [key, value] of Object.entries(vocabDict)) {
  console.log(key, value);
  if (value > 100) {
    delete vocabDict[key];
  } else {
    vocab_block = createsblocks(key, value);
    addblocks(vocab_block);
  }
}