/*
  standardize size for all e2e tests
 */
module.exports = function (browser) {
  // click on source element
  browser.windowSize('current', 1700, 1100);
};
