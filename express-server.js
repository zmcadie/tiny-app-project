const express = require("express");
const app = express();
// sets preffered port
const PORT = process.env.PORT || 8080; // default port 8080
// allows access to POST requests
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
// allows use of cookies
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// checks if url has http(s):// and adds if false
const addProtocol = (URL) => {
  if (URL !== /^https?:\/\//) {
    let longURL = `https://${URL}`;
    return longURL;
  };
  return URL;
};

// enables ejs templates (using render, etc...)
app.set('view engine', 'ejs');

// for storing shortened URLs, with presets
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// generates random 6 char string to use as short url
const generateRandomString = () => {
  let output = '';
  const base = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < 6; i++) {
    const index = Math.floor(Math.random() * 62);
    output += base[index];
  };
  return output;
};

// stand-in root path / home-page
app.get('/', (req, res) => {
  res.redirect('/urls')
});

// passes defined var to ejs template, displays with .render
app.get('/urls', (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

// shows form to shorten url
app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

// shows a page unique to each shortened url
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

// allows user to logout and clears username cookie
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
})

// allows login from the header and sets cookie
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

// allows form fillout to update urlDatabase
app.post("/urls/:id", (req, res) => {
  let longURL = addProtocol(req.body.longURL);
  urlDatabase[req.params.id] = longURL;
  res.redirect('/urls')
});

// handles post requests from new url form
app.post("/urls", (req, res) => {
  const shortened = generateRandomString();
  let longURL = addProtocol(req.body.longURL);
  urlDatabase[shortened] = longURL;
  res.redirect(`/urls/${shortened}`);
});

// allows button to delete from urlDatabase
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('http://localhost:8080/urls');
});

// redirects to website stored in database
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});

// tells server to listen on pre-defined port
app.listen(PORT, () => {
  console.log(`Hello Seattle, Port: ${PORT} is listening.`);
});