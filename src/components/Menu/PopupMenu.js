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
import ReactDOM from 'react-dom';

import MenuItem from './MenuItem';
import MenuSeparator from './MenuSeparator';

export default class PopupMenu extends Component {
  static propTypes = {
    open: PropTypes.bool.isRequired,
    closePopup: PropTypes.func.isRequired,
    menuItems: PropTypes.array.isRequired,
    position: PropTypes.object.isRequired,
    style: PropTypes.object,
  };

  static defaultProps = {
    style: {},
  };

  // mouse down on the blocker closes the modal
  onMouseDown(evt) {
    const blockEl = ReactDOM.findDOMNode(this.refs.blocker);
    if (evt.target === blockEl) {
      this.props.closePopup();
    }
  }

  render() {
    // set position from properties
    const position = {
      left: `${this.props.position.x}px`,
      top: `${this.props.position.y}px`,
    };
    return (
      <div
        onMouseDown={this.onMouseDown.bind(this)}
        className={this.props.open ? 'menu-popup-blocker-visible' : 'menu-popup-blocker-hidden'}
        style={this.props.style}
        ref="blocker">
        <div className="menu-popup-container" style={position}>
          {this.props.menuItems.map((item, index) => {
            const boundAction = (evt) => {
              this.props.closePopup();
              if (item.action) {
                item.action(evt);
              }
            };
            return (
              item.text ?
                (<MenuItem key={item.text}
                           disabled={item.disabled}
                           classes={item.classes}
                           text={item.text}
                           action={boundAction}
                           checked={item.checked}/>)
                :
                (<MenuSeparator key={index}/>)
            );
          })}
        </div>
      </div>
    );
  }
}
