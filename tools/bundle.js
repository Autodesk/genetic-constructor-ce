import webpack from 'webpack';
import { clientConfig } from './webpack.config';

//Creates application bundles from the source files.
function bundle() {
  console.log('Bundling client...');

  return new Promise((resolve, reject) => {
    webpack(clientConfig).run((err, stats) => {
      if (err) {
        return reject(err);
      }

      console.log(stats.toString(clientConfig.stats));
      return resolve();
    });
  });
}

export default bundle;
