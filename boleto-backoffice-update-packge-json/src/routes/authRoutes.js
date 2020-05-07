var express = require('express');
var passport = require('passport');

var authRouter = express.Router();
// function router 
var router = function(logger) {



    // Setting route for /SignIn
    authRouter.route('/signIn')
        // get method for /SignIn/ 
        .post(passport.authenticate('local', { failure: '/' }),
            function(req, res) {

                switch (req.user.profile) {
                    case 'if':
                        logger.debug('Usuario é IF');
                        res.redirect('/if');
                        break;

                    case 'regulador':
                        logger.debug('Usuario é regulador');
                        res.redirect('/regulador');
                        break;

                    default:
                        logger.error('Usuario nao possui profile definido');
                        res.redirect('/');
                        break;
                }
            });

    authRouter.route('/profile')
        // get method for /profile/ 
        .all(function(req, res, next) {
            if (!req.user) {
                res.redirect('/');
            }
            next();
        })
        .get(function(req, res) {
            res.json(req.user)
        });

    return authRouter;
};

// exporting the book router
module.exports = router;