var signout = function(browser) {
  // NOTE: This only works if currently signed in
  browser
    // click user widget to start sign out
    .waitForElementPresent('div.signed-in', 5000, 'expected user to be signed in')
    .click('div.signed-in')
    // click sign out menu item
    .waitForElementPresent('.menu-item:nth-of-type(3)', 5000, 'expected menu to appear')
    .pause(1000)
    .click('.menu-item:nth-of-type(4)')
    .waitForElementPresent('.homepage', 5000, 'expected to be signed out')
}

module.exports = signout;
