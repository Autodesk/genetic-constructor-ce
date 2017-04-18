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
 * ActionTypes module defines constants for every action (i.e. data manipulation) in the application API
 *
 * Read the source code to see all action types.
 *
 * This object is exported on the Genetic Constructor global object. It is recommended you specify event types dynamically using that object, rather than strings, as these types may change internally over time.
 *
 * @name ActionTypes
 * @memberOf module:Constants
 *
 * @example
 *
 * constructor.store.subscribe((store, lastAction) => {
 *   if (lastAction.type === constructor.constants.actionTypes.BLOCK_CREATE) {
 *     //do something
 *   }
 * });
 *
 */

export const BLOCK_CREATE = 'BLOCK_CREATE';
export const BLOCK_STASH = 'BLOCK_STASH';
export const BLOCK_LOAD = 'BLOCK_LOAD';
export const BLOCK_CLONE = 'BLOCK_CLONE';
export const BLOCK_MERGE = 'BLOCK_MERGE';
export const BLOCK_FREEZE = 'BLOCK_FREEZE';
export const BLOCK_DETACH = 'BLOCK_DETACH';
export const BLOCK_DELETE = 'BLOCK_DELETE';
export const BLOCK_RENAME = 'BLOCK_RENAME';
export const BLOCK_SET_PALETTE = 'BLOCK_SET_PALETTE';
export const BLOCK_SET_COLOR = 'BLOCK_SET_COLOR';
export const BLOCK_SET_ROLE = 'BLOCK_SET_ROLE';
export const BLOCK_ADD_ROLE = 'BLOCK_ADD_ROLE';
export const BLOCK_SET_SEQUENCE = 'BLOCK_SET_SEQUENCE';
export const BLOCK_SET_TRIM = 'BLOCK_SET_TRIM';
export const BLOCK_SET_TEMPLATE = 'BLOCK_SET_TEMPLATE';
export const BLOCK_SET_AUTHORING = 'BLOCK_SET_AUTHORING';
export const BLOCK_SET_LIST = 'BLOCK_SET_LIST';
export const BLOCK_SET_HIDDEN = 'BLOCK_SET_HIDDEN';
export const BLOCK_OPTION_ADD = 'BLOCK_OPTION_ADD';
export const BLOCK_OPTION_REMOVE = 'BLOCK_OPTION_REMOVE';
export const BLOCK_OPTION_TOGGLE = 'BLOCK_OPTION_TOGGLE';
export const BLOCK_COMPONENT_ADD = 'BLOCK_COMPONENT_ADD';
export const BLOCK_COMPONENT_MOVE = 'BLOCK_COMPONENT_MOVE';
export const BLOCK_COMPONENT_REMOVE = 'BLOCK_COMPONENT_REMOVE';
export const BLOCK_ANNOTATE = 'BLOCK_ANNOTATE';
export const BLOCK_REMOVE_ANNOTATION = 'BLOCK_REMOVE_ANNOTATION';
export const BLOCK_SET_PROJECT = 'BLOCK_SET_PROJECT';

export const INVENTORY_SEARCH = 'INVENTORY_SEARCH';
export const INVENTORY_SEARCH_RESOLVE_PARTIAL = 'INVENTORY_SEARCH_RESOLVE_PARTIAL';
export const INVENTORY_SEARCH_RESOLVE = 'INVENTORY_SEARCH_RESOLVE';
export const INVENTORY_SEARCH_REJECT = 'INVENTORY_SEARCH_REJECT';
export const INVENTORY_SEARCH_PAGINATE = 'INVENTORY_SEARCH_PAGINATE';
export const INVENTORY_SEARCH_PAGINATE_RESOLVE = 'INVENTORY_SEARCH_PAGINATE_RESOLVE';
export const INVENTORY_SOURCES_VISIBILITY = 'INVENTORY_SOURCES_VISIBILITY';
export const INVENTORY_SOURCES_VISIBLE = 'INVENTORY_SOURCES_VISIBLE';
export const INVENTORY_SET_SOURCES = 'INVENTORY_SET_SOURCES';
export const INVENTORY_SET_SEARCH_TERM = 'INVENTORY_SET_SEARCH_TERM';

