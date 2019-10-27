const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

//add new user logins to user table
exports.addToUsers = functions.auth.user().onCreate((user) => {
  let timestamp = admin.firestore.Timestamp.now();
  return admin.firestore().collection('users').doc(user.uid).set({
    displayName: user.displayName,
    uid: user.uid,
    lastLogin: timestamp
  });
});

//add new user logins to roles table
exports.addToRoles = functions.auth.user().onCreate((user) => {
  return admin.firestore().collection('roles').doc(user.uid).set({
    admin: false,
    editor: false,
    writer: true,
    user: true
  });
});

//add timestamp and upvotes to new posts
exports.createPost = functions.firestore.document('threads/{thread}/posts/{post}').onCreate((snap, context) => {
  let timestamp = admin.firestore.Timestamp.now();
  // Get an object representing the document
  // e.g. {'name': 'Marie', 'age': 66}
  return snap.ref.set({
    time: timestamp,
    upvotes: 1
  }, {
    merge: true
  });
});
