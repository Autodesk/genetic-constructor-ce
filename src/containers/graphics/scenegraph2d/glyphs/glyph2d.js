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
import invariant from 'invariant';

/**
 * base class for all glyphs.
 */
export default class Glyph2D {

  /**
   * base class for all glyphs
   * @param {Node2D} node - the node for which we render ourselves
   */
  constructor(node) {
    invariant(node, 'Expected a parent node');
    this.node = node;
  }

  /**
   * you can't update the base class
   *
   */
  update() {
    invariant(false, 'Inheriting class must define the render method');
  }
}
