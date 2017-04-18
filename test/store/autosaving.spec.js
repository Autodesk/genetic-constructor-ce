import { assert, expect } from 'chai';
import sinon from 'sinon';
import autosaveCreator from '../../src/store/autosave/autosaveCreator';

describe('Store', () => {
  describe('Autosaving', () => {
    //simple reducer + actions
    const initialState = { counter: 0 };
    const increment = (number = 1) => ({ type: 'increment', number });
    const decrement = (number = 1) => ({ type: 'decrement', number });
    const counterReducer = (state = initialState, action) => {
      switch (action.type) {
      case 'increment':
        return { counter: state.counter + action.number };
      case 'decrement':
        return { counter: state.counter - action.number };
      default:
        return state;
      }
    };

    const throttleTime = 30;
    const waitTime = 12;
    assert(throttleTime > waitTime * 2, 'wait time must be less than throttle time');

    const saveSpy = sinon.spy();
    const forceSaveActionType = 'FORCE_SAVE';
    const autosaving = autosaveCreator({
      time: throttleTime,
      wait: waitTime,
      onSave: saveSpy,
      forceSaveActionType,
    });

    const {
      autosaveReducerEnhancer,
      isDirty,
    } = autosaving;

    const savingCounter = autosaveReducerEnhancer(counterReducer);
    let state = savingCounter(undefined, {});

    it('accepts a configuration, requiring onSave, returns object', () => {
      const validConfig = { onSave: () => {} };
      expect(typeof autosaveCreator).to.equal('function');
      expect(autosaveCreator.bind(null, { config: 'stuff' })).to.throw();
      expect(autosaveCreator.bind(null, validConfig)).to.not.throw();
      const autosavingObject = autosaveCreator(validConfig);
      expect(typeof autosavingObject).to.equal('object');
      expect(typeof autosavingObject.autosaveReducerEnhancer).to.equal('function');
    });

    it('doesnt call save on initial state', () => {
      expect(saveSpy.called).to.equal(false);
    });

    it('allows force saving action type', (done) => {
      const callCount = saveSpy.callCount;
      state = savingCounter(state, {
        type: forceSaveActionType,
      });
      expect(saveSpy.callCount).to.equal(callCount + 1);

      setTimeout(done, throttleTime); //make sure throttle ends
    });

    it('only saves when state changes', (done) => {
      const callCount = saveSpy.callCount;

      state = savingCounter(state, { type: 'bogus' });
      expect(saveSpy.callCount).to.equal(callCount);

      state = savingCounter(state, increment(1));

      setTimeout(() => {
        expect(saveSpy.callCount).to.equal(callCount + 1);

        setTimeout(done, throttleTime); //make sure throttle ends
      }, waitTime + 3);
    });

    it('marks dirty when in between throttles', (done) => {
      const callCount = saveSpy.callCount;
      assert(!isDirty(), 'wrong dirty state');

      //doesnt trigger save
      state = savingCounter(state, { type: 'bogus' });
      assert(!isDirty(), 'wrong dirty state');
      expect(saveSpy.callCount).to.equal(callCount);

      //triggers first save
      state = savingCounter(state, increment(1));
      assert(isDirty(), 'mark dirty until debounced save starts');

      //timeout for debounce, wait for first save
      setTimeout(() => {
        assert(!isDirty(), 'not dirty after first save');
        expect(saveSpy.callCount).to.equal(callCount + 1);

        //marks dirty, waits to call until throttle done
        state = savingCounter(state, increment(1));
        assert(isDirty(), 'shuold be dirty while in throttle');
        expect(saveSpy.callCount).to.equal(callCount + 1);

        setTimeout(() => {
          assert(!isDirty(), 'not dirty after throttle over');
          expect(saveSpy.callCount).to.equal(callCount + 2);
          done();
        }, throttleTime + 3);
      }, waitTime + 3);
    });

    it('doesnt block state changes for saves', () => {
      state = savingCounter(initialState, increment(1));
      state = savingCounter(state, increment(1));
      state = savingCounter(state, increment(1));
      state = savingCounter(state, increment(1));
      state = savingCounter(state, increment(1));
      expect(state.counter).to.equal(5);
    });

    it('coordinates across multiple reducers', (done) => {
      const coordinatingSpy = sinon.spy();
      const savingTime = 50;
      const waitingTime = 20;
      const autosave = autosaveCreator({
        onSave: coordinatingSpy,
        time: savingTime,
        wait: waitingTime,
      });
      const counterOne = (state = { one: 0 }, action) => {
        switch (action.type) {
        case 'increment':
          return { one: state.one + action.number };
        case 'decrement':
          return { one: state.one - action.number };
        default:
          return state;
        }
      };
      const counterTwo = (state = { two: 0 }, action) => {
        switch (action.type) {
        case 'increment':
          return { two: state.two + action.number };
        case 'decrement':
          return { two: state.two - action.number };
        default:
          return state;
        }
      };

      const savingOne = autosave.autosaveReducerEnhancer(counterOne);
      const savingTwo = autosave.autosaveReducerEnhancer(counterTwo);

      let stateOne = savingOne(undefined, {});
      let stateTwo = savingTwo(undefined, {});

      expect(coordinatingSpy.callCount).to.equal(0);

      stateOne = savingOne(stateOne, increment(1));
      assert(autosave.isDirty(), 'dirty prior to debounced save initiated');

      setTimeout(() => {
        expect(coordinatingSpy.callCount).to.equal(1);
        assert(!autosave.isDirty(), 'not after first save');

        stateOne = savingOne(stateOne, increment(1));
        assert(autosave.isDirty(), 'dirty while waiting');
        expect(coordinatingSpy.callCount).to.equal(1);
        expect(stateOne.one).to.equal(2);

        stateTwo = savingTwo(stateTwo, increment(1));
        assert(autosave.isDirty(), 'dirty while waiting');
        expect(coordinatingSpy.callCount).to.equal(1);
        expect(stateTwo.two).to.equal(1);

        setTimeout(() => {
          assert(!autosave.isDirty(), 'not dirty after throttle');
          expect(coordinatingSpy.callCount).to.equal(2);
          done();
        }, savingTime + 3);
      }, waitingTime + 3);
    });
  });
});
