import webpack from 'webpack';
import { serverConfig } from './webpack.config';

//Creates application bundles from the source files.
function bundleServer() {
  console.log('Bundling server...');

  return new Promise((resolve, reject) => {
    webpack(serverConfig).run((err, stats) => {
      if (err) {
        return reject(err);
      }

      console.log(stats.toString(serverConfig.stats));
      return resolve();
    });
  });
}

export default bundleServer;
