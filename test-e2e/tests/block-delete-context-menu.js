var homepageRegister = require('../fixtures/homepage-register');
var testProject = require('../fixtures/testproject');
var openNthBlockContextMenu = require('../fixtures/open-nth-block-contextmenu');
var clickNthContextMenuItem = require('../fixtures/click-popmenu-nth-item');
var size = require('../fixtures/size');

module.exports = {
  'Test that you can delete blocks from the block context menu.' : function (browser) {
    size(browser);

    // register via fixture
    homepageRegister(browser);

    // now we can go to the project page
    testProject(browser);

    // delete block from second construct viewer
    openNthBlockContextMenu(browser, '.construct-viewer:nth-of-type(2) .sceneGraph', 0);
    clickNthContextMenuItem(browser, 2);

    // NOTE: The last item add will be selected. Clicking the first item will group select all blocks

    // expect 5 blocks ( there were 6 )
    browser
      .pause(250)
      .assert.countelements('[data-nodetype="block"]', 5)
      .end();
  }
};
