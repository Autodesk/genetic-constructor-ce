var homepageRegister = require('../fixtures/homepage-register');
var signout = require('../fixtures/signout');
var signin = require('../fixtures/signin');
var dragFromTo = require('../fixtures/dragfromto');
var newProject = require('../fixtures/newproject');
var newConstruct = require('../fixtures/newconstruct');
var clickMainMenu = require('../fixtures/click-main-menu');
var http = require("http");
var path = require('path');
var size = require('../fixtures/size');

module.exports = {
  'Import PHI-X virus' : function (browser) {

    size(browser);
    homepageRegister(browser);
    newProject(browser);

    // click the file menu -> Upload Genbank File
    clickMainMenu(browser, 1, 8);

    browser
      .waitForElementPresent('.genbank-import-form', 5000, 'Expect the import dialog to appear')
      // click import into new project
      .click('.genbank-import-form input:nth-of-type(1)');

      browser.execute(function() {
        document.querySelector('.genbank-import-form input[type="file"]').style.display = 'block';
        document.querySelector('.dropzone').style.marginBottom = '5rem';
      }, [], function() {});

    var gbFile = path.resolve(__dirname + '/../fixtures/phiX174_1f_redep.gb');

    browser.uploadFileToSeleniumServer(gbFile, function (result) {

      if (result.status === -1) {
        throw new Error(result);
      }

      // Extract the new remote path of the file
      var remotePath = result.value || "";

      // send file name to hidden input[file]
      browser
      .setValue('.genbank-import-form input[type="file"]', remotePath)
      .pause(3000)
      // click submit button to start the upload of fake data
      .submitForm('.genbank-import-form')
      // wait for blocks to become visible
      .waitForElementPresent('[data-nodetype="block"]', 60000, 'expected a construct viewer to appear')
      .assert.countelements('[data-nodetype="block"]', 39, 'expected 39 blocks for phi-x')
      .saveScreenshot('./test-e2e/current-screenshots/phix.png')
      .end();

    });

  }
};
