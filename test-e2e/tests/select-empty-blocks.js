var homepageRegister = require('../fixtures/homepage-register');
var signout = require('../fixtures/signout');
var signin = require('../fixtures/signin');
var dragFromTo = require('../fixtures/dragfromto');
var newProject = require('../fixtures/newproject');
var newConstruct = require('../fixtures/newconstruct');
var clickMainMenu = require('../fixtures/click-main-menu');
var testProject = require('../fixtures/testproject');
var size = require('../fixtures/size');

module.exports = {
  'Test that we can select empty blocks from the edit menu' : function (browser) {

    size(browser);
    homepageRegister(browser);
    testProject(browser);
    clickMainMenu(browser, 2, 8);
    browser
      .pause(1000)
      // ensure we have all 3 blocks elements selected
      .assert.countelements(".scenegraph-userinterface-selection", 6)
      .saveScreenshot('./test-e2e/current-screenshots/select-empty-blocks.png')
      .end();
  }
};
