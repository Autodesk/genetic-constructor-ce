import { jsdom } from 'jsdom';
import rimraf from 'rimraf';

//FILE SYSTEM SETUP

rimraf.sync('server/auth/temp.config.json');

//DOM SETUP

global.document = jsdom('<!doctype html><html><body></body></html>', {
  cookie: 'blah=demoCookie',
});
global.window = document.defaultView;
global.navigator = global.window.navigator;
window.console = global.console;

//hack - for history/lib/DOMStateStorage
global.localStorage = global.sessionStorage = window.localStorage = window.sessionStorage = {
  getItem: function getItem(key) {
    return this[key];
  },
  setItem: function setItem(key, value) {
    this[key] = value;
  },
};
