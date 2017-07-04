'use strict';

const express = require("express");
const app = express();
// sets preffered port
const PORT = process.env.PORT || 8080; // default port 8080

// enables ejs templates (using render, etc...)
app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get('/', (req, res) => {
  res.send('hello')
});

// passes defined var to ejs template, displays with .render
app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, urls: urlDatabase };
  res.render("urls_show", templateVars);
});

// tells server to listen on pre-defined port
app.listen(PORT, () => {
  console.log(`Hello Seattle, Port: ${PORT} is listening.`);
});