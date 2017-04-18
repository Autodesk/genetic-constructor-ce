var homepageRegister = require('../fixtures/homepage-register');
var signout = require('../fixtures/signout');
var signin = require('../fixtures/signin');
var dragFromTo = require('../fixtures/dragfromto');
var newProject = require('../fixtures/newproject');
var newConstruct = require('../fixtures/newconstruct');
var clickConstructTitle = require('../fixtures/click-construct-title');
var openInventory = require('../fixtures/open-inventory');
var openInspector = require('../fixtures/open-inspector');
var size = require('../fixtures/size');

module.exports = {
  'Test that when creating a new project we get a new focused construct' : function (browser) {

    size(browser);

    // register via fixture
    var credentials = homepageRegister(browser);

    // now we can go to the project page
    browser
      // wait for inventory and inspector to be present
      .waitForElementPresent('.SidePanel.Inventory', 5000, 'Expected Inventory Groups')
      .waitForElementPresent('.SidePanel.Inspector', 5000, 'Expected Inspector')

    // start with a fresh project
    newProject(browser);
    openInventory(browser);
    openInspector(browser);

    browser
      // open symbols
      .click('.InventoryGroup:nth-of-type(3) .InventoryGroup-heading')
      // expect at least one inventory item and one block to drop on
      .waitForElementPresent('.InventoryItem', 5000, 'expected an inventory item')
      // expect one focused construct viewer
      .assert.countelements(".construct-viewer", 1);
      // drag one block to first construct
      dragFromTo(browser, '.InventoryItemRole:nth-of-type(1)', 10, 10, '.construct-viewer:nth-of-type(2) .sceneGraph', 30, 30);

    browser
      .pause(250)
      // we should have a single focused block, so changing its text should change the displayed block
      .clearValue('.Inspector .InputSimple-input')
      .setValue('.Inspector .InputSimple-input', ['Donald Trump', browser.Keys.ENTER])
      // expect the construct title to be updated
      .assert.containsText('[data-nodetype="block"] .nodetext', 'Donald Trump');

    // click the construct title to focus it in inspector
      clickConstructTitle(browser, 'New Construct');
    browser
      .clearValue('.Inspector .InputSimple-input')
      .setValue('.Inspector .InputSimple-input', ['Hillary Clinton', browser.Keys.ENTER])
      .pause(500)
      .assert.containsText('[data-nodetype="construct-title"] .nodetext', 'Hillary Clinton');
    browser
      // focus the project and change its title
      .click('.ProjectHeader')
      .pause(500)
      .clearValue('.Inspector .InputSimple-input')
      .setValue('.Inspector .InputSimple-input', ['Bernie Saunders', browser.Keys.ENTER])
      .pause(500)
      .assert.containsText('.ProjectHeader-title', 'Bernie Saunders')
      .saveScreenshot('./test-e2e/current-screenshots/focus-block-construct-project.png')
      .end();
  }
};
