/*
 Copyright 2016 Autodesk,Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
import StoreHistory from './storeHistory';
import debug from 'debug';

const logger = debug('constructor:store:undo');

export default class SectionManager {
  constructor(initialState, config = {}) {
    this.history = new StoreHistory(initialState);

    this.transactionDepth = 0;
    this.transactionState = null;
    this.transactionFailure = false;

    this.debug = config.debug;
  }

  getCurrentState = () => {
    return (!!this.transactionState) ?
      this.transactionState :
      this.history.present;
  };

  getPresent = () => this.history.present;
  getPast = () => this.history.past;
  getFuture = () => this.history.future;

  setTransactionState = (state, resetDepth = false) => {
    this.transactionFailure = false;
    this.transactionState = state;
    if (resetDepth === true) {
      this.transactionDepth = 0;
    }
    return this.transactionState;
  };

  //todo - verify behavior of patching then inserting... currently, does not create a node
  patch = (state, action = {}) => {
    logger(`SectionManager: patching (not undoable)`, action.type);

    if (this.transactionDepth > 0) {
      return this.setTransactionState(state);
    }

    this.history.patch(state);
    return this.getCurrentState();
  };

  insert = (state, action = {}) => {
    //if same state, ignore it
    if (state === this.getPresent()) {
      return state;
    }

    if (this.transactionDepth > 0) {
      logger('SectionManager insert(): updating transaction state' + (this.transactionDepth > 0 ? ' (in transaction)' : ''), action.type);

      return this.setTransactionState(state);
    }

    logger('SectionManager: insert() updating state' + (this.transactionDepth > 0 ? ' (in transaction)' : ''), action.type);

    this.history.insert(state);

    return this.getCurrentState();
  };

  undo = () => {
    logger(`SectionManager: undo()`);

    this.history.undo();
    this.setTransactionState(null, true);
    return this.getCurrentState();
  };

  redo = () => {
    logger(`SectionManager: redo()`);

    this.history.redo();
    this.setTransactionState(null, true);
    return this.getCurrentState();
  };

  jump = (number) => {
    logger(`SectionManager: jump()`);

    this.history.jump(number);
    this.setTransactionState(null, true);
    return this.getCurrentState();
  };

  //doesnt affect transactions, just clear the history
  purge = () => {
    this.history.reset(this.getCurrentState());
  };

  transact = (action) => {
    this.transactionDepth++;

    logger(`SectionManager: Beginning Transaction (depth = ${this.transactionDepth})`);

    //use current state (opposed to present) in case in a Transaction
    this.setTransactionState(this.getCurrentState());

    return this.getCurrentState();
  };

  commit = (action) => {
    if (!this.transactionDepth > 0) {
      logger('commit() called outside transaction');
      return this.getCurrentState();
    }

    this.transactionDepth--;

    logger('SectionManager: commit() ' +
      (this.transactionFailure ? 'failed (aborted).' : 'committing...') +
      (this.transactionDepth === 0 ? 'all transactions complete' : 'nested transaction'));

    if (this.transactionDepth === 0) {
      if (!this.transactionFailure) {
        this.insert(this.transactionState, action);
      }
      this.setTransactionState(null);
    }

    return this.getCurrentState();
  };

  abort = (action) => {
    if (!this.transactionDepth > 0) {
      logger('abort() called outside transaction');
      return this.getCurrentState();
    }

    if (this.transactionDepth > 1) {
      logger('SectionManager will handle nested transactions with depth greater than one by reverting to the state at start of all transactions, when all of the transactions abort / commit. Currently still in nested transations');
    }

    this.transactionFailure = true;
    this.transactionDepth--;

    logger('SectionManager: aborting transaction. ' +
      (this.transactionDepth === 0 ? 'all transactions complete' : 'nested transaction'));

    if (this.transactionDepth === 0) {
      this.setTransactionState(null);
    }

    return this.getPresent();
  };

  inTransaction = () => (this.transactionDepth > 0);
}
