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
import Row from './row';

export default class Page3 extends Component {

  static propTypes = {
    open: PropTypes.bool.isRequired,
    order: PropTypes.object.isRequired,
  };

  render() {
    // no render when not open
    if (!this.props.open) {
      return null;
    }

    const { order } = this.props;

    return (
      <div className="order-page page3">
        <Row text="Label:">
          <div>{order.metadata.name}</div>
        </Row>
        <Row text="Job ID:">
          <div>{order.status.remoteId}</div>
        </Row>
        <Row text="Date Submitted:">
          <div>{new Date(order.status.timeSent).toUTCString()}</div>
        </Row>
        <Row text="Method:">
          <div>{order.parameters.onePot ? 'All in a single container' : 'Each in an individual container'}</div>
        </Row>
        <Row text="After Fabrication:">
          <div>{order.parameters.sequenceAssemblies ? 'Sequence' : 'Do Not Sequence'}</div>
        </Row>
        <br/>
      </div>
    );
  }
}
