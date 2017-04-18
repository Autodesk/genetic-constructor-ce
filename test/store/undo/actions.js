import { assert, expect } from 'chai';
import * as actions from '../../../src/store/undo/actions';
import * as ActionTypes from '../../../src/store/undo/ActionTypes';

describe('Store', () => {
  describe('Undo', () => {
    describe('Actions', () => {
      const expectedActions = ['undo', 'redo', 'jump', 'transact', 'commit', 'abort'];

      it('should have the expected actions', () => {
        expect(Object.keys(actions).length).to.equal(expectedActions.length);
        assert(expectedActions.every(name => {
          return actions[name] && actions[name]().type;
        }), 'expected action was missing');
      });

      it('should have ActionType constant as type', () => {
        const actionTypeList = Object.keys(ActionTypes).map(key => ActionTypes[key]);

        assert(expectedActions.every(name => {
          const actionObject = actions[name]();
          const actionType = actionObject.type;
          const ind = actionTypeList.findIndex(el => el === actionType);
          actionTypeList.splice(ind, 1);
          return ind >= 0;
        }), 'wrong type found / type missing / overlap');
      });
    });
  });
});
