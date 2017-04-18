Client Extensions

The Constructor web application is bootstrapped with knowledge of all the plugins available on the server, but they are initialized lazily as needed (i.e. `package.json` manifest available, `index.js` loaded when needed).

## Format

Extensions are expected to be NPM modules. They must provide:

- an entrypoint, specified in `package.json` as the field `geneticConstructor.client` (or which defaults to `index.js`), which is responsible for calling `window.constructor.extensions.register(extensionKey, render)`. The format of the render function is given below. The Genetic Constructor server will only serve this file - you must host other files externally if they are to be loaded lazily.

- package.json with fields `name`, `version`, `geneticConstructor`.

- `geneticConstructor` must include the field `type`, and `client` for client extensions (defined below), and optionally `readable`, `description`, etc.

Client extensions may list multiple components to be downloaded on the client, each with a file and region.

#### Example

There are several examples in `/extensions/`. Here is a simple one:

```json
{
  "name": "simple",
  "version": "1.0.0",
  "description": "Simple Genetic Constructor Extension Example",
  "geneticConstructor": {
    "readable": "Simple Extension",
    "type": "Background Script",
    "client": [
      {
        "file": "index.js",
        "region": null
      }
    ]
  }
}
```

## Registering an Extension

### Region

Client extensions with visual elements register to specific sections of the screen.

**A package may only register one component per region.**

#### Valid Regions

Valid regions are listed in `src/extensions/regions.js`

Client extensions must provide `null` in `package.json` if they are not visual

### Example (Non-Visual)

```javascript
//non-visual extensions do not register
window.constructor.store.subscribe(function changeHandler() {
  //store listener
});
```

### Example (Visual)

```javascript
const extensionKey = 'myExtension'; //matches name in package.json
const extensionRegion = 'projectDetail'; //a valid region
const render = (container, options) => {
    //control the container
    container.innerHTML = '<p>yay</p>';

    //API subscription
    const listener = window.constructor.store.subscribe(function changeHandler() {
        //store listener
    });

    //return a function to call when the component unmounts to perform cleanup
    return listener;
}

//register the extension to the appropriate region
window.constructor.extensions.register(extensionKey, extensionRegion, render);
```

##### render()

This function is called when the extension is to be loaded.

Each loaded file of the package should call `window.constructor.extensions.register` with the extension key, region, and render function.

It is passed the container into which the extension is to render. It may be called more than once in a user's session, e.g. if they navigate away from the design page.

Arguments are `container` and `options`

Options include:

```
boundingBox - boundingRect of container element
```

Can pass an `unregister()` callback (e.g. to clean up listeners)
