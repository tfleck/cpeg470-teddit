//ESLint configuration
/* eslint-env browser, es6 */
/*global $, firebase */
/*eslint no-console: ["error", { allow: ["warn", "error"] }] */
'use strict';

// Initialize Cloud Firestore through Firebase
var firebaseConfig = {
  apiKey: 'AIzaSyC9kw1KjhMHK5OUTGlzwoma3efZSI1HDO0',
  authDomain: 'teddit-b3e71.firebaseapp.com',
  databaseURL: 'https://teddit-b3e71.firebaseio.com',
  projectId: 'teddit-b3e71',
  storageBucket: 'teddit-b3e71.appspot.com',
  messagingSenderId: '349139338610',
  appId: '1:349139338610:web:38d40e0cf839a77b77c9eb',
  measurementId: 'G-HRXWVK410N'
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
var google_provider = new firebase.auth.GoogleAuthProvider();

//get URL parameters
var pathnameSplit = window.location.pathname.split('/');
var pathSegments = pathnameSplit.filter(function (value) {
  return value !== '';
});

//jQuery code ordered roughly by page position/time sequence
$(document).ready(function () {
  //Render page content based on URL
  renderPage(pathSegments);

  //listen for back button, and prevent browser default to handle event
  window.addEventListener('popstate', function (event) {
    if (event.state != null) {
      pathSegments = event.state.pathArray;
    } else {
      pathSegments = [];
    }
    renderPage(pathSegments);
  });

  //disable browser defaults for enter key to use for search submit instead
  $(document).on('keydown', '#searchBox', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      console.debug('enter');
    }
  });

  //prevent browser reload on spa-link click
  //add page to browser history to make forward/back work
  //load new content based on new url
  $(document).on('click', 'a.spa-link', function (event) {
    event.preventDefault();
    let newPath = $(this)[0].getAttribute('href');
    let newSplit = newPath.replace($(this)[0].getAttribute('origin'), '').split('/');
    let newSegments = newSplit.filter(function (value) {
      return value !== '';
    })
    pathSegments = newSegments;
    history.pushState({
      pathArray: pathSegments
    }, 'Page Title', newPath);
    renderPage(pathSegments);
  });

  //redirect to google oauth on login/logout click
  $('#loginBtn').click(function () {
    if ($('#loginBtn').html() === 'Log In') {
      firebase.auth().signInWithRedirect(google_provider);
    } else {
      firebase.auth().signOut();
    }
  });

  //Pop up modal to allow user to compose a new post
  $('#newPostBtn').click(function () {
    $('#newPostModal').modal('show');
  });

  //Get new post content from user form and submit to database
  $('#submitPostBtn').click(function () {
    let postTitle = $('#newPostTitle').val();
    let postContent = $('#newPostContent').val();
    if(pathSegments == null || pathSegments.length === 0 || pathSegments[0] === 'index.html'){
      db.collection('threads').add({
        //all fields sanitized by server-side function
        authorDisplay: window.user.displayName,
        body: postContent,
        titleDisplay: postTitle,
        uid: window.user.uid,
      }).then(function () {
        showAlert('#newPostAlertPlaceholder', 'Thread successfully created', 'alert-success');
        //wait a brief period for user to see success message before dismissing
        window.setTimeout(function () {
          //Hide new post modal
          $('#newPostModal').modal('hide');
          //clear form fields
          $('#newPostTitle').val('');
          $('#newPostContent').val('');
        }, 750);
      })
        .catch(function (error) {
        showAlert('#newPostAlertPlaceholder', 'Thread creation failed, please try again', 'alert-danger');
        console.error(error);
      })
    }

    else if (pathSegments[0] === 't') { //url sanity check
      db.collection('threads').where('title', '==', pathSegments[1])
        .get()
        .then(function(querySnapshot) {
        if(querySnapshot.size === 1){
          db.collection('threads').doc(querySnapshot.docs[0].id).collection('posts').add({
            //all fields sanitized by server-side function
            authorDisplay: window.user.displayName,
            body: postContent,
            titleDisplay: postTitle,
            uid: window.user.uid,
            //this bit above with the uid is an unfortunate hack
            //uid is provided client-side due to a limitation of the firestore SDK
            //being unable to provide the authenticated uid to function
            //firestore rules verify the authenticated uid and provided uid
            //match for any logged in operation so that the uid can't be modified
            //to impersonate other users.
          }).then(function () {
            showAlert('#newPostAlertPlaceholder', 'Post successful', 'alert-success');
            //wait a brief period for user to see success message before dismissing
            window.setTimeout(function () {
              //Hide new post modal
              $('#newPostModal').modal('hide');
              //clear form fields
              $('#newPostTitle').val('');
              $('#newPostContent').val('');
            }, 750);
          })
            .catch(function (error) {
            showAlert('#newPostAlertPlaceholder', 'Post failed, please try again', 'alert-danger');
            console.error(error);
          })
        }
      }).catch(function(error) {
        console.error('Error getting documents: ', error);
      });
    }
  });

  $(document).on('click', '.arrow-upvote', function (event) {
    //card div holding upvote button
    let post = $(this).parent().parent().parent();
    console.log(post);
    votePost(post, 1);
  });

  $(document).on('click', '.arrow-downvote', function (event) {
    //card div holding downvote button
    let post = $(this).parent().parent().parent();
    console.log(post);
    votePost(post, -1);
  });

  //handle user login/logout
  firebase.auth().onAuthStateChanged(function (user) {
    window.user = user;
    if (window.user === null) {
      $('#addPostContainer').hide();
      $('#loginBtn').html('Log In');
      $('#loginBtn').removeClass('btn-outline-success');
      $('#loginBtn').addClass('btn-success');
    } else {
      $('#loginBtn').html(window.user.displayName);
      $('#loginBtn').removeClass('btn-success');
      $('#loginBtn').addClass('btn-outline-success');
      $('#addPostContainer').show(300);
    }
  });
});

