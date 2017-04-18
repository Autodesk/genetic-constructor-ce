var homepageRegister = require('../fixtures/homepage-register');
var testProject = require('../fixtures/testproject');
var clickNthBlock = require('../fixtures/click-nth-block-bounds');
var clickAt = require('../fixtures/clickAt');
var clickConstructTitle = require('../fixtures/click-construct-title');
var size = require('../fixtures/size');
var openInspector = require('../fixtures/open-inspector');

module.exports = {
  'Test that you can inline edit block name, construct names and project names' : function (browser) {
    size(browser);
    homepageRegister(browser);
    openInspector(browser);
    testProject(browser);

    clickNthBlock(browser, '.sceneGraph', 0);
    browser.pause(1000);
    clickNthBlock(browser, '.sceneGraph', 0);

    browser.waitForElementPresent('input.inline-editor', 5000, 'expected inline editor to appear');

    browser
    // block
      .clearValue('input.inline-editor')
      .setValue('input.inline-editor', ['Hillary Clinton', browser.Keys.ENTER])
      .pause(5000)
      .assert.containsText( 'div', 'Hillary Clinton', 'expected block name to update');

    // title
    clickConstructTitle(browser, 'New Construct');
    browser
      .waitForElementPresent('input.inline-editor', 5000, 'expected inline editor to appear for title')
      .clearValue('input.inline-editor')
      .setValue('input.inline-editor', ['Donald Trump', browser.Keys.ENTER])
      .pause(5000)
      .assert.containsText( 'div', 'Donald Trump', 'expected construct name to update');

    // project title
    browser
      .click('.ProjectHeader-info')
      .waitForElementPresent('.inline-editor-project', 5000, 'expected inline editor to appear for project title')
      .clearValue('.inline-editor-project')
      .setValue('.inline-editor-project', ['Bernie Saunders', browser.Keys.ENTER])
      .pause(5000)
      .assert.containsText( '.ProjectHeader-title', 'Bernie Saunders', 'expected project name to update')
      .end();
  }
};
