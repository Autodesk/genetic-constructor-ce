import {expect, assert} from 'chai';
import SectionManager from '../../../src/store/undo/SectionManager';

describe('Store', () => {
  describe('Undo', () => {
    describe('SectionManager', () => {
      const initialState = { state: 'value' };
      const stateA = { state: 'A' };
      const stateB = { state: 'B', newVal: 'B' };
      const stateC = { state: 'C' };

      const manager = new SectionManager(initialState);

      it('constructor() creates initial state for present', () => {
        const present = manager.getPresent();
        expect(present).to.eql(initialState);
        expect(manager.getPast()).to.eql([]);
        expect(manager.getFuture()).to.eql([]);
        expect(manager.inTransaction()).to.equal(false);
      });

      it('patch() updates present, no nodes created', () => {
        manager.patch(stateA);
        expect(manager.getPresent()).to.eql(stateA);
        expect(manager.getPast()).to.eql([]);
      });

      it('getCurrentState() returns present state (not in a transaction)', () => {
        expect(manager.getCurrentState()).to.eql(stateA);
        expect(manager.getCurrentState()).to.eql(manager.getPresent());
      });

      it('insert() creates a history node', () => {
        manager.insert(stateB);
        expect(manager.getPresent()).to.eql(stateB);
        expect(manager.getPast()).to.eql([stateA]);
      });

      it('insert() ignores identical state to present', () => {
        manager.insert(stateB);
        expect(manager.getPresent()).to.eql(stateB);
        expect(manager.getPast()).to.eql([stateA]);
      });

      it('undo() goes back a step, updates present + future', () => {
        manager.undo();
        expect(manager.getPast()).to.eql([]);
        expect(manager.getPresent()).to.eql(stateA);
        expect(manager.getFuture()).to.eql([stateB]);
      });

      it('redo() goes forward a step, updates present + past', () => {
        manager.redo();
        expect(manager.getPast()).to.eql([stateA]);
        expect(manager.getPresent()).to.eql(stateB);
        expect(manager.getFuture()).to.eql([]);
      });

      describe('Transactions', () => {
        let preState; //dont set until this block runs
        const txnStateAlt = { state: 'txn alt' };
        const txnState = { state: 'transacting' };

        it('transact() starts a transaction, doesnt change current state', () => {
          preState = manager.getCurrentState();
          expect(manager.inTransaction()).to.equal(false);
          manager.transact();
          expect(manager.inTransaction()).to.equal(true);
          expect(manager.getPresent()).to.eql(preState);
          expect(manager.getCurrentState()).to.eql(preState);
        });

        it('patch() updates transactionState, not present', () => {
          expect(manager.inTransaction()).to.equal(true);
          manager.patch(txnStateAlt);
          expect(manager.inTransaction()).to.equal(true);
          expect(manager.getPresent()).to.eql(preState);
          expect(manager.getCurrentState()).to.eql(txnStateAlt);
        });

        it('insert() updates transactionState, not present', () => {
          manager.insert(txnState);
          expect(manager.inTransaction()).to.equal(true);
          expect(manager.getPresent()).to.eql(preState);
          expect(manager.getCurrentState()).to.eql(txnState);
        });

        it('commit() sets present to transaction state', () => {
          manager.commit();
          expect(manager.inTransaction()).to.equal(false);
          expect(manager.getPresent()).to.eql(txnState);
          expect(manager.getCurrentState()).to.eql(manager.getPresent());
          expect(manager.getPast().slice().pop()).to.eql(preState);
        });

        it('commit() does nothing when no changes in transaction, maintains reference', () => {
          const beforeState = manager.getPresent();
          manager.transact();
          manager.commit();
          expect(manager.getPresent()).to.equal(beforeState);
        });

        it('abort() leaves the present state, ends transaction', () => {
          const beforeState = manager.getCurrentState();
          const beforePastLength = manager.getPast().length;
          manager.transact();
          manager.patch(txnStateAlt);
          expect(manager.getCurrentState()).to.eql(txnStateAlt);
          manager.abort();
          expect(manager.inTransaction()).to.equal(false);
          expect(manager.getCurrentState()).to.eql(beforeState);
          expect(manager.getCurrentState()).to.eql(manager.getPresent());
          expect(manager.getPast().length).to.eql(beforePastLength);
        });

        it('supports nested transactions, only commit when all succeed', () => {
          expect(manager.inTransaction()).to.equal(false);
          manager.transact();
          expect(manager.inTransaction()).to.equal(true);
          manager.transact();
          expect(manager.inTransaction()).to.equal(true);
          manager.commit();
          expect(manager.inTransaction()).to.equal(true);
          manager.commit();
          expect(manager.inTransaction()).to.equal(false);
        });

        it('nested transactions only succeed when no aborts', () => {
          expect(manager.inTransaction()).to.equal(false);

          const beforeState = manager.getPresent();
          const tempState = { state: 'temp' };

          manager.transact();
          expect(manager.inTransaction()).to.equal(true);
          manager.transact();
          expect(manager.inTransaction()).to.equal(true);
          manager.patch(tempState);
          manager.commit();
          expect(manager.inTransaction()).to.equal(true);
          manager.abort();
          expect(manager.inTransaction()).to.equal(false);
          expect(manager.getCurrentState()).to.eql(beforeState);
          expect(manager.getCurrentState()).to.eql(manager.getPresent());
        });

        it('commit() outside transaction is idempotent', () => {
          expect(manager.commit).to.not.throw();
        });

        it('undo() in transaction ends transaction', () => {
          expect(manager.inTransaction()).to.equal(false);
          manager.transact();
          expect(manager.inTransaction()).to.equal(true);
          manager.undo();
          expect(manager.inTransaction()).to.equal(false);
          manager.commit();
          expect(manager.inTransaction()).to.equal(false);
        });
      });
    });
  });
});
