import register from './register';
import { isRegistered, onRegister, validRegion } from './clientRegistry';
import { callExtensionApi as api } from '../middleware/extensions';
import { dispatch } from '../store/index';
import { projectFileWrite as write } from '../actions/projects';
import { projectFileRead as read, projectFileList as list } from '../selectors/projects';

/**
 * `window.constructor.extensions`
 *
 * API Section for extensions
 * @module extensions
 * @memberOf module:constructor
 */
export default {
  register,
  api,
  files: {
    read: (...args) => dispatch(read(...args)),
    write: (...args) => dispatch(write(...args)),
    list: (...args) => dispatch(list(...args)),
  },
  isRegistered,
  onRegister,
  validRegion,
};
