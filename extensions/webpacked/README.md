Example plugin which uses webpack and displays in the projectDetail region.

Webpack (https://webpack.github.io/) or some other build tool is necessary for bundling larger projects, as only one file (`index.js`) is allowed to be served per extension.

## Build process

The build step is also included as part of the `prepublish` script in `package.json`, so that when the package is installed using `npm install`, the script will be run and the package build for us ([reference](https://docs.npmjs.com/files/package.json#devdependencies)).

Ensure that this will run error free, as otherwise the package will not install. Alternatively, as with the simpler examples, simply include a pre-built `index.js` file in the package.

### Explanation / Running Locally

In this example, we list webpack as a project dependency, so it is installed via NPM

`npm install`

And then use NPM to write a build script:

`npm run build`

We write a build script because NPM adds its packages to the $PATH before executing, bringin webpack in scope.

Note that simply running this line will not work, as webpack is not installed globally, unless you have set it up that way on your machine:

`webpack main.js index.js`
