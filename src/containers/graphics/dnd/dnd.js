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
import Vector2D from '../geometry/vector2d';
import Box2D from '../geometry/box2d';
import invariant from 'invariant';
import { commit, abort } from '../../../store/undo/actions';
import { dispatch } from '../../../store/index';
import { difference } from '../../../utils/set/set';

/**
 * Drag and Drop manager. Creates a singleton which allows registration of drag targets and drop targets
 * The singleton is exposed on the window at window.constructor.DnD for extensions to register their own drop targets
 * @module DnD
 */
class DnD {
  constructor() {
    this.targets = [];
    this.monitors = new Set();
    this.mouseMove = this.onMouseMove.bind(this);
    this.mouseUp = this.onMouseUp.bind(this);
  }

  /**
   * start a drag operation using the given element proxy for display purposes
   * and starting from the given global position. Payload is any object representing
   * what is being dragged
   * valid options:
   * - onDrop(target) - can return a payload to use onDrop
   */
  startDrag(elementProxy, globalPosition, payload, options = {}) {
    // the body must have position relative for this to work ( or we could add
    // an element to act as a drag surface but that seems like overkill )
    document.body.style.position = 'relative';

    // the element proxy is positioned absolutely on top of the body so give
    // it the correct style and add to the body with a maximum z-index
    this.proxy = elementProxy;
    this.proxy.style.position = 'absolute';
    // http://www.puidokas.com/max-z-index/
    this.proxy.style.zIndex = 2147483647;
    // remove any transform from proxy and make semi-transparent
    this.proxy.style.transform = null;
    this.proxy.style.opacity = 2 / 3;
    // give the proxy the hand cursor
    this.proxy.style.cursor = 'pointer';

    document.body.appendChild(this.proxy);
    // save proxy dimensions
    this.proxySize = new Vector2D(this.proxy.offsetWidth, this.proxy.offsetHeight);

    // track mouse move until user releases
    document.body.addEventListener('mousemove', this.mouseMove);
    document.body.addEventListener('mouseup', this.mouseUp);

    // initial update of proxy
    this.updateProxyPosition(globalPosition);

    // set initial target we are over, necessary for dragEnter, dragLeave callbacks
    this.lastTarget = null;

    // monitors are set since there can be more than one target at a time
    this.lastMonitors = new Set();

    //set hooks
    this.onDrop = options.onDrop || (() => {});
    this.onDropFailure = options.onDropFailure || (() => {});
    this.onDragComplete = options.onDragComplete || (() => {});

    // save the payload for dropping
    this.payload = payload;

    // save so we know if an undo commit is required
    this.undoCommit = options.undoRedoTransaction;

    // block selection on anything while dragging
    document.body.classList.add('prevent-selection');
  }

  /**
   * mouse move during drag
   */
  onMouseMove(evt) {
    // first get the target at the current location
    invariant(this.proxy, 'not expecting mouse events when not dragging');
    const globalPosition = this.mouseToGlobal(evt);
    this.updateProxyPosition(globalPosition);
    const target = this.findTargetAt(globalPosition);
    // dragLeave callback as necessary
    if (target !== this.lastTarget && this.lastTarget && this.lastTarget.options.dragLeave) {
      this.lastTarget.options.dragLeave.call(this, globalPosition, this.payload);
    }
    // drag enter callback as necessary
    if (target !== this.lastTarget && target && target.options.dragEnter) {
      target.options.dragEnter.call(this, globalPosition, this.payload);
    }
    this.lastTarget = target;

    // given current target a drag over is necessary
    if (target && target.options && target.options.dragOver) {
      target.options.dragOver.call(this, globalPosition, this.payload, this.proxySize);
    }

    // update monitors
    const monitors = this.findMonitorsAt(globalPosition);
    // any prior monitors not in the current set, we need to call monitorLeave
    difference(this.lastMonitors, monitors).forEach(monitor => {
      monitor.options.monitorLeave.call(this, globalPosition, this.payload);
    });
    // call monitorEnter for any new ones
    difference(monitors, this.lastMonitors).forEach(monitor => {
      monitor.options.monitorEnter.call(this, globalPosition, this.payload);
    });
    this.lastMonitors = monitors;
    this.lastMonitors.forEach(monitor => {
      monitor.options.monitorOver.call(this, globalPosition, this.payload);
    });
  }

  /**
   * mouse up during drag
   */
  onMouseUp(evt) {
    invariant(this.proxy, 'not expecting mouse events when not dragging');

    // global position of drop operation
    const globalPosition = this.mouseToGlobal(evt);

    // send monitor leave to all monitors
    this.monitors.forEach(monitor => {
      monitor.options.monitorLeave.call(this, globalPosition, this.payload);
    });

    // find drop target if any
    const target = this.findTargetAt(globalPosition);

    if (target && target.options) {
      if (target.options.dragEnd) {
        target.options.dragEnd.call(this, globalPosition, null, evt);
      }

      const savedPayload = this.payload;

      Promise.resolve(this.onDrop(target, globalPosition))
        .then((result) => {
          const payload = (typeof result !== 'undefined') ?
            Object.assign(savedPayload, { item: result }) :
            savedPayload;

          // drop handler
          if (target.options.drop) {
            target.options.drop.call(this, globalPosition, payload, evt, this.proxySize);
          }

          // ensure lastTarget gets a dragLeave in case they rely on it for cleanup
          if (target.options.dragLeave) {
            target.options.dragLeave.call(this);
          }

          //completion handler
          this.onDragComplete(target, globalPosition, payload, evt);

          // close / commit the undo/redo transaction if one is required
          if (this.undoCommit) {
            dispatch(commit());
          }
        })
        //if the onDrop handler fails, or something in the drop... handle (e.g. close commit)
        .catch((err) => {
          this.onDropFailure(err, target);

          // ensure lastTarget gets a dragLeave in case they rely on it for cleanup
          if (target.options.dragLeave) {
            target.options.dragLeave.call(this);
          }

          // close / commit the undo/redo transaction if one is required
          if (this.undoCommit) {
            dispatch(commit());
          }
        });
    } else {
      // abort the undo/redo transaction since nothing is going to change
      if (this.undoCommit) {
        dispatch(abort());
      }
    }
    this.cancelDrag();
  }

