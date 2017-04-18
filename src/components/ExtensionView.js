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
import extensionRegistry, { validRegion, downloadAndRender } from '../extensions/clientRegistry';
import { isEqual } from 'lodash';

import Spinner from './ui/Spinner';

import '../styles/ExtensionView.css';

export default class ExtensionView extends Component {
  static propTypes = {
    region: function regionPropValidator(props, name) {
      if (!validRegion(props[name])) {
        return new Error(`invalid region provided to ExtensionView, got ${props[name]}`);
      }
    },
    extension: function regionPropValidator(props, name) {
      const extension = props[name];
      if (!extensionRegistry[extension]) {
        return new Error(`invalid extension key, got ${extension}`);
      }
    },
    //isVisible is required so tha the extension unmounts properly (with this component)
    isVisible: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    isVisible: true,
  };

  constructor() {
    super();
    this.callback = null;
  }

  state = {
    downloaded: false,
    hasError: null,
  };

  componentDidMount() {
    this.renderExtension();
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.extension !== nextProps.extension) {
      this.setState({
        downloaded: false,
        hasError: null,
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !isEqual(this.props, nextProps) || !isEqual(this.state, nextState);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.extension !== this.props.extension) {
      this.unmountExtension();
      this.renderExtension();
    }
  }

  componentWillUnmount() {
    this.unmountExtension();
  }

  //when extension changes or unmount, call unregister handler if we have one
  unmountExtension() {
    if (typeof this.callback === 'function') {
      try {
        this.callback();
      } catch (err) {
        console.log('error on unregister callback'); //eslint-disable-line no-console
        console.error(err); //eslint-disable-line no-console
      }
    }
    this.callback = null;
  }

  renderExtension() {
    const { region, extension } = this.props;

    //clear contents
    this.element.innerHTML = '';

    if (!extension) {
      return;
    }

    //wait till next tick so DOM ready etc.
    setTimeout(() => {
      try {
        const boundingBox = this.element.getBoundingClientRect();

        downloadAndRender(extension, region, this.element, { boundingBox })
          .then(unregister => {
            //todo - better handle scenario of extension loaded but not rendered (i.e. callback not yet set) - want to unregister immediately
            this.callback = unregister;
            this.setState({
              downloaded: true,
              hasError: null,
            });
          })
          .catch(err => {
            this.setState({
              downloaded: true,
              hasError: err,
            });
          });
      } catch (err) {
        console.error('error loading / rendering extension ' + extension); //eslint-disable-line no-console
        throw err;
      }
    });
  }

  //todo - better error handling for extension loading + the status / default text
  render() {
    const { extension, isVisible } = this.props;
    const { downloaded, hasError } = this.state;

    if (!extension) {
      return null;
    }

    let overlayContent = null;

    if (!downloaded) {
      overlayContent = <Spinner />;
    } else if (!!hasError) {
      overlayContent = (<div className="ExtensionView-error">
        <p>There was an error rendering the extension</p>
        <div className="ExtensionView-error-stack">{hasError.stack}</div>
      </div>);
    }

    return (
      <div className={'ExtensionView' + (isVisible ? ' visible' : '')}>
        {overlayContent}
        <div className="ExtensionView-content"
             key={extension}
             ref={(el) => {
               if (el) {
                 this.element = el;
               }
             }}>
        </div>
      </div>
    );
  }
}
