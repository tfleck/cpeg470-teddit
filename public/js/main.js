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

//get URL parameters
const pathnameSplit = window.location.pathname.split('/');
const pathSegments = pathnameSplit.filter(function(value, index, arr){
  return value !== '';
});

$(document).ready(function(){
  
  console.log(pathnameSplit);
  console.log(pathSegments);
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  firebase.analytics();

  var db = firebase.firestore();
  var google_provider = new firebase.auth.GoogleAuthProvider();

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
    console.log(user);
  });
  
  if(pathSegments[0] === 't'){
    db.collection("threads").doc(pathSegments[1]).collection("posts").get().then((querySnapshot) => {
    $('#mainContainer').html('');
    querySnapshot.forEach(function(doc) {
      // doc.data() is never undefined for query doc snapshots
      //console.log(doc.id, " => ", doc.data());
      addPost(doc.data());
    });
  });
  }
  
  
  //disable browser defaults for enter key to not screw with search box submit
  $(document).on("keydown", ":input", function(event) {
    if (event.key == "Enter") {
      event.preventDefault();
    }
  });

  $('#loginBtn').click(function(){
    if($('#loginBtn').html() === "Log In"){
      firebase.auth().signInWithRedirect(google_provider);
    }
    else{
      firebase.auth().signOut();
    }
  });

  $('#searchBox').on('keyup', function(e){
    if(e.key === "Enter"){
      console.log("enter");
    }
  })
});

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