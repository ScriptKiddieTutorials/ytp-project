const imageInput = document.getElementById('file-input');
const newImage = document.getElementById('setting-icon');
const iconsrc = localStorage.getItem('image');
var viewFuntSize = document.getElementById('font-size');

viewFuntSize.value = localStorage.getItem('fontSize')*100;

if (iconsrc == null){
  newImage.src = 'https://raw.githubusercontent.com/AllenMuenLee/Engage/main/User-avatar.png';
} else {
  newImage.src = iconsrc;
}

function update(){
  newImage.src = localStorage.getItem('image');
}

var changeIcon = function(event){
  // 👇️ Save the image to localStorage
  const image = event.target.files[0];
  const reader = new FileReader();

  reader.addEventListener('load', () => {
    localStorage.setItem('image', reader.result);
  });

  if (image) {
    reader.readAsDataURL(image);
  }

  // 👇️ Take the image from localStorage
  // and display it
  setTimeout(update, 200);
};

var setFontSize = function(event){
  var fontSize = document.getElementById('font-size').value;
  console.log(fontSize);
  localStorage.setItem('fontSize', fontSize / 100);
  var r = document.querySelector(':root');
  r.style.setProperty('--fontAddSize', fontSize / 100);
  
};