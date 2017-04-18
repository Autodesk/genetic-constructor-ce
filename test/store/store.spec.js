import { assert, expect } from 'chai';
import store from '../../src/store/index';

describe('Store', () => {
  describe('Frozen', () => {
    it('should be frozen', () => {
      const state = store.getState();
      expect(function attemptChangeState() {
        Object.assign(state, {some: 'object'});
      }).to.throw(/object is not extensible/);
    });
  });
});
