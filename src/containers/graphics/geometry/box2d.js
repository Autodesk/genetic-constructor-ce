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
import Vector2D from './vector2d';
import Line2D from './line2d';

export default class Box2D {
  /**
   * flexible axis aligned box class. Can be initialized with almost any
   * reasonable values or object i.e. 4 numbers, an object with a combination
   * or x,y,w,h,l,t,r,b,left,top,right,bottom,width,height
   * @param [x]
   * @param [y]
   * @param [w]
   * @param [h]
   * @constructor
   */
  constructor(x, y, w, h) {
    // parse arguments
    if (arguments.length === 4) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
    } else {
      if (arguments.length === 1) {
        // map the properties ( keys ), if present, to our
        // named property ( the values )
        this.extend(arguments[0], {
          x: 'x',
          left: 'x',
          y: 'y',
          top: 'y',
          w: 'w',
          h: 'h',
          width: 'w',
          height: 'h',
          right: 'r',
          bottom: 'b',
          r: 'r',
          b: 'b',
        });
      } else {
        if (arguments.length === 0) {
          this.x = this.y = this.w = this.h = 0;
        } else {
          throw new Error('Bad parameters');
        }
      }
    }
  }

  /**
   * extend ourselves with any of the property names in props,
   * renaming them to the given target property name
   */
  extend(from, props) {
    for (const key in props) {
      // hasOwnProperty fails on ClientRect, plus this ensures its a number
      if (from[key] === +from[key]) {
        this[props[key]] = from[key];
      }
    }
  }

  /**
   * simple toString 4 CSV values
   * @returns {*}
   */
  toString() {
    return `${this.x}, ${this.y}, ${this.w}, ${this.h}`;
  }

  /**
   * construct a box from a string, opposite of toString
   */
  static fromString(str) {
    invariant(str, 'Bad parameter');
    const values = str.split(',');
    invariant(values && values.length === 4, 'Unexpected format');
    return new Box2D(parseFloat(values[0]), parseFloat(values[1]), parseFloat(values[2]), parseFloat(values[3]));
  }

  /**
   * return an AABB defined by the limits of this point
   * and another point
   * @param  {Vector2D} ary
   * @return {Box2D}
   */
  static boxFromPoints(ary) {
    let xmin = Number.MAX_VALUE;
    let ymin = Number.MAX_VALUE;
    let xmax = -Number.MAX_VALUE;
    let ymax = -Number.MAX_VALUE;

    for (let i = 0; i < ary.length; i += 1) {
      xmin = Math.min(xmin, ary[i].x);
      ymin = Math.min(ymin, ary[i].y);
      xmax = Math.max(xmax, ary[i].x);
      ymax = Math.max(ymax, ary[i].y);
    }

    return new Box2D(xmin, ymin, xmax - xmin, ymax - ymin);
  }

  /**
   * accessors for all corners, edges of the box
   */
  get left() {
    return this.x;
  }

  set left(_x) {
    this.x = _x;
  }

  get width() {
    return this.w;
  }

  set width(_w) {
    this.w = _w;
  }

  get height() {
    return this.h;
  }

  set height(_h) {
    this.h = _h;
  }

  get top() {
    return this.y;
  }

  set top(_y) {
    this.y = _y;
  }

  get right() {
    return this.x + this.w;
  }

  set right(_r) {
    this.w = _r - this.x;
  }

  get bottom() {
    return this.y + this.h;
  }

  set bottom(_b) {
    this.h = _b - this.y;
  }

  get cx() {
    return this.x + this.w / 2;
  }

  set cx(_cx) {
    this.x = _cx - this.w / 2;
  }

  get cy() {
    return this.y + this.h / 2;
  }

  set cy(_cy) {
    this.y = _cy - this.h / 2;
  }

  get center() {
    return new Vector2D(this.cx, this.cy);
  }

  set center(vector) {
    this.cx = vector.x;
    this.cy = vector.y;
  }

  get topLeft() {
    return new Vector2D(this.x, this.y);
  }

  set topLeft(vector) {
    this.x = vector.x;
    this.y = vector.y;
  }

  get topRight() {
    return new Vector2D(this.right, this.y);
  }

  set topRight(vector) {
    this.right = vector.x;
    this.y = vector.y;
  }

  get bottomRight() {
    return new Vector2D(this.right, this.bottom);
  }

  set bottomRight(vector) {
    this.right = vector.x;
    this.bottom = vector.y;
  }

  get bottomLeft() {
    return new Vector2D(this.x, this.bottom);
  }

  set bottomLeft(vector) {
    this.x = vector.x;
    this.bottom = vector.y;
  }

  /**
   * return a cloned copy of this
   * @return Box2D
   */
  clone() {
    return new Box2D(this.x, this.y, this.w, this.h);
  }

  /**
   * normalize by returning a new box with positive extents
   */
  normalize() {
    return new Box2D(
      Math.min(this.x, this.right),
      Math.min(this.y, this.bottom),
      Math.abs(this.w),
      Math.abs(this.h)
    );
  }

  /**
   * return a new Box inflated by the given signed amount
   * @param {number} inflateX
   * @param {number} inflateY
   */
  inflate(inflateX, inflateY) {
    const box = new Box2D(this.x, this.y, this.w + inflateX * 2, this.h + inflateY * 2);
    box.cx = this.cx;
    box.cy = this.cy;
    return box;
  }

  /**
   * scale width/height of box around center returning a new box
   * @param x
   * @param y
   */
  scale(x, y) {
    return new Box2D(
      this.cx - (this.width * x) / 2,
      this.cy - (this.height * y) / 2,
      this.width * x,
      this.height * y);
  }

  /**
   * return a new box that is this box * e
   * @param multiplier
   */
  multiply(multiplier) {
    return new Box2D(this.x * multiplier, this.y * multiplier, this.width * multiplier, this.height * multiplier);
  }

  /**
   * return a new box that is this box / e
   * @param divisor
   */
  divide(divisor) {
    return new Box2D(this.x / divisor, this.y / divisor, this.width / divisor, this.height / divisor);
  }

  /**
   * return true if this box is identical to another box
   * @param other
   * @returns {boolean}
   */
  equals(other) {
    return other.x === this.x &&
      other.y === this.y &&
      other.width === this.width &&
      other.height === this.height;
  }

  /**
   * return a new box that is the union of this box and some other box/rect like object
   * @param box - anything with x,y,w,h properties
   * @returns Box2D - the union of this and box
   */
  union(box) {
    const uni = new Box2D(
      Math.min(this.x, box.x),
      Math.min(this.y, box.y),
      0, 0
    );

    uni.right = Math.max(this.right, box.x + box.w);
    uni.bottom = Math.max(this.bottom, box.y + box.h);

    return uni;
  }

  /**
   * get the nth edge
   * 0: top left -> top right
   * 1: top right -> bottom right
   * 2: bottom right -> bottom left
   * 3: bottom left -> top left
   * @param {Number} nth
   */
  getEdge(nth) {
    invariant(nth >= 0 && nth < 4, 'Bad parameter');
    switch (nth) {
    case 0:
      return new Line2D(new Vector2D(this.x, this.y), new Vector2D(this.right, this.y));
    case 1:
      return new Line2D(new Vector2D(this.right, this.y), new Vector2D(this.right, this.bottom));
    case 2:
      return new Line2D(new Vector2D(this.right, this.bottom), new Vector2D(this.x, this.bottom));
    default:
      return new Line2D(new Vector2D(this.x, this.bottom), new Vector2D(this.x, this.y));
    }
  }

  /**
   * return the union of the given boxes or an empty box if the list is empty
   * @static
   */
  static union(boxes) {
    const uni = new Box2D(0, 0, 0, 0);

    if (boxes && boxes.length) {
      uni.x = Math.min.apply(null, boxes.map(box => box.x));
      uni.y = Math.min.apply(null, boxes.map(box => box.y));
      uni.r = Math.min.apply(null, boxes.map(box => box.r));
      uni.b = Math.min.apply(null, boxes.map(box => box.b));
    }
    return uni;
  }

  /**
   * return the intersection of this box with the other box
   * @param box
   */
  intersectWithBox(box) {
    // minimum of right edges
    const minx = Math.min(this.right, box.right);
    // maximum of left edges
    const maxx = Math.max(this.x, box.x);
    // minimum of bottom edges
    const miny = Math.min(this.bottom, box.bottom);
    // maximum of top edges
    const maxy = Math.max(this.y, box.y);
    // if area is greater than zero there is an intersection
    if (maxx < minx && maxy < miny) {
      const x = Math.min(minx, maxx);
      const y = Math.min(miny, maxy);
      const w = Math.max(minx, maxx) - x;
      const h = Math.max(miny, maxy) - y;
      return new Box2D(x, y, w, h);
    }
    return null;
  }

  /**
   * shortest orthogonal distance between the x/y extents of the boxes.
   * Basically compares left/right edges and top/bottom edges to find the closest.
   */
  proximityX(other) {
    return Math.abs(this.center.x - other.center.x);
  }

  proximityY(other) {
    return Math.abs(this.center.y - other.center.y);
  }

  /**
   * return true if we are completely inside the other box
   * @param other
   */
  isInside(other) {
    return this.x >= other.x &&
      this.y >= other.y &&
      this.right <= other.right &&
      this.bottom <= other.bottom;
  }

  /**
   * return true if the given point ( anything with x/y properties ) is inside the box
   * @param point
   */
  pointInBox(point) {
    return point.x >= this.x && point.y >= this.y && point.x < this.right && point.y < this.bottom;
  }

  /**
   * return true if the box have zero or negative extents in either axis
   */
  isEmpty() {
    return this.w <= 0 || this.h <= 0;
  }
}
