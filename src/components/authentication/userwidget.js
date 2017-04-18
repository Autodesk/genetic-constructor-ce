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
import ReactDOM from 'react-dom';
import { push } from 'react-router-redux';
import PopupMenu from '../../components/Menu/PopupMenu';
import Vector2D from '../../containers/graphics/geometry/vector2d';
import { connect } from 'react-redux';
import { uiShowAuthenticationForm, uiSetGrunt, uiShowExtensionPicker } from '../../actions/ui';
import { userLogout } from '../../actions/user';
import track from '../../analytics/ga';

import '../../styles/userwidget.css';

class UserWidget extends Component {

  static propTypes = {
    uiShowAuthenticationForm: PropTypes.func.isRequired,
    uiShowExtensionPicker: PropTypes.func.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
    user: PropTypes.object,
    push: PropTypes.func.isRequired,
    userLogout: PropTypes.func.isRequired,
    userWidgetVisible: PropTypes.bool.isRequired,
  };

  constructor() {
    super();
    this.state = {
      menuOpen: false,
      menuPosition: new Vector2D(),
    };
  }

  onSignIn(evt) {
    evt.preventDefault();
    this.props.uiShowAuthenticationForm('signin');
  }

  onShowMenu() {
    const box = ReactDOM.findDOMNode(this).getBoundingClientRect();
    this.setState({
      menuOpen: true,
      menuPosition: new Vector2D(box.left - 200, box.top + box.height),
    });
  }

  closeMenu() {
    this.setState({
      menuOpen: false,
    });
  }

  signOut() {
    this.props.userLogout()
    .then(() => {
      track('Authentication', 'Sign Out', 'Success');
      // store is left with previous user projects and other issue. For now do a complete reload
      //this.props.push('/homepage');
      window.location = `${window.location.protocol}\\\\${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}\\homepage`;
    })
    .catch((reason) => {
      this.props.uiSetGrunt('There was a problem signing you out');
      track('Authentication', 'Sign Out', 'Failed');
    });
  }

  contextMenu() {
    return (<PopupMenu
      open={this.state.menuOpen}
      position={this.state.menuPosition}
      closePopup={this.closeMenu.bind(this)}
      menuItems={
        [
          {
            text: `${this.props.user.firstName} ${this.props.user.lastName}`,
            disabled: true,
            classes: 'blue-menu-items',
          },
          {
            text: 'Extension Settings',
            action: () => {
              this.props.uiShowExtensionPicker(true);
            },
          },
          {
            text: 'Account Settings',
            action: () => {
              this.props.uiShowAuthenticationForm('account');
            },
          },
          {
            text: 'Sign Out',
            action: this.signOut.bind(this),
          },
        ]
      }/>);
  }

  render() {
    if (!this.props.userWidgetVisible) {
      return null;
    }

    if (this.props.user.userid) {
      // signed in user
      return (
        <div className="userwidget">
          <div onClick={this.onShowMenu.bind(this)} className="signed-in">
            {this.props.user.firstName ? this.props.user.firstName.substr(0, 1) : '?'}</div>
          {this.contextMenu()}
        </div>
      );
    }
    // signed out user
    return (
      <div className="userwidget">
        <a className="signed-out" onClick={this.onSignIn.bind(this)}>SIGN IN</a>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    user: state.user,
    userWidgetVisible: state.ui.modals.userWidgetVisible,
  };
}

export default connect(mapStateToProps, {
  uiShowAuthenticationForm,
  uiShowExtensionPicker,
  uiSetGrunt,
  push,
  userLogout,
})(UserWidget);
