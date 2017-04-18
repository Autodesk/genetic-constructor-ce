Extensions handling on the server.

[Server Extensions](../docs/ServerExtensions.md) are dynamically included and are installed via `npm run install-extensions` from the project root, which will install packages listed in `package.json` in this directory. These extensions are installed in `node_modules`.

[Native Extensions](native/README.md) are included statically as part of the application bundle, and have deep access to the application and data.

Note - do not remove the test extensions from the manifest, as they will result in some tests not passing. Extensions beginning with `test` will be ignored unless in the test environment.