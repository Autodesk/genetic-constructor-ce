var clickmainmenu = function(browser, menuIndex, menuItemIndex) {
  var selector = '.menu-dropdown:nth-of-type(' + menuIndex + ') .menu-item:nth-of-type(' + menuItemIndex + ')';
  browser
    // open the given menu
    .click('.menu-dropdown:nth-of-type(' + menuIndex + ')')
    .waitForElementPresent('.menu-header-open', 5000, 'expected an open menu')
    // click the given menu item
    .waitForElementPresent(selector, 5000, 'expected our menu item to appear')
    .click(selector)
    .waitForElementNotPresent('.menu-header-open', 5000, 'expected a closed menu')
    .pause(1000)
};

module.exports = clickmainmenu;
