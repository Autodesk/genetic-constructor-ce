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

import '../../styles/updown.css';

export default class UpDown extends Component {
  static propTypes = {
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
    disabled: PropTypes.bool,
    enabled: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func,
  };

  /**
   * cursor up/down increment / decrement the value within the current range.
   * The default behavior or moving the caret to start/end of text is prevented.
   */
  onKeyDown = (evt) => {
    if (this.props.disabled) {
      return;
    }

    switch (evt.keyCode) {
      // up arrow
    case 38:
      this.up();
      evt.preventDefault();
      break;
      // down arrow
    case 40:
      this.down();
      evt.preventDefault();
      break;
    default:
    }
  };

  /**
   * when the input is changed fire the change handler
   * if the value has changed. The change is only called with
   * valid numbers between min <= value <= max
   */
  onInputChanged = (evt) => {
    if (this.props.disabled) {
      return;
    }
    const value = this.getValue();
    if (value !== this.props.value) {
      if (this.props.onChange) {
        this.props.onChange(value);
      }
    }
  };

  onBlur = (evt) => {
    if (this.props.disabled) {
      return;
    }
    const value = this.getValue();
    if (value !== this.props.value) {
      if (this.props.onBlur) {
        this.props.onBlur(value);
      }
    }
  };

  /**
   * get the current value of the input, if invalid return this.props.min
   */
  getValue() {
    const val = parseInt(this.refs.updown.value, 10);
    return isNaN(val) || val < this.props.min || val > this.props.max ? this.props.min : val;
  }

  up = () => {
    const value = Math.min(this.getValue() + 1, this.props.max);
    if (this.props.onChange) {
      this.props.onChange(value);
    } else {
      this.props.onBlur(value);
    }
  };

  down = () => {
    const value = Math.max(this.getValue() - 1, this.props.min);
    if (this.props.onChange) {
      this.props.onChange(value);
    } else {
      this.props.onBlur(value);
    }
  };

  render() {
    return (
      <div className="updown-container">
        <input
          className="input-updown"
          value={this.props.value}
          ref="updown"
          maxLength={this.props.max.toString().length}
          onKeyDown={this.onKeyDown}
          onChange={this.onInputChanged}
          onBlur={this.onBlur}
        />
        <div className="updown-spinner">
          <div className="arrow-container">
            <div className="updown-arrows up" onClick={this.up}/>
            <div className="updown-arrows down" onClick={this.down}/>
          </div>
        </div>
      </div>
    );
  }
}
