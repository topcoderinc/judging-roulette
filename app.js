/**
 * Module dependencies.
 */

var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var methodOverride = require('method-override');
var MongoStore = require('connect-mongo')({ session: session });
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var swig = require('swig');

/**
 * Controllers (route handlers).
 */
var loginController = require('./controllers/login');
var routesController = require('./controllers/routes');

/**
 * API keys and Passport configuration.
 */
var config = require('./config/config');

/**
 * Create Express server.
 */
var app = express();

/**
 * Connect to MongoDB.
 */
mongoose.connect(config.db);
mongoose.connection.on('error', function () {
    console.error('MongoDB Connection Error. Make sure MongoDB is running.');
});

/**
 * Swig Templating Engine
 */
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.set('view cache', false);
swig.setDefaults({ cache: false });

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 8000);
app.use(compress());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: config.sessionSecret,
    store: new MongoStore({
        url: config.db,
        auto_reconnect: true
    })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

var hour = 3600000;
var day = hour * 24;
var week = day * 7;
app.use(express.static(path.join(__dirname, 'public'), { maxAge: week }));

var loginUrl = 'https://www.topcoder.com/?action=showlogin&next=http://tcojudging.topcoder.com';

app.use(function (req, res, next) {
    if (req.isAuthenticated()){
        if(!req.user.eligibleForJudging){
            return res.render('error', { message: 'You are not eligible for judging.' });
        }
        return next();
    }

    if (typeof req.cookies.tcjwt != 'undefined') {
        req.body.email = req.cookies.tcjwt;
        req.body.password = ' ';
        passport.authenticate('local', function (err, user, info) {
            if (err) return next(err);
            req.logIn(user, function (err) {
                if (err) return next(err);
                next();
            });
        })(req, res, next);
    } else {
        res.redirect(loginUrl);
        /** TODO: To be removed */
        // var cookie = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3RvcGNvZGVyLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExMTg1ODczMDE2NDUzMzY5OTI4NCIsImF1ZCI6IjZad1pFVW8yWks0YzUwYUxQcGd1cGVnNXYyRmZ4cDlQIiwiZXhwIjoxNzc1Mjk0NDY4LCJpYXQiOjE0MTUyOTQ0Njh9.XlOXp6L87QSyASxqEk0AHI6amW2qSGIfmKJLe_00irI';
        // res.cookie('tcjwt', cookie, { maxAge: week, httpOnly: true });
        // next();
    }
});


/**
 * Main routes.
 */
app.get('/', routesController.index);
app.get('/logout', routesController.logout);
app.post('/create-submission', routesController.createSubmission);
app.get('/get-submission', routesController.getSubmission);
app.post('/submit-review', routesController.submitReview);
app.get('/get-submissions', routesController.getSubmissions);
app.get('/calculate-scores', routesController.calculateScores);
app.get('/submission-details/:id', routesController.getSubmissionDetails);

/**
 * 500 Error Handler.
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get('port'), function () {
    console.log('Judging Roulette [%s] server is listening on port %d', app.get('env'), app.get('port'));
});

module.exports = app;
