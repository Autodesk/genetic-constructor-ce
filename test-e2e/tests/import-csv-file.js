var homepageRegister = require('../fixtures/homepage-register');
var signout = require('../fixtures/signout');
var signin = require('../fixtures/signin');
var dragFromTo = require('../fixtures/dragfromto');
var newProject = require('../fixtures/newproject');
var newConstruct = require('../fixtures/newconstruct');
var clickMainMenu = require('../fixtures/click-main-menu');
var http = require("http");
var path = require('path');
var rightClickAt = require('../fixtures/rightClickAt');
var clickContextMenu = require('../fixtures/click-popmenu-nth-item.js');
var size = require('../fixtures/size');

module.exports = {
  'Import a CSV file': function (browser) {

    size(browser);
    // register via fixture
    homepageRegister(browser);

    // now we can go to the project page
    browser
    // wait for inventory and inspector to be present
      .waitForElementPresent('.SidePanel.Inventory', 5000, 'Expected Inventory Groups')
      .waitForElementPresent('.SidePanel.Inspector', 5000, 'Expected Inspector');

    // start with a new project to ensure no construct viewers are visible
    newProject(browser);

    rightClickAt(browser, '[data-nodetype="construct-title"]', 15, 15);

    clickContextMenu(browser, 2);

    // click the file menu -> Upload Genbank File
    clickMainMenu(browser, 1, 8);

    browser
      .waitForElementPresent('.genbank-import-form', 5000, 'Expect the import dialog to appear')
      // click import into new project
      .click('.genbank-import-form input:nth-of-type(1)');

    browser.execute(function () {
      document.querySelector('.genbank-import-form input[type="file"]').style.display = 'block';
      document.querySelector('.dropzone').style.marginBottom = '5rem';
    }, [], function () {});

    var csvFile = path.resolve(__dirname + '/../fixtures/test.csv');

    browser.uploadFileToSeleniumServer(csvFile, function (result) {

      if (result.status === -1) {
        throw new Error(result);
      }

      // Extract the new remote path of the file
      var remotePath = result.value || "";

      browser
        .setValue('.genbank-import-form input[type="file"]', remotePath)
        .pause(3000)
        // click submit button to start the upload of fake data
        .submitForm('.genbank-import-form')
        .waitForElementPresent('.construct-viewer', 60000, 'expected a construct viewer')
        .assert.countelements('.construct-viewer', 4)
        .saveScreenshot('./test-e2e/current-screenshots/import-csv-file.png')
        .end();

    });
  }
};
