var homepageRegister = require('../fixtures/homepage-register');
var signout = require('../fixtures/signout');
var signin = require('../fixtures/signin');
var dragFromTo = require('../fixtures/dragfromto');
var newProject = require('../fixtures/newproject');
var newConstruct = require('../fixtures/newconstruct');
var size = require('../fixtures/size');
var searchFor = require('../fixtures/search-for');
module.exports = {
  'Test ncbi search functionality' : function (browser) {

    // maximize for graphical tests
    size(browser);
    homepageRegister(browser);
    newProject(browser);

    browser
      .pause(1000);

    // term matches insulin in IGEM registry
    searchFor(browser, 'NZ_JUOA01000505');

    // drag first result to create new construct
    dragFromTo(browser, '.InventoryItem-item',10, 10, '.cvc-drop-target', 50, 40);

    browser
      // wait for a block to appear
      .waitForElementPresent('[data-nodetype="block"]', 30000, 'expected blocks to appear')
      .assert.countelements('[data-nodetype="block"]', 25)
      .end();
  }
};
