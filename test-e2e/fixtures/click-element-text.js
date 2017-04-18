module.exports = function(browser, text, inputSelector) {
  var selector = inputSelector || '*';

  browser.elements('css selector', selector, function (resultValues) {
    resultValues.value.forEach(function(element) {
      browser.elementIdText(element.ELEMENT, function (result) {
        if(result.value === text) {
          browser.moveTo(element.ELEMENT, 0, 0, function () {
            browser.elementIdClick(element.ELEMENT);
          });
        }
      });
    });
  });
};
