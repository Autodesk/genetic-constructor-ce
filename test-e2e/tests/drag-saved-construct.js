var homepageRegister = require('../fixtures/homepage-register');
var signout = require('../fixtures/signout');
var signin = require('../fixtures/signin');
var dragFromTo = require('../fixtures/dragfromto');
var newProject = require('../fixtures/newproject');
var newConstruct = require('../fixtures/newconstruct');
var clickMainMenu = require('../fixtures/click-main-menu');
var openInventory = require('../fixtures/open-inventory');
var size = require('../fixtures/size');

module.exports = {
  'Create a construct, save to inventory, drag out to create a new construct' : function (browser) {

    size(browser);
    homepageRegister(browser);
    newProject(browser);
    openInventory(browser);

    browser
      // open sbol blocks
      .click('.InventoryGroup:nth-of-type(3) .InventoryGroup-heading');

    // create a new construct with a single block
    dragFromTo(browser, '.InventoryItemRole:nth-of-type(1)', 10, 10, '.cvc-drop-target', 50, 40);

    // and again
    dragFromTo(browser, '.InventoryItemRole:nth-of-type(1)', 10, 10, '.cvc-drop-target', 50, 40);

    //browser.pause(1000000);

    browser
      // expect three construct views, two with one block each
      .assert.countelements('.construct-viewer', 3)
      .assert.countelements('[data-nodetype="block"]', 2)

    // save project
    clickMainMenu(browser, 1, 1);

    // click the my projects inventory tab and expect a project.
    browser
      .click('.InventoryGroup:nth-of-type(2) .InventoryGroup-heading')
      // expect one project
      .waitForElementPresent('.InventoryListGroup-heading', 5000, 'expect a list of projects to appear')
      // click to expand
      //.click('.InventoryListGroup-heading')
      .pause(1000)
      // expect to see 3 projects
      .assert.countelements('[data-inventory~="project"]', 3)
      // expand the 3rd project
      .click('[data-inventory~="project"]:nth-of-type(1) .Toggler')
      .click('[data-inventory~="project"]:nth-of-type(2) .Toggler')
      .pause(2000)
      // expect to see 2 blocks that we added to the two constructs
      .assert.countelements('[data-inventory~="construct"]', 2)

    // drag the first construct into the canvas
    dragFromTo(browser, '[data-inventory~="construct"]', 10, 10, '.cvc-drop-target', 50, 40);

    // should have a new construct with a corresponding increase in numbers of blocks/role glyphs
    browser
      .pause(2000)
      // expect four constructs and three blocks
      .assert.countelements('.construct-viewer', 4)
      .assert.countelements('[data-nodetype="block"]', 3)

    //drag a single block to create a new construct
    dragFromTo(browser, '.InventoryItem-item', 10, 10, '.cvc-drop-target', 50, 40);

    // should have a new construct with a corresponding increase in numbers of blocks/role glyphs
    browser
      // expect four construct views and 4 blocks
      .assert.countelements('.construct-viewer', 5)
      .assert.countelements('[data-nodetype="block"]', 4)
      // generate test image
      .saveScreenshot('./test-e2e/current-screenshots/drag-saved-construct.png')
      .end();

  }
};
