## Walkthrough

We will go through the process of writing this extension from scratch. You will create it in another directory, and can refer to this one for guidance.

### Overview

This extension consists of a server piece and a client piece.

The server piece will run a python script, which runs a reverse complement, and returns the result.

When active, the client piece will listen to when blocks are selected, call the server route, and display the result.

### Setup

```sh
cd extensions

# choose your extension name, must match folder name
mkdir myExample

# init the npm package
npm init

# go through the steps

# create our files
touch router.js
touch client.js
touch helper.py
```

### Write package.json

Constructor extensions are build on [`npm`](https://docs.npmjs.com/) modules, which is why we ran `npm init` above.

We need to update our package for Constructor, noting our files and some additional metadata.

Add this to `package.json` at the root level.

```json
"geneticConstructor": {
  "type": "Contributed",
  "router": "router.js",
  "client": [
    {
      "file": "client.js",
      "region": "projectDetail"
    }
  ]
},
```

### Link our extension during development

When the server starts, it expects extensions to be registered.

In production, extensions are installed by running `npm run install-extensions`, which looks at `/server/extensions/package.json` and installs the appropriate extensions.

In development, it is easier to register your extension using [`npm link`](../../docs/extensions/npmLink.md). Using this stratgety, do not add your extension to `/server/extensions/package.json`.

Instead, we will create a symbolic link to the extension, so that our changes will be picked up automatically every time the server restarts:

```sh
cd extensions/myExample

# register the symbolic link to the extension
npm link

cd ../../server/extensions

# link your extensions
npm link myExample
```

You should now see your extension in `/server/extensions/node_modules/myExample`.

### Start the server

It is helpful to see what is happening while developing, and try our our links

Let's start a live-reloading server:

```
npm run start
```

This may take a few seconds, but all subsequent rebuilds will be quick.

A window should pop up automatically, or go to `localhost:3001` when its done.

Note that the live-reloading server runs at port `3001`. Port `3000` will hit the server, but the client bundle is only in memory, and the unproxied server cannot serve it.

### Write Python Script

Our python script is simple: It takes a file name as a CLI argument, and uses biopython to get the reverse complement.

Set the contents of `helper.py`:

```python
#!/usr/bin/python

from Bio.Seq import Seq
import sys

with open(str(sys.argv[1]), 'r') as f:
    contents = f.read()
    seq = Seq(contents)
    print seq.reverse_complement()
```

##### Test it

Create a file `sequence.txt` and add some DNA sequence, for example

```
AACGGT
```

Then, try running it

`python helper.py sequence.txt`

You should see the reverse complement printed:

```
ACCGTT
```

### Setup Server

Constructor Server Extensions are expected to export an express-compatible router, and are registered at `/extensions/api/<extensionName>`. So, your extension, if named `myExtension`, will be registered at `http://localhost:3000/extensions/api/myExtension` while running locally.

##### Install Dependencies

[`express`](http://expressjs.com/) is the easiest way to create the router.

[`body-parser`](https://github.com/expressjs/body-parser) makes it easy to read the POST body

```sh
npm install --save express body-parser
```

##### Scaffold our Server

Open `router.js`, and add:

```javascript
//import dependencies

//server router
var express = require('express');
//parse message bodies
var bodyParser = require('body-parser');

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
    //todo
    res.status(501).send('not implemented');
  });

module.exports = router;
```

### Basic Server Test

After the server restarts, if you have linked the extension, the route should be registered.

In your browser console, you can try running the following:

```javascript
//GET http://localhost:3000/extensions/api/myExample/test
constructor.extensions.api('myExample', 'test', {})
    .then(function (response) { response.text() })
    .then(function (text) { console.log(text) });
```

You should see `use post instead` show up in the console, matching our GET route above.

##### `constructor.extensions.api`

`constructor.extensions.api` is built on [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).

The final argument allows you to set the fetch body, which will we do later.

This function returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

### Add Python

##### Add dependencies

To run the python, we need to `require` a few more core node packages to. We do not need to install these, they come with node.

Add this to the top of `router.js` with the other dependencies:

```javascript
//run shell scripts + create child processes
var cp = require('child_process');
//file system paths
var path = require('path');
//file system IO
var fs = require('fs');
```

##### Get request body

`body-parser` makes it easy to get the message body. If our request has the header `Content-Type: text/plain`, `body-parser` will add it to `req.body` in our request handler.

```javascript
.post(function (req, res, next) {
    var posted = req.body;

    console.log('received body:', posted);

    //todo - run python + respond
    res.status(501).send('not implemented');
})
```

##### Write file for Python

We'll write a file, and pass the filename to python, so we can easily pass information between javascript and python:

```javascript
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

        //todo - call python + respond
        res.status(501).send('not implemented');
    });
});
```

##### Call our python script + respond with the result

We want to call our script and pass the location of the file:

```javascript
var command = 'python ' + scriptLocation + ' ' + fileLocation;
```

We'll use `child_process` [`exec()`](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback) to effectively run a command on the CLI.

```javascript
exec(command, function (error, stdout, stderr) { ... })
```

And then return `stdout` as our response, or a `500` if there's an error.

```javascript
exec(command, function (error, stdout, stderr) {
    if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).send('error running python');
    }

    res.send(stdout);
});
```

Putting it all together:

```javascript
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
```

### Test the REST endpoint

At this point, you should be able to get reverse complements from the Constructor server.

Try it the console of your browser:

```javascript
//POST the sequence http://localhost:3000/extensions/api/myExample/test
var sequence = 'AACGGT';
constructor.extensions.api('myExample', 'test', {
    method: 'POST',
    body: sequence
})
    .then(function (response) { response.text() })
    .then(function (text) { console.log(text) });

    //should log ACCGTT
```

##### Wrap as function

Let's wrap our API call in a function, which expects a sequence, and returns the text result:

```javascript
function getComplement(seq) {
  return window.constructor.extensions.api('example-python', '', {
    method: 'POST',
    body: seq,
  })
    .then(function getText(resp) { return resp.text(); });
}
```

### Client Piece

##### Client Extension Overview

[Client Extensions](../../docs/extensions/ClientExtensions.md) may take a few forms. Visual extensions (e.g. `region === 'projectDetail') are only downloaded when active and specifically requested. Non-visual (`region === null`) client pieces are downloaded once activated.

We will write a simple visual plugin which shows up at the bottom of the page, in the region `projectDetail`.

Visual client extensions must register themselves with the Constructor application, with the general format:

```javascript
function render(container, options) { ... }

window.constructor.extensions.register('example-python', 'projectDetail', render);
```

##### Outline extension

Let's define a simple render function, and register the extension on the client with Constructor:

```javascript
function getComplement(seq) {
  return window.constructor.extensions.api('example-python', '', {
    method: 'POST',
    body: seq,
  })
    .then(function getText(resp) { return resp.text(); });
}

//run when the script is downloaded
console.log('script downloaded!');
getComplement('ACGATTATCGTATCCA').then(function (result) {console.log(result)});

//render function
function render(container, optinons) {
  container.innerHTML = 'My Extension Loaded!';
}

//register with Constructor
window.constructor.extensions.register('example-python', 'projectDetail', render);
```

### Activate Extension

By default, your extension will not be active. To activate it, open the Extension Picker from the User menu (top right corner) in the Constructor application, and click the checkbox next to your extension. The extension is now marked active, and it should show up in the Project Detail section, at the bottom of the design canvas.

To download and render your extension, click your extension in the Project Detail section. The section should pop open, and should read `My Extension Loaded!`

### Listen for Application Changes

Refer to the [client api documentation](http://geneticconstructor.dev.bionano.autodesk.com/help/docs).

Constructor's application state is tracked in a single Store, to which you can `subscribe`. Subscriptions are triggered on all changes, so they should be quick. They are passed the store and last action.

```javascript
var subscription = window.constructor.store.subscribe(function (state, lastAction) { ... });
```

##### Get + Reverse Complement Sequences

We want to get the currently selected blocks, get their sequences, and then call our API, and join all the results into a single sequence.

Getting the sequence of a block returns a promise, so we need to use `Promise.all()` to wait for all the sequences.

```javascript
var focusedBlocks = window.constructor.api.focus.focusGetBlocks();

//wait for all
Promise.all(
    focusedBlocks.map(function (blockId) {
      return window.constructor.api.blocks.blockGetSequence(blockId)
        .then(getComplement);
    })
)
.then(function (sequences) { return sequences.join('').trim(); })
```

However, we should only run this code when the blocks are different:

```javascript
var lastBlocks = [];

//register a subscription to the store
var subscription = window.constructor.store.subscribe(function (state, lastAction) {
    var focusedBlocks = window.constructor.api.focus.focusGetBlocks();

    //simple array comparison
    var isDifferent = lastBlocks.join('') !== focusedBlocks.join('');

    //only run if blocks are in focus, and different than what we had before
    if (focusedBlocks.length > 0 && isDifferent) {
        lastBlocks = focusedBlocks;

        //todo - do our transformations
    }
});
```

Finally, lets write the joined sequence to our div:

```javascript
function render(container, optinons) {
    Promise.all( ... )
    .then(function (sequences) { return sequences.join('').trim(); })
    .then(function (sequence) { container.innerHTML = sequence; });
}
```

Putting it all together, we have our final content for `client.js`:

```javascript
function getComplement(seq) {
  return window.constructor.extensions.api('example-python', '', {
    method: 'POST',
    body: seq,
  })
    .then(function getText(resp) { return resp.text(); });
}

//render function
function render(container, optinons) {
  container.innerHTML = 'example-python extension - loading';

  var lastBlocks = [];

  //register a subscription to the store
  var subscription = window.constructor.store.subscribe(function (state, lastAction) {
    var focusedBlocks = window.constructor.api.focus.focusGetBlocks();

    //simple array comparison
    var isDifferent = lastBlocks.join('') !== focusedBlocks.join('');

    //only run if blocks are in focus, and different than what we had before
    if (focusedBlocks.length > 0 && isDifferent) {
      lastBlocks = focusedBlocks;
      Promise.all(
        focusedBlocks.map(function (blockId) {
          return window.constructor.api.blocks.blockGetSequence(blockId)
            .then(getComplement);
        })
      )
        .then(function (sequences) {
          console.log(sequences);
          return sequences.join('').trim();
        })
        .then(function (sequence) { container.innerHTML = sequence; });
    }
  });

  //return it to unregister when we break down component
  return subscription;
}

//register with Constructor
window.constructor.extensions.register('example-python', 'projectDetail', render);
```

### Final Test

Now, all three pieces are complete:

1) Python Script
2) Router
3) Client Extension

Reload your browser, activate your extension in the Project Detail section, and click on a block which has some sequence. After a moment, the reverse complement should show up.

Yay!
