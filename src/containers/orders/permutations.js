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

export default class Permutations extends Component {
  static propTypes = {
    disabled: PropTypes.bool,
    total: PropTypes.number.isRequired,
    value: PropTypes.number,
    editable: PropTypes.bool.isRequired,
    onBlur: PropTypes.func.isRequired,
  };

  state = {
    value: 1,
  };

  componentWillReceiveProps(nextProps) {
    this.setState({ value: nextProps.value });
  }

  onBlur = () => {
    if (this.props.disabled) {
      return;
    }
    let value = parseInt(this.state.value, 10);
    if (value < 1) {
      value = 1;
      this.setState({ value });
    }
    if (isNaN(value) || value > this.props.total) {
      value = this.props.total;
      this.setState({ value });
    }
    this.props.onBlur(value);
  };

  onChange = (evt) => {
    this.setState({
      value: evt.target.value,
    });
  };

  render() {
    // if editable show input + permutations
    if (this.props.editable) {
      return (
        <div className="permutations">
          <input
            disabled={this.props.disabled}
            onChange={this.onChange}
            value={this.state.value}
            onBlur={this.onBlur}
          />
          <span> of <b>{this.props.total} </b>possibilities</span>
        </div>
      );
    }

    // if non editable show permutations
    return (
      <div>
        <span><b>{this.props.total} </b>possibilities</span>
      </div>
    );
  }
}
