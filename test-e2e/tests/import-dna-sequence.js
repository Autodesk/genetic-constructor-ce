var homepageRegister = require('../fixtures/homepage-register');
var signout = require('../fixtures/signout');
var signin = require('../fixtures/signin');
var dragFromTo = require('../fixtures/dragfromto');
var newConstruct = require('../fixtures/newconstruct');
var openNthBlockContextMenu = require('../fixtures/open-nth-block-contextmenu');
var clickNthContextMenuItem = require('../fixtures/click-popmenu-nth-item');
var openInventory = require('../fixtures/open-inventory');
var clickMainMenu = require('../fixtures/click-main-menu');
var newProject = require('../fixtures/newproject');
var size = require('../fixtures/size');

module.exports = {
  'Import a DNA sequence into a sketch block' : function (browser) {

    size(browser);

    // register via fixture
    var credentials = homepageRegister(browser);

    // now we can go to the project page
    browser
      // wait for inventory and inspector to be present
      .waitForElementPresent('.SidePanel.Inventory', 5000, 'Expected Inventory Groups')
      .waitForElementPresent('.SidePanel.Inspector', 5000, 'Expected Inspector');


    // start with a fresh project
    newProject(browser);
    openInventory(browser);

    browser
      // open the sketch blocks
      .click('.InventoryGroup:nth-of-type(3) .InventoryGroup-heading')

    // double check there are no construct viewers present
      .assert.countelements('.construct-viewer', 1);

    // add block to construct
    dragFromTo(browser, '.InventoryItemRole:nth-of-type(1)', 10, 10, '.construct-viewer:nth-of-type(2) .sceneGraph', 30, 30);

    browser
      // expect one construct view and one block
      .assert.countelements('.construct-viewer', 1)
      .assert.countelements('[data-nodetype="block"]', 1);

    browser.pause(5000)
      .waitForElementNotPresent('.ribbongrunt');

    var blockBounds = openNthBlockContextMenu(browser, '.sceneGraph', 0);
    clickNthContextMenuItem(browser, 3);

    // wait for the import DNA modal window
    browser
      .waitForElementPresent('.importdnaform', 5000, 'expected the import form')
      // it should contain a text area if there was a selected block
      .waitForElementPresent('.importdnaform textarea', 5000, 'expected a text area')
      // enter a BAD sequence
      .setValue('.importdnaform textarea', 'XXXX')
      // expect to get a zero length sequence
      .assert.containsText('.importdnaform label:nth-of-type(1)', 'Length: 0')
      // set a valid sequence with white space and newlines
      .clearValue('.importdnaform textarea')
      .setValue('.importdnaform textarea', 'acgtu ryswk mbdhv n.-')
      // expect a message about a valid 18 character sequence ( with white space etc removed )
      .assert.containsText('.importdnaform label:nth-of-type(1)', 'Length: 18')
      // submit the form with the valid sequence
      .submitForm('.importdnaform')
      // wait for the grunt ribbon to confirm,
      .waitForElementPresent('.ribbongrunt', 5000, 'expected a grunt')
      .assert.containsText('.ribbongrunt', 'Sequence was successfully inserted.');

    // now start a new project and ensure the dialog is no operational with no block selected
    // start with a fresh project
    newProject(browser);

    // open import DNA from main edit menu
    clickMainMenu(browser, 2, 7);

    browser
      .pause(100)
      .waitForElementPresent('.ribbongrunt', 1000, 'expect an error message for this case')
      .end();
  }
};
