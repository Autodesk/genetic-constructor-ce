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
import Glyph2D from '../glyph2d';
import kT from '../../../views/layoutconstants';

export default class RoleGlyph2D extends Glyph2D {

  /**
   * represents a block with, possibly an SBOL symbol and a context menu
   * that is shown only on hover.
   */
  constructor(node) {
    super(node);
    // basic div block
    this.el = document.createElement('div');
    this.el.className = 'glyph';
    // dot selector
    this.dot = document.createElement('div');
    this.dot.className = 'listSelected';

    this.dot.style.top = (kT.optionH / 2 - kT.optionDotS / 2) + 'px';
    this.dot.style.left = kT.optionDotL + 'px';
    this.dot.style.width = this.dot.style.height = kT.optionDotS + 'px';
    this.el.appendChild(this.dot);
    // add our outer container to the node element
    this.node.el.appendChild(this.el);
  }

  /**
   * render latest changes
   */
  update() {
    // basic rectangle
    const sw = this.node.strokeWidth;
    this.el.style.left = -(sw / 2) + 'px';
    this.el.style.top = -(sw / 2) + 'px';
    this.el.style.width = (this.node.width + sw) + 'px';
    this.el.style.height = (this.node.height + sw) + 'px';
    this.el.style.backgroundColor = this.node.fill;

    this.el.style.borderLeft = sw ? `${sw}px solid ${this.node.stroke}` : 'none';
    this.el.style.borderRight = sw ? `${sw}px solid ${this.node.stroke}` : 'none';

    this.dot.style.visibility = this.node.optionSelected ? 'visible' : 'hidden';
  }
}
