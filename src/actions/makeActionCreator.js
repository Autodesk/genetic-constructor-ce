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
/**
 * Helper for creating simple actions with known keys
 *
 * @private
 *
 * @param type {ActionType} ActionType
 * @param argNames {...string} argument names
 * @returns {Function} function which takes the arguments defined and creates the corresponding payload
 *
 * @example
 *
 * before:
 *
 *  export function addTodo(text) {
 *    return {
 *      type: 'ADD_TODO',
 *      text
 *    };
 *  }
 *
 * after:
 *
 * export const addTodo = makeActionCreator(ADD_TODO, 'text');
 */
export default function makeActionCreator(type, ...argNames) {
  return function actionAwaitingArgs(...args) {
    const action = {type};
    argNames.forEach((arg, index) => {
      action[argNames[index]] = args[index];
    });
    return action;
  };
}
