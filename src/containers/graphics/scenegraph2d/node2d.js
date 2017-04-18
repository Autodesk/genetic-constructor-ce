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
import uuid from 'node-uuid';
import Vector2D from '../geometry/vector2d';
import Box2D from '../geometry/box2d';
import Transform2D from '../geometry/transform2d';
import invariant from 'invariant';
import NodeText2D from './nodetext2d';
import RectangleGlyph2D from './glyphs/html/rectangleglyph2d';
import RoleGlyph2D from './glyphs/html/roleglyph2d';
import ListItemGlyph2D from './glyphs/html/listitemglyph2d';
import LineGlyph2D from './glyphs/html/lineglyph2d';
import ConstructBanner from './glyphs/canvas/constructbanner';
/**
 * shared DIV for measuring text,
 */
let textDIV;
const textCache = {};

/**
 * basic rectangular node
 */
export default class Node2D {
  constructor(props) {
    // top level element is just a div
    this.el = document.createElement('div');
    // default class
    this.el.className = 'node';
    // transformation object
    this.transform = new Transform2D();
    // child nodes of this node
    this.children = [];
    // extend default options with the given options
    this.set(Object.assign({
      visible: true,
      hover: false,
      stroke: 'black',
      strokeWidth: 0,
      fill: 'dodgerblue',
      width: 0,
      height: 0,
      translateX: 0,
      translateY: 0,
      rotate: 0,
      scale: 1,
      fontSize: '2rem',
      fontWeight: 'normal',
      fontFamily: 'Helvetica',
      color: 'black',
      uuid: uuid.v4(),
      glyph: 'none',
      textAlign: 'center',
      textIndent: 0,
    }, props));

    // we must belong to a scene graph
    invariant(this.sg, 'nodes must belong to a scenegraph');

    // create our glyph at the same time
    switch (this.glyph) {
    case 'rectangle':
      this.glyphObject = new RectangleGlyph2D(this);
      break;
    case 'construct-banner':
      this.glyphObject = new ConstructBanner(this);
      break;
    case 'role':
      this.glyphObject = new RoleGlyph2D(this);
      break;
    case 'line':
      this.glyphObject = new LineGlyph2D(this);
      break;
    case 'listitem':
      this.glyphObject = new ListItemGlyph2D(this);
      break;

    case 'none':
      break;
    default:
      throw new Error('unrecognized glyph type');
    }
    // create our text element
    this.textGlyph = new NodeText2D(this);
  }

  /**
   * mostly for debugging
   * @return {String}
   */
  toString() {
    return `Node = glyph:${this.glyph || 'NONE'} text:${this.text || ''}`;
  }

  /**
   * apply the properties of the object p to our props.
   * @param {Object} props - key / value pairs of properties
   */
  set(props) {
    Object.keys(props).forEach(key => {
      // value associated with key
      const value = props[key];

      switch (key) {

      case 'parent':
        value.appendChild(this);
        break;

      case 'bounds':
        this.translateX = value.cx;
        this.translateY = value.cy;
        this.width = value.w;
        this.height = value.h;
        break;

      case 'glyph':
        invariant(!this.glyph, 'nodes do not expect their glyph type to change after construction');
        this.glyph = value;
        break;

        // apply a data-??? attribute with the given value to our element
        // value should be {name:'xyz', value:'123'} which would appear in
        // the dom as data-xyz="123"
      case 'dataAttribute':
        this.dataAttribute = value;
        this.el.setAttribute(`data-${value.name}`, value.value);
        break;

        // default behaviour is to just set the property
      default:
        this[key] = props[key];
      }
    });
  }

  /**
   * just our local transform
   *
   */
  get localTransform() {
    // use simple caching to save on this calculation
    const key = `${this.translateX},${this.translateY},${this.width},${this.height},${this.scale},${this.rotate}`;
    if (this.transformCachedKey !== key) {
      // update cache key
      this.transformCachedKey = key;
      // our local transform
      this.transform.translate = new Vector2D(this.translateX, this.translateY);
      this.transform.rotate = this.rotate;
      this.transform.scale = new Vector2D(this.scale, this.scale);
      this.matrixCached = this.transform.getTransformationMatrix(this.width, this.height);
    }
    return this.matrixCached.clone();
  }

