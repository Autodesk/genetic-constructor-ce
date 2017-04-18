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
import Toggler from '../ui/Toggler';

//todo - update classes

import '../../styles/InspectorRow.css';

export default class InspectorRow extends Component {
  static propTypes = {
    heading: PropTypes.string.isRequired,
    hasToggle: PropTypes.bool,
    forceActive: PropTypes.bool,
    onToggle: PropTypes.func,
    condition: PropTypes.bool,
    children: PropTypes.any,
  };

  static defaultProps = {
    condition: true,
    hasToggle: false,
    onToggle: () => {},
  };

  state = {
    active: false,
  };

  getActiveState = () => {
    const { forceActive } = this.props;
    return (forceActive === true || forceActive === false) ? forceActive : this.state.active;
  };

  handleToggle = () => {
    this.setState({ active: !this.state.active });
    this.props.onToggle(this.state.active);
  };

  render() {
    const { heading, hasToggle, condition, children } = this.props;

    if (!children) {
      return null;
    }

    if (!condition) {
      return (<div className="InspectorRow"></div>);
    }

    const isActive = this.getActiveState();

    const headingEl = hasToggle ?
      (
        <h4 className={'InspectorRow-heading toggler' + (isActive ? ' active' : '')}
            onClick={() => this.handleToggle()}>
          <Toggler open={isActive}/>
          <span>{heading}</span>
        </h4>
      )
      :
      (<h4 className="InspectorRow-heading">{heading}</h4>);

    return (
      <div className="InspectorRow">
        {headingEl}
        {(!hasToggle || isActive) && children}
      </div>
    );
  }
}
