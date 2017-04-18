var homepageRegister = require('../fixtures/homepage-register');
var newConstruct = require('../fixtures/newconstruct');
var testProject = require('../fixtures/testproject');
var clickAt = require('../fixtures/clickAt');
var rightClickAt = require('../fixtures/rightClickAt');
var clickContextMenu = require('../fixtures/click-popmenu-nth-item.js');
var size = require('../fixtures/size');

module.exports = {
  'Test duplicating a construct/template via context menu on title' : function (browser) {

    size(browser);
    homepageRegister(browser);
    testProject(browser);
    browser
      .waitForElementPresent('[data-nodetype="construct-title"]', 5000, 'expected a title for the construct')
      // test project has six blocks
      .assert.countelements('[data-nodetype="block"]', 6);
    // duplicate via context menu
    rightClickAt(browser, '[data-nodetype="construct-title"]', 15, 15);
    clickContextMenu(browser, 3);
    browser
      .pause(1000)
      // should have double the blocks we started with
      .assert.countelements('[data-nodetype="block"]', 12)
      .saveScreenshot('./test-e2e/current-screenshots/duplicate-construct.png')
      .end();
  }
};
