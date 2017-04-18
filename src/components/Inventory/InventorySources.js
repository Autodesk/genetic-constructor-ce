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
import PopupMenu from '../Menu/PopupMenu';
import '../../styles/InventorySources.css';

//note - this is reset on hot-reloads, but shouldnt matter in production
let position = {};

export default function InventorySources({ toggling, sourceList, registry, onSourceToggle, onToggleVisible }) {
  const menuItems = [
    {
      text: 'Search Sources:',
      disabled: true,
      action: () => {},
    },
    ...(Object.keys(registry)
      .filter(key => typeof registry[key].search === 'function')
      .map(key => {
        const source = registry[key];
        return {
          text: source.name,
          action: (evt) => {
            evt.stopPropagation();
            onSourceToggle(key);
          },
          checked: sourceList.indexOf(key) >= 0,
        };
      })),
  ];

  return (
    <div className={'InventorySources' + (toggling ? ' expanded' : '')}
         onClick={() => onToggleVisible()}
         ref={(el) => {
           if (el) {
             const {top: y, left: x} = el.getBoundingClientRect();
             position = {x, y};
           }
         }}>
      <div className="InventorySources-back">
        <div className="InventorySources-back-cog"></div>
        <div className="InventorySources-back-sources">
          <span>{`Sources: ${sourceList.filter(source => registry[source]).map(source => registry[source].name).join(', ')}`}</span>
        </div>
      </div>
      <PopupMenu open={toggling}
                 closePopup={() => onToggleVisible()}
                 position={position}
                 menuItems={menuItems}/>
    </div>
  );
}

InventorySources.propTypes = {
  toggling: PropTypes.bool.isRequired,
  registry: PropTypes.object.isRequired,
  sourceList: PropTypes.array.isRequired,
  onToggleVisible: PropTypes.func.isRequired,
  onSourceToggle: PropTypes.func.isRequired,
};
