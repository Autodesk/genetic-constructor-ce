import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { uiShowAbout } from '../actions/ui';
import ModalWindow from './modal/modalwindow';

import '../../src/styles/form.css';
import '../../src/styles/aboutform.css';

class AboutForm extends Component {

  static propTypes = {
    uiShowAbout: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
  };

  render() {
    // no render when not open
    if (!this.props.open) {
      return null;
    }

    return (<ModalWindow
      open={this.props.open}
      title="Genome Designer"
      closeOnClickOutside
      closeModal={(buttonText) => {
        this.props.uiShowAbout(false);
      }}
      payload={
          <div className="gd-form aboutform">
            <div className="image">
              <img style={{borderRadius: 0}} className="background" src="/images/homepage/tiles.jpg"/>
                <div className="name">
                  <div className="lighter">Autodesk&nbsp;</div>
                  <div>Genetic Constructor</div>
                </div>
            </div>
            <div className="text no-vertical-scroll">
              <div className="heading">
                Copyright 2016 Autodesk,Inc.
              </div>
              <span>
              Licensed under the Apache License, Version 2.0 (the "License");
              you may not use this file except in compliance with the License.
              You may obtain a copy of the License at
              </span>
              <br/>
              <br/>
              <a target="_blank" href="http://www.apache.org/licenses/LICENSE-2.0">&nbsp;www.apache.org/licenses/LICENSE-2.0</a>
              <br/>
              <br/>
              <span>
              Unless required by applicable law or agreed to in writing, software
              distributed under the License is distributed on an "AS IS" BASIS,
              WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
              See the License for the specific language governing permissions and
              limitations under the License.
              </span>
              <div className="heading">
                Trademarks
              </div>
              Autodesk is a registered trademark or trademark of Autodesk, Inc., and/or its subsidiaries and/or affiliates.
              All other brand names, product names or trademarks belong to their respective holders.
              <br/>
            </div>
            <br/>
            <button
              type="submit"
              onClick={() => {
                this.props.uiShowAbout(false);
              }}>Close
            </button>
          </div>}
    />);
  }
}

function mapStateToProps(state) {
  return {
    open: state.ui.modals.showAbout,
  };
}

export default connect(mapStateToProps, {
  uiShowAbout,
})(AboutForm);
