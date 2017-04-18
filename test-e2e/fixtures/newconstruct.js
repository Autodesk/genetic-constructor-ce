var clickMainMenu = require('./click-main-menu');

var newconstruct = function(browser) {
    clickMainMenu(browser, 1, 6)
    browser
      .pause(250)
      .waitForElementPresent('.construct-viewer', 5000, 'expected at least one construct viewer')
};

module.exports = newconstruct;
