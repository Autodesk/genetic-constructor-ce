import { expect } from 'chai';
import StoreHistory from '../../../src/store/undo/storeHistory';

describe('Store', () => {
  describe('Undo', () => {
    describe('storeHistory', () => {
      const initialState = { my: 'state' };
      const stateA = { my: 'milkshake' };
      const stateB = { brings: 'all the boys' };
      const stateC = { to: 'the yard' };
      const stateD = { and: 'theyre like' };
      const history = new StoreHistory(initialState);

      it('should create history with initialState as present, and arrays past and future', () => {
        expect(history.present).to.eql(initialState);
        expect(history.past).to.eql([]);
        expect(history.future).to.eql([]);
      });

      it('should have undo(), redo(), update(), patch()', () => {
        expect(typeof history.undo).to.equal('function');
        expect(typeof history.redo).to.equal('function');
        expect(typeof history.insert).to.equal('function');
        expect(typeof history.patch).to.equal('function');
      });

      it('undo() does nothing when there is no past, no error', () => {
        history.undo();
        expect(history.present).to.equal(initialState);
      });

      it('insert() creates new present, moves present to past', () => {
        history.insert(stateA);
        expect(history.present).to.eql(stateA);
        expect(history.past).to.eql([initialState]);
      });

      it('insert() works again', () => {
        history.insert(stateB);
        expect(history.past).to.eql([initialState, stateA]);
        expect(history.present).to.eql(stateB);
      });

      it('should maintain object references', () => {
        expect(history.present).to.equal(stateB);
      });

      it('undo() goes back a step', () => {
        expect(history.present).to.equal(stateB);
        history.undo();
        expect(history.present).to.equal(stateA);
        expect(history.past).to.eql([initialState]);
        expect(history.future).to.eql([stateB]);
      });

      it('redo() goes forward a step', () => {
        expect(history.future).to.eql([stateB]);
        history.redo();
        expect(history.present).to.eql(stateB);
        expect(history.future).to.eql([]);
        expect(history.past).to.eql([initialState, stateA]);
      });

      it('redo() does nothing when there is no future, no error', () => {
        history.redo();
        expect(history.present).to.equal(stateB);
      });

      it('insert() deletes the future', () => {
        history.future = [{ some: 'things' }, { in: 'the future' }];
        history.insert(stateC);
        expect(history.future).to.eql([]);
      });

      it('patch() updates the present state, deletes future, past unaffected', () => {
        const oldPast = history.past.slice();
        history.future = [{ some: 'things' }, { in: 'the future' }];
        history.patch(stateD);
        expect(history.past).to.eql(oldPast);
        expect(history.present).to.eql(stateD);
        expect(history.future).to.eql([]);
      });
    });
  });
});
