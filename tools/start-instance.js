import run from './run';
import runServer from './runServer';
import setup from './setup';
import bundle from './bundle';

//This is a short term file which is used to build the client, and run the server once. Meant for short-term production use, getting rid of webpack middleware etc., but still running the server in babel-node.

async function startInstance() {
  await run(setup);

  await run(bundle);

  await new Promise(resolve => {
    runServer(() => resolve);
  });
}

export default startInstance;
