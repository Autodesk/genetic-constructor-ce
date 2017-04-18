var clickMainMenu = require('./click-main-menu');

var newproject = function(browser) {
  browser
    .waitForElementNotPresent('.ribbongrunt')
  clickMainMenu(browser, 1, 5);
  browser
    .waitForElementNotPresent('.ribbongrunt')
    .waitForElementPresent('.construct-viewer', 5000, 'expect a construct for the new project')
    .assert.countelements('.construct-viewer', 1);
};

module.exports = newproject;