//load page content for a particular URL
function renderPage(pathArray) {
  if(pathArray == null || pathArray.length === 0 || pathArray[0] === 'index.html'){
    //change create modal text to create thread
    $('#newPostBtn').html(`<img src="/assets/pencil-square-o.svg" width="20" height="20"> New Thread`);
    $('#newPostTitle').attr("placeholder", 'Awesome Thread Title');
    $('#newPostContent').attr("placeholder", 'Awesome Thread Description...');
    //render list of threads
    db.collection('threads').orderBy('time', 'desc').limit(10).onSnapshot((querySnapshot) => {
      $('#postsContainer').html('');
      querySnapshot.forEach(function (doc) {
        //make sure rendering continues if a thread fails for any reason
        try {
          renderThread(doc.data());
        } catch (err) {
          console.error('Post failed to render');
          console.error(err);
        }
      });
    });
  }
  if (pathArray[0] === 't') {
    //change create modal text to create post
    $('#newPostBtn').html(`<img src="/assets/pencil-square-o.svg" width="20" height="20"> Write Post`);
    $('#newPostTitle').attr("placeholder", 'Awesome Post Title');
    $('#newPostContent').attr("placeholder", 'Awesome Post Text...');
    //render specified thread
    db.collection('threads').where('title', '==', pathArray[1])
      .get()
      .then(function(querySnapshot) {
      if(querySnapshot.size === 1){
        db.collection('threads').doc(querySnapshot.docs[0].id).collection('posts').orderBy('time', 'desc').limit(20).onSnapshot((querySnapshot) => {
          $('#postsContainer').html('');
          querySnapshot.forEach(function (doc) {
            //make sure rendering continues if a post fails for any reason
            try {
              console.log(doc.id);
              renderPost(doc.data());
            } catch (err) {
              console.error('Post failed to render');
              console.error(err);
            }
          });
        });
      }
    }).catch(function(error) {
      console.error('Error getting documents: ', error);
    });
  }
}

