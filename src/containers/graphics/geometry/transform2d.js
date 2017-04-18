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
import {isRealNumber} from '../utils';
import Vector2D from './vector2d';
import Matrix2D from './matrix2d';

export default class Transform2D {
  /**
   * Represents a 2D transform consisting of Scale/Rotate/Transform components. This is unit less.
   * When composed into a matrix the order of operations is S/R/T. Rotation and scaling always occurs around
   * the center i.e. translation to origin occurs, followed by S, then R and T to the final position
   *
   * @param {Vector2D} [scale] - initial scale, defaults to 1,1
   * @param {Number}      [rotate] - rotation in degrees, defaults to 0
   * @param {Vector2D} [translate] - initial translation, defaults to 0, 0
   * @param {Vector2D} [flip] - x/y flipping -1 or 1 are the only acceptable values
   *
   * @constructor
   */
  constructor(scale = new Vector2D(1, 1), rotate = 0, translate = new Vector2D(), flip = new Vector2D(1, 1)) {
    this._s = scale.clone();
    this._r = rotate;
    this._t = translate.clone();
    this._f = flip.clone();
  }

  /**
   * scale getter, getters/setters always clone input/outputs
   * and invalidate our cache
   * @return {Vector2D}
   */
  get scale() {
    return this._s.clone();
  }

  /**
   * scale setter
   * @param  {Vector2D} vector
   */
  set scale(vector) {
    // scale must be positive ( use flip to mirror the object )
    invariant(isRealNumber(vector.x) && isRealNumber(vector.y) && vector.x >= 0 && vector.y >= 0, 'invalid scale');
    this._s = vector.clone();
    this.cache = this.cacheKey = null;
  }

  /**
   * translate getter
   * @return {Vector2D}
   */
  get translate() {
    return this._t.clone();
  }

  /**
   * translate setter
   * @param  {Vector2D} vector
   */
  set translate(vector) {
    invariant(isRealNumber(vector.x) && isRealNumber(vector.y), 'invalid translate');
    this._t = vector.clone();
    this.cache = this.cacheKey = null;
  }

  /**
   * flip getter setter
   * @return {Vector2D}
   */
  get flip() {
    return this._f.clone();
  }

  /**
   * flip setter
   * @param {Vector2d}
   * @return {void}
   */
  set flip(vector) {
    invariant((vector.x === 1 || vector.x === -1) && (vector.y === 1 || vector.y === -1), 'invalid flip');
    this._f = vector.clone();
    this.cache = this.cacheKey = null;
  }

  /**
   * rotate getter
   * @return {number}
   */
  get rotate() {
    return this._r;
  }

  /**
   * rotate setter
   * @param  {number} angle
   */
  set rotate(angle) {
    invariant(isRealNumber(angle), 'invalid rotate');
    this._r = angle;
    this.cache = this.cacheKey = null;
  }

  /**
   * clone the entire transform
   * @return {Transform2D}
   */
  clone() {
    return new Transform2D(this._s, this._r, this._t, this._f);
  }

  /**
   * return a JSONable object representation of the transform
   * @return {Object}
   */
  toObject() {
    return {
      translate: this.translate.toObject(),
      scale: this.scale.toObject(),
      flip: this.flip.toObject(),
      rotate: this.rotate,
    };
  }

  /**
   * create a new Transform2D from an object created with toObject
   * @param  {Object} obj
   * @return Transform2D
   */
  static fromObject(obj) {
    const tr = new Transform2D();
    tr.translate = Vector2D.fromObject(obj.translate);
    tr.scale = Vector2D.fromObject(obj.scale);
    tr.flip = Vector2D.fromObject(obj.flip);
    tr.rotate = obj.rotate;
    return tr;
  }

  /**
   * compose our transformations into a single 3x3 matrix.
   * The order is consequential of course.
   * 1. translate so center is at the origin
   * 2. apply scaling ( using flip.x/flip.y to set the sign)
   * 3. apply rotation
   * 4. pply translate to final position
   *
   *
   * @param {number} w
   * @param {number} h
   * @returns Matrix2D
   */
  getTransformationMatrix(w, h) {
    invariant(isRealNumber(w) && isRealNumber(h), 'invalid width and/or height');
    // form a cache key
    const key = w + ':' + h;
    // return a copy of our cache if possible
    if (key === this.cacheKey) {
      return new Matrix2D(this.cache._v);
    }
    if (this.scale.x === 1 && this.scale.y === 1 && this.flip.x === 1 && this.flip.y === 1 && this.rotate === 0) {
      // shorter version without scale / rotate
      this.cache = Matrix2D.translate(-(w / 2) + this.translate.x, -(h / 2) + this.translate.y);
    } else {
      // full multiply
      const _m1 = Matrix2D.translate(-(w / 2), -(h / 2));
      const _m2 = Matrix2D.scale(this.scale.x * this.flip.x, this.scale.y * this.flip.y);
      const _m3 = Matrix2D.rotate(this.rotate);
      const _m4 = Matrix2D.translate(this.translate.x, this.translate.y);
      this.cache = _m4.multiplyMatrix(_m3).multiplyMatrix(_m2).multiplyMatrix(_m1);
    }
    this.cacheKey = key;
    return this.cache;
  }
}
