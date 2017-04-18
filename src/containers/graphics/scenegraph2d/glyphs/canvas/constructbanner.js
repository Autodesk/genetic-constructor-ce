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

export default class ConstructBanner extends Glyph2D {

  /**
   * Simple HTML based rectangle. The only complexity is that we carefully
   * adjust the size to accomodate the stroke ( which is rendered using a border property).
   * HTML borders are either inside or outside the elenent, for compatibility
   * with canvas/svg with make the border straddle the edges.
   * @param {Node2D} node - the node for which we render ourselves
   */
  constructor(node) {
    super(node);
    this.el = document.createElement('canvas');
    this.el.className = 'canvas-glyph';
    this.node.el.appendChild(this.el);
    this.ctx = this.el.getContext('2d');
  }

  /**
   * render into our bounds
   */
  update() {
    // update size
    this.el.width = this.node.width;
    this.el.height = this.node.height;
    // draw horizontal line
    this.ctx.strokeStyle = 'gray';
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(this.node.width, 0);
    this.ctx.stroke();

    // draw triangle
    this.ctx.fillStyle = this.node.fill;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(this.node.height, 0);
    this.ctx.lineTo(0, this.node.height);
    this.ctx.closePath();
    this.ctx.fill();
  }
}
