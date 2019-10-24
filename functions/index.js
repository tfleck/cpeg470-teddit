const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.addToUsers = functions.auth.user().onCreate((user) => {
  let timestamp = admin.firestore.Timestamp.now();
  return admin.firestore().collection('users').doc(user.uid).set({
    displayName: user.displayName,
    uid: user.uid,
    lastLogin: timestamp
  });
});

exports.addToRoles = functions.auth.user().onCreate((user) => {
  return admin.firestore().collection('roles').doc(user.uid).set({
    admin: false,
    editor: false,
    writer: true,
    user: true
  });
});
