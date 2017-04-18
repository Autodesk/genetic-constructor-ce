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
import Vector2D from './geometry/vector2d';
import invariant from 'invariant';

/**
 * MS and pixel thresholds to register a double click
 */
const doubleClickTimeThreshold = 500;
const doubleClickSpatialThreshold = 4;

/**
 * handle mousedown,mousemove,mouseup events for the given element including
 * converting to local coordinates and capturing the mouse on the document.body
 * during a drag.
 * Callbacks which should exist are:
 * mouseTrapDown(client point, event)
 * mouseTrapMove(client point, event)
 * mouseTrapUp(client point, event)
 * mouseTrapDrag(client point, event) - which is a mousemove with the button held down
 *
 * A drag can be cancelled at anytime by calling cancelDrag on this instance.
 * Call dispose to end all mouse captures. Do not use the instance after this.
 */
export default class MouseTrap {

  /**
   * owner is any object that will get the callbacks. Element is
   * the target element you want the events on.
   */
  constructor(options) {
    // save our options, which at the very least must contain the targeted element.
    // Options are:
    //
    // element: HTMLElement - the element which we listen to
    // mouseEnter: Function - callback for mouseenter event (event)
    // mouseLeave: Function - callback for mouseleave event (event)
    // mouseDown: Function - callback for mousedown event (point, event)
    // mouseMove: Function - callback for mousemove event (point, event)
    // mouseDrag: Function - callback for mousemove with button held down event (point, event)
    // mouseUp: Function - callback for mouseup event (point, event) only when mousedown preceeded.
    // doubleClick: Function - callback for left double click ( no drag will start on second click ) (point, event)
    this.options = Object.assign({}, options);
    invariant(this.options.element, 'options must contain an element');
    this.element = options.element;

    // create bound versions of the listener which we can remove as well as add
    this.mouseEnter = this.onMouseEnter.bind(this);
    this.mouseLeave = this.onMouseLeave.bind(this);
    this.mouseDown = this.onMouseDown.bind(this);
    this.mouseMove = this.onMouseMove.bind(this);
    this.mouseDrag = this.onMouseDrag.bind(this);
    this.mouseUp = this.onMouseUp.bind(this);
    this.contextMenu = this.onContextMenu.bind(this);

    // mouse enter/leave are always running
    this.element.addEventListener('mouseenter', this.mouseEnter);
    this.element.addEventListener('mouseleave', this.mouseLeave);
    // sink the mousedown, later dynamically add the move/up handlers
    this.element.addEventListener('mousedown', this.mouseDown);
    // for normal mouse move with no button we track via the target element itself
    this.element.addEventListener('mousemove', this.mouseMove);
    // context menus are also handled by the mousetrap but only prevented if the user sinks the event
    this.element.addEventListener('contextmenu', this.contextMenu);
  }

  /**
   * context menu event
   *
   *
   */
  onContextMenu(event) {
    this.callback('contextMenu', event, new Vector2D(event.offsetX, event.offsetY));
  }
  /**
   * mouse enter/leave handlers
   */
  onMouseEnter(event) {
    this.callback('mouseEnter', event);
  }
  onMouseLeave(event) {
    this.callback('mouseLeave', event);
  }
  /**
   * mouse down handler, invoked on our target element
   */
  onMouseDown(event) {
    //console.log("mouse down ", Date.now());
    //console.log(this.element.className);
    // whenever our element gets a mouse down ( any button ) ensure any inputs are unfocused
    if (document.activeElement
      && document.activeElement.tagName
      && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' )) {
      document.activeElement.blur();
    }
    // left button only
    if (event.which !== 1) {
      return;
    }
    // get local position and record the starting position and setup
    // move/up handlers on the body
    const localPosition = new Vector2D(event.offsetX, event.offsetY);
    const time = Date.now();
    // first check for a double click, otherwise treat as start of a drag
    if (this.lastLeftClick && this.lastLeftClick.sub(localPosition).len() <= doubleClickSpatialThreshold
    && time - this.lastLeftClickTime <= doubleClickTimeThreshold) {
      this.lastLeftClick = null;
      this.callback('doubleClick', event, localPosition);
      return;
    }

    this.lastLeftClick = localPosition;
    this.lastLeftClickTime = time;

    this.dragging = {
      startPosition: this.lastLeftClick,
    };
    document.body.addEventListener('mousemove', this.mouseDrag);
    document.body.addEventListener('mouseup', this.mouseUp);

    // invoke optional callback
    this.callback('mouseDown', event, this.lastLeftClick);
  }

