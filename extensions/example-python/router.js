//import dependencies

//server router
var express = require('express');
//parse message bodies
var bodyParser = require('body-parser');
//run shell scripts + create child processes
var cp = require('child_process');
//file system paths
var path = require('path');
//file system IO
var fs = require('fs');

//construct our router
var router = express.Router();

//automatically parse text bodies and make them available on req.body
router.use(bodyParser.text());

//declare routes
router.route('*')
  //non-functional get route
  .get(function (req, res, next) {
    res.status(400).send('use post instead');
  })
  //post route, expects text on the body
  .post(function (req, res, next) {
    var posted = req.body;

    console.log('received body:', posted);

    var fileLocation = path.resolve(__dirname, 'temp.txt');
    var scriptLocation = path.resolve(__dirname, 'helper.py');

    //write a file with the post body, so we can easily communicate between the javascript and python process
    fs.writeFile(fileLocation, posted, 'utf8', function fileWriter(err) {
      if (err) {
        return res.status(500).send('error writing file');
      }

      var command = 'python ' + scriptLocation + ' ' + fileLocation;

      //execute our python helper, passing the file name
      //std out is captured and sent back to to the client
      cp.exec(command, function runPython(error, stdout, stderr) {
        if (error) {
          console.error(`exec error: ${error}`);
          return res.status(500).send('error running python');
        }

        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);

        //if no errors, send stdout as our response
        res.send(`${stdout}`);
      });
    });
  });

module.exports = router;
