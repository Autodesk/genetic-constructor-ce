var extensionKey = 'clientAndServer';
var apiEndpoint = '/extensions/api/' + extensionKey;

function render(container, options) {
  container.innerHTML = '';
  container.style.cssText = 'color: red; font-size: 1rem; width: 100%; text-align: center; padding: 3rem;';

  //set up a listener so that every action will increment our counter by one, and update the container with the count

  var subscriber = window.constructor.store.subscribe(function storeSubscription(state, lastAction) {
    window.fetch(apiEndpoint, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: '1',
    })
      .then(function (response) {return response.text(); })
      .then(function (number) {
        var child = document.createElement('div');
        child.innerHTML = lastAction.type + ' -- ' + number + ' times (according to server)';
        container.appendChild(child);
      });
  });

  //return an unsubscribe function to clean up when the extension unmounts
  return subscriber;
}

window.constructor.extensions.register(extensionKey, 'projectDetail', render);