  /**
   * mousemove event
   */
  onMouseMove(event) {
    const localPosition = this.globalToLocal(this.mouseToGlobal(event), this.element);
    this.callback('mouseMove', event, localPosition);
  }

  /**
   * mousemove event binding during a drag operation
   */
  onMouseDrag(event) {
    invariant(this.dragging, 'only expect mouse moves during a drag');
    // send the mouse move, then check for the begin of a drag
    const localPosition = this.globalToLocal(this.mouseToGlobal(event), this.element);
    const distance = localPosition.sub(this.dragging.startPosition).len();
    // invoke optional callback
    this.callback('mouseDrag', event, localPosition, this.dragging.startPosition, distance);
  }

  /**
   * mouseup handler
   */
  onMouseUp(event) {
    // left drag only
    if (event.which !== 1) {
      return;
    }
    invariant(this.dragging, 'only expect mouse up during a drag');
    const localPosition = this.globalToLocal(this.mouseToGlobal(event), this.element);
    this.cancelDrag();
    this.callback('mouseUp', event, localPosition);
  }

  /**
   * cancel a drag track in progress
   *
   */
  cancelDrag() {
    if (this.dragging) {
      document.body.removeEventListener('mousemove', this.mouseDrag);
      document.body.removeEventListener('mouseup', this.mouseUp);
      this.dragging = null;
    }
  }

  /**
   * if given, invoke one of the named optional callbacks with a clone of the local point
   */
  callback(eventName, event) {
    if (this.options[eventName]) {
      // if the client wants a callback preventDefault
      event.preventDefault();
      // slice the event name off the arguments but forward everything else
      const args = Array.prototype.slice.call(arguments, 1);
      this.options[eventName].apply(this, args);
    }
  }

  /**
   * cleanup all event listeners. Instance cannot be used after this.
   */
  dispose() {
    this.element.removeEventListener('mouseenter', this.mouseEnter);
    this.element.removeEventListener('mouseleave', this.mouseLeave);
    this.element.removeEventListener('mousedown', this.mouseDown);
    this.element.removeEventListener('mousemove', this.mouseMove);
    this.element.removeEventListener('contextmenu', this.contextMenu);
    this.cancelDrag();
    this.dragging = this.element = this.owner = null;
  }

  /**
   * convert page coordinates into local coordinates
   * @param vector
   * @param element
   * @returns {G.Vector2D}
   */
  globalToLocal(vector, element) {
    invariant(vector && element && arguments.length === 2, 'Needs a vector and an element');
    return vector.sub(this.documentOffset(element));
  }

  /**
   * x-browser solution for the global mouse position
   */
  mouseToGlobal(event) {
    invariant(arguments.length === 1, 'expect only an event for this method');
    const parentPosition = this.documentOffset(event.target);
    return new Vector2D(event.offsetX + parentPosition.x, event.offsetY + parentPosition.y);
  }

  /**
   * return the top/left of the element relative to the document. Includes any scrolling.
   */
  documentOffset(element) {
    invariant(element && arguments.length === 1, 'Bad parameter');
    const domRECT = element.getBoundingClientRect();
    return new Vector2D(domRECT.left + window.scrollX, domRECT.top + window.scrollY);
  }
}
