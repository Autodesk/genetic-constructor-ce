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
import {connect} from 'react-redux';
import { uiSetGrunt } from '../actions/ui';

import '../../src/styles/ribbongrunt.css';

// MS display time for grunt messages
const DISPLAY_TIME = 5000;

class RibbonGrunt extends Component {

  static propTypes = {
    gruntMessage: PropTypes.string,
    uiSetGrunt: PropTypes.func.isRequired,
  };

  constructor() {
    super();
  }

  // if we going to show a message then start or extend the close timer
  componentWillReceiveProps(nextProps) {
    window.clearTimeout(this.closeTimer);
    if (nextProps.gruntMessage) {
      this.closeTimer = window.setTimeout(this.close.bind(this), DISPLAY_TIME);
    }
  }

  close() {
    window.clearTimeout(this.closeTimer);
    this.props.uiSetGrunt('');
  }

  cancelTimer() {
    window.clearTimeout(this.closeTimer);
  }

  render() {
    if (this.props.gruntMessage) {
      return (
        <div className="ribbongrunt">{this.props.gruntMessage}
          <button onClick={this.close.bind(this)}>&times;</button>
        </div>
      );
    }
    return null;
  }
}

function mapStateToProps(state) {
  return {
    gruntMessage: state.ui.modals.gruntMessage,
  };
}
export default connect(mapStateToProps, {
  uiSetGrunt,
})(RibbonGrunt);
