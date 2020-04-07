'use strict';

const express = require('express');
const passport = require('passport');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const errorHandler = require('errorhandler');
const cookieParser = require('cookie-parser');
const ejs = require('ejs');
const flash = require("connect-flash");

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
app.use(flash());

//Application Routes
require('./routes')(app);

//Listen
app.listen(process.env.PORT || 3000);

module.exports = app;