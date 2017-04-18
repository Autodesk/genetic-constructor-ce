var homepageRegister = require('../fixtures/homepage-register');
var newConstruct = require('../fixtures/newconstruct');
var newProject = require('../fixtures/newproject');
var clickAt = require('../fixtures/clickAt');
var rightClickAt = require('../fixtures/rightClickAt');
var clickContextMenu = require('../fixtures/click-popmenu-nth-item.js');
var size = require('../fixtures/size');

module.exports = {
  'Test deleting a construct using construct menu in header' : function (browser) {
    size(browser);
    homepageRegister(browser);
    newProject(browser);

    browser
      .waitForElementNotPresent('.ribbongrunt')
      .waitForElementPresent('.construct-viewer', 5000, 'expected one construct viewer')
      .waitForElementPresent('[data-nodetype="construct-title"]', 5000, 'expected a title for the construct')

    rightClickAt(browser, '[data-nodetype="construct-title"]', 15, 15);

    clickContextMenu(browser, 2);

    browser
      .waitForElementNotPresent('.construct-viewer', 5000, 'expected construct viewer to go away')
      .end();
  }
};
