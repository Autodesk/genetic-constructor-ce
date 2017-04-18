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

export default class StoreHistory {
  constructor(initialState) {
    this.reset(initialState);
  }

  //silently set present state, reset future, doesnt affect past
  patch(newState) {
    return Object.assign(this, {
      present: newState,
      future: [],
    });
  }

  //add a new state, updating present, past, future (to empty)
  insert(newState) {
    const { past, present } = this;

    return Object.assign(this, {
      past: [
        ...past,
        present,
      ],
      present: newState,
      future: [],
    });
  }

  //move back one point
  undo() {
    const { past, present, future } = this;

    if (past.length <= 0) {
      console.warn('called undo with no past in history'); //eslint-disable-line no-console
      return this;
    }

    return Object.assign(this, {
      past: past.slice(0, past.length - 1),
      present: past[past.length - 1],
      future: [
        present,
        ...future,
      ],
    });
  }

  //move forward one point
  redo() {
    const { past, present, future } = this;

    if (future.length <= 0) {
      console.warn('called redo with no future in history'); //eslint-disable-line no-console
      return this;
    }

    return Object.assign(this, {
      past: [
        ...past,
        present,
      ],
      present: future[0],
      future: future.slice(1, future.length),
    });
  }

  //this function is not yet tested
  jump(steps) {
    invariant(Number.isNumber(steps) || steps === undefined, 'must pass a number of steps');

    const { past, present, future } = this;

    if (steps === 0) return this;
    if (steps === -1) return this.undo();
    if (steps === 1) return this.redo();

    //todo - check number of steps out

    if (steps < -1) {
      //past
      return Object.asssign({
        past: past.slice(0, steps),
        present: past[steps],
        future: past.slice(steps + 1)
          .concat([present])
          .concat(future),
      });
    }

    //else, future (steps > 1)
    return Object.assign(this, {
      past: past.concat([present])
        .concat(future.slice(0, steps)),
      present: future[steps],
      future: future.slice(steps + 1),
    });
  }

  reset(initialState) {
    const presentState = initialState || this.present;
    return Object.assign(this, {
      past: [],
      present: presentState,
      future: [],
    });
  }
}
