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
var openTemplates = require('../fixtures/open-templates-sample');


module.exports = {
  'Export a project with a regular construct and a template' : function (browser) {

    size(browser);
    
    // register via fixture
    var credentials = homepageRegister(browser);

    // now we can go to the project page
    browser
      // wait for inventory and inspector to be present
      .waitForElementPresent('.SidePanel.Inventory', 5000, 'Expected Inventory Groups')
      .waitForElementPresent('.SidePanel.Inspector', 5000, 'Expected Inspector');

    newProject(browser);
    openInventory(browser);
    searchFor(browser, 'Runx1');
    dragFromTo(browser, '.InventoryItem-item', 10, 10, '.cvc-drop-target', 50, 40);

    // click the my projects inventory tab and expect a project.
    browser
      .waitForElementPresent('.InventoryGroup:nth-of-type(2) .InventoryGroup-heading', 10000, 'expected project header')
      .click('.InventoryGroup:nth-of-type(2) .InventoryGroup-heading')
      // expect one project
      .waitForElementPresent('.InventoryListGroup-heading', 5000, 'expect a list of projects to appear')
      // click to expand
      .waitForElementPresent('[data-inventory~="project"]', 30000, 'expected projects to appear')
      // expect to see 3 projects
      .assert.countelements('[data-inventory~="project"]', 3)
    // expand the 3rd project
      .click('[data-inventory~="project"]:nth-of-type(3) .Toggler')
      .pause(500)

    // drag the first construct into the canvas
    dragFromTo(browser, '[data-inventory~="template"]', 10, 10, '.cvc-drop-target', 50, 40);
    browser.pause(500);

    clickMainMenu(browser, 1, 1);

    // we can't actually download the file but we can ensure the correct header is present at the expected url
    browser.url(function (response) {
      // save original project url
      var projectURL = response.value;
      var projectId = response.value.split('/').pop();
      var uri = browser.launchUrl + '/extensions/api/genbank/export/' + projectId;
      browser
        .url(uri)
        .pause(1000)
        .assert.urlContains(projectId)
        .saveScreenshot('./test-e2e/current-screenshots/export-list-blocks.png')
        .end();
    });
  }
};
