const express = require("express");
const app = express();
// sets preffered port
const PORT = process.env.PORT || 8080;
// allows access to POST requests
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
// allows use of cookies
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// enables ejs templates (using render, etc...)
app.set('view engine', 'ejs');

// for storing shortened URLs, with presets
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//for storing user info
const users = {
  01: {
    id: 01,
    email: 'admin@tinyapp.com',
    password: 'admin'
  }
};

// generates random 6 char string to use as short url
const generateRandomString = () => {
  let output = '';
  const base = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < 6; i++) {
    const index = Math.floor(Math.random() * 62);
    output += base[index];
  }
  return output;
};

// checks if url has http(s):// and adds if false
const addProtocol = (URL) => {
  if (!/https?:\/\//.test(URL)) {
    URL = `https://${URL}`;
  }
  return URL;
};

// check if given email is in users
const isUser = (email) => {
  for (user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

const checkPassword = (email, password) => {
  if (users[getIdByEmail(email)].password === password) {
    return true;
  }
  return false
};

const getEmailById = (id) => {
  let user = users[id];
  if (!user) {
    return;
  }
  return user.email;
};

const getIdByEmail = (email) => {
  let id = undefined;
  for (user in users) {
    if (users[user].email === email) {
      id = user;
    }
  }
  return id;
};

// stand-in root path / home-page
app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/login', (req, res) => {
  let templateVars = {
    userEmail: getEmailById(req.cookies["user_id"])
  }
  res.render('login', templateVars)
})

// passes defined var to ejs template, displays with .render
app.get('/urls', (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    userEmail: getEmailById(req.cookies["user_id"])
  };
  res.render("urls_index", templateVars);
});

// shows form to shorten url
app.get("/urls/new", (req, res) => {
  let templateVars = {
    userEmail: getEmailById(req.cookies["user_id"])
  };
  res.render("urls_new", templateVars);
});

// shows a page unique to each shortened url
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase,
    userEmail: getEmailById(req.cookies["user_id"])
  };
  res.render("urls_show", templateVars);
});

// allows don't register button on register page
app.post("/dontRegister", (req, res) => {
  res.redirect("/urls");
});

// register form on register page, handles errors
app.post("/register", (req, res) => {
  if (isUser(req.body.email)) {
    res.status(400).send("Sorry user with that email already exists");
    return;
  } else if (req.body.email && req.body.password){
    const newUser = {
      id: generateRandomString(),
      email: req.body.email,
      password: req.body.password
    };
    users[newUser.id] = newUser;
    res.cookie('user_id', newUser.id);
    res.redirect('/urls');
  } else {
    res.status(400).send("Email and Password cannot be empty");
  }
});

// allows user to logout and clears username cookie
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

// allows login from login page and sets cookie
app.post("/login", (req, res) => {
  const email = req.body.email
  const password = req.body.password
  const id = getIdByEmail(email)
  if (!isUser(email)) {
    res.status(403).send("Email or Password incorrect");
    return;
  } else if (!checkPassword(email, password)) {
    res.status(403).send("Email or Password incorrect");
    return;
  } else {
    res.cookie('user_id', id);
    res.redirect('/');
  };
});

// allows form fillout to update urlDatabase
app.post("/urls/:id", (req, res) => {
  let longURL = addProtocol(req.body.longURL);
  urlDatabase[req.params.id] = longURL;
  res.redirect('/urls');
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
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// tells server to listen on pre-defined port
app.listen(PORT, () => {
  console.log(`Hello Seattle, Port: ${PORT} is listening.`);
});