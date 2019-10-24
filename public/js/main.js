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
firebase.analytics();

var db = firebase.firestore();
//var google_provider = new firebase.auth.GoogleAuthProvider();
var ui = new firebaseui.auth.AuthUI(firebase.auth());

var uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function(authResult, redirectUrl) {
      // User successfully signed in.
      // Return type determines whether we continue the redirect automatically
      // or whether we leave that to developer to handle.
      return true;
    },
    uiShown: function() {
      // The widget is rendered.
      // Hide the loader.
      document.getElementById('loader').style.display = 'none';
    }
  },
  // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
  signInFlow: 'redirect',
  //signInSuccessUrl: '<url-to-redirect-to-on-success>',
  signInOptions: [
    // Leave the lines as is for the providers you want to offer your users.
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
  ],
  // Terms of service url.
  tosUrl: '<your-tos-url>',
  // Privacy policy url.
  privacyPolicyUrl: '<your-privacy-policy-url>'
};

ui.start('#firebaseui-auth-container', uiConfig);

/*
function signIn(){
  firebase.auth().signInWithRedirect(google_provider);
}

firebase.auth().getRedirectResult().then(function(result) {
  if (result.credential) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // ...
  }
  // The signed-in user info.
  var user = result.user;
  console.log(user);
}).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  // The email of the user's account used.
  var email = error.email;
  // The firebase.auth.AuthCredential type that was used.
  var credential = error.credential;
  // ...
});
*/


db.collection("threads").doc("thread1").collection("posts").get().then((querySnapshot) => {
  querySnapshot.forEach(function(doc) {
    // doc.data() is never undefined for query doc snapshots
    console.log(doc.id, " => ", doc.data());
  });

  //console.log(doc);
  //console.log(doc.data());
});
