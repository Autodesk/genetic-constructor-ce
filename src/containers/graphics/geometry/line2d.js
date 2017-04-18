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
import Intersection2D from './intersection2d';

//shallow hasOwnProperty check
const hasProp = (obj, prop) => {
  return obj.hasOwnProperty(prop);
};

export default class Line2D {

  /**
   * a line composed of a start and end point
   * @constructor
   * @param {Vector2D} start
   * @param {Vector2D} end
   */
  constructor(start, end) {
    switch (arguments.length) {
    case 0:
      this._start = new Vector2D();
      this._end = new Vector2D();
      break;

    case 1:
      invariant(hasProp(start, 'x1') && hasProp(start, 'y1') && hasProp(start, 'x2') && hasProp(start, 'y2'), 'Bad parameter');
      this._start = new Vector2D(start.x1, start.y1);
      this._end = new Vector2D(start.x2, start.y2);
      break;

    case 2:
      this._start = start.clone();
      this._end = end.clone();
      break;

    case 4:
      this._start = new Vector2D(arguments[0], arguments[1]);
      this._end = new Vector2D(arguments[2], arguments[3]);
      break;

    default:
      throw new Error('Bad parameters');
    }
  }

  /**
   * getter for start of line
   * @return {Vector2D} [description]
   */
  get start() {
    return this._start.clone();
  }
  /**
   * setter for start
   * @param  {Vector2D} vector
   */
  set start(vector) {
    this._start = vector.clone();
  }

  /**
   * getter for end of line
   * @return {Vector2D} [description]
   */
  get end() {
    return this._end.clone();
  }
  /**
   * setter for end
   * @param  {Vector2D} vector
   */
  set start(vector) {
    this._end = vector.clone();
  }

  /**
   * getter for x start
   * @return {number}
   */
  get x1() {
    return this.start.x;
  }
  /**
   * getter for y start
   * @return {number}
   */
  get y1() {
    return this.start.y;
  }

  /**
   * getter for x end
   * @return {number}
   */
  get x2() {
    return this.end.x;
  }

  /**
   * getter for y end
   * @return {number}
   */
  get y2() {
    return this.end.y;
  }

  /**
   * clone the line
   * @return {Line2D}
   */
  clone() {
    return new Line2D(this.start, this.end);
  }

  /**
   * JSONable version of object
   * @return object
   */
  toObject() {
    return {
      start: this.start.toObject(),
      end: this.end.toObject(),
    };
  }

  /**
   * static constructor, produces a Line from the product of toObject
   * @param  {Object} obj
   * @return Line2D
   */
  static fromObject(obj) {
    invariant(obj && obj.start && obj.end, 'Bad parameter');
    return new Line2D(Vector2D.fromObject(obj.start), Vector2D.fromObject(obj.end));
  }

  /**
   * return length of line
   * return number
   */
  len() {
    const xl = this.x2 - this.x1;
    const yl = this.y2 - this.y1;
    return Math.sqrt(xl * xl + yl * yl);
  }

  /**
   * return the slope of the line. Returns infinity if the line is vertical
   * @return {number} [description]
   */
  slope() {
    const xd = (this.start.x - this.end.x);
    if (xd === 0) {
      return Infinity;
    }
    return (this.start.y - this.end.y) / xd;
  }

  /**
   * distance of point to line segment formed by this.start, this.end squared.
   * @param {Vector2D} point
   * @return {number} [description]
   */
  distanceToSegment(point) {
    return Math.sqrt(this.distanceToSegmentSquared(point));
  }

  /**
   * return the squared distance of the point to this line
   * @param  {Vector2D} point
   * @return {number}
   */
  distanceToSegmentSquared(point) {
    function sqr(xp) {
      return xp * xp;
    }
    function dist2(p1, p2) {
      return sqr(p1.x - p2.x) + sqr(p1.y - p2.y);
    }
    const startv = this.start;
    const endv = this.end;
    const l2 = dist2(startv, endv);
    if (l2 === 0) {
      return dist2(point, startv);
    }
    const dst = ((point.x - startv.x) * (endv.x - startv.x) + (point.y - startv.y) * (endv.y - startv.y)) / l2;
    if (dst < 0) {
      return dist2(point, startv);
    }
    if (dst > 1) {
      return dist2(point, endv);
    }
    return dist2(point, {
      x: startv.x + dst * (endv.x - startv.x),
      y: startv.y + dst * (endv.y - startv.y),
    });
  }


  /**
   * parametric point on line
   * @param {number} point
   */
  pointOnLine(point) {
    const x = this.x1 + (this.x2 - this.x1) * point;
    const y = this.y1 + (this.y2 - this.y1) * point;
    return new Vector2D(x, y);
  }

  /**
   * intersection of this line with another line. This is really line segment intersection since
   * it considers the lines finite as defined by their end points

   * @param {Line2D} other - other line segment to intersect with
   * @returns {Intersection2D}
   */
  intersectWithLine(other) {
    let result;
    const uaT = (other.x2 - other.x1) * (this.y1 - other.y1) - (other.y2 - other.y1) * (this.x1 - other.x1);
    const ubT = (this.x2 - this.x1) * (this.y1 - other.y1) - (this.y2 - this.y1) * (this.x1 - other.x1);
    const uB = (other.y2 - other.y1) * (this.x2 - this.x1) - (other.x2 - other.x1) * (this.y2 - this.y1);

    if (uB !== 0) {
      const ua = uaT / uB;
      const ub = ubT / uB;

      if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        result = new Intersection2D(new Vector2D(
          this.x1 + ua * (this.x2 - this.x1),
          this.y1 + ua * (this.y2 - this.y1)
        ));

        result.status = 'Intersection';
      } else {
        result = new Intersection2D('No Intersection');
      }
    } else {
      if (uaT === 0 || ubT === 0) {
        result = new Intersection2D('Coincident');
      } else {
        result = new Intersection2D('Parallel');
      }
    }
    return result;
  }

  /**
   * multiple / scale the line by the given coeffecient
   * @param (numner) v
   */
  multiply(multiplier) {
    return new Line2D(this.start.multiply(multiplier), this.end.multiply(multiplier));
  }

  /**
   * stringify the line
   * @return {string}
   */
  toString() {
    return `line2d: ${this.start.toString()} : ${this.end.toString()}`;
  }
}
