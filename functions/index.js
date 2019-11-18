const functions = require('firebase-functions');
const admin = require('firebase-admin');
const xss = require('xss');

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
  let newData = snap.data();
  return snap.ref.set({
    authorDisplay: xss(newData.authorDisplay),
    body: xss(newData.body),
    time: timestamp,
    title: encodeURI(xss(newData.titleDisplay)),
    titleDisplay: xss(newData.titleDisplay),
    upvotes: 1
  }, {
    merge: true
  });
});

exports.createThread = functions.firestore.document('threads/{thread}').onCreate((snap, context) => {
  let timestamp = admin.firestore.Timestamp.now();
  // Get an object representing the document
  // e.g. {'name': 'Marie', 'age': 66}
  let newData = snap.data();
  return snap.ref.set({
    authorDisplay: xss(newData.authorDisplay),
    body: xss(newData.body),
    time: timestamp,
    title: encodeURI(xss(newData.titleDisplay)),
    titleDisplay: xss(newData.titleDisplay)
  }, {
    merge: true
  });
});

exports.changeUpvotes = functions.firestore.document('threads/{thread}/posts/{post}/upvoters/{upvote}').onWrite((snap, context) => {
  let oldData = snap.before.data();
  let oldVote = 0;
  if( oldData !== undefined ){
    oldVote = parseInt(oldData.vote);
  }
  let newData = snap.after.data();
  let newVote = parseInt(xss(newData.vote));
  console.log('old: '+oldVote);
  console.log('new: '+newVote);
  let newVal = 0;
  if( newVote === -1 || newVote === 0 || newVote === 1){
    newVal = newVote-oldVote;
  }
  return snap.after.ref.parent.parent.set({
    upvotes: admin.firestore.FieldValue.increment(newVal)
  }, {
    merge: true
  });
});
