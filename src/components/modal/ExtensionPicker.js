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
import { connect } from 'react-redux';
import { merge } from 'lodash';
import ModalWindow from './modalwindow';
import { uiShowExtensionPicker } from '../../actions/ui';
import { userUpdateConfig } from '../../actions/user';
import registry from '../../extensions/clientRegistry';
import {
  extensionName,
  extensionAuthor,
  extensionRegion,
  extensionType,
  extensionDescription,
  manifestIsClient,
  manifestIsServer,
} from '../../../server/extensions/manifestUtils';

import '../../styles/ExtensionPicker.css';

export class ExtensionPicker extends Component {
  static propTypes = {
    open: PropTypes.bool.isRequired,
    config: PropTypes.shape({
      extensions: PropTypes.object,
    }),
    uiShowExtensionPicker: PropTypes.func.isRequired,
    userUpdateConfig: PropTypes.func.isRequired,
  };

  static defaultProps = {
    config: { extensions: {} },
  };

  state = {
    dirty: false,
    extensionsActive: {},
  };

  checkExtensionActive = (extension) => {
    return (typeof this.state.extensionsActive[extension] === 'boolean') ?
      this.state.extensionsActive[extension] :
      (this.props.config.extensions[extension] && this.props.config.extensions[extension].active);
  };

  handleToggleExtension = (extension) => {
    const nextState = !this.checkExtensionActive(extension);

    const extensionsActive = Object.assign({}, this.state.extensionsActive, { [extension]: nextState });
    this.setState({ extensionsActive, dirty: true });
  };

  submitForm = () => {
    const mappedExtensionsActive = Object.keys(this.state.extensionsActive).reduce((acc, key) => {
      return Object.assign(acc, { [key]: { active: this.state.extensionsActive[key] } });
    }, {});
    const nextConfig = merge({}, this.props.config, { extensions: mappedExtensionsActive });

    this.props.userUpdateConfig(nextConfig)
      .then(user => {
        this.setState({ dirty: false });
        this.props.uiShowExtensionPicker(false);
      });
  };

  render() {
    // no render when not open
    if (!this.props.open || !this.props.config || !this.props.config.extensions) {
      return null;
    }

    //todo - better dirty check - see if not at inital state

    const tableFields = ['Name', 'Type', 'Description'];

    return (
      <ModalWindow
        closeOnClickOutside
        open={this.props.open}
        title="Extensions"
        closeModal={() => this.props.uiShowExtensionPicker(false)}
        payload={(
          <div className="ExtensionPicker gd-form">
            <div className="title">Extensions</div>

            <div className="ExtensionPicker-list">
              <div className="ExtensionPicker-row ExtensionPicker-header">
                {['', ...tableFields].map(field => {
                  return (<div className="ExtensionPicker-cell" key={field}>{field}</div>);
                })}
              </div>
              {Object.keys(registry).map(key => registry[key]).map(extension => {
                const values = {
                  Name: extensionName(extension),
                  Type: extensionType(extension),
                  Description: extensionDescription(extension),
                  Author: extensionAuthor(extension),
                  Client: manifestIsClient(extension),
                  isServer: manifestIsServer(extension),
                  Region: extensionRegion(extension),
                };

                return (<div className="ExtensionPicker-row"
                             key={extension.name}>
                  <div className="ExtensionPicker-cell">
                    <input type="checkbox"
                           className="ExtensionPicker-cell ExtensionPicker-toggle"
                           checked={this.checkExtensionActive(extension.name)}
                           onChange={() => this.handleToggleExtension(extension.name)}/>
                  </div>
                  {tableFields.map((field) => {
                    return (<div className={'ExtensionPicker-cell ExtensionPicker-' + field}
                                 key={field}>
                      {values[field]}
                    </div>);
                  })}

                </div>);
              })}
            </div>

            <div style={{ paddingTop: '1.5rem', textAlign: 'center' }}>
              <button
                type="submit"
                disabled={!this.state.dirty}
                onClick={() => this.submitForm()}>
                Submit
              </button>
            </div>
          </div>
        )}/>
    );
  }
}

function mapStateToProps(state) {
  return {
    config: state.user.config,
    open: state.ui.modals.showExtensionPicker,
  };
}

export default connect(mapStateToProps, {
  uiShowExtensionPicker,
  userUpdateConfig,
})(ExtensionPicker);
