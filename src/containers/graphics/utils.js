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
import * as validators from '../../schemas/fields/validators';
import safeValidate from '../../schemas/fields/safeValidate';

export const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

export const rad2deg = (rad) => {
  return rad * (180 / Math.PI);
};

export const isRealNumber = safeValidate.bind(null, validators.number({reals: true}), false);

/**
 * true if ~1
 * @param  {number} val
 * @return {boolean}
 */
export const isOne = (val) => {
  return Math.abs(1 - val) <= 1e-6;
};

/**
 * index of child in parent
 *
 *
 */
export const nodeIndex = (node) => {
  if (!node.parentNode) {
    return -1;
  }
  let i = 0;
  while (i < node.parentNode.children.length) {
    if (node.parentNode.children[i] === node) {
      return i;
    }
    i += 1;
  }
};

/**
 * true if ~0
 * @param  {number} val
 * @return {boolean}
 */
export const isZero = (val) => {
  return Math.abs(val) <= 1e-6;
};

/**
 * true if the number v is very close to K
 * @param  {number} v1
 * @param  {number} v2
 * @return {boolean}
 */
export const nearly = (v1, v2) => {
  return Math.abs(v1 - v2) < 1e-6;
};


/**
 * set the attribute on the given element AND all children.
 * Optionally uses the setAttributeNS method. The attribute is only
 * applied to element that already have the attribute.
 * Primary usage is changing the fill / stroke of SVG elements e.g
 *
 * setAttribute(someSVG, 'fill', 'dodgerblue', true);
 *
 */
export const setAttribute = (element, attributeName, attributeValue, useNS = false) => {
  // get child elements with this attribute as an array
  const matches = Array.prototype.slice.call(element.querySelectorAll(`[${attributeName}]`));
  // add the element itself if necessary
  if (useNS ? element.hasAttributeNS(null, attributeName) : element.hasAttribute(attributeName)) {
    matches.push(element);
  }
  matches.forEach(el => {
    if (useNS) {
      el.setAttributeNS(null, attributeName, attributeValue);
    } else {
      el.setAttribute(attributeName, attributeValue);
    }
  });
};
