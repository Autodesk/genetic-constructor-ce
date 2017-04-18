import chai from 'chai';
import * as extensionsApi from '../../src/middleware/extensions';
import { validateManifest } from '../../server/extensions/manifestUtils';
const { assert } = chai;

describe('Middleware', () => {
  describe('Extensions', () => {
    it('getExtensionsInfo() should be able get extension manifests', () => {
      return extensionsApi.getExtensionsInfo()
        .then(output => {
          assert(typeof output === 'object', 'wrong format for info');
          assert(Object.keys(output).every(key => {
            const manifest = output[key];
            try {
              validateManifest(manifest);
              return true;
            } catch (err) {
              console.log(key, err);
              return false;
            }
          }), 'some extensions are not in correct format');
        });
    });
  });
});

