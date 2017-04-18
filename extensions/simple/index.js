console.log('simple extension executed!');

function simpleStoreSubscription(state, lastAction) {
  console.log(lastAction, state);
}

var subscriber = window.constructor.store.subscribe(simpleStoreSubscription);

//later, when you are done, to stop listening...
//at the moment, the extension will simply continue to exist and is never unmounted.
//subscriber()