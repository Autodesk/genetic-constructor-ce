var homepageRegister = require('../fixtures/homepage-register');
var signout = require('../fixtures/signout');
var signin = require('../fixtures/signin');
var size = require('../fixtures/size');


// NOTE: Doesn't check the full pathway since getting the email is impossible.
// just that we can make the forms appear
module.exports = {
  'Test forgot password and reset password form' : function (browser) {
  size(browser);
  browser
    .url(browser.launchUrl + '/homepage/forgot')
    .waitForElementPresent('#forgot-form', 5000, 'Expected form to be present')
    .pause(2000)
    .click('#forgot-form button:nth-of-type(2)')
    .waitForElementNotPresent('#forgot-form', 5000, 'Expected form to go away')
    .url(browser.launchUrl + '/homepage/reset')
    .waitForElementPresent('#reset-form', 5000, 'Expected form to be present')
    .pause(2000)
    .click('#reset-form button:nth-of-type(2)')
    .waitForElementNotPresent('#reset-form', 5000, 'Expected form to go away')
    .end();
  }
};
