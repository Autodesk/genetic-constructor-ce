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
import { uiShowAuthenticationForm, uiSetGrunt } from '../../actions/ui';
import { forgot } from '../../middleware/auth';
import track from '../../analytics/ga';

/*
 * default visibility and text for error labels
 * @type {Object}
 */
const errors = {
  emailError: {
    visible: false,
    text: '&nbsp;',
  },
};

class ForgotForm extends Component {

  static propTypes = {
    uiShowAuthenticationForm: PropTypes.func.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
  };

  constructor() {
    super();
    this.state = Object.assign({}, errors);
  }

  // on form submission, first perform client side validation then submit
  // to the server if that goes well.
  onSubmit(evt) {
    // submission occurs via REST not form submission
    evt.preventDefault();
    // reset errors
    this.setState({
      emailError: false,
      text: '&nbsp;',
    });

    forgot(this.emailAddress)
      .then((json) => {
        if (json.message === 'Invalid email' || json.message === 'missing email') {
          this.setState({
            emailError: {
              visible: true,
              text: 'Unrecognized email address',
            },
          });
          track('Authentication', 'Forgot', json.message);
          return;
        }
        // show grunt
        this.props.uiSetGrunt(`Check Email: A link to reset your password has been sent to ${this.emailAddress}`);
        // close the form
        this.props.uiShowAuthenticationForm('none');
        track('Authentication', 'Forgot', 'Success');
      })
      .catch((reason) => {
        // unrecognized email throws an exception, but we don't want the caller to know if the email is registered or not.
        if (reason && reason.message === 'Invalid email') {
          this.setState({
            emailError: {
              visible: true,
              text: 'Unrecognized email address',
            },
          });
          track('Authentication', 'Forgot', 'Unrecognized Email');
        } else {
          this.setState({
            emailError: {
              visible: true,
              text: 'Unexpected error, please check your connection',
            },
          });
          track('Authentication', 'Forgot', 'Unexpected Error');
        }
      });
  }

  get emailAddress() {
    return this.refs.emailAddress.value.trim();
  }

  render() {
    return (
      <form
        id="forgot-form"
        className="gd-form authentication-form"
        onSubmit={this.onSubmit.bind(this)}>
        <div className="title">Forgot Password</div>
        <input
          ref="emailAddress"
          className="input"
          placeholder="Registered Email Address"/>
        <div className={`error ${this.state.emailError.visible ? 'visible' : ''}`}>{`${this.state.emailError.text}`}</div>
        <button type="submit">Send Request</button>
          <button
            type="button"
            onClick={() => {
              this.props.uiShowAuthenticationForm('none');
            }}>Cancel</button>
      </form>
    );
  }
}

function mapStateToProps(state) {
  return {};
}

export default connect(mapStateToProps, {
  uiShowAuthenticationForm,
  uiSetGrunt,
})(ForgotForm);
