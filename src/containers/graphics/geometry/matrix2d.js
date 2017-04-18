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
import {isOne, isZero, deg2rad, rad2deg} from '../utils';
import Vector2D from './vector2d';

export default class Matrix2D {

  /**
   * a 3x3 matrix designed to perform transformations in 2D space.
   * This class currently only implements the most basic operations e.g. Matrix x Vector, Matrix x Matrix, Inverse
   * @constructor
   * @param {undefined|Array} vector
   */
  constructor(vector) {
    invariant(vector === undefined || Array.isArray(vector), 'invalid parameter');
    if (vector) {
      this._v = vector.slice();
    } else {
      // matrix defaults to the identity matrix with 1,1,1, from top left to bottom right
      this._v = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }
    invariant(this.validate(), 'Bad Matrix');
  }

  /**
   * clone the matrix
   * @return {Matrix2D} [description]
   */
  clone() {
    return new Matrix2D(this._v);
  }

  /**
   * return true if matrix is approximately identity
   */
  isIdentity() {
    return isOne(this._v[0]) &&
      isZero(this._v[1]) &&
      isZero(this._v[2]) &&
      isZero(this._v[3]) &&
      isOne(this._v[4]) &&
      isZero(this._v[5]) &&
      isZero(this._v[6]) &&
      isZero(this._v[7]) &&
      isOne(this._v[8]);
  }

  /**
   * ensure all the numbers in the matrix are reasonable
   */
  validate() {
    return true;
    // if (this._v && this._v.length === 9) {
    //   for (let i = 0; i < 9; i += 1) {
    //     // all 9 elements should be numbers and not NaN or Infinity or -Infinity
    //     if (!isRealNumber(this._v[i])) {
    //       return false;
    //     }
    //   }
    //   // bottom row should always be identity, or very close
    //   if (!isZero(this._v[6]) || !isZero(this._v[7]) || !isOne(this._v[8])) {
    //     return false;
    //   }
    //   return true;
    // }
    // return false;
  }

  /**
   * return the decomposed rotation value from the matrix ( in degrees )
   * NOTE: Matrices can contain ambiguous sets of transforms...use at your peril
   * @returns Number - rotation in degrees
   */
  decomposeRotation() {
    return rad2deg(Math.atan2(this._v[3], this._v[0]));
  }

  /**
   * likewise for translation
   * @returns Vector2D
   */
  decomposeTranslate() {
    return new Vector2D(this._v[2], this._v[5]);
  }


  /**
   * likewise for scale
   * @returns {Vector2D}
   */
  decomposeScale() {
    const scaleX = Math.sqrt(this._v[0] * this._v[0] + this._v[1] * this._v[1]);
    const scaleY = Math.sqrt(this._v[3] * this._v[3] + this._v[4] * this._v[4]);
    return new Vector2D(scaleX, scaleY);
  }

  /**
   * returns an object with translate: Vector2D, rotate: number, scale: Vector2D.
   * Based on http://math.stackexchange.com/questions/13150/extracting-rotation-scale-values-from-2d-transformation-matrix
   */
  decompose() {
    return {
      translate: this.decomposeTranslate(),
      rotate: this.decomposeRotation(),
      scale: this.decomposeScale(),
    };
  }

  /**
   * construct a translation matrix
   * @param  {number} xv
   * @param  {number} yv
   * @return {Matrix2D}
   */
  static translate(xv, yv) {
    const mtx = new Matrix2D();
    mtx._v[2] = xv;
    mtx._v[5] = yv;
    return mtx;
  }

  /**
   * construct a scale matrix
   * @param  {number} x
   * @param  {number} y
   * @return {Matrix2D}
   */
  static scale(x, y) {
    const mtx = new Matrix2D();
    mtx._v[0] = x;
    mtx._v[4] = y;
    return mtx;
  }
  /**
   * construct a rotation matrix
   * @param  {number} degrees
   * @return {Matrix2D}
   */
  static rotate(degrees) {
    const mtx = new Matrix2D();
    const radians = deg2rad(degrees);
    mtx._v[0] = Math.cos(radians);
    mtx._v[1] = -Math.sin(radians);
    mtx._v[3] = Math.sin(radians);
    mtx._v[4] = Math.cos(radians);
    return mtx;
  }
  /**
   * multiply a vector by this matrix, returning a new vector
   * @param {Vector2D} vector
   * @return Vector2D
   */
  multiplyVector(vector) {
    const out = new Vector2D();
    // dot matrix with vector, using 1 for the missing w component of our vector
    out.x = this._v[0] * vector.x + this._v[1] * vector.y + this._v[2] * 1;
    out.y = this._v[3] * vector.x + this._v[4] * vector.y + this._v[5] * 1;
    return out;
  }

