## Local Authentication

This module mocks authentication, which simplifies local development. It does not have real user tracking (there is only one user), but enables persistence, configuration updates, and login state tracking (though by default, authentication is effectively disabled).

This module is additionally required because production builds of Genetic Constructor rely on a module `bio-user-platform`, which is not open source.

Developers who wish to enable their own authentication should model such a module on the routes etc. of this one.

### Enabling Login State

When running constructor locally, you can set an environment variable `REQUIRELOGIN=true` to enable a mocked registration and login / logout

##### Example

`REQUIRELOGIN=true npm run start`