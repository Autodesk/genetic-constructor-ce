
var homepageRegister = require('../fixtures/homepage-register');
var signout = require('../fixtures/signout');
var signin = require('../fixtures/signin');
var size = require('../fixtures/size');

module.exports = {
  'Test homepage registration, signout and sign in.' : function (browser) {
    size(browser);
    // register via fixture and get credentials used
    var credentials = homepageRegister(browser);
    // now sign out
    signout(browser);
    // now sign in with previous credentials
    signin(browser, credentials);
    // done
    browser.end();
  }
};
