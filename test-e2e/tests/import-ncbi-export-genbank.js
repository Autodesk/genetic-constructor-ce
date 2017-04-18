var homepageRegister = require('../fixtures/homepage-register');
var signout = require('../fixtures/signout');
var signin = require('../fixtures/signin');
var dragFromTo = require('../fixtures/dragfromto');
var newProject = require('../fixtures/newproject');
var newConstruct = require('../fixtures/newconstruct');
var clickMainMenu = require('../fixtures/click-main-menu');
var http = require("http");
var path = require('path');
var size = require('../fixtures/size');
var searchFor = require('../fixtures/search-for');
var openInventory = require('../fixtures/open-inventory');
var openNthBlockContextMenu = require('../fixtures/open-nth-block-contextmenu');
var clickNthContextMenuItem = require('../fixtures/click-popmenu-nth-item');

module.exports = {
  'Import an ncbi part when creating a construct and export the genbank file' : function (browser) {

    size(browser);

    // register via fixture
    homepageRegister(browser);

    // now we can go to the project page
    browser
      // wait for inventory and inspector to be present
      .waitForElementPresent('.SidePanel.Inventory', 5000, 'Expected Inventory Groups')
      .waitForElementPresent('.SidePanel.Inspector', 5000, 'Expected Inspector');

    // start with a new project to ensure no construct viewers are visible
    newProject(browser);
    browser.pause(1000);
    openInventory(browser);

    // open sketch menu
    browser
      .click('.InventoryGroup:nth-of-type(3) .InventoryGroup-heading')
      // expect at least one inventory item and one block to drop on
      .waitForElementPresent('.InventoryItem', 5000, 'expected an inventory item');

    // put a Promoter
    dragFromTo(browser, '.InventoryItemRole:nth-of-type(2)', 10, 10, '.construct-viewer:nth-of-type(2) .sceneGraph', 30, 30);
    // CDS
    dragFromTo(browser, '.InventoryItemRole:nth-of-type(3)', 10, 10, '.construct-viewer:nth-of-type(2) .sceneGraph [data-nodetype="block"]', 300, 10);
    // Insulator
    dragFromTo(browser, '.InventoryItemRole:nth-of-type(6)', 10, 10, '.construct-viewer:nth-of-type(2) .sceneGraph [data-nodetype="block"]', 300, 30);
    // Terminator
    dragFromTo(browser, '.InventoryItemRole:nth-of-type(4)', 10, 10, '.construct-viewer:nth-of-type(2) .sceneGraph [data-nodetype="block"]', 300, 30);

    // term matches insulin in the registry
    searchFor(browser, 'Runx1');

    // drag first result to the Promoter block
    dragFromTo(browser, '.InventoryItem-item', 10, 10, '.construct-viewer:nth-of-type(2) .sceneGraph [data-nodetype="block"]', 30, 30);

    browser
    // wait for a block to appear
      .useXpath()
      .waitForElementVisible('//*[contains(text(), "Runx1")]', 5000, 'expected block runx1 to appear')
      .pause(1000)
      .assert.countelements('//div[@data-nodetype="block"]', 7)
      .end();
  }
};
