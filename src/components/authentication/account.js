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
import invariant from 'invariant';
import { userUpdate } from '../../actions/user';
import track from '../../analytics/ga';

/*
 * default visibility and text for error labels
 * @type {Object}
 */
const errors = {
  currentPasswordError: {
    visible: false,
    text: 'none',
  },
  nameError: {
    visible: false,
    text: 'none',
  },
  email1Error: {
    visible: false,
    text: 'none',
  },
  email2Error: {
    visible: false,
    text: 'none',
  },
  password1Error: {
    visible: false,
    text: 'none',
  },
  password2Error: {
    visible: false,
    text: 'none',
  },
  tosError: {
    visible: false,
    text: 'none',
  },
};

class AccountForm extends Component {

  static propTypes = {
    uiShowAuthenticationForm: PropTypes.func.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
    userUpdate: PropTypes.func.isRequired,
    user: PropTypes.object.isRequired,
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

    // if user hasn't changed name, email or added a new password
    // then just close the dialog
    if (this.firstName === this.props.user.firstName &&
        this.lastName === this.props.user.lastName &&
        !this.emailAddress &&
        !this.emailConfirm &&
        !this.password &&
        !this.passwordConfirm) {
      this.props.uiShowAuthenticationForm('none');
      return;
    }

    // client side validation first
    if (this.clientValidation()) {
      track('Authentication', 'Account', 'Failed client validation');
      return;
    }

    // most fields are optional except the current password
    const payload = {password: this.currentPassword};
    if (this.firstName) {
      payload.firstName = this.firstName;
    }
    if (this.lastName) {
      payload.lastName = this.lastName;
    }
    if (this.emailAddress) {
      payload.email = this.emailAddress;
    }
    if (this.password) {
      payload.newPassword = this.password;
    }

    this.props.userUpdate(payload)
      .then((user) => {
        // show grunt / close form
        this.props.uiSetGrunt(`Account updated to ${user.firstName} ${user.lastName} ( ${user.email} )`);
        this.props.uiShowAuthenticationForm('none');
        track('Authentication', 'Account', 'Success');
      })
      .catch((reason) => {
        const defaultMessage = 'Unexpected error, please check your connection';
        const { message = defaultMessage } = reason;
        this.showServerErrors({
          message,
        });
        track('Authentication', 'Account', message);
      });
  }

  /**
   * most fields are optional except current password. If password or email are supplied
   * the confirmation field must match.
   */
  clientValidation() {
    // reset all error messages
    const newState = Object.assign({}, errors);

    // parse individual problems and report
    if (!this.currentPassword) {
      newState.currentPasswordError = { visible: true, text: 'Current password not recognized as entered.'};
    }

    if (this.emailAddress && this.emailAddress !== this.emailConfirm) {
      newState.email2Error = { visible: true, text: 'The email addresses entered don\’t match.'};
    }

    if (this.password && this.password !== this.passwordConfirm) {
      newState.password2Error = { visible: true, text: 'The passwords entered don\’t match'};
    }

    // display appropriate errors
    this.setState(newState);
    // return true if there was an error
    return Object.keys(newState).find((key) => {
      return newState[key].visible;
    });
  }

  /**
   * display server errors in the most logical way
   */
  showServerErrors(json) {
    invariant(json && json.message, 'We expected an error message');
    if ((json.path === 'email' && json.type === 'unique violation') || json.message === 'Validation error') {
      this.setState({
        email1Error: {
          visible: true,
          text: 'That email address is already registered',
        },
      });
      return;
    }
    if (json.message === 'Authentication Failure') {
      this.setState({
        currentPasswordError: {
          visible: true,
          text: 'Current password not recognized as entered',
        },
      });
      return;
    }

    if (json.message === 'new password minimum length not met') {
      this.setState({
        password1Error: {
          visible: true,
          text: 'Passwords must be at least six characters.',
        },
      });
      return;
    }

    if (json.message === 'email domain is missing suffix' || json.message === 'email address is not valid') {
      this.setState({
        email1Error: {
          visible: true,
          text: 'Email address is not valid',
        },
      });
      return;
    }

    // any unrecognized errors are displayed below the passwords fields above the update button
    this.setState({
      password2Error: {
        visible: true,
        text: json.message,
      },
    });
  }

  // syntactic suger for fetcing values from inputs
  get firstName() {
    return this.refs.firstName.value.trim();
  }
  get lastName() {
    return this.refs.lastName.value.trim();
  }
  get emailAddress() {
    return this.refs.emailAddress.value.trim();
  }
  get emailConfirm() {
    return this.refs.emailConfirm.value.trim();
  }
  get currentPassword() {
    return this.refs.currentPassword.value.trim();
  }
  get password() {
    return this.refs.password.value.trim();
  }
  get passwordConfirm() {
    return this.refs.passwordConfirm.value.trim();
  }

  render() {
    return (
      <form
        id="account-form"
        className="gd-form authentication-form"
        onSubmit={this.onSubmit.bind(this)}>
        <div className="title">Account Settings</div>

        <input
          ref="currentPassword"
          type="password"
          className="input"
          placeholder="Enter your current password"/>
        <div className={`error ${this.state.currentPasswordError.visible ? 'visible' : ''}`}>{`${this.state.currentPasswordError.text}`}</div>

        <span className="left-label">Name</span>
        <input
          ref="firstName"
          className="input"
          placeholder="First Name"
          defaultValue={this.props.user.firstName}/>
        <input
          ref="lastName"
          className="input"
          placeholder="Last Name"
          defaultValue={this.props.user.lastName}/>
        <div className={`error ${this.state.nameError.visible ? 'visible' : ''}`}>{`${this.state.nameError.text}`}</div>

        <div className={`error ${this.state.email1Error.visible ? 'visible' : ''}`}>{`${this.state.email1Error.text}`}</div>
        <span className="left-label">Email address</span>
        <input
          ref="emailAddress"
          className="input"
          placeholder="New email address"/>
        <input
          ref="emailConfirm"
          className="input"
          placeholder="Confirm new email address"/>
        <div className={`error ${this.state.email2Error.visible ? 'visible' : ''}`}>{`${this.state.email2Error.text}`}</div>

        <div className={`error ${this.state.password1Error.visible ? 'visible' : ''}`}>{`${this.state.password1Error.text}`}</div>
        <span className="left-label">Change Password</span>
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
        <div className={`error ${this.state.password2Error.visible ? 'visible' : ''}`}>{`${this.state.password2Error.text}`}</div>

        <button type="submit">Update Account</button>
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
  return {
    user: state.user,
  };
}

export default connect(mapStateToProps, {
  uiShowAuthenticationForm,
  uiSetGrunt,
  userUpdate,
})(AccountForm);
