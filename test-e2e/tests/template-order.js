var homepageRegister = require('../fixtures/homepage-register');
var openInventory = require('../fixtures/open-inventory');
var newProject = require('../fixtures/newproject');
var myProjects = require('../fixtures/myprojects');
var size = require('../fixtures/size');
var openTemplates = require('../fixtures/open-templates-sample');
var dragFromTo = require('../fixtures/dragfromto.js');

module.exports = {
  'Verify we can order all templates' : function (browser) {

    size(browser);
    homepageRegister(browser);
    myProjects(browser);
    openTemplates(browser);
    newProject(browser);
    dragFromTo(browser, '.InventoryItem-item', 10, 10, '.cvc-drop-target', 50, 40);
    browser
      .click('.order-button')
      .waitForElementPresent('.order-form .page1', 10000, 'expected order dialog to appear')
      .pause(1000)
      .submitForm('.order-form')
      .waitForElementPresent('.order-form .page3', 120000, 'expect summary page to appear')
      // click done
      .click('.order-form button:nth-of-type(1)')
      .waitForElementNotPresent('.order-form', 10000, 'expected order dialog to go away')
      .end();
  }
};
