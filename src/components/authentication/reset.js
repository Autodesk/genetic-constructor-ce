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
import { connect } from 'react-redux';
import { uiShowAuthenticationForm, uiSetGrunt } from '../../actions/ui';
import { userLogin } from '../../actions/user';
import { reset } from '../../middleware/auth';
import invariant from 'invariant';
import { projectOpen } from '../../actions/projects';
import track from '../../analytics/ga';

/*
 * default visibility and text for error labels
 * @type {Object}
 */
const errors = {
  password1Error: {
    visible: false,
    text: 'none',
  },
  password2Error: {
    visible: false,
    text: 'none',
  },
};

class RegisterForm extends Component {

  static propTypes = {
    uiShowAuthenticationForm: PropTypes.func.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
    userLogin: PropTypes.func.isRequired,
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
    // client side validation first
    if (this.clientValidation()) {
      track('Authentication', 'Reset', 'Failed client validation');
      return;
    }

    reset(this.getParameter('e'), this.getParameter('h'), this.password)
      .then((json) => {
        if (json.message) {
          this.showServerErrors(json);
          return;
        }
        track('Authentication', 'Reset', 'Success');
        this.props.uiSetGrunt(`Your password has been reset`);
        // we can sign in the user since we have their password and email
        this.props.userLogin(this.getParameter('e'), this.password)
          .then(user => {
            // close the form
            this.props.uiShowAuthenticationForm('none');
            this.props.projectOpen(null);
          })
          .catch((reason) => {
            // if the sign in failed just redirect to sign in
            this.props.uiShowAuthenticationForm('signin');
          });
      })
      .catch((reason) => {
        this.showServerErrors({
          message: reason.message || 'Unexpected error, please check your connection',
        });
        track('Authentication', 'Reset', 'Unexpected Error');
      });
  }

  // return a hash of the query strings
  getQueryStrings() {
    const assoc = {};
    const decode = (str) => {
      return decodeURIComponent(str.replace(/\+/g, ' '));
    };
    const queryString = location.search.substring(1);
    const keyValues = queryString.split('&');

    for (const i in keyValues) {
      if (keyValues.hasOwnProperty(i)) {
        const key = keyValues[i].split('=');
        if (key.length > 1) {
          assoc[decode(key[0])] = decode(key[1]);
        }
      }
    }
    return assoc;
  }

  // return a single named parameter from the query string
  getParameter(name) {
    return this.getQueryStrings()[name];
  }

  /**
   * basic validation occurs on client i.e. matching email addresses, Passwords
   * and all required fields present
   */
  clientValidation() {
    // reset all error messages
    const newState = Object.assign({}, errors);
    // parse individual problems and report

    if (!this.password) {
      newState.password1Error = { visible: true, text: 'Please enter a password' };
    }
    if (!this.passwordConfirm || this.password !== this.passwordConfirm) {
      newState.password2Error = { visible: true, text: 'Passwords do not match' };
    }

    // display appropriate errors
    this.setState(newState);
    // return true if there was an error
    return Object.keys(newState).find((key) => {
      return newState[key].visible;
    });
  }

  get password() {
    return this.refs.password.value.trim();
  }

  get passwordConfirm() {
    return this.refs.passwordConfirm.value.trim();
  }

  /**
   * display server errors in the most logical way
   */
  showServerErrors(json) {
    invariant(json && json.message, 'We expected an error message');
    // any unrecognized errors are displayed below the tos
    this.setState({
      password1Error: {
        visible: true,
        text: json.message,
      },
    });
  }

  render() {
    return (
      <form
        id="reset-form"
        className="gd-form authentication-form"
        onSubmit={this.onSubmit.bind(this)}>
        <div className="title">Reset Password</div>

        <div
          className={`error ${this.state.password1Error.visible ? 'visible' : ''}`}>{`${this.state.password1Error.text}`}</div>
        <input
          ref="password"
          type="password"
          className="input"
          placeholder="New password"/>
        <input
          ref="passwordConfirm"
          type="password"
          className="input"
          placeholder="Confirm new password"/>
        <div
          className={`error ${this.state.password2Error.visible ? 'visible' : ''}`}>{`${this.state.password2Error.text}`}</div>

        <button type="submit">Reset Password</button>
        <button
          type="button"
          onClick={() => {
            this.props.uiShowAuthenticationForm('none');
          }}>Cancel
        </button>
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
  userLogin,
  projectOpen,
})(RegisterForm);