export const FOCUS_FORCE_PROJECT = 'FOCUS_FORCE_PROJECT';
export const FOCUS_FORCE_BLOCKS = 'FOCUS_FORCE_BLOCKS';
export const FOCUS_CONSTRUCT = 'FOCUS_CONSTRUCT';
export const FOCUS_BLOCKS = 'FOCUS_BLOCKS';
export const FOCUS_PRIORITIZE = 'FOCUS_PRIORITIZE';
export const FOCUS_BLOCK_OPTION = 'FOCUS_BLOCK_OPTION';
export const FOCUS_ROLE = 'FOCUS_ROLE';

export const PROJECT_LIST = 'PROJECT_LIST';
export const PROJECT_CREATE = 'PROJECT_CREATE';
export const PROJECT_SAVE = 'PROJECT_SAVE';
export const PROJECT_SNAPSHOT = 'PROJECT_SNAPSHOT';
export const PROJECT_LOAD = 'PROJECT_LOAD';
export const PROJECT_OPEN = 'PROJECT_OPEN';
export const PROJECT_DELETE = 'PROJECT_DELETE';
export const PROJECT_MERGE = 'PROJECT_MERGE';
export const PROJECT_RENAME = 'PROJECT_RENAME';
export const PROJECT_ADD_CONSTRUCT = 'PROJECT_ADD_CONSTRUCT';
export const PROJECT_REMOVE_CONSTRUCT = 'PROJECT_REMOVE_CONSTRUCT';
export const PROJECT_FILE_WRITE = 'PROJECT_FILE_WRITE';

export const INSPECTOR_TOGGLE_VISIBILITY = 'INSPECTOR_TOGGLE_VISIBILITY';

export const INVENTORY_TOGGLE_VISIBILITY = 'INVENTORY_TOGGLE_VISIBILITY';
export const INVENTORY_SELECT_TAB = 'INVENTORY_SELECT_TAB';

export const DETAIL_VIEW_TOGGLE_VISIBILITY = 'DETAIL_VIEW_TOGGLE_VISIBILITY';
export const DETAIL_VIEW_SELECT_EXTENSION = 'DETAIL_VIEW_SELECT_EXTENSION';

export const UI_SHOW_USER_WIDGET = 'UI_SHOW_USER_WIDGET';
export const UI_SHOW_AUTHENTICATION_FORM = 'UI_SHOW_AUTHENTICATION_FORM';
export const UI_SHOW_DNAIMPORT = 'UI_SHOW_DNAIMPORT';
export const UI_SHOW_ORDER_FORM = 'UI_SHOW_ORDER_FORM';
export const UI_SHOW_ABOUT = 'UI_SHOW_ABOUT';
export const UI_SET_GRUNT = 'UI_SET_GRUNT';
export const UI_SPIN = 'UI_SPIN';
export const UI_INLINE_EDITOR = 'UI_INLINE_EDITOR';
export const UI_SHOW_GENBANK_IMPORT = 'UI_SHOW_GENBANK_IMPORT';
export const UI_SHOW_PARTSCSV_IMPORT = 'UI_SHOW_PARTSCSV_IMPORT';
export const UI_SAVE_ERROR = 'UI_SAVE_ERROR';
export const UI_SHOW_REPORT_ERROR = 'UI_SHOW_REPORT_ERROR';
export const UI_SHOW_EXTENSION_PICKER = 'UI_SHOW_EXTENSION_PICKER';

export const USER_SET_USER = 'USER_SET_USER';

export const CLIPBOARD_SET_DATA = 'CLIPBOARD-SET-DATA';

export const ORDER_CREATE = 'ORDER_CREATE';
export const ORDER_SET_PARAMETERS = 'ORDER_SET_PARAMETERS';
export const ORDER_STASH = 'ORDER_STASH';
export const ORDER_SUBMIT = 'ORDER_SUBMIT';
export const ORDER_SET_NAME = 'ORDER_SET_NAME';
export const ORDER_DETACH = 'ORDER_DETACH';
