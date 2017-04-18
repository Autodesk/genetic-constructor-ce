import chai, {expect, assert} from 'chai';
import sinon from 'sinon';
import * as actions from '../../../src/store/undo/actions';
import { undoReducerEnhancerCreator, makePurging, makeUndoable } from '../../../src/store/undo/reducerEnhancer';

describe('Store', () => {
  describe('Undo', () => {
    describe('reducerEnhancer', () => {
      //simple reducer + actions
      const initialState = {counter: 0};
      const increment = (number = 1) => ({ type: 'increment', number });
      const decrement = (number = 1) => ({ type: 'decrement', number });
      const counterReducer = (state = initialState, action) => {
        switch (action.type) {
        case 'increment':
          return {counter: state.counter + action.number};
        case 'decrement':
          return {counter: state.counter - action.number};
        default:
          return state;
        }
      };

      const undoReducerEnhancer = undoReducerEnhancerCreator();
      const undoableCounter = undoReducerEnhancer(counterReducer, 'counter');
      let state = undoableCounter(undefined, {});

      it('accepts a configuration', () => {
        expect(typeof undoReducerEnhancerCreator).to.equal('function');
        expect(undoReducerEnhancerCreator.bind({ config: 'stuff' })).to.not.throw();
        expect(typeof undoReducerEnhancer).to.equal('function');
      });

      it('wraps a reducer, takes a key', () => {
        expect(typeof undoableCounter).to.equal('function');
      });

      it(`doesnt affect the reducer on its own`, () => {
        expect(state).to.eql(initialState);
        state = undoableCounter(state, increment(5));
        expect(state.counter).to.equal(5);
      });

      it(`makes updates when an action has the field 'undoable'`, () => {
        state = undoableCounter(state, makeUndoable(increment(5)));
        state = undoableCounter(state, makeUndoable(increment(10)));
        expect(state.counter).to.equal(20);
      });

      it(`undo action goes back a state`, () => {
        state = undoableCounter(state, actions.undo());
        expect(state.counter).to.equal(10);
      });

      it(`redo action goes forward a step`, () => {
        state = undoableCounter(state, actions.redo());
        expect(state.counter).to.equal(20);
      });

      it('patches present on non-undoable actions', () => {
        state = undoableCounter(state, increment(10));
        expect(state.counter).to.equal(30);
        state = undoableCounter(state, actions.undo());
        expect(state.counter).to.equal(10);
        state = undoableCounter(state, actions.redo());
        expect(state.counter).to.equal(30);
      });

      it('purge() on some actions, marked by undoPurge', () => {
        const starting = state.counter;
        state = undoableCounter(state, makeUndoable(increment(10)));
        expect(state.counter).to.equal(starting + 10);
        state = undoableCounter(state, makePurging(increment(5)));
        expect(state.counter).to.equal(starting + 15);
        state = undoableCounter(state, actions.undo()); //should be impotent
        expect(state.counter).to.equal(starting + 15);
      });

      it('catches undo, redo, transaction, commit actions (doesnt call reducer)', () => {
        const reducerSpy = sinon.spy();
        const undoableSpiedReducer = undoReducerEnhancer(reducerSpy, 'counterAlt');
        expect(reducerSpy.callCount).to.equal(1);
        undoableSpiedReducer(undefined, actions.undo());
        expect(reducerSpy.callCount).to.equal(1);
        undoableSpiedReducer(undefined, {});
        expect(reducerSpy.callCount).to.equal(2);
        undoableSpiedReducer(undefined, actions.redo());
        expect(reducerSpy.callCount).to.equal(2);
        undoableSpiedReducer(undefined, actions.transact());
        expect(reducerSpy.callCount).to.equal(2);
        undoableSpiedReducer(undefined, actions.commit());
        expect(reducerSpy.callCount).to.equal(2);
      });
    });
  });
});
