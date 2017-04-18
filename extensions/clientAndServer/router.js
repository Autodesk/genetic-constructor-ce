var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();

router.use(bodyParser.text());

var counter = 0;

router.route('*')
  .get(function getHandler(req, res, next) {
    res.status(200).send(counter);
  })
  .post(function postHandler(req, res, next) {
    var count = parseInt(req.body, 10) || 1;
    counter += count;
    res.status(200).send('' + counter);
  });

module.exports = router;
