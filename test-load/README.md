### Load Testing

You can load test the application using artillary.io. This simple nodejs app runs locally and targets
the public website. Currently there are 4 tests that can be used to validate performance off
basic page rendering, user registration, project creation and genbank file importing.

## Running

Assuming you have already run npm install you can simple enter:

```npm run artillery```

This will run all the tests and will log terse results to the console.
A more detailed report will be found in the root of the project with a file name like artillery_report_TIMESTAMP.json
To create a pretty visual report from this you can run

```node_modules/.bin/artillery report FILE_NAME```

## Performance

The default configuration for all the test are very low and will NOT stress the website.
See artillery.io for details on changing the settings in each tests JSON file. WARNING, you can configure
the tests to send very large numbers of users per second at the website which it cannot currently handle.

