## `npm link`

Using NPM's package linking will speed your development process. NPM has support for setting up symlinks. You can use `npm link` to link an extension you are actively developing to the `node_modules` directory of the server, so that your changes automatically update the server without requiring reinstallation of all extensions.

Suppose you wish to develop an extension `myExtension`.

If you do not have an extension, let's create one in `/extensions/myExtension`:

```sh
$ cd extensions
$ mkdir myExtension
$ cd myExtension
```

NPM packages require a file called `package.json` to describe them and their dependencies.

```
# set up your extension's NPM package
$ npm init
# follow the steps...
```

Now, let's set up the link. Note that you should not add the extension to `server/extensions/package.json`.

```sh
# this will expose your extension globally on your file system, the first part of setting up the symlink
# it will be exposed using the name listed in package.json
$ npm link

# go back to project root
$ cd ../..

# go into server/extensions
$ cd server/extensions

# add the link, assuming your package name is myExtension
$ npm link myExtension

# start / restart the server (to ensure your extension is picked up in the registry)
$ npm run start
```

Now, you should see a linked directory `myExtension` in `node_modules` of server/extensions. Simply reload the client and you should be served the latest version of your code, as the server dynamically pulls from the directory of your extension.

###### Notes:

- When creating a link, npm may not run the `preprocess` (or `prepublish` etc) script if you have defined one, even though this script is called with `npm install`, and the extension will not automatically recompile for you.

- `npm run install-extensions` clears the `node_modules` directory, so you will have to re-establish the link after running that script using `npm link <packageName>`.

- You likely want to add your extension to the root `/extensions/` directory while you are developing, if you are developing with file-watching set up.