window.constructor.store.subscribe(function (state, lastAction) {
  console.log('testClient background', lastAction.type);
});
