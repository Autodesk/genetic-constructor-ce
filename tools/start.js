import BrowserSync from 'browser-sync';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import run from './run';
import runServer from './runServer';
import { clientConfig } from './webpack.config';
import setup from './setup';
import colors from 'colors/safe';
//import bundleServer from './bundleServer';
import { debounce } from 'lodash';

const DEBUG = !process.argv.includes('--release');

async function start() {
  try {
    await run(setup);

    console.log(colors.blue('Bundling application with Webpack (this may take a moment)...'));

    //await run(bundleServer);

    await new Promise(resolve => {
      // Patch the client-side bundle configurations
      // to enable Hot Module Replacement (HMR) and React Transform
      [clientConfig].forEach(config => {
        /* eslint-disable no-param-reassign */
        if (Array.isArray(config.entry)) {
          config.entry.unshift('webpack/hot/dev-server', 'webpack-hot-middleware/client');
        } else {
          config.entry = [
            'webpack/hot/dev-server',
            'webpack-hot-middleware/client',
            config.entry,
          ];
        }

        //caching + cache-busting
        //not yet in use. see e.g.: https://github.com/kriasoft/react-starter-kit/blob/master/tools/webpack.config.js
        //config.output.filename = config.output.filename.replace('[chunkhash]', '[hash]');
        //config.output.chunkFilename = config.output.chunkFilename.replace('[chunkhash]', '[hash]');

        config.plugins.push(new webpack.HotModuleReplacementPlugin());
        config.plugins.push(new webpack.NoErrorsPlugin());
        config
          .module
          .loaders
          .filter(x => x.loader === 'babel-loader')
          .forEach(x => (x.query = {
            ...x.query,

            // Wraps all React components into arbitrary transforms
            // https://github.com/gaearon/babel-plugin-react-transform
            plugins: [
              ...(x.query ? x.query.plugins : []),
              ['react-transform', {
                transforms: [
                  {
                    transform: 'react-transform-hmr',
                    imports: ['react'],
                    locals: ['module'],
                  }, {
                    transform: 'react-transform-catch-errors',
                    imports: ['react', 'redbox-react'],
                  },
                ],
              },
              ],
            ],
          }));
        /* eslint-enable no-param-reassign */
      });

      //todo - reloading for server
      //const clientCompiler = webpack([clientConfig, serverConfig]);

      const clientCompiler = webpack(clientConfig);
      const clientDevMiddleware = webpackDevMiddleware(clientCompiler, {
        publicPath: clientConfig.output.publicPath,
        stats: clientConfig.stats.colors,
      });
      const hotMiddleware = webpackHotMiddleware(clientCompiler);

      const debouncedRunServer = debounce(runServer, 100);

      //need to essentially build twice so that browsersync starts with a valid bundle
      //use browsersync and its proxy so that we dont need to explicitly include it in server code, only when debugging...
      //also allows us to watch static assets
      let handleServerBundleComplete = () => {
        console.log('webpack initial build complete');
        console.log('Starting Browser-Sync proxy & injecting Webpack middleware...');

        console.log(colors.blue('Starting server...'));

        runServer((err, host) => {
          if (!err) {
            const bs = BrowserSync.create();

            bs.init({
              // no need to watch *.js, webpack will take care of it for us
              // no need to watch *.css, since imported so webpack will handle
              files: [
                'src/content/**/*.*',
                //todo - webpack server, let webpack handle watching
              ],

              ...(DEBUG ? {} : { notify: false, ui: false }),

              proxy: {
                target: host,
                middleware: [
                  clientDevMiddleware,
                  hotMiddleware,
                ],
              },
            }, resolve);

            //todo - we want ton only recompile once per batch of changes - currently every single file change will trigger a build. Maybe just debounce?
            const ignoreDotFilesAndNestedNodeModules = /([\/\\]\.)|(node_modules\/.*?\/node_modules)/gi;
            const checkSymlinkedNodeModule = /(.*?\/)?extensions\/.*?\/node_modules/;
            const checkIsInServerExtensions = /^server\//;
            const checkTempFile = /temp/gi;
            const ignoreFilePathCheck = (path) => {
              if (ignoreDotFilesAndNestedNodeModules.test(path)) {
                return true;
              }
              //ignore jetbrains temp filesystem
              if (/__jb_/ig.test(path)) {
                return true;
              }
              //ignore compiled python
              if (/\.pyc$/.test(path)) {
                return true;
              }
              //ignore node_modules for things in the root server/extensions/ folder
              //additional check needed to handle symlinked files (nested node modules wont pick this up in symlinks)
              //ugly because javascript doesnt support negative lookaheads
              if (checkSymlinkedNodeModule.test(path) && checkIsInServerExtensions.test(path)) {
                return true;
              }
              if (checkTempFile.test(path)) {
                return true;
              }
            };

            const eventsCareAbout = ['add', 'change', 'unlink', 'addDir', 'unlinkDir'];
            const handleChange = (evt, path, stat) => {
              if (ignoreFilePathCheck(path)) {
                return;
              }
              if (eventsCareAbout.includes(evt)) {
                console.log(colors.yellow('webpack watch:', evt, path));
                debouncedRunServer();
              }
            };

            //while we are not bundling the server, we can set up a watch to recompile on changes
            const watcher = bs.watch('server/**/*', {
              ignored: ignoreFilePathCheck,
            });

            //wait for initial scan to complete then listen for events
            watcher.on('ready', () => watcher.on('all', handleChange));

            //reassign so that we arent creating multiple browsersync entities, or rebuilding over and over
            handleServerBundleComplete = () => {};
          }
        });
      };

      // middleware will initiate the build for us, we dont need to explicit run()
      // if we do, might call handleServerBundleComplete twice (because two calls before browsersync set up)

      clientCompiler.plugin('failed', (err) => {
        console.log(colors.bgRed('Error creating webpack bundle!'));
        throw err;
      });
      clientCompiler.plugin('done', () => handleServerBundleComplete());

      /*
       console.info('beginning webpack build');
       clientCompiler.run((err) => {
       if (err) throw err;
       });
       */
    });
  } catch (err) {
    console.log(colors.bgRed('Error Running Constructor...'));
    throw err;
  }
}

export default start;