  /**
   * update proxy to given global position
   */
  updateProxyPosition(globalPoint) {
    const bounds = this.proxy.getBoundingClientRect();
    this.proxy.style.left = `${globalPoint.x - bounds.width / 2}px`;
    this.proxy.style.top = `${globalPoint.y - bounds.height / 2}px`;
  }

  /**
   * cancel / end a drag/drop in progress
   */
  cancelDrag() {
    if (this.proxy) {
      document.body.removeEventListener('mousemove', this.mouseMove);
      document.body.removeEventListener('mouseup', this.mouseUp);
      this.proxy.parentElement.removeChild(this.proxy);
      this.proxy = null;
      this.payload = null;
      this.lastTarget = null;
      this.lastMonitor = new Set();
      document.body.classList.remove('prevent-selection');
    }
  }

  // clean up the component
  dispose() {
    this.cancelDrag();
  }

  /**
   * given a mouse event, find the drop target if any at the given location
   */
  findTargetAt(globalPoint) {
    // find all targets at the given point
    const hits = this.targets.filter(options => {
      return this.getElementBounds(options.element).pointInBox(globalPoint);
    });
    // sort by zorder and return the one with the highest values
    hits.sort((aaa, bbb) => {return aaa.options.zorder - bbb.options.zorder;});
    return hits.pop();  // undefined on an empty array
  }

  /**
   * return all monitors at the given global position as a Set
   */
  findMonitorsAt(globalPoint) {
    const monitors = [...this.monitors].filter(options => {
      return this.getElementBounds(options.element).pointInBox(globalPoint);
    });
    return new Set(monitors);
  }

  /**
   * register a target for drop events.
   * The options block should contain the callbacks you are interested in:
   * dragEnter(globalPosition, payload) - when a drag enters the target
   * dragOver(globalPosition, payload) - when a drag moves over the target, dragEnter is always called first
   * dragLeave(globalPosition, payload) - when a drag leaves the target, if dragEnter was called before NOTE: dragLeave is called even after a successful drop
   * drop(globalPosition, payload) - when a drop occurs - alway follows a dragEnter, dragOver
   *
   * options should also include an arbitary z order for the target. Drop targets can be over laid
   * and the chosen target will be the highest in the z order if there is overlap
   *
   * drop handler is not optional and should be included.
   */
  registerTarget(element, options) {
    invariant(element, 'expected an element to register');
    invariant(options && options.drop, 'expected a drop handler');
    invariant(options.zorder === +options.zorder, 'z order must be a number');
    this.targets.push({ element, options });
  }

  /**
   * unregister a drop target via the registered element
   */
  unregisterTarget(element) {
    const targetIndex = this.targets.findIndex(obj => obj.element);
    invariant(targetIndex >= 0, 'element is not registered');
    this.targets.splice(targetIndex, 1);
  }

  /**
   * a monitor element will get called regardless of it zorder relative to
   * other drop target and monitors. It is primary use is to allow things
   * like autoscrolling to function on container controls. As such it will
   * NEVER get a drop event, only monitorEnter, monitorLeave, monitorDrag
   */
  registerMonitor(element, options) {
    invariant(element, 'expected an element to register');
    invariant(options.monitorEnter && options.monitorLeave && options.monitorOver, 'expected enter/leave/over handlers');
    this.monitors.add({ element, options });
  }

  /**
   * unregister a drop target via the registered element
   */
  unregisterMonitor(element) {
    const monitor = [...this.monitors].find(obj => obj.element);
    invariant(monitor, 'element is not registered');
    this.monitors.delete(monitor);
  }

  /**
   * return the bounds of the element in document coordinates.
   */
  getElementBounds(element) {
    invariant(element, 'Bad parameter');
    const domRECT = element.getBoundingClientRect();
    return new Box2D(domRECT.left + window.scrollX, domRECT.top + window.scrollY, domRECT.width, domRECT.height);
  }

  /**
   * x-browser solution for the global mouse position
   */
  mouseToGlobal(event) {
    invariant(arguments.length === 1, 'expect only an event for this method');
    const parentPosition = this.getElementPosition(event.target);
    return new Vector2D(event.offsetX + parentPosition.x, event.offsetY + parentPosition.y);
  }

  /**
   * return the top/left of the element relative to the document. Includes any scrolling.
   */
  getElementPosition(element) {
    invariant(element && arguments.length === 1, 'Bad parameter');
    const domRECT = element.getBoundingClientRect();
    return new Vector2D(domRECT.left + window.scrollX, domRECT.top + window.scrollY);
  }
}

// export the singleton
export default new DnD();
