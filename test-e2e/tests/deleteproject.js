var homepageRegister = require('../fixtures/homepage-register');
var signout = require('../fixtures/signout');
var signin = require('../fixtures/signin');
var dragFromTo = require('../fixtures/dragfromto');
var testProject = require('../fixtures/testproject');
var newConstruct = require('../fixtures/newconstruct');
var clickMainMenu = require('../fixtures/click-main-menu');
var size = require('../fixtures/size');

module.exports = {
  'Test that we can delete a construct via its context menu' : function (browser) {

    size(browser);
    homepageRegister(browser);
    testProject(browser);

    browser
      .pause(3000)
      // start with six blocks in the project to be deleted
      .assert.countelements('[data-nodetype="block"]', 6)
        .url(function (response) {
        // save original project id
        var projectId = response.value.split('/').pop();
        // click delete project in the menu
        clickMainMenu(browser, 1, 2);
        // wait for form to appear
        browser
          .waitForElementPresent('form.ok-cancel-form', 5000, 'expected confirmation dialog to appear')
          // delete is the default action
          .submitForm('form.ok-cancel-form')
          // wait for form to go away
          .waitForElementNotPresent('form.ok-cancel-form', 5000, 'expected confirmation dialog to go away')
          // this will open the templates project with 29 constructs
          .pause(5000)
          .url(function (response) {
            // get new project id
            var newProjectId = response.value.split('/').pop();
            // test
            browser.assert.ok(projectId !== newProjectId, 'expected project id in url bar to change');
            browser.end();
          });
        });
  }
};
