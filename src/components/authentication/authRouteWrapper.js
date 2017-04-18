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
import { withRouter } from 'react-router';

class AuthRouteWrapper extends Component {
  static propTypes = {
    userid: PropTypes.string,
    children: PropTypes.object,
    router: PropTypes.object.isRequired,
  };

  render() {
    if (!!this.props.userid) {
      return React.Children.only(this.props.children);
    }

    //redirect them to the homepage
    this.props.router.push('/homepage');

    //empty component until redirected
    return null;
  }
}

function mapStateToProps(state) {
  return {
    userid: state.user.userid,
  };
}

export default withRouter(connect(mapStateToProps)(AuthRouteWrapper));
