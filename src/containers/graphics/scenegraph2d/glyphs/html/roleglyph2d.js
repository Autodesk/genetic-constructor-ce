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
import { setAttribute } from '../../../utils';

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
    // possible role symbol, the div is a container for a SVG which we will clone
    // and style from an in document template
    this.svgContainer = document.createElement('div');
    this.svgContainer.className = 'role-icon';
    this.el.appendChild(this.svgContainer);
    // possible child indicator
    this.triangle = document.createElement('div');
    this.triangle.className = 'nw-triangle';
    this.el.appendChild(this.triangle);
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
    this.el.style.border = sw ? `${sw}px solid ${this.node.stroke}` : 'none';
    if (this.node.roleName) {
      if (this.roleName !== this.node.roleName) {
        this.roleName = this.node.roleName;
        // remove existing svg
        while (this.svgContainer.firstChild) {
          this.svgContainer.removeChild(this.svgContainer.firstChild);
        }
        this.svgContainer.style.display = 'none';
        // clone the appropriate template
        const templateId = `sbol-svg-${this.roleName}`;
        const template = document.getElementById(templateId);
        if (template) {
          const svg = template.cloneNode(true);
          // ensure svg is stroked in black
          setAttribute(svg, 'stroke', '#1D222D', true);
          // remove the ID attribute from the clone to avoid duplicates
          svg.removeAttribute('id');
          // add to the container
          this.svgContainer.appendChild(svg);
          // display the svg
          this.svgContainer.style.display = 'block';
        } else {
          // unrecognised role symbol
          this.svgContainer.style.display = 'none';
        }
      }
      // update geometry of container
      this.svgContainer.style.left = (this.node.width - kT.roleIcon - 2 - kT.contextDotsW) + 'px';
      this.svgContainer.style.top = (this.node.height / 2 - kT.roleIcon / 2) + 'px';
      this.svgContainer.style.width = kT.roleIcon + 'px';
    } else {
      this.svgContainer.style.display = 'none';
    }
    this.triangle.style.display = this.node.hasChildren ? 'block' : 'none';
  }
}
