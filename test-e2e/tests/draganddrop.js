var homepageRegister = require('../fixtures/homepage-register');
var signout = require('../fixtures/signout');
var signin = require('../fixtures/signin');
var dragFromTo = require('../fixtures/dragfromto');
var newProject = require('../fixtures/newproject');
var newConstruct = require('../fixtures/newconstruct');
var openInventory = require('../fixtures/open-inventory');
var size = require('../fixtures/size');


module.exports = {
  'Test drag and drop on test project.' : function (browser) {

    size(browser);
    homepageRegister(browser);

    // create three new constructs
    newProject(browser);
    newConstruct(browser);
    newConstruct(browser);
    openInventory(browser);

      // open inventory
    browser
      .click('.InventoryGroup:nth-of-type(3) .InventoryGroup-heading')
      // expect at least one inventory item and one block to drop on
      .waitForElementPresent('.InventoryItem', 5000, 'expected an inventory item');

    // drag a block to each construct to start them off
    dragFromTo(browser, '.InventoryItemRole:nth-of-type(1)', 10, 10, '.construct-viewer:nth-of-type(2) .sceneGraph', 30, 30);
    dragFromTo(browser, '.InventoryItemRole:nth-of-type(2)', 10, 10, '.construct-viewer:nth-of-type(3) .sceneGraph', 30, 30);
    dragFromTo(browser, '.InventoryItemRole:nth-of-type(3)', 10, 10, '.construct-viewer:nth-of-type(4) .sceneGraph', 30, 30);

    // drag an item from the inventory
    for(var j = 1; j <= 3; j += 1) {
      for(var i = 1; i <= 5; i += 1) {
        dragFromTo(
            browser,
            '.InventoryItemRole:nth-of-type(' + i + ')', 10, 10,
            '.construct-viewer:nth-of-type(' + (j + 1) + ') .sceneGraph [data-nodetype="block"]', 30, 10);
      }
    }

    browser
      .pause(2000)
      .assert.countelements('[data-nodetype="block"]', 18)
      .saveScreenshot('./test-e2e/current-screenshots/draganddrop.png')
      .end();
  }
};
