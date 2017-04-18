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
import {
  uiShowAuthenticationForm,
  uiSetGrunt,
  uiSpin,
} from '../../actions/ui';
import invariant from 'invariant';
import { userLogin } from '../../actions/user';
import { projectOpen } from '../../actions/projects';
import track from '../../analytics/ga';

/*
 * default visibility and text for error labels
 * @type {Object}
 */
const errors = {
  signinError: {
    visible: false,
    text: 'none',
  },
};

class SignInForm extends Component {

  static propTypes = {
    uiShowAuthenticationForm: PropTypes.func.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
    uiSpin: PropTypes.func.isRequired,
    userLogin: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
  };

  constructor() {
    super();
    this.state = Object.assign({}, errors, {canSubmit: false});
  }

  onForgot(evt) {
    evt.preventDefault();
    this.props.uiShowAuthenticationForm('forgot');
  }

  // on form submission, first perform client side validation then submit
  // to the server if that goes well.
  onSubmit(evt) {
    // submission occurs via REST not form submission
    evt.preventDefault();
    this.props.uiSpin('Signing in... Please wait.');
    this.props.userLogin(this.emailAddress, this.password)
      .then(user => {
        track('Authentication', 'Sign In', 'Success');
        // close the form
        this.props.uiSpin();
        this.props.uiShowAuthenticationForm('none');
        this.props.projectOpen(null);
      })
      .catch((reason) => {
        this.props.uiSpin();
        const defaultMessage = 'Email address or password are not recognized.';
        const { message = defaultMessage } = reason;
        this.showServerErrors({
          message,
        });
        track('Authentication', 'Sign In', message);
      });
  }

  onRegister(evt) {
    evt.preventDefault();
    this.props.uiShowAuthenticationForm('register');
  }
  onTextChanged() {
    this.setState({
      canSubmit: this.emailAddress && this.password,
    });
  }
  get emailAddress() {
    return this.refs.emailAddress.value.trim();
  }
  get password() {
    return this.refs.password.value.trim();
  }

  /**
   * display server errors in the most logical way
   */
  showServerErrors(json) {
    invariant(json && json.message, 'We expected an error message');
    // any unrecognized errors are displayed below the tos
    const msg = json.message === 'Incorrect username.' ? 'Email address not recognized' : json.message;
    this.setState({
      signinError: {
        visible: true,
        text: msg,
      },
    });
  }

  render() {
    const registerStyle = {
      textAlign: 'center',
      margin: '1rem 0 2rem 0',
    };

    return (
      <form
        id="auth-signin"
        className="gd-form authentication-form"
        onSubmit={this.onSubmit.bind(this)}>
        <div className="title">Sign In</div>
          <span style={registerStyle}>{"Don't have an account? "}
            <a className="blue-link" href="/" onClick={this.onRegister.bind(this)}>Register&nbsp;</a>
            <span>{"- it's free!"}</span>
          </span>
        <input
          ref="emailAddress"
          className="input"
          placeholder="Email Address"
          onChange={this.onTextChanged.bind(this)}
          />
        <input
          type="password"
          ref="password"
          maxLength={32}
          className="input"
          onChange={this.onTextChanged.bind(this)}
          placeholder="Password"/>
        <div className="forgot-box">
          <a className="blue-link forgot-link" href="/" onClick={this.onForgot.bind(this)}>Forgot?</a>
        </div>
        <div
          className={`error ${this.state.signinError.visible ? 'visible' : ''}`}>{`${this.state.signinError.text}`}</div>
        <button
          type="submit"
          disabled={!this.state.canSubmit}
          >Sign In</button>
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
  uiSpin,
  userLogin,
  projectOpen,
})(SignInForm);
