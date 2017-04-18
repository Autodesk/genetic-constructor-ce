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
import React, { Component, PropTypes } from 'react';
import ModalWindow from './modal/modalwindow';

import '../styles/ok-cancel-form.css';

/**
 * Genbank import dialog.
 */
export default class OkCancel extends Component {
  static propTypes = {
    open: PropTypes.bool.isRequired,
    titleText: PropTypes.string.isRequired,
    messageHTML: PropTypes.node.isRequired,
    okText: PropTypes.string,
    cancelText: PropTypes.string,
    ok: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
  };

  static defaultProps = {
    okText: 'ok',
    cancelText: 'cancel',
  };

  render() {
    if (!this.props.open) {
      return null;
    }
    return (
      <div>
        <ModalWindow
          open
          title={this.props.titleText}
          payload={(
            <form
              className="gd-form ok-cancel-form"
              onSubmit={(evt) => {
                evt.preventDefault();
                this.props.ok();
              }}
            >
              <div className="title">{this.props.titleText}</div>
              {this.props.messageHTML}
              <button
                type="submit"
                onClick={(evt) => {
                  evt.preventDefault();
                  this.props.ok();
                }}
              >{this.props.okText}</button>
              <button
                type="button"
                onClick={this.props.cancel}
              >{this.props.cancelText}
              </button>
            </form>

          )}
          closeOnClickOutside
          closeModal={buttonText => {

          }}
        />
      </div>
    );
  }
}
