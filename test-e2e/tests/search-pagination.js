var homepageRegister = require('../fixtures/homepage-register');
var signout = require('../fixtures/signout');
var signin = require('../fixtures/signin');
var dragFromTo = require('../fixtures/dragfromto');
var newProject = require('../fixtures/newproject');
var newConstruct = require('../fixtures/newconstruct');
var size = require('../fixtures/size');
var searchFor = require('../fixtures/search-for');
module.exports = {
  'Test search pagination' : function (browser) {

    // maximize for graphical tests
    size(browser);
    homepageRegister(browser);
    newProject(browser);

    browser
      .pause(1000);

    // term that matches a lot of items
    searchFor(browser, 'yeast');

    browser
      // wait for a block to appear
      .waitForElementPresent('.InventoryItem-item', 10000, 'expected some results')
      .waitForElementPresent('.InventoryListGroupAction', 5000, 'expected a load more button');

    // mark all the current search results so we know when they are replaced.
    browser.execute(function() {
      var items = document.querySelectorAll('.InventoryItem-item');
      for(var i = 0; i < 10; i += 1) {
        items[i].setAttribute('data-test', 'test');
      }
    }, [], function() {

      browser
        // ensure the tags items are visible to selenium
        .assert.countelements('[data-test="test"]', 10)
        // ask for more results
        .click('.InventoryListGroupAction')
        // wait for old results to go away
        .waitForElementNotPresent('[data-test-flag="test"]', 10000, 'expected old results to go away')
        .assert.countelements('[data-test-flag="test"]', 0)
        .end();
    });
  }
};
