var homepageRegister = require('../fixtures/homepage-register');
var openInventory = require('../fixtures/open-inventory');
var newProject = require('../fixtures/newproject');
var myProjects = require('../fixtures/myprojects');
var size = require('../fixtures/size');
var openTemplates = require('../fixtures/open-templates-sample');

module.exports = {
  'Verify all templates are available' : function (browser) {

    // maximize for graphical tests
    size(browser);
    homepageRegister(browser);
    myProjects(browser);
    openTemplates(browser);
    browser
      .assert.countelements('[data-inventory~="template"]', 14)
      .assert.countelements('.construct-viewer', 14)
      .assert.countelements('[data-nodetype="block"]', 143)
      .saveScreenshot('./test-e2e/current-screenshots/templates-basic.png')
      .end();
  }
};
