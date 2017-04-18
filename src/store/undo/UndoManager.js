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
import invariant from 'invariant';
import TransactionManager from './SectionManager';

export default class UndoManager {
  constructor(config = {}) {
    this.slaves = {};

    //dont want a storeHistory because no present necessary
    this.past = [];
    this.future = [];

    this.lastAction = null;

    this.transactionDepth = 0;
    this.transactionAtStart = false; //when start a transaction, need to save history item for the first change made, then just update keys list on subsequent
  }

  register(key, transactionManager) {
    invariant(transactionManager instanceof TransactionManager, 'must pass TransactionManager');
    Object.assign(this.slaves, { [key]: transactionManager });
  }

  getUndoState() {
    const lastItem = this.getLastHistoryItem();
    return {
      past: this.past.length,
      future: this.future.length,
      time: lastItem ? lastItem.time : +(new Date()),
    };
  }

  assignLastAction(action) {
    this.lastAction = action;
  }

  doOnce = (action, func) => {
    if (action === this.lastAction) return;
    this.assignLastAction(action);
    func();
  };

  addHistoryItem(key, action) {
    if (this.inTransaction()) {
      //if at start, just continue and make payloa as normal
      if (this.transactionAtStart === true) {
        this.transactionAtStart = false;
      } else {
        //if not at start, add key if its different
        const lastItem = this.past.pop();
        const newKeys = [...new Set(lastItem.keys.concat(key))];
        Object.assign(lastItem, { keys: newKeys });
        this.past.push(lastItem);
        return;
      }
    }

    const payload = {
      keys: [key],
      action,
      time: +(new Date()),
    };
    this.past.push(payload);

    //purge the history once you make an insertion (like StoreHistory)
    this.future.length = 0;
  }

  getLastHistoryItem() {
    const pastLength = this.past.length;
    return pastLength ? this.past[pastLength - 1] : null;
  }

  getFirstFutureItem() {
    return this.future.length ? this.future[0] : null;
  }

  insert = (key, state, action) => this.doOnce(action, () => {
    this.addHistoryItem(key, action);
    this.slaves[key].insert(state, action);
  });

  patch = (key, state, action) => this.doOnce(action, () => {
    this.slaves[key].patch(state, action);
  });

  //don't wrap in doOnce, so don't block patch() and insert()
  purge = (action) => {
    //reset past and future
    this.past.length = 0;
    this.future.length = 0;

    //clean up slaves (not technically necessary, but for GC)
    Object.keys(this.slaves).forEach(key => this.slaves[key].purge());
  };

  undo = (action) => this.doOnce(action, () => {
    const lastItem = this.getLastHistoryItem();
    if (lastItem) {
      lastItem.keys.forEach(key => this.slaves[key].undo());
      this.future.unshift(this.past.pop());
    }
  });

  redo = (action) => this.doOnce(action, () => {
    const nextItem = this.getFirstFutureItem();
    if (nextItem) {
      nextItem.keys.forEach(key => this.slaves[key].redo());
      this.past.push(this.future.shift());
    }
  });

  jump = (number, action) => this.doOnce(action, () => {
    invariant(false, 'jump not yet implemented');
  });

  //transactions are just delegated to section reducers to handle

  transact = (action) => this.doOnce(action, () => {
    this.transactionDepth++;
    this.transactionAtStart = true;
    Object.keys(this.slaves).forEach(key => this.slaves[key].transact(action));
  });

  commit = (action) => this.doOnce(action, () => {
    invariant(this.transactionDepth > 0, 'cant commit outside of a transaction!');
    this.transactionDepth--;
    Object.keys(this.slaves).forEach(key => this.slaves[key].commit(action));
  });

  abort = (action) => this.doOnce(action, () => {
    invariant(this.transactionDepth > 0, 'cant abort outside of a transaction!');
    this.transactionDepth--;
    Object.keys(this.slaves).forEach(key => this.slaves[key].abort(action));
  });

  inTransaction = () => (this.transactionDepth > 0);
}
