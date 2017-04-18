A Simple Genetic Construct Extension

This extension is only a single file, which will log events as they happen in the app.

It demonstrates what is minimally needed to write an extension, and demonstrates how to register it with the App.

This extension does not have any visual element - it simply exists and interacts with the app non-visually.

No building or installation is necessary.

### Files

#### package.json

`package.json` is required for NPM packages, and NPM nicely underlies our dependency system.

In addition to basic fields like `name`, for front-end extensions, the field `region` is required. It can be `null`, or refer to a page region if the extension is visual. These page regions are defined in ``/src/extensions/regions.js`

#### index.js

This is the file that is actually served and executed on the client.

Extensions may simply register to the store etc by interacting with the GC API at `window.constructor`