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
import Node2D from './node2d';
import invariant from 'invariant';
import Vector2D from '../geometry/vector2d';

export default class SceneGraph2D {

  constructor(props) {
    // extend this with defaults and supplied properties.
    // width / height are the actual dimensions of the scene graph.
    // availableWidth, availableHeight are the dimensions of the window we are in.
    Object.assign(this, {
      width: 800,
      height: 600,
      availableWidth: 800,
      availableHeight: 600,
      uuid: uuid.v4(),
      userInterfaceConstructor: null,
    }, props);

    // we must have a parent before being created
    invariant(this.parent, 'expected a parent DOM element');

    // ensure our parent element has the scene graph class
    //this.parent.classList.add('sceneGraph');

    // create our root node, which represents the view matrix and to which
    // all other nodes in the graph are ultimately attached.
    this.root = new Node2D({
      sg: this,
      isRoot: true,
    });

    // root is appended directly to the scene graph BUT without setting a parent node.
    this.parent.appendChild(this.root.el);

    // create the user interface layer as required
    if (this.userInterfaceConstructor) {
      this.ui = new this.userInterfaceConstructor(this); //eslint-disable-line new-cap
    }

    // size our element to initial scene graph size
    this.updateSize();
  }

  /**
   * darken by changing opacity on parent el
   */
  darken() {
    this.parent.classList.add('sceneGraph-dark');
  }

  lighten() {
    this.parent.classList.remove('sceneGraph-dark');
  }

  /**
   * update our element to the current scene graph size
   *
   */
  updateSize() {
    this.parent.style.width = this.width + 'px';
    this.parent.style.height = this.height + 'px';
    if (this.ui) {
      this.ui.updateSize();
    }
  }

  /**
   * current size of the graph, unscaled
   */
  getSize() {
    return new Vector2D(this.width, this.height);
  }

  /**
   * generic in-order traversal of the nodes of the graph.
   * @param  {Function} callback
   * @param  {this}   context
   */
  traverse(callback, context) {
    let stack = [this.root];
    while (stack.length) {
      const next = stack.pop();
      callback.call(context, next);
      stack = stack.concat(next.children);
    }
  }

  /**
   * return a list of nodes at the given location, the higest in the z-order
   * will be towards tht end of the list, the top most node is the last.
   * @param  {Vector2D} point
   * @return {Array.<Node2D>}
   */
  findNodesAt(point) {
    const hits = [];
    this.traverse(node => {
      if (node.parent && node.containsGlobalPoint(point)) {
        hits.push(node);
      }
    }, this);
    return hits;
  }

  /**
   * find nodes that intersect the given box
   */
  findNodesWithin(box) {
    const hits = [];
    this.traverse(node => {
      if (node.parent && node.getAABB().intersectWithBox(box)) {
        hits.push(node);
      }
    }, this);
    return hits;
  }

  /**
   * return the union of the AABB of all nodes in the scenegraph
   * except the root node
   * @return {Box2D}
   */
  getAABB() {
    let aabb = null;
    this.traverse(node => {
      // ignore the root, which we can identify because it has no parent
      if (node.parent) {
        const nodeAABB = node.getAABB();
        aabb = aabb ? aabb.union(nodeAABB) : nodeAABB;
      }
    });
    return aabb;
  }

  /**
   * updating the entire graph just involves updating the entire root node branch
   *
   */
  update() {
    this.root.updateBranch();
  }
}
