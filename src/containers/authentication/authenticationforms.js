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
import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import ModalWindow from '../../components/modal/modalwindow';
import RegisterForm from '../../components/authentication/register';
import SignInForm from '../../components/authentication/signin';
import ForgotForm from '../../components/authentication/forgot';
import ResetForm from '../../components/authentication/reset';
import AccountForm from '../../components/authentication/account';
import { uiShowAuthenticationForm } from '../../actions/ui';

import '../../../src/styles/form.css';
import '../../../src/styles/authenticationforms.css';

class AuthenticationForms extends Component {
  static propTypes = {
    uiShowAuthenticationForm: PropTypes.func.isRequired,
    authenticationForm: PropTypes.string,
  };

  constructor() {
    super();
  }

  render() {
    let form;
    switch (this.props.authenticationForm) {
    case 'register' : form = <RegisterForm/>; break;
    case 'signin' : form = <SignInForm/>; break;
    case 'forgot' : form = <ForgotForm/>; break;
    case 'reset' : form = <ResetForm/>; break;
    case 'account' : form = <AccountForm/>; break;
    default: form = null; break;
    }

    return !form
      ?
      <noscript />
      :
      (
        <ModalWindow open
                     title="Auth Modal"
                     payload={form}
                     closeOnClickOutside
                     closeModal={(buttonText) => {
                       this.props.uiShowAuthenticationForm('none');
                     }}/>
      );
  }
}

function mapStateToProps(state) {
  return {
    authenticationForm: state.ui.modals.authenticationForm,
  };
}

export default connect(mapStateToProps, {
  uiShowAuthenticationForm,
})(AuthenticationForms);
