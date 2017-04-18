function format(time) {
  return time.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
}

// if you want more colors, npm install colors
function magentaLog(msg) {
  console.log(`\x1b[35m${msg}\x1b[0m`);
}
function greenLog(msg) {
  console.log(`\x1b[32m${msg}\x1b[0m`);
}
function redLog(msg) {
  console.log(`\x1b[31m${msg}\x1b[0m`);
}

function run(fn, options) {
  const task = typeof fn.default === 'undefined' ? fn : fn.default;
  const start = new Date();

  magentaLog(`[${format(start)}] Starting '${task.name}${options ? `(${options})` : ''}'...`);

  return task(options).then(result => {
    const end = new Date();
    const time = end.getTime() - start.getTime();

    greenLog(`[${format(end)}] Finished '${task.name}${options ? `(${options})` : ''}' after ${time} ms`);

    return result;
  })
    .catch(err => {
      redLog(`Error running task: ${task.name}`);
      redLog(err.stack);
      throw err;
    });
}

//e.g. babel-node tools/run script
if (process.mainModule.children.length === 0 && process.argv.length > 2) {
  delete require.cache[__filename];
  const theScript = require(`./${process.argv[2]}.js`);

  run(theScript)
    .catch(err => {
      console.error(err);
      console.error(err.stack);
      process.exit(1);
    });
}

export default run;
