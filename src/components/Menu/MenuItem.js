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

/**
 * Popup window class. Accepts any component as it client.
 * Required properties:
 *
 * {String} title - title bar text for window
 * {Function} onClose - function to call when the window is closed
 * {ReactElement} client - element to place in the client area
 */
export default class MenuItem extends Component {
  static propTypes = {
    text: PropTypes.string.isRequired,
    action: PropTypes.func,
    disabled: PropTypes.bool,
    checked: PropTypes.bool,
    shortcut: PropTypes.string,
    classes: PropTypes.string,
  };

  static defaultProps = {
    action: () => {},
  };

  render() {
    // indent if checkable regardless of checked state
    const indent = this.props.checked === true || this.props.checked === false;
    let check = null;
    if (indent) {
      check = <div className={this.props.checked ? 'menu-item-checked' : 'menu-item-unchecked'}></div>;
    }
    let classes = 'menu-item' + (this.props.disabled ? ' disabled' : '');
    if (this.props.classes) {
      classes += ` ${this.props.classes}`;
    }

    return (
      <div className={classes}
           onClick={evt => {
             evt.stopPropagation();
             if (!this.props.disabled) {
               this.props.action(evt);
             }
           }}>
        {check}
        {this.props.text}
        {this.props.shortcut && (<div className="menu-item-shortcut" disabled={this.props.disabled}>{this.props.shortcut}</div>)}
      </div>
    );
  }
}
