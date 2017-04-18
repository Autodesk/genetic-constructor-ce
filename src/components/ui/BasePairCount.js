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

import '../../styles/BasePairCount.css';

function formatCount(count) {
  if (!count) {
    return '0 bp';
  }
  const thresh = 1000;

  if (count < thresh) {
    return `${count} bp`;
  }

  const sizes = ['bp', 'kb', 'Mb', 'Gb', 'Tb'];
  const ind = Math.floor(Math.log(count) / Math.log(thresh));
  return `${parseFloat((count / Math.pow(thresh, ind))).toFixed(1)} ${sizes[ind]}`;
}

export default function BasePairCount({ count, ...rest }) {
  const formatted = formatCount(count);
  return (<span className="BasePairCount" {...rest}>{formatted}</span>);
}

BasePairCount.propTypes = {
  count: PropTypes.number.isRequired,
};
