/**
 * get the nth block, within the given selector, bounds in document space
 */
module.exports = function (browser, srcSelector, blockIndex) {

  var b;
  // generate mouse move events on body from source to destination
  browser.execute(function(srcSelector, blockIndex) {

    var src = document.querySelector(srcSelector);
    var blocks = src.querySelectorAll('[data-nodetype="block"]');
    var block = blocks[blockIndex];
    var bounds = block.getBoundingClientRect();
    return {left: bounds.left , top: bounds.top, width: bounds.width, height: bounds.height};

  }, [srcSelector, blockIndex], function(result) {
    b = result.value;

    browser
      .moveToElement('body', b.left + b.width - 8, b.top + 15)
      .mouseButtonClick('right')
      .waitForElementPresent('.menu-popup-blocker-visible .menu-popup-container', 5000, 'expected an open menu')
  });
}
