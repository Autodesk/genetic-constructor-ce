/**
 * get the nth block, within the given selector, bounds in document space
 */
module.exports = function (browser, constructTitle) {

  // generate mouse move events on body from source to destination
  browser.execute(function(constructTitle) {

    var node = document.querySelector('[data-construct-title="' + constructTitle + '"]');
    return node.getBoundingClientRect();

  }, [constructTitle], function(result) {
    var b = result.value;
    browser
      .moveToElement('body', b.left + 10, b.top + 10)
      .mouseButtonDown(0)
      .mouseButtonUp(0);
  });
}
