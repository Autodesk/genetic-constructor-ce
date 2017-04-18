var size = require('../fixtures/size');

module.exports = {
  'Test homepage.' : function (browser) {
    size(browser);
    browser
      .url(browser.launchUrl + '/homepage')
      // wait for homepage to be present before starting
      .waitForElementPresent('.homepage', 5000, 'Expected homepage element to be present')
      .waitForElementPresent('.homepage-title', 5000, 'Expected homepage title element to be present')
      .waitForElementPresent('.homepage-getstarted', 5000, 'Expected homepage get started button to be present')
      .waitForElementPresent('.homepage-footer', 5000, 'Expected homepage footer to be present')
      .waitForElementPresent('.homepage-footer-list', 5000, 'Expected homepage footer list to be present')
      .waitForElementPresent('.homepage-autodesk', 5000, 'Expected homepage autodesk logo to be present')
      .waitForElementPresent('.homepage-cookie-warning', 5000, 'Expected homepage cookie warning to be present')
      .waitForElementNotPresent('.userwidget', 5000, 'The User Widget should not be visible on the homepage')
      .saveScreenshot('./test-e2e/current-screenshots/homepage.png')
      .end();
  }
};
