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
import MouseTrap from '../mousetrap';
import invariant from 'invariant';

export default class UserInterface {

  constructor(sg) {
    // the scenegraph we are on top of.
    this.sg = sg;
    invariant(this.sg, 'user interface must have a scenegraph');
    // build our element
    this.el = document.createElement('div');
    this.el.className = 'scenegraph-userinterface';
    // append after our scenegraph
    this.sg.parent.parentNode.insertBefore(this.el, this.sg.parent.nextSibiling);
    // base class can handle simple selections based on the AABB of nodes
    this.selections = [];
    // maps selected node UUID's to their display glyph
    this.selectionMap = {};
    // mouse tracker
    this.mouseTrap = new MouseTrap({
      element: this.el,
      mouseEnter: this.mouseEnter.bind(this),
      mouseLeave: this.mouseLeave.bind(this),
      mouseDown: this.mouseDown.bind(this),
      mouseMove: this.mouseMove.bind(this),
      mouseDrag: this.mouseDrag.bind(this),
      mouseUp: this.mouseUp.bind(this),
      doubleClick: this.doubleClick.bind(this),
      contextMenu: this.contextMenu.bind(this),
    });
  }
  /**
   * replace current selections, call with falsey to reset selections
   *
   */
  setSelections(newSelections) {
    this.selections = newSelections ? newSelections.slice() : [];
    this.updateSelections();
  }
  /**
   * add to selections, ignores if already present
   *
   */
  addToSelections(nodes) {
    let added = 0;
    (nodes || []).forEach(node => {
      if (!this.isSelected(node)) {
        this.selections.push(node);
        added += 1;
      }
    });
    if (added) {
      this.updateSelections();
    }
  }
  /**
   * remove from selections, ignores if not present
   *
   *
   */
  removeFromSelections(node) {
    invariant(node.sg === this.sg, 'node is not in our scenegraph');
    const index = this.selections.indexOf(node);
    if (index >= 0) {
      this.selections.splice(index, 1);
      this.updateSelections();
    }
  }
  /**
   * returns true if the node is selected
   *
   * @return {Boolean}      [description]
   */
  isSelected(node) {
    return this.selections.indexOf(node) >= 0;
  }

  /**
   * create / add / remove selection elements according to current selections
   *
   */
  updateSelections() {
    // bucket any items are don't need anymore, we will try to reuse them
    // before removing them from the DOM
    const bucket = [];
    Object.keys(this.selectionMap).forEach(nodeUUID => {
      if (!this.selections.find(node => nodeUUID === node.uuid)) {
        const element = this.selectionMap[nodeUUID];
        delete this.selectionMap[nodeUUID];
        bucket.push(element);
      }
    });

    this.selections.forEach(node => {
      // create an element if we need one
      let sel = this.selectionMap[node.uuid];
      if (!sel) {
        if (bucket.length) {
          sel = bucket.pop();
        } else {
          sel = this.createSelectionElement(node);
          this.el.appendChild(sel);
        }
        this.selectionMap[node.uuid] = sel;
      }
      // update to current node bounds
      const bounds = node.getAABBWithChildren();
      sel.style.left = bounds.x + 'px';
      sel.style.top = bounds.y + 'px';
      sel.style.width = bounds.width + 1 + 'px';
      sel.style.height = bounds.height + 1 + 'px';
    });

    // now we have to say goodbye to items left in the bucket
    bucket.forEach(element => {
      this.el.removeChild(element);
    });
  }

  /**
   * create a selection element for a given node. Override this method to create
   * selection elements with a different appearance.
   * @param  {Node2D} node
   */
  createSelectionElement(node) {
    const div = document.createElement('div');
    div.className = 'scenegraph-userinterface-selection';
    return div;
  }

  /**
   * this is the actual mouse down event you should override in descendant classes
   */
  mouseEnter(event) {}
  /**
   * this is the actual mouse down event you should override in descendant classes
   */
  mouseLeave(event) {}
  /**
   * this is the actual mouse down event you should override in descendant classes
   */
  mouseDown(point, event) {}
  /**
   * this is the actual mouse move event you should override in descendant classes
   */
  mouseMove(point, event) {}
  /**
   * this is the actual mouse drag event you should override in descendant classes
   */
  mouseDrag(point, event) {}
  /**
   * this is the actual mouse up event you should override in descendant classes
   */
  mouseUp(point, event) {}
  /**
   * this is the actual mouse up event you should override in descendant classes
   */
  doubleClick(point, event) {}
  /**
   * mouse down with right button
   */
  contextMenu(point, event) {}

  /**
   * general update, called whenever our scenegraph updates
   *
   */
  update() {
    this.updateSelections();
  }

  /**
   * update our element to the current scene graph size
   *
   */
  updateSize() {
    this.el.style.width = this.sg.width + 'px';
    this.el.style.height = this.sg.height + 'px';
  }
}
