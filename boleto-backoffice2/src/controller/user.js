module.exports.controller = function(app) {

/**
 * home page route
 */
  app.get('/login', function(req, res) {
      // any logic goes here
      res.render('index.js')
  });

}