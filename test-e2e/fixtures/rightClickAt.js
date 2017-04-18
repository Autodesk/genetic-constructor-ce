/**
 * mouse down and mouse up at given location in selector
 * NOTE: Pauses are to prevent double clicks being triggered
 */
module.exports = function (browser, srcSelector, X, Y) {
  // click on source element
  browser
    .moveToElement(srcSelector, X, Y)
    .mouseButtonClick('right');
}
