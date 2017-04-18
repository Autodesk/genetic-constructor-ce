var homepageRegister = require('../fixtures/homepage-register');
var myProjects = require('../fixtures/myprojects');
var size = require('../fixtures/size');
var openTemplates = require('../fixtures/open-templates-sample');
var clickAt = require('../fixtures/clickAt');

module.exports = {
  'Verify we can collapse / expand constructs': function (browser) {

    size(browser);
    homepageRegister(browser);
    myProjects(browser);
    openTemplates(browser);
    clickAt(browser, '.scenegraph-userinterface', 5, 5);
    browser
      .waitForElementPresent('[data-nodetype="moreLabel"]', 5000, 'expect more label to appear');

    clickAt(browser, '.scenegraph-userinterface', 5, 5);
    browser
      .waitForElementNotPresent('[data-nodetype="moreLabel"]', 5000, 'expect more label to appear')
      .end();
  }
};
