var signout = function(browser) {
  // NOTE: This only works if currently signed in
  browser
    // click user widget to start sign out
    .waitForElementPresent('div.signed-in', 5000, 'expected user to be signed in')
    .click('div.signed-in')
    // click extensions on menu
    .waitForElementPresent('.menu-item:nth-of-type(2)', 5000, 'expected menu item to appear')
    .pause(1000)
    .click('.menu-item:nth-of-type(2)')
    .waitForElementPresent('.ExtensionPicker', 5000, 'expected dialog to appear')
}

module.exports = signout;
