## Overview

State management which supports undo/redo and transactions with minimal buy-in, especially to consumers of actions.

Builds on top of Redux, primarily as a "reducer enhancer" with support for some actions (undo, redo)

### Goals

- Support transactions
- Per-action granularity, not limited to each reducer
- do not track UI state, just sections of store corresponding to application data
- Little memory increase
- Useful debug messages

## Implementation

Sections of the store are wrapped in a reducerEnhancer, which creates a SectionManager (one for each section). The enhancer does not change the shape of state.
 
SectionManagers register with an UndoManager singleton.

The enhancer uses the reducer for calculating next states when appropriate, but handles undo state management on its own and avoids the reducer when such an action is passed. 

Past, present, future steps are tracked by the SectionManager for each section. These are flattened and controlled by the UndoManager for the whole store, so that subsequent undos delegate between sections properly.

### reducerEnhancerCreator

Primary entry point, which can be configured. See fields in reducerEnhancer.js

### UndoManager

Does the actual state management, is called by the reducer. Cannot be called directly, use actions instead. Delegates changing of state to SectionManagers, is mostly responsible for orchestrating between the sections.

While JSON.stringify() would allow for nice string equality checks, we are using immutables and would lose our ability to reference equality check.

### SectionManager

Handles each section of the store. 

##### API

```
//state tracking
insert(state) - add state node if (state !=== newState) and subject to transactions, clears future steps, returns new state.
patch(state) - updates present state, does not add state node

//transactions (called directly)
transact() - begin a transaction (increment counter, so nesting handled)
commit(full = false) - commit a transaction, all transactions if `full === true`, return new state (throw error if not in transaction)
abort() - abort a transaction, return prior state (throw error if not in transaction)
inTransaction() - true/false, if in transaction

//state movement (are exposed as actions) 
undo() - return state after going back one step, throw if no past 
redo() - return state after going forward one step, throw if no future
jump(number = 0) - jump # of steps in past (-) or future (+), throw if # not present

//utils
getPast() - return past states
getFuture() - return future states
```

### Actions

Actions can have an additional field `undoable`, which, when true, will `insert()` into the `UndoManager`.

Actions may also have a field `undoPurge` which will purge all undo states, e.g. on a route change or user login.

```
{
    type <const>
    undoable <boolean>
    undoPurge <boolean>
    ...rest <payload>
}
```

### Reducer Enhancer

Catches all events, and saves them to the undoManager as appropriate:

```
P = patch()
I = insert()
N = undo()
R = redo()
T = transact()
C = commit()
                    I  P  T  I   I P   C  P  I
                          |            |
                  --1--2--|--3---4-5---|--6--7----
undoable actions: --*-----|--*---*-----|-----*----
 history.present:   1  2  2  2   2 2   5  6  7
transactionState:   -  -  2  3   4 5   -  -  -
transactionDepth:   0  0  1  1   1 1   0  0  0
```

##### config

Object with the following keys:

```
filter {function} - passed the action, function to track whether should be added to undo, returning true is yes
debug {boolean}
stateKey {String}           //todo - determine whether doing this
```

### undo reducer

You can add a reducer to track undo state to the store

```js
import { undoReducer } from ...
import * as reducers from ...

//combineReducers({
  undo: undoReducer,
  ...reducers
});

//in your store:
undo: {
    past: #,
    future: #,
    time: <date store was updated>
}
```

###Todo

- todo - save the actions (2D array to handle transactions?)
- support limit of states to track
- pruning the store of unneeded blocks / projects