  /**
   * get our transform multiplied by our parents, if present, this recursive
   * and works up the child -> parent hierarchy
   */
  get transformationMatrix() {
    // bring in parent if we have one, otherwise just our matrix
    return this.parent
      ? this.parent.transformationMatrix.multiplyMatrix(this.localTransform)
      : this.localTransform;
  }

  /**
   * inverse transformation matrix
   *
   */
  get inverseTransformationMatrix() {
    return this.transformationMatrix.inverse();
  }

  /**
   * return true if we are any kind of distance descendant of the given node
   */
  isNodeOrChildOf(otherNode) {
    let current = this;
    while (current) {
      if (current === otherNode) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  /**
   * convert a point ( or array of points ) in global ( scene graph space ) to local space
   */
  globalToLocal(point) {
    if (Array.isArray(point)) {
      return point.map(pt => {
        return this.globalToLocal(pt);
      }, this);
    }
    return this.inverseTransformationMatrix.multiplyVector(point);
  }

  /**
   * convert a point ( or array of points ) in global ( scene graph space ) to local space
   */
  localToGlobal(point) {
    if (Array.isArray(point)) {
      return point.map(pt => {
        return this.localToGlobal(pt);
      }, this);
    }
    return this.transformationMatrix.multiplyVector(point);
  }

  /**
   * transform point into our local space and return results of containment test
   * @param {Vector2D} point
   * @returns boolean
   */
  containsGlobalPoint(point) {
    // get our inverse transformation matrix including all our parents transforms
    // and use the inverse to put the point into the local space of the
    // node. Then we can just test against the AABB
    const pt = this.globalToLocal(point);
    return pt.x >= 0 && pt.y >= 0 && pt.x <= this.width && pt.y <= this.height;
  }

  /**
   * uses a global, hidden div to measure the width height of the given string
   * using our current text settings
   * @param  {string} str - string to measure or if ommitted this.text
   * @return {Vectot2D}
   */
  measureText(str) {
    const text = str || '';
    // measuring text is probably fairly slow so if possible use a cached measurement
    const cacheKey = `${text}${this.fontSize}${this.fontWeight}${this.fontFamily}`;
    const cachedValue = textCache[cacheKey];
    if (cachedValue) {
      return cachedValue;
    }

    // create div on demand
    if (!textDIV) {
      textDIV = document.createElement('DIV');
      textDIV.style.display = 'inline-block';
      textDIV.style.position = 'absolute';
      textDIV.style.left = textDIV.style.top = '-100000px';
      textDIV.style.padding = 0;
      textDIV.style.visibility = 'hidden';
      document.body.appendChild(textDIV);
    }

    // update to our current font settings and text
    textDIV.innerHTML = text;
    textDIV.style.fontSize = this.fontSize;
    textDIV.style.fontWeight = this.fontWeight;
    textDIV.style.fontFamily = this.fontFamily;

    // measure the actual dimensions
    const size = new Vector2D(textDIV.clientWidth, textDIV.clientHeight);
    // update cache
    textCache[cacheKey] = size;
    // done
    return size;
  }

  /**
   * get the axis align bounding box for the element
   * @returns {Box2D}
   */
  getAABB() {
    // transform the 4 corners of the bounds into screen space
    const pts = [
      new Vector2D(0, 0),
      new Vector2D(this.width, 0),
      new Vector2D(this.width, this.height),
      new Vector2D(0, this.height),
    ];

    const tpts = pts.map(pt => this.transformationMatrix.multiplyVector(pt));

    const xmin = Math.min(tpts[0].x, tpts[1].x, tpts[2].x, tpts[3].x);
    const ymin = Math.min(tpts[0].y, tpts[1].y, tpts[2].y, tpts[3].y);
    const xmax = Math.max(tpts[0].x, tpts[1].x, tpts[2].x, tpts[3].x);
    const ymax = Math.max(tpts[0].y, tpts[1].y, tpts[2].y, tpts[3].y);

    return new Box2D(xmin, ymin, xmax - xmin, ymax - ymin);
  }

  /**
   * AABB of node including all child nodes
   * @return {Box2D}
   */
  getAABBWithChildren() {
    return this.children.reduce((aabb, child) => {
      return aabb.union(child.getAABBWithChildren());
    }, this.getAABB());
  }

  /**
   * send to back of z order
   *
   */
  sendToBack() {
    invariant(this.parent, 'Not attached!');
    const par = this.parent;
    // ignore if we are already the lowest child
    if (par.children[0] === this) {
      return;
    }
    this.detach();
    this.insertBack(par);
  }

  /**
   * remove from our current parent.
   */
  detach() {
    invariant(this.parent, 'Node is not parented');
    this.parent.children.splice(this.parent.children.indexOf(this), 1);
    this.parent.el.removeChild(this.el);
    this.parent = null;
  }

  /**
   * add to the back ( lowest z ) of the parent
   */
  insertBack(parent) {
    invariant(!this.parent, 'Node is already parented');
    invariant(parent, 'Bad parameter');
    // if parent has no children then append is necessary
    if (parent.children.length === 0) {
      parent.appendChild(this);
    } else {
      // update child list of parent and this nodes parent reference
      parent.children.splice(0, 0, this);
      this.parent = parent;
      // update the DOM
      this.parent.el.insertBefore(this.el, this.parent.el.firstChild);
    }
  }

  /**
   * append the given child to us. It will be top most until another child is added
   *
   *
   */
  appendChild(child) {
    invariant(child && !child.parent, 'cannot append nothing or a parented node');
    child.parent = this;
    this.children.push(child);
    this.el.appendChild(child.el);
    return child;
  }

  /**
   * remove the given child from our children
   *
   *
   */
  removeChild(child) {
    invariant(child && this.children.indexOf(child) >= 0, 'node is not our child');
    child.parent = null;
    this.children.splice(this.children.indexOf(child), 1);
    this.el.removeChild(child.el);
    return child;
  }

  /**
   * Updating all display properties of the node and returning our element.
   *
   */
  update() {
    //if we have additional CSS classes to apply do that
    if (this.classes) {
      this.el.className = `node ${this.classes}`;
    }

    // set width/height and transform
    this.el.style.width = this.width + 'px';
    this.el.style.height = this.height + 'px';
    this.el.style.transform = this.localTransform.toCSSString();

    // visibility is controlled with opacity
    this.el.style.opacity = this.visible ? 1 : 0;

    // now update our glyph
    if (this.glyphObject) {
      this.glyphObject.update();
    }

    // update text
    if (this.textGlyph) {
      this.textGlyph.update();
    }

    // display hover state, which is used to indicate inline editing
    this.updateHoverGlyph();

    return this.el;
  }

  /**
   * show or hide hover glyph according to state
   */
  updateHoverGlyph() {
    // remove hover glyph if no longer needed
    if (this.hoverGlyph && !this.hover) {
      this.el.removeChild(this.hoverGlyph);
      this.hoverGlyph = null;
    }
    // add hover glyph as required
    if (this.hover && !this.hoverGlyph) {
      this.el.insertAdjacentHTML('beforeend',
        `<div class="inline-editor-hover ${this.hoverClass}">
        <span>${this.text}</span>
        <img src="/images/ui/inline_edit.svg"/>
       </div>`);
      this.hoverGlyph = this.el.lastChild;
    }
  }

  /**
   * update branch performs a recursive update on the entire branch rooted on this node.
   * @return {Node2D}
   */
  updateBranch() {
    this.update();
    this.children.forEach(child => {
      child.updateBranch();
    });
    return this.el;
  }
}
