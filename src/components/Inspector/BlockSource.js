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
import { registry } from '../../inventory/registry';

import '../../styles/BlockSource.css';

export default function BlockSource({ block, ...rest }) {
  const { source } = block;
  const sourceKey = source.source;

  if (!sourceKey) {
    return (<span>Unknown Source</span>);
  }

  const knownUrl = source.url || null;
  const registrySource = registry[sourceKey];

  //if the source is not registered with the running app... just show static text
  if (!registrySource && !knownUrl) {
    return (<span>{sourceKey}</span>);
  }

  const name = registrySource ? registrySource.name : sourceKey;
  const computedUrl = (registrySource && typeof registrySource.sourceUrl === 'function') ?
    registrySource.sourceUrl(source)
    : null;

  const url = knownUrl || computedUrl;

  //note - use key to force re=render when href is removed. React v15 uses removeAttribute and will handle this, can remove when upgrade.
  return (<a className="BlockSource"
             href={url}
             key={url ? 'y' : 'n'}
             target="_blank" {...rest}>
    <span className="BlockSource-name">{name}</span>
    {url && (<span className="BlockSource-icon"/>)}
  </a>);
}

BlockSource.propTypes = {
  block: PropTypes.shape({
    source: PropTypes.object.isRequired,
  }).isRequired,
};
