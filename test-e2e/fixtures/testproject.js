var dragFromTo = require('./dragfromto');
var clickMainMenu = require('./click-main-menu');
var openInventory = require('./open-inventory');

var newproject = function(browser) {
  browser
    .pause(1000)
    // make sure inventory is present
    .waitForElementPresent('.SidePanel.Inventory', 5000, 'Expected Inventory Groups');
    // click new project, which adds a new construct
  clickMainMenu(browser, 1, 5);
  browser
    .waitForElementPresent('.construct-viewer', 5000, 'expect a construct for the new project');
  // ensure inventory open
  openInventory(browser);
    // click the second inventory group 'EGF Parts' to open it
  browser
    .click('.InventoryGroup:nth-of-type(3) .InventoryGroup-heading')
    // expect at least one inventory item and one block to drop on
    .waitForElementPresent('.InventoryItem', 5000, 'expected an inventory item');

  // drag 3 role symbols into construct
  dragFromTo(browser, '.InventoryItemRole:nth-of-type(1)', 10, 10, '.construct-viewer:nth-of-type(2) .sceneGraph', 600, 60);
  dragFromTo(browser, '.InventoryItemRole:nth-of-type(2)', 10, 10, '.construct-viewer:nth-of-type(2) .sceneGraph', 600, 60);
  dragFromTo(browser, '.InventoryItemRole:nth-of-type(3)', 10, 10, '.construct-viewer:nth-of-type(2) .sceneGraph', 600, 60);
  dragFromTo(browser, '.InventoryItemRole:nth-of-type(4)', 10, 10, '.construct-viewer:nth-of-type(2) .sceneGraph', 600, 60);
  dragFromTo(browser, '.InventoryItemRole:nth-of-type(5)', 10, 10, '.construct-viewer:nth-of-type(2) .sceneGraph', 600, 60);
  dragFromTo(browser, '.InventoryItemRole:nth-of-type(6)', 10, 10, '.construct-viewer:nth-of-type(2) .sceneGraph', 600, 60);

  browser
    .pause(250)
    .assert.countelements('[data-nodetype="block"]', 6);

};

module.exports = newproject;
