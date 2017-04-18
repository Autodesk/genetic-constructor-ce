var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var clickText = require('../fixtures/click-element-text');
var openExtensions = require('../fixtures/open-extensions-dialog');

module.exports = {
  'Test that you can enable / disable extensions' : function (browser) {
    size(browser);
    homepageRegister(browser);

    // open the viewer extension
    clickText(browser, "Sequence Viewer", '.ProjectDetail-heading-extension');
    browser
      .pause(2000)
      .waitForElementPresent('.viewer', 5000, 'expected viewer to be visible')

    // open the dialog and remove the extensions viewer
    openExtensions(browser);
    browser
      .pause(1000)
      .click('input.ExtensionPicker-toggle')
      // submit button ( its not really a form )
      .click('.ExtensionPicker.gd-form button[type="submit"]')
      // form should go away
      .waitForElementNotPresent('.ExtensionPicker.gd-form', 5000, 'expected for to go away')
      // viewer should go away
      .waitForElementNotPresent('.viewer', 5000, 'expected viewer to be removed')

    // bring it back again
    openExtensions(browser);
    browser
      .pause(1000)
      .click('input.ExtensionPicker-toggle')
      .pause(1000)
      // submit button ( its not really a form )
      .click('.ExtensionPicker.gd-form button[type="submit"]')
      // form should go away
      .waitForElementNotPresent('.ExtensionPicker.gd-form', 5000, 'expected form to go away')
      // viewer should be available again
      .waitForElementPresent('.ProjectDetail-heading-extension', 5000, 'expected form to be visible again');
      
    clickText(browser, "Sequence Viewer", '.ProjectDetail-heading-extension');
    browser
      .waitForElementPresent('.viewer', 5000, 'expected viewer to be present')
      .end();
  }
};
