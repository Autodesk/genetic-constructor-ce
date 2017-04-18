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
import * as ActionTypes from '../../constants/ActionTypes';
import { LOCATION_CHANGE } from 'react-router-redux';

export const initialState = {
  detailViewVisible: false,
  authenticationForm: 'none',
  showDNAImport: false,
  orderId: null,
  showAbout: false,
  gruntMessage: null,
  showGenBankImport: false,
  userWidgetVisible: true,
  spinMessage: '',
  inlineEditorCommit: null,
  inlineEditorCancel: null,
  inlineEditorPosition: null,
  showSaveError: false,
  showOrderForm: false,
  showReportError: false,
  showPartsCSVImport: false,
  listBlock: null,
  showExtensionPicker: false,
};

export default function modals(state = initialState, action) {
  switch (action.type) {
  case ActionTypes.UI_SHOW_AUTHENTICATION_FORM:
    const { authenticationForm } = action;
    return Object.assign({}, state, { authenticationForm });

  case ActionTypes.UI_SHOW_GENBANK_IMPORT:
    const { showGenBankImport } = action;
    return Object.assign({}, state, { showGenBankImport });

  case ActionTypes.UI_SHOW_PARTSCSV_IMPORT:
    const { showPartsCSVImport, listBlock } = action;
    return Object.assign({}, state, { showPartsCSVImport, listBlock });

  case ActionTypes.UI_SHOW_DNAIMPORT:
    const { showDNAImport } = action;
    return Object.assign({}, state, { showDNAImport });

  case ActionTypes.UI_SHOW_ORDER_FORM:
    const { showOrderForm, orderId } = action;
    return Object.assign({}, state, { showOrderForm, orderId });

  case ActionTypes.UI_SHOW_ABOUT:
    const { showAbout } = action;
    return Object.assign({}, state, { showAbout });

  case ActionTypes.DETAIL_VIEW_TOGGLE_VISIBILITY :
    const { nextState } = action;
    return Object.assign({}, state, { detailViewVisible: nextState });

  case ActionTypes.UI_SHOW_USER_WIDGET :
    const { userWidgetVisible } = action;
    return Object.assign({}, state, { userWidgetVisible });

  case ActionTypes.UI_SET_GRUNT :
    const { gruntMessage } = action;
    return Object.assign({}, state, { gruntMessage });

  case ActionTypes.UI_SPIN:
    const { spinMessage } = action;
    return Object.assign({}, state, { spinMessage });

  case ActionTypes.UI_INLINE_EDITOR:
    const {
      inlineEditorCommit,
      inlineEditorValue,
      inlineEditorPosition,
      inlineEditorClassName,
      inlineEditorTarget,
    } = action;
    return Object.assign({}, state, {
      inlineEditorCommit,
      inlineEditorValue,
      inlineEditorPosition,
      inlineEditorClassName,
      inlineEditorTarget,
    });

  case ActionTypes.UI_SAVE_ERROR:
    return Object.assign({}, state, { showSaveError: true });

  case ActionTypes.UI_SHOW_REPORT_ERROR:
    const { modalState } = action;
    return Object.assign({}, state, { showReportError: modalState });

  case ActionTypes.UI_SHOW_EXTENSION_PICKER:
    const { pickerState } = action;
    return Object.assign({}, state, { showExtensionPicker: pickerState });

  case LOCATION_CHANGE :
    const toKeep = ['gruntMessage'].reduce((acc, field) => Object.assign(acc, { [field]: state[field] }), {});
    return Object.assign({}, initialState, toKeep);

  default :
    return state;
  }
}
