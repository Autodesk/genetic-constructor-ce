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

export default class Intersection2D {
  /**
   * the generic results of various types of intersection test.
   * For valid intersections the points property is an array of
   * Vector2D objects. There is also a point property that returns
   * the first point in the points array. The status property is a string that indicates why the intersection test
   * failed if any
   * @constructor
   * @param {G.Vector2D|String|undefined} arg - can be a vector or a status string or nothing
   */
  constructor(arg) {
    if (arg && arg.constructor.name === 'Vector2D') {
      this.points = [arg];
    } else {
      if (typeof arg === 'string') {
        this._status = arg;
      }
      this.points = [];
    }
  }

  /**
   * return the first point in our intersection set or null if there are no intersections
   *
   */
  get point() {
    if (this.points && this.points.length) {
      return this.points[0];
    }
    return null;
  }

  /**
   * return our status string
   * @return String
   */
  get status() {
    return this._status;
  }

  /**
   * setter for our status
   * @param  {String} str
   */
  set status(str) {
    invariant(typeof str === 'string', 'expected a string');
    this._status = str;
  }

  /**
   * add a point to our intersection set
   * @param {Vector2D} point
   */
  add(point) {
    this.points = this.points || [];
    this.points.push(point);
  }
}
