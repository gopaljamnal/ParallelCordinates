/*
    LAMDA - Server
    
    Copyright 2019 Luxembourg Institute of Science and technology <tto@list.lu>.
                   All rights reserved.
*/


/**
 * Simple module to set up application and specify routes
 *
 * @module app
 * @requires express
 * @requires 'http-errors'
 * @requires path
 * @requires cookie-parser
 * @requires morgan
 * @requires app-config
 * @requires ./routes/index
 * @requires ./routes/users
 * @requires express-session
 * @requires keycloak-connect
 * @requires ./serverLogging.js
 * @requires //runtimeConfiguration
 * @requires ./data
 * @requires ./routes/pythonRouter.js
 * @author Fintan McGee (LIST) fintan.mcgee@list.lu
 */

var createError = require('http-errors');
var express = require('express');

//var auth = require("./authentication.js");


var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var  cfg = require('app-config');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var selectedRouter = null;
var session = require('express-session');// used to store data for authentication purposes
var Keycloak = require('keycloak-connect');
var runtimeConfig = require('.//runtimeConfiguration');
var fileUpload = require('express-fileupload');
var data = require('./data');

if(cfg.server.analyticsRoute === "OCPU ") {
  selectedRouter = require('./routes/opencpuRouter.js');
} else {
  //python is default router
  selectedRouter = require('./routes/pythonRouter.js');
}
var  fs = require('fs'); // for file system interaction

var app = express();
var memoryStore = new session.MemoryStore();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// uncomment line below  for extra logging
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(fileUpload());

//app.get("/public",keycloak.protect());

//app.use(express.static(path.join(__dirname, 'public')));
if(runtimeConfig.getAuthenticationEnabled()) {
  // use authentication , if true indicates that we are going to authenticate all calls via a keycloak server
  // the keycloak config is specified in a "keycloak.json" config file is the same folder as this one
  // the keycloak version should be specified in the  package.json file
  // the version of the node keycloak-connect module should be the saem as that of the server
  // to generate that file a realm must be created on the serer , and a client too
  // the config file can be exported from the client
  // (specify realm the  clients-> [application client name] ->installation
  // select keycloak oicd json

  var keycloak = new Keycloak({store: memoryStore});
  app.use(session({
    secret: 'We are living in a material world',
    resave: false,
    saveUninitialized: true,
    store: memoryStore
  }));
  app.use(keycloak.middleware());
  app.use(keycloak.protect(), express.static(path.join(__dirname, 'public')));
  app.use('/', keycloak.protect(), indexRouter);
  app.use('/data', keycloak.protect(), indexRouter);
  app.use('/ocpu', keycloak.protect(), selectedRouter)

} else {
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/',  indexRouter);
  app.use('/data', indexRouter);
  app.use('/ocpu', selectedRouter);
}
//app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  console.log("Server is handling Error: " + err.message)
  console.log("Error is for " + req.method +  " to " + req.url + " (" + req.originalUrl +") ");
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
