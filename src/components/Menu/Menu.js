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
import MenuItem from './MenuItem';
import MenuSeparator from './MenuSeparator';

export default class Menu extends Component {
  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    menuItems: PropTypes.arrayOf(PropTypes.shape({
      text: PropTypes.string,
      disabled: PropTypes.bool,
      action: PropTypes.func,
    })).isRequired,
  };

  constructor() {
    super();
    this.timeout = null;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.isOpen && !this.props.isOpen) {
      this.killTimeout();
    }
  }

  componentWillUnmount() {
    this.killTimeout();
  }

  toggle = (forceVal) => {
    this.killTimeout();
    this.props.onToggle(forceVal);
  };

  startTimeout = () => {
    this.killTimeout();

    if (this.props.isOpen) {
      this.timeout = window.setTimeout(() => {
        this.toggle(false);
        this.timeout = null;
      }, 500);
    }
  };

  killTimeout = () => {
    if (this.timeout) {
      window.clearTimeout(this.timeout);
      this.timeout = null;
    }
  };

  render() {
    return (
      <div className="menu-dropdown"
           onMouseLeave={() => this.startTimeout()}
           onMouseEnter={() => this.killTimeout()}>
        <div className={this.props.isOpen ? 'menu-header menu-header-open' : 'menu-header'}
             onClick={this.toggle}>
          {this.props.title}
        </div>
        {this.props.isOpen && (
          <div className="menu-dropdown-container">
            {this.props.menuItems.map((item, index) => {
              const boundAction = () => {
                item.action();
                this.toggle(false);
              };
              return (
                item.text ?
                  (<MenuItem
                    key={item.text}
                    text={item.text}
                    shortcut={item.shortcut}
                    checked={item.checked}
                    disabled={!!item.disabled}
                    classes={item.classes}
                    action={boundAction}/>) :
                  (<MenuSeparator key={index}/>)
              );
            })}
          </div>
        )}
      </div>
    );
  }
}
