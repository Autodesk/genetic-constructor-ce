var express = require('express');
var bodyParser = require('body-parser');
var fetch = require('isomorphic-fetch');

var extensionKey = 'serverBasicApi';

//construct our router
var router = express.Router();
router.use(bodyParser.text());

//interact with Genetic Constructor's REST API
//key file read+writes under extension name

function writeFile(host, fileId, contents) {
  var url = host + '/file/' + extensionKey + '/' + fileId;
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: contents,
  });
}

function readFile(host, fileId, contents) {
  var url = host + '/file/' + extensionKey + '/' + fileId;
  return fetch(url)
    .then(function (response) { return response.text(); })
}

router.route('/file/:id')
  .get(function fileGetHandler(req, res) {
    readFile(req.protocol + '://' + req.get('host'), req.params.id)
      .then(function (contents) {
        res.send(contents);
      })
      .catch(function (err) {
        res.status(500).send(err)
      });
  })
  .post(function filePostHandler(req, res) {
    var contents = req.body;
    writeFile(req.protocol + '://' + req.get('host'), req.params.id, contents)
      .then(function (response) { return response.text(); })
      .then(function (url) {
        console.log('written at URL', url);
        res.send(req.originalUrl);
      })
      .catch(function (err) {
        console.log(err);
        console.log(err.stack);
        res.status(500).send(err);
      });
  });

router.all('*', function (req, res, next) {
  console.log('couldnt find route', req.originalUrl);

  next('routeNotFound');
});

module.exports = router;
