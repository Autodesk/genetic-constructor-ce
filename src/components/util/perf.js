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

import { createElement } from 'react';
import ReactPerf from 'react-addons-perf';

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

function getNow() {
  if (window && window.performance) {
    return window.performance.now();
  }
  return +Date.now();
}

/**
 * @private
 * Higher order component to track performance of a React component's render() using ReactPerf addon + performance.now()
 * Can be used as decorator
 *
 * @param  {ReactComponent} Component
 * @return {ReactComponent}
 */
export default function perf(Component) {
  if (process.env.NODE_ENV !== 'production') {
    class Perf extends Component {
      constructor(props, context) {
        super(props, context);
        this.mounted = getNow();
      }

      componentWillUpdate() {
        ReactPerf.start();
        this.start = getNow();
      }

      componentDidUpdate() {
        this.end = getNow();
        const time = this.end - this.start;
        const groupName = getDisplayName(Component);
        ReactPerf.stop();

        console.groupCollapsed(groupName + ' - ' + time); //eslint-disable-line no-console

        const measurements = ReactPerf.getLastMeasurements();
        ReactPerf.printExclusive(measurements);
        ReactPerf.printWasted(measurements);

        console.groupEnd(); //eslint-disable-line no-console
      }

      getWrappedInstance() {
        return this.refs.wrappedInstance;
      }

      render() {
        this.renderedElement = createElement(Component, {
          ...this.props,
          ref: 'wrappedInstance',
        });

        return this.renderedElement;
      }
    }

    Perf.displayName = `Perf(${getDisplayName(Component)})`;
    Perf.WrappedComponent = Component;

    return Perf;
  }

  return Component;
}
