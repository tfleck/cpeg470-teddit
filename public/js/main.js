// Initialize Cloud Firestore through Firebase
var firebaseConfig = {
  apiKey: "AIzaSyC9kw1KjhMHK5OUTGlzwoma3efZSI1HDO0",
  authDomain: "teddit-b3e71.firebaseapp.com",
  databaseURL: "https://teddit-b3e71.firebaseio.com",
  projectId: "teddit-b3e71",
  storageBucket: "teddit-b3e71.appspot.com",
  messagingSenderId: "349139338610",
  appId: "1:349139338610:web:38d40e0cf839a77b77c9eb",
  measurementId: "G-HRXWVK410N"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
var google_provider = new firebase.auth.GoogleAuthProvider();

//get URL parameters
var pathnameSplit = window.location.pathname.split('/');
var pathSegments = pathnameSplit.filter(function(value, index, arr){
  return value !== '';
});

$(document).ready(function(){
  //Render page content based on URL
  renderPage(pathSegments);
  
  //listen for back button, and prevent browser default to handle event
  window.addEventListener('popstate', function(event){
    pathSegments = event.state.pathArray;
    renderPage(pathSegments);
  });

  //disable browser defaults for enter key to use for search submit instead
  $(document).on("keydown", "#searchBox", function(event) {
    if (event.key == "Enter") {
      event.preventDefault();
      console.log("enter");
    }
  });

  //prevent browser reload on spa-link click
  //add page to browser history to make forward/back work
  //load new content based on new url
  $(document).on("click", ".spa-link", function(event) {
    event.preventDefault();
    let newPath = event.target.getAttribute('href');
    let newSplit = newPath.replace(event.target.getAttribute('origin'),'').split('/');
    let newSegments = newSplit.filter(function(value,index,arr){
      return value !== '';
    })
    pathSegments = newSegments;
    history.pushState({pathArray: pathSegments}, "Page Title", newPath);
    renderPage(pathSegments);
  });
  
  //redirect to google oauth on login/logout click
  $('#loginBtn').click(function(){
    if($('#loginBtn').html() === "Log In"){
      firebase.auth().signInWithRedirect(google_provider);
    }
    else{
      firebase.auth().signOut();
    }
  });
  
  //handle user login/logout
  firebase.auth().onAuthStateChanged(function(user) {
    window.user = user;
    if(window.user === null){
      $('#loginBtn').html("Log In");
      $('#loginBtn').removeClass('btn-outline-success');
      $('#loginBtn').addClass('btn-success');
    }
    else{
      $('#loginBtn').html(window.user.displayName);
      $('#loginBtn').removeClass('btn-success');
      $('#loginBtn').addClass('btn-outline-success');
    }
  });
});

function renderPage(pathArray){
  if(pathArray[0] === 't'){
    db.collection("threads").doc(pathArray[1]).collection("posts").get().then((querySnapshot) => {
      $('#mainContainer').html('');
      querySnapshot.forEach(function(doc) {
        // doc.data() is never undefined for query doc snapshots
        addPost(doc.data());
      });
    });
  }
}

function addPost(data){
  //turn elapsed seconds into whole number of appropriate unit
  let elapsedTime = (Date.now()/1000-data.time.seconds)/60;
  let elapsedString = "minutes";
  if(elapsedTime > 60){
    elapsedTime = elapsedTime/60;
    elapsedString = "hours";
    if(elapsedTime > 24){
      elapsedTime = elapsedTime/24;
      elapsedString = "days";
    }
  }
  elapsedTime = Math.round(elapsedTime);
  if(elapsedTime == 1){
    //remove trailing s if not needed
    elapsedString = elapsedString.substr(0,elapsedString.length-1);
  }
  $('#mainContainer').append(`
<br>
<div class="container-fluid">
<div class="row justify-content-center">
<div class="col-10 col-md-8">
<div class="card">
<div class="card-header">
<h5 class="card-title">${data.title}</h5>
</div>
<div class="card-body">
<p class="card-text">${data.body}</p>
</div>
<div class="card-footer">
<small class="text-muted">${data.authorDisplay} last updated ${elapsedTime} ${elapsedString} ago</small>
</div>
</div>
</div>
</div>
</div>
`)
}