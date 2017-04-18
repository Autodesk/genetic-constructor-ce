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
import autosaveCreator from './autosaveCreator';
import * as ActionTypes from '../../constants/ActionTypes';
import { LOCATION_CHANGE } from 'react-router-redux';

const purgeEvents = [
  //ActionTypes.PROJECT_SAVE, //dont purge on this, since call it on save, will never throttle
  ActionTypes.PROJECT_SNAPSHOT,
  LOCATION_CHANGE, //we handle saving in projectOpen, which changes the route, so purge when the route changes
];

const simulateEvents = [
  ActionTypes.PROJECT_SAVE,
  ActionTypes.PROJECT_SNAPSHOT,
  LOCATION_CHANGE,
];

const autosave = autosaveCreator({
  //filter to undoable actions, which basically are the ones that are state changes (undoable reducer relies on these)
  filter: (action, alreadyDirty, nextState, lastState) => !!action.undoable,

  //no longer need to autosave when route changes, since projectOpen does this
  //however, if change route with something other than projectOpen then should re-enable
  //
  //want this to run prior to route change -- note if have other middleware to prune store
  //only run if this reducer was updated so compare states
  //if dont compare states, will likely trigger on all route changes (including init, which will not find window.constructor.api
  //forceOn: ({ type }, alreadyDirty) => {
  //  return type === LOCATION_CHANGE && alreadyDirty;
  //},

  //this is pretty hack, but want to rely on action to do this (and actions have a dependency on the store, so cant import directly or create circular dependency. just need to be sure this doesnt run until after everything has been set up...
  onSave: () => {
    if (process.env.NODE_ENV === 'test') {
      return null;
    }
    return window.constructor.api.projects.projectSave();
  },

  purgeOn: ({ type }, alreadyDirty, nextState, lastState) => {
    return purgeEvents.some(eventType => eventType === type);
  },

  simulateOn: ({ type }, alreadyDirty) => {
    return simulateEvents.some(eventType => eventType === type);
  },
});

export default autosave;
