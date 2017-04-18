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
 * @module Selectors_UI
 * @memberOf module:Selectors
 */

/**
 * Check if the inventory is open
 * @function
 * @returns {boolean} true if the inventory is open
 */
export const inventoryIsVisible = () => {
  return (dispatch, getState) => {
    return getState().inventory.isVisible;
  };
};

/**
 * Check if the inspector is open
 * @function
 * @returns {boolean} true if the inspector is open
 */
export const inspectorIsVisible = () => {
  return (dispatch, getState) => {
    return getState().inspector.isVisible;
  };
};

/**
 * Check if the project detail view is open
 * @function
 * @returns {boolean} true if the detail view is open
 */
export const projectDetailViewIsVisible = () => {
  return (dispatch, getState) => {
    return getState().detailView.isVisible;
  };
};
