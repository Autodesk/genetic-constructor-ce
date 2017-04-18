/**
 * mouse down and mouse up at given location in selector
 * NOTE: Pauses are to prevent double clicks being triggered
 */
module.exports = function (browser, srcSelector, X, Y) {
  // click on source element
  browser
    .moveToElement(srcSelector, X, Y)
    .pause(200)
    .mouseButtonDown(0)
    .pause(200)
    .mouseButtonUp(0);
}
