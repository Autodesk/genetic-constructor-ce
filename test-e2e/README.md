To run the end to end tests locally:
------------------------------------
- Start the server with authentication enabled e.g. npm run auth 
  ( requires the biouser authentication server/storage system to be running )
- Then run the tests with 'npm run nightwatch'
- You can run an individual test locally with 'npm run e2e' and select the test from the menu.

Tests can be automatically triggered on commits on Travis-CI/Saucelabs. This is currently disabled due to:
----------------------------------------------------------------------------------------------------------

- Timeouts ( our tests exceed the maximum time for a job ( 50 minutes ) we need to upgrade to a paid account )
- Some tests need to be modified to work in the test environment in saucelabs.

NOTE:
-----

We are using a forked version of nightwatch which contains the important function uploadFileToSeleniumServer
which allows a file to be stored on the selenium server but with a local file URI that can be used with
form input type="file" for example.
There is a PR for this on the nightwatch repo but it seems inactive and has not been merged.

https://github.com/nightwatchjs/nightwatch/pull/1193

We can revert to nightwatch master when it is merged i.e. change this:

    "nightwatch": "https://github.com/duncanmeech/nightwatch/tarball/master",
    
in package.json


