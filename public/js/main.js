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


$(document).ready(function(){
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

  db.collection("threads").doc("thread1").collection("posts").get().then((querySnapshot) => {
    querySnapshot.forEach(function(doc) {
      // doc.data() is never undefined for query doc snapshots
      console.log(doc.id, " => ", doc.data());
    });
  });
  
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