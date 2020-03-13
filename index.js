'use strict';

//Backlog:

//Is Expired
//If Expired, deny access
//Issue Refresh Token
//Get token by using Refresh Token endpoint
//Implicit Grant
//Password Grant
//Client Grant
//Add Users
//Reset Password

const express = require('express');
const passport = require('passport');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const errorHandler = require('errorhandler');
const cookieParser = require('cookie-parser');
const ejs = require('ejs');

//Configure Application
require('dotenv').config();
require('./auth/config.js');
app.engine('ejs', ejs.__express);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));
app.use(cookieParser());
app.use(bodyParser.json({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(errorHandler());
app.use(session({ secret: 'correct horse battery staple', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

//Application Routes
require('./routes')(app);

//Listen
app.listen(process.env.PORT || 3000);

module.exports = app;