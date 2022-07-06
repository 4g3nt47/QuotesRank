//--------------------------------------------------
// Frontend JavaScript code for the QuotesRank site.
//               Author: Umar Abdul
//--------------------------------------------------


// Highlight the current URL opened in the navigation menus.
function highlightCurrentURL(){

  let links = document.getElementsByTagName("a");
  const currLink = window.location.href;
  for (let link of links){
    if (link.href == currLink)
      link.classList.add("current-link");
  }
}

// For changing the text of an element with the given ID.
// Always returns false since I use it mainly to prevent browser auto submit of forms.
function setText(id, text){

  const elem = document.getElementById(id);
  if (elem != null)
    elem.innerText = text;
  return false;
}

//----------------------------------
// User login and sign up functions.
//----------------------------------

// Sign up a user.
function createAccount(form, endpoint){

  setText("error", ""); // Clear the error field;
  // Do some client-side validation.
  let username = form["username"].value.trim();
  let password = form["password"].value.trim();
  let confPassword = form["conf-password"].value.trim();
  if (!(username.length && password.length && confPassword.length))
    return setText("error", "Required fields not defined!");
  if (username.length < 4)
    return setText("error", "Username too short!");
  if (username.length > 32)
    return setText("error", "Username too long!");
  if (password !== confPassword)
    return setText("error", "Password mismatch!");
  if (password.length < 8)
    return setText("error", "Password too short");
  // Forward the request.
  const req = new XMLHttpRequest();
  req.open("POST", endpoint);
  req.onload = function(){
    const rsp = JSON.parse(req.responseText);
    if (req.status == 200)
      window.location = rsp.redirect;
    else
      setText("error", rsp.error);
    form.reset();
    form["username"].focus();
    form["signup"].disabled = false; // Enable the signup button
  };
  form["signup"].disabled = true; // Disable the signup button until request has been processed.
  req.setRequestHeader("Content-Type", "application/json");
  req.send(JSON.stringify({username, password, autoLogin: true}));
  return false;
}

// Handles user login.
function userLogin(form, endpoint){

  setText("error", ""); // Clear error.
  let username = form["username"].value.trim();
  let password = form["password"].value.trim();
  if (!(username.length && password.length))
    return setText("error", "Required fields not defined!");
  // Forward the request to server.
  const req = new XMLHttpRequest();
  req.open("POST", endpoint);
  req.onload = function(){
    const rsp = JSON.parse(req.responseText);
    if (rsp.error !== undefined)
      setText("error", rsp.error);
    else
      window.location = rsp.redirect;
    form.reset();
    form["username"].focus();
    form["login"].disabled = false; // Enable the login button.
  };
  form["login"].disabled = true; // Disable the login button until the request has been processed.
  req.setRequestHeader("Content-Type", "application/json");
  req.send(JSON.stringify({username, password}));
  return false;
}

// Password resets.
function resetPassword(form){

  setText("error", "");
  setText("status", "");
  let currPassword = form["curr-password"].value;
  let newPassword = form["new-password"].value;
  let confPassword = form["conf-password"].value;
  if (!(currPassword.length && newPassword.length && confPassword.length))
    return setText("error", "Required fields not defined!");
  if (newPassword !== confPassword)
    return setText("error", "Password mismatch!");
  if (newPassword.length < 8)
    return setText("error", "Password must be >= 8 characters long!");
  const req = new XMLHttpRequest();
  req.open("POST", "/api/user/password");
  req.setRequestHeader("Content-Type", "application/json");
  req.onload = function(){
    if (req.status == 200){
      form.reset();
      setText("status", "Password changed successfully!");
    }else{
      setText("error", JSON.parse(req.responseText).error);
    }
  };
  req.send(JSON.stringify({password: currPassword, new_password: newPassword}));
  return false;
}

//----------------------------
// Functions to handle voting.
//----------------------------

// Handles upvotes and downvotes.
function vote(qid, voteType){

  // Craft the request.
  const req = new XMLHttpRequest();
  let endpoint = "/api/user/upvote";
  if (voteType != 1)
    endpoint = "/api/user/downvote";
  req.open("GET", `${endpoint}/${qid}`);
  req.onload = function(){
    const rsp = JSON.parse(req.responseText);
    if (req.status == 200){
      let votesField = document.getElementById("votes-count-" + qid);
      if (votesField != null)
        votesField.innerText = (rsp.votes);
    }else{
      // Error occured. Disable all voting buttons.
      document.getElementById("upvote-btn-" + qid).disabled = true;
      document.getElementById("downvote-btn-" + qid).disabled = true;
      alert(`Voting error: ${rsp.error}`);
    }
  };
  // Enable/Disable the appropriate buttons.
  if (voteType == 1){
    document.getElementById("upvote-btn-" + qid).disabled = true;
    document.getElementById("downvote-btn-" + qid).disabled = false;
  }else{
    document.getElementById("upvote-btn-" + qid).disabled = false;
    document.getElementById("downvote-btn-" + qid).disabled = true;
  }
  // Send the request.
  req.send();
}

//--------------------------
// Handle quote submissions.
//--------------------------

function submitQuote(form){

  setText("error", "");
  setText("status", "");
  let quote = form["quote"].value.trim();
  let author = form["author"].value.trim();
  if (!(quote.length && author.length))
    return setText("error", "Required field not defined!");
  setText("status", "Submitting quote...");
  const req = new XMLHttpRequest();
  req.open("POST", "/api/quote");
  req.setRequestHeader("Content-Type", "application/json");
  req.onload = function(){
    setText("status", "");
    const rsp = JSON.parse(req.responseText);
    if (req.status == 200){
      setText("status", "Quote submitted successfully!");
      form.reset();
    }else{
      setText("error", rsp.error);
    }
    form["quote"].focus();
    form["submitBtn"].disabled = false;
  };
  form["submitBtn"].disabled = true;
  req.send(JSON.stringify({quote, author}));
  return false;
}

//------------------------------------------
// Functions used for approving submissions.
//------------------------------------------

function acceptQuote(qid){

  // Remove the quote from the page.
  document.getElementById("quote-" + qid).remove();
  // Send the request.
  const req = new XMLHttpRequest();
  req.open("GET", "/api/quote/approve/" + qid);
  req.send();
}

function rejectQuote(qid){

  // Remove the quote from the page.
  document.getElementById("quote-" + qid).remove();
  // Send the request.
  const req = new XMLHttpRequest();
  req.open("DELETE", "/api/quote/" + qid);
  req.send();
}

// Delete a quote.
function deleteQuote(qid){
  
  const req = new XMLHttpRequest();
  req.open("DELETE", "/api/quote/" + qid);
  req.onload = function(){
    if (req.status == 200){
      window.location = "/";
    }else{
      let rsp = JSON.parse(req.responseText);
      setText("error", rsp.error);
    }
  };
  req.send();
}
