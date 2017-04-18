function render(container, options) {
  //change the content of the widget
  container.innerHTML = 'extension loaded!';

  //simple, beautiful CSS changes through DOM manipulation
  container.style.cssText = 'background: red; height: 100%; width: 100%';

  //find out the size of the element we are rendering into
  console.log(options.boundingBox);

  //listen to changes in the Constructor app
  var subscriber = window.constructor.store.subscribe(function storeSubscription(state, lastAction) {
    console.log(lastAction.type);
  });

  //return an unsubscribe function to clean up when the extension unmounts
  return function () {
    console.log('i am called when the extension is closed');
    subscriber();
  };
}

window.constructor.extensions.register('simpleWidget', 'projectDetail', render);
