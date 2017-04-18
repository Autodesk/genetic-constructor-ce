## Testing

#### E2E Tests

Using Nightwatch. Tests are in `/test-e2e` directory.

To run all the tests:

`npm run nightwatch`

To run a specific test:

`npm run e2e`

##### Notes

The unit tests generate images, saved in `/e2ereports` to perform image diffing

#### Unit tests

Unit tests for server and app, using Mocha. Tests are in the `/tests/` directory

`npm run test`

#### Linting

`npm run lint`

