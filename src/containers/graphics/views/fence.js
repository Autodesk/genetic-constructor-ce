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
import Box2D from '../geometry/box2d';
import invariant from 'invariant';
import { clearSelection } from '../../../utils/ui/uiapi';

/**
 * an interactive fence / drag box for the construct viewer
 */
export default class Fence {

  /**
   * @param ui ConstructViewerUserInterface
   * @param p initial zero point box
   */
  constructor(cvui, point) {
    this.cvui = cvui;
    this.start = point.clone();
    this.createElement();
    this.update(this.start);

    // block selection on anything while dragging out the fence
    document.body.classList.add('prevent-selection');
    clearSelection();
  }

  /**
   * create display element for fence
   */
  createElement() {
    this.fenceElement = document.createElement('div');
    this.fenceElement.className = 'fence-element';
    this.cvui.el.appendChild(this.fenceElement);
  }
  /**
   * update fence rendering
   */
  update(newEnd) {
    // update end point of box
    this.end = newEnd.clone();
    // get a normalized rectangle from the start/end points
    const box = Box2D.boxFromPoints([this.start, this.end]);
    // clamp to element
    const client = new Box2D(this.cvui.el.getBoundingClientRect());
    client.x = client.y = 0;
    const final = box.intersectWithBox(client);
    if (final) {
      this.fenceElement.style.left = final.x + 'px';
      this.fenceElement.style.top = final.y + 'px';
      this.fenceElement.style.width = final.w + 'px';
      this.fenceElement.style.height = final.h + 'px';
    }
  }

  /**
   * return our bounds using a normalized box i.e. without negative extents
   */
  getBox() {
    return Box2D.boxFromPoints([this.start, this.end]);
  }

  dispose() {
    invariant(!this.disposed, 'already disposed');
    this.disposed = true;
    // reenable selection after fence dragging complete
    document.body.classList.remove('prevent-selection');
    // remove the fence element if we have one
    if (this.fenceElement) {
      this.fenceElement.parentElement.removeChild(this.fenceElement);
      this.fenceElement = null;
    }
  }
}
