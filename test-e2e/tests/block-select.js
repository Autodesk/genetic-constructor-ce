var homepageRegister = require('../fixtures/homepage-register');
var signout = require('../fixtures/signout');
var signin = require('../fixtures/signin');
var dragFromTo = require('../fixtures/dragfromto');
var dragRegion = require('../fixtures/dragregion');
var testProject = require('../fixtures/testproject');
var newConstruct = require('../fixtures/newconstruct');
var clickNthBlock = require('../fixtures/click-nth-block-bounds');
var clickAt = require('../fixtures/clickAt');
var openInventory = require('../fixtures/open-inventory');
var size = require('../fixtures/size');

module.exports = {
  'Test that you can shift/meta/fence select blocks' : function (browser) {
    size(browser);
    homepageRegister(browser);
    testProject(browser);

    // click first block
    clickNthBlock(browser, '.sceneGraph', 0);

    browser
      .pause(100)
      .waitForElementPresent(".scenegraph-userinterface-selection", 5000, 'expected a selection block')
      .assert.countelements(".scenegraph-userinterface-selection", 1);

    // open then close the inline editor
    clickNthBlock(browser, '.sceneGraph', 0);
    browser.pause(1000);
    clickNthBlock(browser, '.sceneGraph', 0);

    browser.waitForElementPresent('.inline-editor', 5000, 'expected inline editor to appear');
    clickNthBlock(browser, '.sceneGraph', 1);
    browser.waitForElementNotPresent('.inline-editor', 5000, 'expected inline editor to go away');

    browser
      .pause(3000)
      .keys([browser.Keys.SHIFT]);

    for(var i = 0; i < 6; i += 1) {
      clickNthBlock(browser, '.sceneGraph', i);
    }

    // expect all 6 elements to be selected
    browser
      .pause(250)
      .assert.countelements(".scenegraph-userinterface-selection", 6);

    // meta key select 1 block to toggle it
    // meta key select 1 block to toggle it
    browser.keys([browser.Keys.META]);
    clickNthBlock(browser, '.sceneGraph', 0);
    browser.pause(1000)
    browser.assert.countelements(".scenegraph-userinterface-selection", 5);

      // click outside the blocks to deselect them all
    clickAt(browser, '.scenegraph-userinterface', 100, 10);
    browser.pause(1000);
    browser.assert.countelements(".scenegraph-userinterface-selection", 0);

    dragRegion(browser, '.scenegraph-userinterface', 800, 110, 30, 10, 100);
    browser
      .waitForElementPresent('.scenegraph-userinterface-selection', 5000, 'expected selections')
      // ensure we have all elements selected
      .assert.countelements(".scenegraph-userinterface-selection", 6)
      .end();
  }
};
