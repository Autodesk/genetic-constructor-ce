var express = require('express');
var router = express.Router();

router.get('*', function simpleRouteHandler(req, res) {
  res.send('Hello World!');
});

module.exports = router;
