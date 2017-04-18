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
import Line2D from '../geometry/line2d';
import Node2D from './node2d';
/**
 * a simple canvas based line class
 */
export default class Line extends Node2D {
  constructor(props) {
    super(Object.assign({
      glyph: 'line',
      stroke: 'red',
      strokeWidth: 10,
      line: new Line2D(),
    }, props));
  }

  update() {
    // width is length of line, height is thickness
    this.width = this.line.len();
    this.height = Math.max(1, this.strokeWidth);

    // mid point of line is our translation
    const position = this.line.pointOnLine(0.5);
    this.translateX = position.x;
    this.translateY = position.y;

    // rotation is angle between end points
    this.rotate = this.line.start.angleBetween(this.line.end);

    // base class
    const el = Node2D.prototype.update.call(this);
    return el;
  }
}