//turn JSON into html thread blocks and add to body
function renderThread(data) {
  //turn elapsed seconds into whole number of appropriate unit
  let elapsedTime = 0;
  let elapsedString = 'minutes';
  if (data.time != null) {
    elapsedTime = (Date.now() / 1000 - data.time.seconds) / 60;
    if (elapsedTime > 60) {
      elapsedTime = elapsedTime / 60;
      elapsedString = 'hours';
      if (elapsedTime > 24) {
        elapsedTime = elapsedTime / 24;
        elapsedString = 'days';
      }
    }
    elapsedTime = Math.round(elapsedTime);
    if (elapsedTime == 1) {
      //remove trailing s if not needed
      elapsedString = elapsedString.substr(0, elapsedString.length - 1);
    }
  }

  $('#postsContainer').html($('#postsContainer').html() + `
<br>
<div class="container-fluid">
<div class="row justify-content-center">
<div class="col-10 col-md-8">
<div class="card">
<div class="card-header">
<a class="spa-link" href="/t/${data.title}">
<h5 class="card-title">${data.titleDisplay}</h5>
</a>
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
`);
}

//turn JSON into html post and add to body
function renderPost(data) {
  //turn elapsed seconds into whole number of appropriate unit
  let elapsedTime = 0;
  let elapsedString = 'minutes';
  if (data.time != null) {
    elapsedTime = (Date.now() / 1000 - data.time.seconds) / 60;
    if (elapsedTime > 60) {
      elapsedTime = elapsedTime / 60;
      elapsedString = 'hours';
      if (elapsedTime > 24) {
        elapsedTime = elapsedTime / 24;
        elapsedString = 'days';
      }
    }
    elapsedTime = Math.round(elapsedTime);
    if (elapsedTime == 1) {
      //remove trailing s if not needed
      elapsedString = elapsedString.substr(0, elapsedString.length - 1);
    }
  }

  $('#postsContainer').html($('#postsContainer').html() + `
<br>
<div class="container-fluid">
<div class="row justify-content-center">
<div class="col-10 col-md-8">
<div class="card">
<div class="card-header">
<a class="spa-link" href="/t/${data.title}">
<h5 class="card-title">${data.titleDisplay}</h5>
</a>
</div>
<div class="card-body">
<p class="card-text">${data.body}</p>
</div>
<div class="card-footer">
<small class="text-muted"><img class="arrow-upvote" src="/assets/arrow-up.svg" width="15" height="15">&nbsp;${data.upvotes}&nbsp;<img class="arrow-downvote" src="/assets/arrow-down.svg" width="15" height="15">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${data.authorDisplay} last updated ${elapsedTime} ${elapsedString} ago</small>
</div>
</div>
</div>
</div>
</div>
`);
}

function votePost(post, myvote){
  let post_link = post[0].children[0].children[0]
  console.log(post_link)
  let newPath = post_link.getAttribute('href');
  let newSplit = newPath.replace(post_link.getAttribute('origin'), '').split('/');
  let newSegments = newSplit.filter(function (value) {
    return value !== '';
  })
  console.log(newSegments[1])
  db.collection('threads').where('title', '==', pathSegments[1])
    .get()
    .then(function(querySnapshot) {
    if(querySnapshot.size === 1){
      db.collection('threads').doc(querySnapshot.docs[0].id).collection('posts').where('title', '==', newSegments[1])
        .get()
        .then(function(querySnapshot2) {
        if(querySnapshot2.size === 1){
          db.collection('threads').doc(querySnapshot.docs[0].id).collection('posts').doc(querySnapshot2.docs[0].id).collection('upvoters').doc(window.user.uid).set({
            vote: myvote,
            uid: window.user.uid
          }).then(function(){
            console.log("success");
          }).catch(function(error){
            console.error('Error upvoting: ', error);
          })
        }

      }).catch(function(error) {
        console.error('Error getting documents: ', error);
      })
    }
  }).catch(function(error) {
    console.error('Error getting documents: ', error);
  });
}

function showAlert(selector, message, alertClass) {
  $(selector).hide();
  $(selector).html(`<div class='alert alert-dismissable ` + alertClass + `' role='alert'>
<span>` + message + `</span>
<button type='button' class='close' data-dismiss='alert' aria-label='Close'>
<span aria-hidden='true'>&times</span>
</button>
</div>`);
  $(selector).slideToggle(400);
  window.setTimeout(function () {
    $(selector).slideToggle(400, function () {
      $(selector).html('');
    })
  }, 5000);
}
