var homepageRegister = require('../fixtures/homepage-register');
var signout = require('../fixtures/signout');
var signin = require('../fixtures/signin');
var size = require('../fixtures/size');

module.exports = {
  'Test account updating.' : function (browser) {
    size(browser);
    // register via fixture and get credentials used
    var credentials = homepageRegister(browser);
    browser
      // click user widget to access account dialog
      .click('div.signed-in')
      .pause(1000)
      .click('.menu-popup-blocker-visible .menu-item:nth-of-type(3)')
      .waitForElementPresent('#account-form', 5000, 'expected account form');
    // change password, email and names
    var newCredentials = {
      password: 'new' + credentials.password,
      email: 'new' + credentials.email,
      firstName: 'new' + credentials.firstName,
      lastName: 'new' + credentials.lastName,
    };
    browser
      .clearValue('#account-form input:nth-of-type(1)')
      .clearValue('#account-form input:nth-of-type(2)')
      .clearValue('#account-form input:nth-of-type(3)')
      .clearValue('#account-form input:nth-of-type(4)')
      .clearValue('#account-form input:nth-of-type(5)')
      .clearValue('#account-form input:nth-of-type(6)')
      .clearValue('#account-form input:nth-of-type(7)');

      browser.setValue('#account-form input:nth-of-type(1)', credentials.password)
      .setValue('#account-form input:nth-of-type(2)', newCredentials.firstName)
      .setValue('#account-form input:nth-of-type(3)', newCredentials.lastName)
      .setValue('#account-form input:nth-of-type(4)', newCredentials.email)
      .setValue('#account-form input:nth-of-type(5)', newCredentials.email)
      .setValue('#account-form input:nth-of-type(6)', newCredentials.password)
      .setValue('#account-form input:nth-of-type(7)', newCredentials.password)
      .submitForm('#account-form')
      .waitForElementNotPresent('#account-form', 5000, 'expected account form to disappear');

    // now sign out and sign in with new credentials
    signout(browser);
    signin(browser, newCredentials);
    // done
    browser.end();
  }
};
