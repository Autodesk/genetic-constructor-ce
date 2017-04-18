var clickcontextmenu = function(browser, index) {
  browser
    .waitForElementPresent('.menu-popup-blocker-visible .menu-popup-container', 5000, 'expected an open menu')
    .pause(250)
    .click('.menu-popup-blocker-visible .menu-popup-container .menu-item:nth-of-type(' + index + ')')
    .waitForElementNotPresent('.menu-popup-blocker-visible .menu-popup-container', 5000, 'expected a closed menu')
};

module.exports = clickcontextmenu;
