const testUrl = process.env.NIGHTWATCH_URL || 'http://localhost:3001';

module.exports = {
  src_folders: ['test-e2e/tests'],
  output_folder: 'e2ereports',
  custom_commands_path: '',
  custom_assertions_path: './test-e2e/custom-assertions/',
  page_objects_path: '',
  globals_path: '',

  selenium: {
    start_process: true,
    server_path: './node_modules/selenium-standalone/.selenium/selenium-server/2.53.1-server.jar',
    log_path: '',
    host: '127.0.0.1',
    port: 4444,
    cli_args: {
      'webdriver.chrome.driver': './node_modules/selenium-standalone/.selenium/chromedriver/2.24-x64-chromedriver',
    },
  },

  test_settings: {
    local: {
      launch_url: testUrl,
      selenium_port: 4444,
      selenium_host: '127.0.0.1',
      silent: true,
      screenshots: {
        enabled: true,
        path: './test-e2e/screenshots',
      },
      globals: {
        waitForConditionTimeout: 10000,
      },
      test_workers: {
        "enabled": true,
        "workers": 2
      },
      desiredCapabilities: {
        browserName: 'chrome',
        javascriptEnabled: true,
        acceptSslCerts: true,
      },
    },

    saucelabs: {
      launch_url: testUrl,
      selenium_port: 80,
      selenium_host: 'ondemand.saucelabs.com',
      desiredCapabilities: {
        browserName: 'chrome',
        platform: 'OS X 10.11',
        version: '52',
        javascriptEnabled: true,
        acceptSslCerts: true,
        screenResolution: '2048x1536',
        build: `build-${process.env.TRAVIS_JOB_NUMBER}`,
        'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
      },
      silent: true,
      username: 'bionano',
      access_key: process.env.SAUCE_ACCESS_KEY,
      screenshots: {
        enabled: false,
        path: '',
      },
      test_workers: {
        "enabled": true,
        "workers": 2
      },
      globals: {
        waitForConditionTimeout: 10000,
      },
    },
  },
};
