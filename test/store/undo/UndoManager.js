import {expect, assert} from 'chai';
import UndoManager from '../../../src/store/undo/UndoManager';
import SectionManager from '../../../src/store/undo/SectionManager';

describe('Store', () => {
  describe('Undo', () => {
    describe('UndoManager', () => {
      const manager = new UndoManager();

      const makeDummyAction = () => ({ type: 'someType', data: false });

      const keyA = 'A';
      const stateA1 = { first: 'A' };
      const stateA2 = { second: 'A' };
      const stateA3 = { third: 'A' };
      const stateA4 = { fourth: 'A' };
      const sectionManagerA = new SectionManager(stateA1);
      manager.register(keyA, sectionManagerA);

      const keyB = 'B';
      const stateB1 = { first: 'B' };
      const stateB2 = { second: 'B' };
      const stateB3 = { third: 'B' };
      const stateB4 = { fourth: 'B' };
      const sectionManagerB = new SectionManager(stateB1);
      manager.register(keyB, sectionManagerB);

      it('patch(key, state, action) updates appropriate section by patching, no affect on past', () => {
        manager.patch(keyA, stateA2, makeDummyAction());
        expect(sectionManagerA.getCurrentState()).to.eql(stateA2);
        expect(sectionManagerA.getPast()).to.eql([]);
        expect(sectionManagerB.getCurrentState()).to.eql(stateB1);
        expect(manager.getLastHistoryItem()).to.eql(null);
      });

      it('insert(key, state, action) updates appropriate section by inserting, adds to past', () => {
        const action = makeDummyAction();
        //STATE - first insert
        manager.insert(keyB, stateB2, action);
        expect(sectionManagerB.getCurrentState()).to.eql(stateB2);
        expect(sectionManagerB.getPast()).to.eql([stateB1]);
        expect(sectionManagerA.getCurrentState()).to.eql(stateA2);
        const lastItem = manager.getLastHistoryItem();
        expect(lastItem.keys[0]).to.equal(keyB);
        expect(lastItem.action).to.equal(action);
      });

      it('insert() updates past by key', () => {
        //STATE - second insert
        manager.insert(keyA, stateA3, makeDummyAction());
        //STATE - third insert
        manager.insert(keyB, stateB3, makeDummyAction());

        expect(sectionManagerA.getPast()).to.eql([stateA2]);
        expect(sectionManagerA.getCurrentState()).to.eql(stateA3);
        expect(sectionManagerB.getPast()).to.eql([stateB1, stateB2]);
        expect(sectionManagerB.getCurrentState()).to.eql(stateB3);

        expect(manager.past.map(item => item.keys[0])).to.eql([keyB, keyA, keyB]);
      });

      it('undo() goes in order by key', () => {
        //STATE - undo
        manager.undo(makeDummyAction());

        expect(manager.past.length).to.equal(2);
        expect(sectionManagerA.getPast()).to.eql([stateA2]);
        expect(sectionManagerA.getCurrentState()).to.eql(stateA3);
        expect(sectionManagerB.getPast()).to.eql([stateB1]);
        expect(sectionManagerB.getCurrentState()).to.eql(stateB2);
        expect(sectionManagerB.getFuture()).to.eql([stateB3]);
      });

      it('undo() only runs once per action', () => {
        //STATE - undo
        const action = makeDummyAction();
        manager.undo(action);

        expect(manager.past.length).to.equal(1);
        expect(sectionManagerA.getPast()).to.eql([]);
        expect(sectionManagerA.getCurrentState()).to.eql(stateA2);
        expect(sectionManagerA.getFuture()).to.eql([stateA3]);
        expect(sectionManagerB.getPast()).to.eql([stateB1]);
        expect(sectionManagerB.getCurrentState()).to.eql(stateB2);
        expect(sectionManagerB.getFuture()).to.eql([stateB3]);

        manager.undo(action);

        //same tests as chunk above
        expect(manager.past.length).to.equal(1);
        expect(sectionManagerA.getPast()).to.eql([]);
        expect(sectionManagerA.getCurrentState()).to.eql(stateA2);
        expect(sectionManagerA.getFuture()).to.eql([stateA3]);
        expect(sectionManagerB.getPast()).to.eql([stateB1]);
        expect(sectionManagerB.getCurrentState()).to.eql(stateB2);
        expect(sectionManagerB.getFuture()).to.eql([stateB3]);
      });

      it('getUndoState() gives number of past and future state across all sections', () => {
        const { past, future } = manager.getUndoState();
        expect(past).to.equal(1);
        expect(future).to.equal(2);
      });

      it('redo()', () => {
        //STATE - redo
        manager.redo(makeDummyAction());

        expect(manager.past.length).to.equal(2);
        expect(sectionManagerA.getPast()).to.eql([stateA2]);
        expect(sectionManagerA.getCurrentState()).to.eql(stateA3);
        expect(sectionManagerB.getPast()).to.eql([stateB1]);
        expect(sectionManagerB.getCurrentState()).to.eql(stateB2);
        expect(sectionManagerB.getFuture()).to.eql([stateB3]);
      });

      it('purge() clears history of all sectionManagers', () => {
        manager.purge(makeDummyAction());
        expect(sectionManagerA.getPast()).to.eql([]);
        expect(sectionManagerA.getCurrentState()).to.eql(stateA3);
        expect(sectionManagerA.getFuture()).to.eql([]);
        expect(sectionManagerB.getPast()).to.eql([]);
        expect(sectionManagerB.getCurrentState()).to.eql(stateB2);
        expect(sectionManagerB.getFuture()).to.eql([]);
      });

      describe('Transactions', () => {
        it('transact() sets all sectionManagers to transacting', () => {
          //init check
          expect(sectionManagerA.inTransaction()).to.equal(false);
          expect(sectionManagerB.inTransaction()).to.equal(false);

          manager.transact(makeDummyAction());
          expect(sectionManagerA.inTransaction()).to.equal(true);
          expect(sectionManagerB.inTransaction()).to.equal(true);
        });

        it('commit() commits all sections', () => {
          //init check
          expect(sectionManagerA.inTransaction()).to.equal(true);
          expect(sectionManagerB.inTransaction()).to.equal(true);

          const pastA = sectionManagerA.getPast();
          const presentA = sectionManagerA.getPresent();
          const futureA = sectionManagerA.getFuture();
          const pastB = sectionManagerB.getPast();
          const presentB = sectionManagerB.getPresent();
          const futureB = sectionManagerB.getFuture();

          manager.patch(keyA, stateA4, makeDummyAction());
          //dont insert anything on patch
          expect(manager.getLastHistoryItem()).to.eql(null);

          manager.insert(keyB, stateB4, makeDummyAction());
          //add this key to the undo keys for the last transaction
          expect(manager.getLastHistoryItem().keys).to.eql([keyB]);

          expect(sectionManagerA.getPast()).to.eql(pastA);
          expect(sectionManagerA.getPresent()).to.eql(presentA);
          expect(sectionManagerA.getCurrentState()).to.eql(stateA4);
          expect(sectionManagerA.getFuture()).to.eql(futureA);
          expect(sectionManagerB.getPast()).to.eql(pastB);
          expect(sectionManagerB.getPresent()).to.eql(presentB);
          expect(sectionManagerB.getCurrentState()).to.eql(stateB4);
          expect(sectionManagerB.getFuture()).to.eql(futureB);

          manager.commit(makeDummyAction());

          expect(sectionManagerA.getPast()).to.eql([...pastA, presentA]);
          expect(sectionManagerA.getPresent()).to.eql(stateA4);
          expect(sectionManagerA.getCurrentState()).to.eql(stateA4);
          expect(sectionManagerA.getFuture()).to.eql([]);
          expect(sectionManagerB.getPast()).to.eql([...pastB, presentB]);
          expect(sectionManagerB.getPresent()).to.eql(stateB4);
          expect(sectionManagerB.getCurrentState()).to.eql(stateB4);
          expect(sectionManagerB.getFuture()).to.eql([]);
          expect(manager.getLastHistoryItem().keys).to.eql([keyB]);

        });

        it('abort() aborts all sections', () => {
          //init check
          expect(sectionManagerA.inTransaction()).to.equal(false);
          expect(sectionManagerB.inTransaction()).to.equal(false);

          manager.transact(makeDummyAction());
          expect(sectionManagerA.inTransaction()).to.equal(true);
          expect(sectionManagerB.inTransaction()).to.equal(true);
          manager.abort(makeDummyAction());
          expect(sectionManagerA.inTransaction()).to.equal(false);
          expect(sectionManagerB.inTransaction()).to.equal(false);
        });
      });
    });
  });
});
