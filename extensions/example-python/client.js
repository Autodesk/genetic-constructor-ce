function getComplement(seq) {
  return window.constructor.extensions.api('example-python', '', {
    method: 'POST',
    body: seq,
  })
    .then(function getText(resp) { return resp.text(); });
}

//simple demonstration of a background script, run when downloaded
//getComplement('ACGATTATCGTATCCA').then(function (result) {console.log(result)});

//render function
function render(container, optinons) {
  container.innerHTML = 'example-python extension - loading';

  var lastBlocks = [];

  //register a subscription to the store
  var subscription = window.constructor.store.subscribe(function (state, lastAction) {
    var focusedBlocks = window.constructor.api.focus.focusGetBlocks();

    //simple array comparison
    var isDifferent = lastBlocks.join('') !== focusedBlocks.join('');

    //only run if blocks are in focus, and different than what we had before
    if (focusedBlocks.length > 0 && isDifferent) {
      lastBlocks = focusedBlocks;
      Promise.all(
        focusedBlocks.map(function (blockId) {
          return window.constructor.api.blocks.blockGetSequence(blockId)
            .then(getComplement);
        })
      )
        .then(function (sequences) {
          console.log(sequences);
          return sequences.join('').trim();
        })
        .then(function (sequence) { container.innerHTML = sequence; });
    }
  });

  //return it to unregister when we break down component
  return subscription;
}

//register with Constructor
window.constructor.extensions.register('example-python', 'projectDetail', render);
