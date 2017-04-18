var homepageRegister = require('../fixtures/homepage-register');
var testProject = require('../fixtures/testproject');
var size = require('../fixtures/size');
var clickText = require('../fixtures/click-element-text');
var clickConstructTitle = require('../fixtures/click-construct-title');

module.exports = {
  'Test that when creating a new project we get a new focused construct' : function (browser) {

    // maximize for graphical tests
    size(browser);
    homepageRegister(browser);
    testProject(browser);

    clickText(browser, "Sequence Viewer", '.ProjectDetail-heading-extension');
    browser.pause(2000);
    clickConstructTitle(browser, "New Construct");
    browser
      // we should have a project with a single construct with the construct selected.
      // Test all the basic DOM elements of the sequence viewer are present
      .waitForElementPresent('.viewer', 5000, 'expected viewer to be visible')
      .waitForElementPresent('.viewer-status-bar', 5000, 'expected viewer status bar to be visible')
      .waitForElementPresent('.viewer .menu', 5000, 'expected viewer menu to be visible')
      .waitForElementPresent('.viewer .rows', 5000, 'expected rows element to be visible')
      .waitForElementPresent('.viewer .userinterface', 5000, 'expected viewer user interface to be visible')
      // there should be 1 row containing six empty blocks.
      .assert.countelements(".viewer .row-element", 1)
      .assert.countelements(".viewer .sequence-text", 6)
      .assert.countelements(".viewer .sequence-name", 6)
      .assert.countelements(".viewer .sequence-text-marker", 6)
      .assert.countelements(".viewer .sequence-text-reverse", 6)
      .assert.countelements(".viewer .sequence-ruler", 1)
      .assert.countelements(".viewer .sequence-ruler .number", 5)
      .assert.countelements(".viewer .sequence-ruler .tick", 5)
      .end();
  }
};
