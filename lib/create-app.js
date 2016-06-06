module.exports = createApp

var express = require('express')
var session = require('express-session')
var uuid = require('node-uuid')
var cors = require('cors')
var vhost = require('vhost')
var path = require('path')
var WcMiddleware = require('wc_express').middleware
var Sequelize  = require('sequelize');
var express    = require('express');
var program    = require('commander');
var bodyParser = require('body-parser');
var https      = require('https');
var fs         = require('fs');
var wc_db      = require('wc_db');

var balance    = require('qpm_balance').handlers.balance
var clear      = require('./handlers/clear')
var deposit    = require('./handlers/deposit')
var home       = require('./handlers/home')
var toledger   = require('./handlers/toledger')
var sweep      = require('./handlers/sweep')



var corsSettings = cors({
  methods: [
    'OPTIONS', 'HEAD', 'GET', 'PATCH', 'POST', 'PUT', 'DELETE'
  ],
  exposedHeaders: 'User, Location, Link, Vary, Last-Modified, ETag, Accept-Patch, Updates-Via, Allow, Content-Length',
  credentials: true,
  maxAge: 1728000,
  origin: true
})

function createApp (argv) {
  var app = express()

  // Session
  var sessionSettings = {
    secret: uuid.v1(),
    saveUninitialized: false,
    resave: false
  }
  sessionSettings.cookie = {
    secure: true
  }

  app.use(session(sessionSettings))
  app.use('/', WcMiddleware(corsSettings))

  app.use( bodyParser.json() )       // to support JSON-encoded bodies
  app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
  }))

  var config = require('../config/config')
  sequelize = wc_db.getConnection(config.db)


  app.use(function(req,res, next) {
    res.locals.sequelize = sequelize;
    res.locals.config = config;
    next();
  });

  app.set('view engine', 'ejs')

  config.ui = config.ui || {}
  config.ui.tabs = [
    {"label" : "Home", "uri" : "/"},
    {"label" : "Balance", "uri" : "/balance"},
    {"label" : "Deposit", "uri" : "/deposit"}
  ]
  config.ui.name = "Testcoin"


  app.get('/', home)
  app.get('/balance', balance)
  app.get('/clear', clear)
  app.get('/deposit', deposit)
  app.get('/toledger', toledger)
  app.get('/sweep', sweep)

  return app
}
