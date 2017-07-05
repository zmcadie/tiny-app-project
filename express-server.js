const express = require("express");
const app = express();
// sets preffered port
const PORT = process.env.PORT || 8080; // default port 8080
// allows access to POST requests
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


// enables ejs templates (using render, etc...)
app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = () => {
  let output = '';
  const base = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < 6; i++) {
    const index = Math.floor(Math.random() * 62);
    output += base[index];
  };
  return output;
};

app.get('/', (req, res) => {
  res.send('hello')
});

// passes defined var to ejs template, displays with .render
app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// shows form to shorten url
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// shows a page unique to each shortened url
app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, urls: urlDatabase };
  res.render("urls_show", templateVars);
});

// handles post requests from new url form
app.post("/urls", (req, res) => {
  const shortened = generateRandomString()
  let longURL = req.body.longURL
  if (longURL !== /^https?:\/\//) { longURL = `https://${longURL}` }
  urlDatabase[shortened] = longURL
  res.send(res.redirect(`http://localhost:8080/urls/${shortened}`));
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});

// tells server to listen on pre-defined port
app.listen(PORT, () => {
  console.log(`Hello Seattle, Port: ${PORT} is listening.`);
});