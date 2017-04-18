
var openinspector= function(browser) {
  browser
    // make sure inspector is present
    .waitForElementPresent('.SidePanel.Inspector', 5000, 'Expected Inspector');
  // now determine if the inventory is already open
  browser.execute(function() {
    return !!document.querySelector('.SidePanel.Inspector.visible');
  }, [], function(result) {
    if (!result.value) {
      browser
        .click('.Inspector-trigger')
        .pause(500);
    }
  });
};

module.exports = openinspector;
