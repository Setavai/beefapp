
// if not in production, load variables from .env
if(process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

var createError = require('http-errors');
var express = require('express');
var passport = require('passport');
var util = require('util');
var session = require('express-session');
var SteamStrategy = require('passport-steam').Strategy;
var path = require('path');
var logger = require('morgan');

passport.serializeUser(function(obj, done) {
  done(null, obj);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(
  new SteamStrategy({
    returnURL: 'http://localhost:3000/auth/steam/return',
    realm: 'http://localhost:3000/',
    apiKey: process.env.STEAM_API_KEY
  },
  function(identifier, profile, done) {
    process.nextTick(function () {
      profile.identifier = identifier;
      return done(null, profile);
    });
  })
);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(session({
  secret: 'your secret',
  name: 'name of session id',
  resave: true,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/dashboard', ensureAuthenticated, function(req, res){
  res.render('dashboard', { user: req.user });
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// GET /auth/steam
app.get('/auth/steam',
  passport.authenticate('steam', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
  }
);

// GET /auth/steam/return
app.get('/auth/steam/return',
  passport.authenticate('steam', { failureRedirect: '/' }),
  function(req,res) {
    res.redirect('/dashboard');
  }
);

function ensureAuthenticated(req, res, next) {
  if(req.isAuthenticated()) { return next(); }
  res.redirect('/');
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