  /**
   * multiply this matrix by another
   * @param {Matrix2D} mtx
   */
  multiplyMatrix(mtx) {
    const result = new Matrix2D();
    const _a = this._v;
    const _b = mtx._v;
    const _c = result._v;
    // dot product of first row with each column of m
    _c[0] = _a[0] * _b[0] + _a[1] * _b[3] + _a[2] * _b[6];
    _c[1] = _a[0] * _b[1] + _a[1] * _b[4] + _a[2] * _b[7];
    _c[2] = _a[0] * _b[2] + _a[1] * _b[5] + _a[2] * _b[8];
    // dot product of second row with each column of m
    _c[3] = _a[3] * _b[0] + _a[4] * _b[3] + _a[5] * _b[6];
    _c[4] = _a[3] * _b[1] + _a[4] * _b[4] + _a[5] * _b[7];
    _c[5] = _a[3] * _b[2] + _a[4] * _b[5] + _a[5] * _b[8];
    // dot product of third row with each column of m
    _c[6] = _a[6] * _b[0] + _a[7] * _b[3] + _a[8] * _b[6];
    _c[7] = _a[6] * _b[1] + _a[7] * _b[4] + _a[8] * _b[7];
    _c[8] = _a[6] * _b[2] + _a[7] * _b[5] + _a[8] * _b[8];
    // validate
    invariant(result.validate(), 'Bad Matrix');
    return result;
  }

  /**
   * Return the inverse of this matrix
   * @return Matrix2D
   */
  inverse() {
    const _v = this._v;
    // computes the inverse of a matrix m
    // 1. calculate the determinant http://en.wikipedia.org/wiki/Determinant#3.C2.A0.C3.97.C2.A03_matrices
    const det = _v[0] * (_v[4] * _v[8] - _v[7] * _v[5]) -
      _v[1] * (_v[3] * _v[8] - _v[5] * _v[6]) +
      _v[2] * (_v[3] * _v[7] - _v[4] * _v[6]);
    const invdet = 1 / det;
    const out = new Matrix2D();
    const _o = out._v;
    _o[0] = (_v[4] * _v[8] - _v[7] * _v[5]) * invdet;
    _o[1] = (_v[2] * _v[7] - _v[1] * _v[8]) * invdet;
    _o[2] = (_v[1] * _v[5] - _v[2] * _v[4]) * invdet;
    _o[3] = (_v[5] * _v[6] - _v[3] * _v[8]) * invdet;
    _o[4] = (_v[0] * _v[8] - _v[2] * _v[6]) * invdet;
    _o[5] = (_v[3] * _v[2] - _v[0] * _v[5]) * invdet;
    _o[6] = (_v[3] * _v[7] - _v[6] * _v[4]) * invdet;
    _o[7] = (_v[6] * _v[1] - _v[0] * _v[7]) * invdet;
    _o[8] = (_v[0] * _v[4] - _v[3] * _v[1]) * invdet;
    invariant(out.validate(), 'Bad Matrix');
    return out;
  }

  /**
   * import our values from a 6 element css matrix
   * @param cssMatrix
   */
  importCSSValues(cssMatrix) {
    // reset to identity first ( since the CSS matrix doesn't have a bottom row )
    this._v = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    this._v[0] = cssMatrix.a;
    this._v[3] = cssMatrix.b;
    this._v[1] = cssMatrix.c;
    this._v[4] = cssMatrix.d;
    this._v[2] = cssMatrix.e;
    this._v[5] = cssMatrix.f;
    return this;
  }

  /**
   * get the string form of the matrix formatted for use with the css property 'transform'
   * CSS and SVG use a slightly strange form of the 3x3 matrix. It does not include the bottom row
   * ( which should always be identity and is written in column order.
   * @return string
   */
  toCSSString() {
    const _v = this._v;
    // using limited notation since Safari doesn't like a matrix with values like 6.123233995736766e-17
    return `matrix(${_v[0].toFixed(8)}, ${_v[3].toFixed(8)}, ${_v[1].toFixed(8)}, ${_v[4].toFixed(8)}, ${_v[2].toFixed(8)}, ${_v[5].toFixed(8)})`;
  }
}
