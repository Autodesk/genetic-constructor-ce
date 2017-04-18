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

import '../../../src/styles/ordermodal.css';

export default class Selector extends Component {
  static propTypes = {
    options: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.any,
    disabled: PropTypes.bool.isRequired,
  };

  state = {
    menuOpen: false,
  };

  onClick = () => {};

  onShowMenu = () => {
    if (this.props.disabled) {
      return;
    }
    this.setState({
      menuOpen: true,
    });
  };

  onMouseLeave = () => {
    if (this.state.menuOpen) {
      this.setState({ menuOpen: false });
    }
  };

  closeMenu = () => {
    this.setState({
      menuOpen: false,
    });
  };

  render() {
    let menu = null;
    if (this.state.menuOpen) {
      const items = this.props.options.map(item => {
        return (
          <div
            className="menu-item"
            onClick={(evt) => {
              evt.preventDefault();
              evt.stopPropagation();
              this.setState({ menuOpen: false });
              this.props.onChange(item);
            }}>
            {item}
          </div>
        );
      });
      menu = (
        <div className="selector-menu" children={items}/>
      );
    }

    return (
      <div onClick={this.onShowMenu} className="dropdown-container">
        <div
          className="dropdown"
          onMouseLeave={this.onMouseLeave}>
          {this.props.value}
          {menu}
        </div>
        <div className="selector-arrow"/>
      </div>
    );
  }
}
