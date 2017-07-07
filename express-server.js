const express = require("express");
const app = express();
// sets preffered port
const PORT = process.env.PORT || 8080;
// allows access to POST requests
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
// allows use of session cookies
const cookieSession = require("cookie-session");
app.use(cookieSession({
  userId: 'userId',
  keys: ['purple', 'elephant']
}));
// includes bcrypt
const bcrypt = require('bcrypt');

// enables ejs templates (using render, etc...)
app.set('view engine', 'ejs');

// for storing shortened URLs, with presets
const urlDatabase = {
  "b2xVn2": {
    url: "http://www.lighthouselabs.ca",
    userId: "d7G88i",
    visits: 0,
    created: "1/1/2001"
  },
  "9sm5xK": {
    url: "http://www.google.com",
    userId: "d7G88i",
    visits: 0,
    created: "1/1/2001"
  }
};

//for storing user info
const users = {
  d7G88i: {
    id: 'd7G88i',
    email: 'admin@tinyapp.com',
    password: bcrypt.hashSync('admin', 10)
  }
};

// generates random 6 char string using base 62 to use as short url
const generateRandomString = () => {
  let output = '';
  const base = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < 6; i++) {
    const index = Math.floor(Math.random() * 62);
    output += base[index];
  }
  return output;
};

// checks if url has http(s):// and www. and adds if false
const addProtocol = (URL) => {
  let newUrl = URL;
  if (!/https?:\/\//.test(URL)) {
    if (!/www\./.test(URL)) {
      newUrl = `www.${newUrl}`;
    }
    newUrl = `https://${newUrl}`;
  }
  return newUrl;
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

// gets email registered to given id
const getEmailById = (id) => {
  let user = users[id];
  if (!user) {
    return;
  }
  return user.email;
};

// gets id registered to email
const getIdByEmail = (email) => {
  let id = undefined;
  for (user in users) {
    if (users[user].email === email) {
      id = user;
    }
  }
  return id;
};

// checks if given email and password match
const checkPassword = (email, password) => {
  if (bcrypt.compareSync(password, users[getIdByEmail(email)].password)) {
    return true;
  }
  return false;
};

// generates list of urls associated with given id
const urlsForUser = (id) => {
  const output = {};
  for (url in urlDatabase) {
    if (urlDatabase[url].userId === id) {
      output[url] = urlDatabase[url];
    }
  }
  return output;
};

// root path, sends to login if not logged in or urls
app.get('/', (req, res) => {
  if (!req.session.userId) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

// if logged in sends user to urls index page,
// otherwise renders registration form
app.get('/register', (req, res) => {
  if (req.session.userId) {
    res.redirect("/urls");
  } else {
    res.render('register');
  }
});

// if logged in redirects to urls index,
// else renders login page
app.get('/login', (req, res) => {
  let templateVars = {
    userEmail: getEmailById(req.session.userId)
  };
  if (req.session.userId) {
    res.redirect("/urls");
  } else {
    res.render('login', templateVars);
  }
});

// if logged in renders urls created by user,
// else throws 401 error
app.get('/urls', (req, res) => {
  let templateVars = {
    userEmail: getEmailById(req.session.userId),
    urls: urlsForUser(req.session.userId)
  };
  if (!req.session.userId) {
    res.status(401).send("You are not logged in.");
    return;
  } else {
    res.render("urls_index", templateVars);
  }
});

// shows form to shorten url if logged in,
// else redirects to login page
app.get("/urls/new", (req, res) => {
  let templateVars = {
    userEmail: getEmailById(req.session.userId)
  };
  if (!templateVars.userEmail) {
    res.redirect('/login');
  } else {
    res.render("urls_new", templateVars);
  }
});

// shows a page unique to each shortened url with stats
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortUrl: req.params.id,
    urls: urlDatabase,
    userEmail: getEmailById(req.session.userId),
    userId: req.session.userId
  };
  if (urlDatabase[req.params.id] === undefined) {
    res.status(404).send('Not found');
    return;
  } else {
    res.render("urls_show", templateVars);
  }
});

// allows new user registration if email not registered
// does not allow blank submission
app.post("/register", (req, res) => {
  if (req.session.userId) {
    res.status(400).send("Your already logged in!");
    return;
  } else if (isUser(req.body.email)) {
    res.status(400).send("Sorry user with that email already exists");
    return;
  } else if (req.body.email && req.body.password){
    const newUser = {
      id: generateRandomString(),
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    users[newUser.id] = newUser;
    req.session.userId = newUser.id;
    res.redirect('/urls');
  } else {
    res.status(400).send("Email and Password cannot be empty");
  }
});

// allows user to logout and clears username cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
});

// allows login from login page and sets cookie
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = getIdByEmail(email);
  if (req.session.userId) {
    res.status(400).send("You're already logged in!");
    return;
  } else if (!isUser(email)) {
    res.status(403).send("Email or Password incorrect");
    return;
  } else if (!checkPassword(email, password)) {
    res.status(403).send("Email or Password incorrect");
    return;
  } else {
    req.session.userId = id;
    res.redirect('/');
  }
});

// allows form fillout to update urlDatabase
app.post("/urls/:id", (req, res) => {
  let longURL = addProtocol(req.body.longURL);
  if (urlDatabase[req.params.id].userId === req.session.userId) {
    urlDatabase[req.params.id].url = longURL;
    res.redirect('/urls');
  } else if (!req.session.userId) {
    res.status(401).send("You must be logged in to view this page.");
  } else {
    res.status(400).send("You do not have permission to edit that URL");
  }
});

// updates url database when new url created
app.post("/urls", (req, res) => {
  if (!req.session.userId) {
    res.status(401).send("You must be logged in to shorten URLs.");
    return;
  } else {
    const shortened = generateRandomString();
    let longURL = addProtocol(req.body.longURL);
    const date = new Date();
    urlDatabase[shortened] = {
      url: longURL,
      userId: req.session.userId,
      visits: 0,
      created: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
    };
    res.redirect(`/urls/${shortened}`);
  }
});

// allows button to delete from urlDatabase
app.post("/urls/:id/delete", (req, res) => {
  if (!req.session.userId) {
    res.status(401).send("You must be logged in to do that!");
    return;
  } else if (urlDatabase[req.params.id].userId === req.session.userId) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  } else {
    res.status(400).send("You do not have permission to delete that URL");
  }
});

// redirects to website stored in database
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send("Not found");
    return;
  } else {
    urlDatabase[req.params.shortURL].visits += 1;
    let longURL = urlDatabase[req.params.shortURL].url;
    res.redirect(longURL);
  }
});

// tells server to listen on pre-defined port (includes frasier joke...)
app.listen(PORT, () => {
  console.log(`Hello Seattle, Port: ${PORT} is listening.`);
});