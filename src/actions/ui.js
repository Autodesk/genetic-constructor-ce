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
 * @module Actions_UI
 * @memberOf module:Actions
 */
import * as ActionTypes from '../constants/ActionTypes';
import invariant from 'invariant';
import extensionRegistry from '../extensions/clientRegistry';

//hack - so this is super weird - jsdoc will work when you have some statements here. This file needs 2!
const spaceFiller = 10; //eslint-disable-line no-unused-vars
const spaceFiller2 = 20; //eslint-disable-line no-unused-vars

/**
 * Toggle whether the inspector is visible
 * @function
 * @param {boolean} [forceState] Omit to toggle
 * @returns {boolean} whether visible
 */
export const inspectorToggleVisibility = (forceState) => {
  return (dispatch, getState) => {
    const currentState = getState().ui.inspector.isVisible;
    const nextState = (forceState !== undefined) ? !!forceState : !currentState;
    dispatch({
      type: ActionTypes.INSPECTOR_TOGGLE_VISIBILITY,
      nextState,
    });

    window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);

    return nextState;
  };
};

/**
 * Toggle whether the inventory is visible
 * @function
 * @param {boolean} [forceState] Omit to toggle
 * @returns {boolean} whether visible
 */
export const inventoryToggleVisibility = (forceState) => {
  return (dispatch, getState) => {
    const currentState = getState().ui.inventory.isVisible;
    const nextState = (forceState !== undefined) ? !!forceState : !currentState;
    dispatch({
      type: ActionTypes.INVENTORY_TOGGLE_VISIBILITY,
      nextState,
    });

    window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);

    return nextState;
  };
};

/**
 * Select which tab of the inventory is active
 * @function inventorySelectTab
 * @todo - validate a legitimate tab is selected
 * @param {string} tab Key of tab to be active
 * @returns {string} Tab active
 */
export const inventorySelectTab = (tab) => {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.INVENTORY_SELECT_TAB,
      tab,
    });
    return tab;
  };
};

/* detail view */

/**
 * Toggle whether the detail view of the design canvas is open
 * @function uiToggleDetailView
 * @param {boolean} [forceState] Omit to toggle
 * @returns {boolean} next state
 */
export const uiToggleDetailView = (forceState) => {
  return (dispatch, getState) => {
    const currentState = getState().ui.detailView.isVisible;
    const nextState = (forceState !== undefined) ? !!forceState : !currentState;
    dispatch({
      type: ActionTypes.DETAIL_VIEW_TOGGLE_VISIBILITY,
      nextState,
    });

    window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);

    return nextState;
  };
};

/**
 * Select an extension to show in the detail view
 * @function
 * @param {string} key Key (name) of extension
 * @throws If manifest not registered
 * @returns {string} selected manifest key
 */
export const detailViewSelectExtension = (key) => {
  return (dispatch, getState) => {
    invariant(extensionRegistry[key], 'extension must be registerd in registry, got ' + key);
    dispatch({
      type: ActionTypes.DETAIL_VIEW_SELECT_EXTENSION,
      key,
    });
    return key;
  };
};

/* modals */

export const uiShowAuthenticationForm = (name) => {
  return (dispatch, getState) => {
    invariant(['signin', 'register', 'forgot', 'reset', 'account', 'none'].indexOf(name) >= 0, 'attempting to show invalid form name');
    dispatch({
      type: ActionTypes.UI_SHOW_AUTHENTICATION_FORM,
      authenticationForm: name,
    });
    return name;
  };
};

export const uiShowGenBankImport = (bool) => {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.UI_SHOW_GENBANK_IMPORT,
      showGenBankImport: bool,
    });
    return bool;
  };
};

export const uiShowPartsCSVImport = (bool, listBlock) => {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.UI_SHOW_PARTSCSV_IMPORT,
      showPartsCSVImport: bool,
      listBlock,
    });
    return bool;
  };
};

export const uiShowDNAImport = (bool) => {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.UI_SHOW_DNAIMPORT,
      showDNAImport: bool,
    });
    return bool;
  };
};

export const uiShowOrderForm = (bool, orderId) => {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.UI_SHOW_ORDER_FORM,
      showOrderForm: bool,
      orderId,
    });
    return bool;
  };
};

export const uiShowAbout = (bool) => {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.UI_SHOW_ABOUT,
      showAbout: bool,
    });
    return bool;
  };
};

export const uiShowUserWidget = (userWidgetVisible) => {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.UI_SHOW_USER_WIDGET,
      userWidgetVisible,
    });
    return userWidgetVisible;
  };
};

export const uiSetGrunt = (gruntMessage) => {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.UI_SET_GRUNT,
      gruntMessage,
    });
    return gruntMessage;
  };
};

export const uiSpin = (spinMessage = '') => {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.UI_SPIN,
      spinMessage,
    });
    return spinMessage;
  };
};

export const uiInlineEditor = (commit, value, position, className, target) => {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.UI_INLINE_EDITOR,
      inlineEditorCommit: commit,
      inlineEditorValue: value,
      inlineEditorPosition: position,
      inlineEditorClassName: className,
      inlineEditorTarget: target,
    });
    return null;
  };
};

//cannot be dismissed
export const uiSaveFailure = () => {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.UI_SAVE_ERROR,
    });
    return null;
  };
};

export const uiReportError = (nextState) => {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.UI_SHOW_REPORT_ERROR,
      modalState: nextState,
    });
    return null;
  };
};

export const uiShowExtensionPicker = (nextState = true) => {
  return (dispatch, getState) => {
    dispatch({
      type: ActionTypes.UI_SHOW_EXTENSION_PICKER,
      pickerState: nextState,
    });
    return nextState;
  };
};


