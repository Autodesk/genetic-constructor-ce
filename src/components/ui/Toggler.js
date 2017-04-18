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
import React, { PropTypes } from 'react';

const serializer = navigator.userAgent.indexOf('Node.js') < 0 ? new XMLSerializer() : {
  serializeToString: () => {return '<SVG/>';},
};

import '../../styles/Toggler.css';

export default function Toggler({ onClick, hidden, open, disabled, style }) {
  if (hidden) {
    //todo - in React v15, can return null
    return <noscript />;
  }

  const handleClick = (evt) => {
    if (!disabled) {
      onClick(evt);
    }
  };

  const templateId = `disclosure_triangle_closed`;
  const template = document.getElementById(templateId);
  const svg = template.cloneNode(true);
  svg.removeAttribute('id');

  const markup = serializer.serializeToString(svg);

  return (<div className={'Toggler' +
                           (disabled ? ' disabled' : '') +
                           (open ? ' open' : '')}
              style={style}
              onClick={handleClick}
              dangerouslySetInnerHTML={{__html: markup}}></div>);
}

Toggler.propTypes = {
  onClick: PropTypes.func,
  style: PropTypes.object,
  open: PropTypes.bool,
  disabled: PropTypes.bool,
  hidden: PropTypes.bool,
};

Toggler.defaultProps = {
  onClick: () => {},
  style: {},
  hidden: false,
  open: false,
  disabled: false,
};
