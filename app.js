/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var partials = require('express-partials');
var flash = require('connect-flash');
var MongoStore = require('connect-mongo')(express);
var settings = require('./settings');
var fs = require('fs');

var accessLogfile = fs.createWriteStream('access.log', {flags: 'a'});
var errorLogfile = fs.createWriteStream('error.log', {flags: 'a'});

var app = express();

app.locals({
    user: function (req, res) {
        return req.session.user;
    },
    error: function (req, res) {
        var err = req.flash('error');
        if (err.length) {
            return err;
        } else {
            return null;
        }
    },
    success: function (req, res) {
        var succ = req.flash('success');
        if (succ.length) {
            return succ;
        } else {
            return null;
        }
    }
});


app.configure(function () {
    app.use(express.logger({stream: accessLogfile}));
    app.set('port', process.env.PORT || 8082);
    app.set('env', process.env.NODE_ENV || 'production');
    app.set('views', path.join(__dirname, '/views'));
    app.set('view engine', 'ejs');
    app.use(partials());
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({
        secret: settings.cookieSecret,
        key: settings.db,
        cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
        store: new MongoStore({
            host: settings.host,
            db: settings.db
        })
    }));
    app.use(flash());
    app.use(function (req, res, next) {
        res.locals.user = req.session.user;
        res.locals.post = req.session.post;
        res.locals.error = req.flash('error');
        res.locals.success = req.flash('success');
        next();
    });
    app.use(app.router);
    //app.use(express.router(routes));
    app.use(express.static(path.join(__dirname, '/public')));
});

app.configure('production', function () {
    app.use(function (err, req, res, next) {
        var meta = '[' + new Date() + '] ' + req.url + '\n';
        errorLogfile.write(meta + err.stack + '\n');
        next();
    });
});

// all environments
//NODE_ENV=production;
// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

routes(app);

/*
 app.get('/', routes.index);
 app.get('/u/:user', routes.user);
 app.post('/post', routes.post);
 app.get('/reg', routes.reg);
 app.post('/reg', routes.doReg);
 app.get('/login', routes.login);
 app.post('/login', routes.doLogin);
 app.get('/logout', routes.logout);
 */
http.createServer(app);

if (!module.parent) {
    app.listen(app.get('port'), function () {
        console.log('Express server listening on port %d in %s mode ', app.get('port'), app.settings.env);
    })
}

module.exports = app;
