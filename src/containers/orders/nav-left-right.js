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

export default class NavLeftRight extends Component {
  static propTypes = {
    left: PropTypes.bool.isRequired,
    text: PropTypes.string.isRequired,
    visible: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
  };

  render() {
    if (!this.props.visible) {
      return (<div className="nav-left-right disabled"/>);
    }

    return (
      <div className="nav-left-right" onClick={this.props.onClick}>
        {this.props.left ? <div className="angle left"/> : null}
        <div className="text">{this.props.text}</div>
        {!this.props.left ? <div className="angle right"/> : null}
      </div>
    );
  }
}
