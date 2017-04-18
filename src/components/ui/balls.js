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
import '../../styles/balls.css';

export default class Balls extends Component {

  static propTypes = {
    running: PropTypes.bool.isRequired,
    color: PropTypes.string.isRequired,
  };

  render() {
    if (!this.props.running) {
      return null;
    }
    return (
      <div className="loading-horizontal">
        <div className="loading-ball" style={{backgroundColor: this.props.color}}/>
        <div className="loading-ball" style={{backgroundColor: this.props.color}}/>
        <div className="loading-ball" style={{backgroundColor: this.props.color}}/>
        <div className="loading-ball" style={{backgroundColor: this.props.color}}/>
        <div className="loading-ball" style={{backgroundColor: this.props.color}}/>
      </div>
    );
  }
}
