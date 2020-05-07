/*eslint-env node*/

//------------------------------------------------------------------------------
// Aciptance Web Application
//------------------------------------------------------------------------------

// Innocuous comment to test build & deploy pipeline 
// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

var http = require('http');
// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

var bodyParser = require('body-parser');

var cookieParser = require('cookie-parser');

var passport = require('passport');

var session = require('express-session');

// fcw requirements libs
var path = require('path');
var os = require('os');
var async = require('async');
var winston = require('winston');

// Setting logger
var logger = new(winston.Logger)({
    level: 'debug',
    transports: [
        new(winston.transports.Console)({
            colorize: true
        }),
    ]
});

/*
 *	Loading credentials
 */

// setting config filename with my credentials options
var config_filename = "config_file.json";
//
var options = {};
// reading config options
var config_path = path.join(__dirname, './src/config/' + config_filename);
options.config = require(config_path);

// reading credentials
var creds_path = path.join(__dirname, './src/config/' + options.config.cred_filename);
options.creds = require(creds_path);

// Setting Fabric Library
var fcw = require('./src/fabric/fcw/index')({
    block_delay: options.creds.credentials.app.block_delay
}, logger);


/*
 * enroll an admin with the CA
 */
// Initializing Chaincode Library
chaincodeLib = require('./src/fabric/chaincodeLib')(options, fcw, logger);
// enrolling admin
chaincodeLib.enrollAdmin(1, function(e) {
    if (e == null) {
        logger.info("[chaincodeLib] Autenticado");
    }
});

// websocket
var wss = require('./src/websocket/serverSide')(logger, chaincodeLib);

// create a new express server
var app = express();

//api = require('./src/routes/api'),

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(cookieParser());

app.use(session({
    secret: 'aciptance'
}));
// using passport
app.use(passport.initialize());
app.use(passport.session());

require('./src/config/passport')(app);
// setting the views directory
app.set('views', './src/views');

// setting ejs as our view engine
app.set('view engine', 'ejs');

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// importing routes
var authRouter = require('./src/routes/authRoutes.js')(logger);

var propostaRouter = require('./src/routes/propostaRoutes')(logger, chaincodeLib);
var ifRouter = require('./src/routes/ifRoutes')(logger, chaincodeLib);
var reguladorRouter = require('./src/routes/reguladorRoutes')(logger);

/*
 * Routing Configuration
 */
app.use('/Auth', authRouter);
app.use('/proposta', propostaRouter);
app.use('/if', ifRouter);
app.use('/regulador', reguladorRouter);

app.get('/', function(req, res) {
    res.render('login');
});

// start server on the specified port and binding host
var server = http.createServer(app).listen(appEnv.port, function() {
    // print a message when the server starts listening
    logger.info("Server starting on " + appEnv.url);
});

// setup websocket server
wss.setup(server);

module.exports = app;