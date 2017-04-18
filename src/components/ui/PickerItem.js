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
import RoleSvg from '../RoleSvg';

export default function PickerItem(props) {
  const { readOnly, isCurrent, svg, name, styles, onClick, onMouseEnter, onMouseOut } = props;

  return (<a className={'Picker-item' +
                        (isCurrent ? ' active' : '') +
                        (readOnly ? ' readOnly' : '')}
             alt={name}
             title={name}
             style={styles}
             onMouseEnter={(evt) => onMouseEnter(evt)}
             onMouseOut={evt => onMouseOut(evt)}
             onClick={(evt) => onClick(evt)}>
      {svg && (<RoleSvg stroke={0.5}
                        width="100%"
                        height="100%"
                        color="white"
                        symbolName={svg}
                        key={svg}/>)}
    </a>
  );
}

PickerItem.propTypes = {
  readOnly: PropTypes.bool,
  isCurrent: PropTypes.bool,
  styles: PropTypes.object,
  svg: PropTypes.string,
  name: PropTypes.string,
  onClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseOut: PropTypes.func,
};

PickerItem.defaultProps = {
  readOnly: false,
  isCurrent: false,
  onMouseEnter: () => {},
  onClick: () => {},
  onMouseOut: () => {},
};
