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

export default class LineGlyph2D extends Glyph2D {

  constructor(node) {
    super(node);
    this.el = document.createElement('div');
    this.el.style.position = 'absolute';
    this.el.style.display = 'inline-block';
    this.node.el.appendChild(this.el);
  }

  /**
   * render latest changes
   */
  update() {
    // update size and color
    this.el.style.width = this.node.width + 'px';
    this.el.style.height = this.node.height + 'px';
    this.el.style.backgroundColor = this.node.stroke;
  }
}
