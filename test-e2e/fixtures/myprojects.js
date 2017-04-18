var openInventory = require('./open-inventory.js');

var myprojects = function(browser) {
  openInventory(browser);
  browser
    .click('.InventoryGroup:nth-of-type(2) .InventoryGroup-heading')
    .waitForElementPresent('[data-inventory~="project"]', 5000, 'expect at least one project');
};

module.exports = myprojects;
