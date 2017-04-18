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
import React from 'react';
import { Router, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import store from './store/index';
import { Route, IndexRedirect, IndexRoute } from 'react-router';

import App from './containers/App';
import ProjectPage from './containers/ProjectPage';
import HomePage from './containers/homepage';
import RouteNotFound from './containers/routenotfound';
import AuthRouteWrapper from './components/authentication/authRouteWrapper';

const history = syncHistoryWithStore(browserHistory, store, {
  selectLocationState: (state) => state.router,
});

export default (
  <Router history={history}>
    <Route path="/" component={App}>

      {/* require authentication */}

      <Route component={AuthRouteWrapper}>
        <Route path="/homepage/account" component={HomePage}/>
        <Route path="/project/:projectId"
               component={ProjectPage}/>
      </Route>

      {/* do not require authentication */}

      <Route path="/homepage">
        <Route path=":comp" component={HomePage}/>
        <IndexRoute component={HomePage}/>
      </Route>
      <Route path="*" component={RouteNotFound}/>

      <IndexRedirect to="/homepage"/>

    </Route>
  </Router>
);
