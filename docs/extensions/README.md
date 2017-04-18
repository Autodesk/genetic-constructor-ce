Extensions are additions for Genetic Constructor, with client and/or server functionality

[Client Extensions](ClientExtensions.md) allow for interaction with user's data from the client, and widgets inserted at specified regions within the app.

[Server Extensions](ServerExtensions.md) add dynamic REST APIs to the server, which can be called by client-extensions, and have some access to persisted Genetic Constructor data.

Some [Walkthroughs](walkthroughs.md) are available, after you've read through the basics.

### Requirements

Extensions must be valid NPM packages, including a file `package.json`.

Extensions must include a field `geneticConstructor: {}` in `package.json` or they will be ignored.

The `geneticConstructor` object must include the field `type`, and either `client` for Client Extensions, or `router` for Server Extensions, or both if there are components on both the client and server.

### Install extensions

In general, extensions listed in `/server/extensions/package.json` and are installed using `npm run install-extensions`. This will install packages, which are assumed to be already build. You may wish to use `npm link` while you are developing a local extension (see Tips section).

We make no guarantees that all package dependencies will be installed (currently, we use `npm install`, which installs dependencies and runs `postinstall` scripts, but that may change in the future).

If you are developing locally, you may list packages in `package.json` with relative paths, as allowed by NPM.

### Hosting extensions

Extensions are installed onto the server using `npm`. NPM supports referencing packages in several ways, defined [on their website](https://docs.npmjs.com/files/package.json#dependencies), but which include:

- local, relative paths
- URLs
- github repositories
- npm packages

See the npm documentation for how to update `package.json`.

### package.json

A few additional fields in `package.json` indicate to Constructor information and intent about the extension. See the docs on [Client extensions](ClientExtensions.md) and [Server Extensions](ServerExtensions.md) for specifics.

### Developing Extensions

To develop an extension, you should download and run Genetic Constructor locally, and develop your extension by including it in the local server. The recommended way of including your extension is to use [`npm link`](npmLink.md).

When running locally, simple / mocked [authentication](../../server/auth/README.md) is used.

### Tips

[`npm link`](npmLink.md)

### Troubleshooting

#### My extension isn't showing up

- Make sure you started the server after modifying package.json or adding the symlinked directory.

- Ensure that the package is in `server/extensions/node_modules`

- Check the server log and client console for errors