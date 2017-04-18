var homepageRegister = require('../fixtures/homepage-register');
var signout = require('../fixtures/signout');
var signin = require('../fixtures/signin');
var dragFromTo = require('../fixtures/dragfromto');
var newProject = require('../fixtures/newproject');
var newConstruct = require('../fixtures/newconstruct');
var openInventory = require('../fixtures/open-inventory');
var testProject = require('../fixtures/testproject');
var size = require('../fixtures/size');
module.exports = {
  'Test that dropping on the project canvas creates a new construct.' : function (browser) {
    size(browser);
    var credentials = homepageRegister(browser);

    // now we can go to the project page
    browser
      // wait for inventory and inspector to be present
      .waitForElementPresent('.SidePanel.Inventory', 5000, 'Expected Inventory Groups')
      .waitForElementPresent('.SidePanel.Inspector', 5000, 'Expected Inspector');

    testProject(browser);

    // generate image for testing.
    browser
      .saveScreenshot('./test-e2e/current-screenshots/drag-to-create-construct.png')
      .end();
  }
};
