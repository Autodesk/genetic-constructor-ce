function noop() {
  return null;
}

require.extensions['.style'] = noop;
// you can add whatever you wanna handle
require.extensions['.css'] = noop;
require.extensions['.png'] = noop;
// ..etc
