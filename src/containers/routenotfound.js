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
import React, {Component} from 'react';

import '../styles/404.css';

export default class RouteNotFound extends Component {
  render() {
    return (
      <div className="fourohfour">
        <div className="grid">

          <div className="row1">
            <span className="color-white size-medium font-regular">Autodesk</span>
            <span className="color-white size-medium font-bold">BioNano</span>
          </div>

          <div className="row2">
            <span className="color-white size-large font-light">Oops!&nbsp;</span>
            <span className="color-orange size-large font-light">Page not found.</span>
          </div>

          <div className="row3">
            <span className="color-gray size-small font-medium msg">We can't find this specific URL for some reason. Please check that it wasn't entered incorrectly by mistake, (hey, it happens!). If you are sure the URL is correct</span>
            <a className="color-blue size-small font-medium" href="https://forum.bionano.autodesk.com/t/resolving-page-not-found-errors">please check here for other possible solutions.</a>
          </div>

          <div className="image"></div>

        </div>


      </div>
    );
  }
}
