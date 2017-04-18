var openInventory = require('./open-inventory.js');

var searchFor = function(browser, term) {
  // open inventory at search tab
  openInventory(browser);
  browser
    .click('.InventoryGroup:nth-of-type(1) .InventoryGroup-heading')
    .waitForElementPresent('.InventorySearch-input', 5000, 'expect search box / input to appear')
    // enter search term and wait for results
    .clearValue('.InventorySearch-input')
    .setValue('.InventorySearch-input', term)
    .waitForElementPresent('.InventoryItem-item', 10000, 'expected results to appear');

};

module.exports = searchFor;
