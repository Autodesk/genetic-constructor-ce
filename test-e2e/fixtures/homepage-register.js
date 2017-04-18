var registerViaHomepage = function(browser) {

  browser
    .url(browser.launchUrl + '/homepage')
    // wait for homepage to be present before starting
    .waitForElementPresent('.homepage', 5000, 'Expected homepage element to be present')
    // open sign in dialog
    .click('.homepage-getstarted')
    // wait for it to be present
    .waitForElementPresent('#auth-signin', 5000, 'Expected form to become visible')
    // ensure it is the sign in dialog
    .pause(1000)
    .getText('#auth-signin .title', function(result) {
      browser.assert.equal(result.value, "Sign In")
    })
    // click the a tag that switches to registration
    .click('#auth-signin a:nth-of-type(1)')
    // wait for registration dialog to appear
    .pause(2000)
    .waitForElementPresent('#auth-register', 5000, 'Expected form to become visible')
    // submit with no values to ensure errors appear
    .submitForm('#auth-register')
    .pause(1000)
    // expect 6 errors to appear ( name error, two email errors, two password erros TOS error )
    .assert.countelements('.error.visible', 6);
    // create fields with viable values including a random email
  var email = 'User' + new Date().getTime() + 'blah@hotmail.com';
  var password = '123456';
  var firstName = 'George';
  var lastName = 'Washington';

  browser
    .clearValue('#auth-register input:nth-of-type(1)')
    .clearValue('#auth-register input:nth-of-type(2)')
    .clearValue('#auth-register input:nth-of-type(3)')
    .clearValue('#auth-register input:nth-of-type(4)')
    .clearValue('#auth-register input:nth-of-type(5)')
    .clearValue('#auth-register input:nth-of-type(6)')

    .setValue('#auth-register input:nth-of-type(1)', firstName)
    .setValue('#auth-register input:nth-of-type(2)', lastName)
    .setValue('#auth-register input:nth-of-type(3)', email)
    .setValue('#auth-register input:nth-of-type(4)', email)
    .setValue('#auth-register input:nth-of-type(5)', password)
    .setValue('#auth-register input:nth-of-type(6)', password)
    .click('.checkbox input')
    //.pause(1000)
    .submitForm('#auth-register')
    //.pause(1000)
    .waitForElementNotPresent('#auth-register', 10000, 'expected form to be dismissed')
    .waitForElementPresent('.userwidget', 10000, 'expected to land on page with the user widget visible')
    //.pause(1000)
    // wait for inventory and inspector to be present to ensure we are on a project page
    .waitForElementPresent('.SidePanel.Inventory', 10000, 'Expected Inventory Groups')
    .waitForElementPresent('.SidePanel.Inspector', 10000, 'Expected Inspector')
    //.pause(1000)

  return {email, password, firstName, lastName};

}

module.exports = registerViaHomepage;
