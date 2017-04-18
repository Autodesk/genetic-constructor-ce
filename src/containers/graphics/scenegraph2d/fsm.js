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
export default class FiniteStateMachine {

  constructor(fsm) {
    // we should at least one a basic FSM definition with an array of states and an initial state.
    invariant(fsm, 'expected an fsm/graph definition');
    invariant(Array.isArray(fsm.states) && fsm.states.length > 0, 'expect an array of states');

    // saved the FSM and set the initial state
    this.fsm = fsm;
    this.state = this.fsm.states[0];

    // we assume the initial state can always be entered but we do call its entryMethod regardless
    // although the from state is not specified.
    if (this.state.entryMethod) {
      this.state.entryMethod(this.state, null);
    }
  }

  /**
   * transition to the named state. Optional exit and entry conditions must be met.
   * @param  {String} toStateName
   */
  transition(toStateName) {
    // the next state name MUST match one of the current states transitions
    invariant(this.canTransition(toStateName), 'there is no transition to that state');

    // location the new state
    const newState = this.fsm.states.find(state => toStateName);
    invariant(newState, 'no definition for that state');

    // exit the old state
    if (this.state.exitMethod) {
      this.state.exitMethod(this.state, toStateName);
    }
    // entry the new state
    const oldStateName = this.state.name;
    this.state = newState;
    if (this.state.entryMethod) {
      this.state.enterMethod(this.state, oldStateName);
    }
  }

  /**
   * return true if a transition from the current state to the named state is permitted
   * @param  {String} toStateName
   * @return {Boolean}
   */
  canTransition(toStateName) {
    // states don't have to have a transitions i.e. they are terminal states.
    if (!this.state.transitions) {
      return false;
    }
    const states = this.state.transitions.split('/');
    return states.indexOf(toStateName) >= 0;
  }
}

/*
  Example data structure to initialize the FSM with
  const FSM = {
    states: [
        {
          name: "A",
          enterMethod: "function(object: state, string: from state)",
          exitMethod: "function(object: state, string: to state)",
          transitions: "B/C"
        }, {
          name: "B",
          transitions: [
              to: "C",
            ]
        }, {

        }
    ]
  }
 */
