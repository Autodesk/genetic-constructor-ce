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
import UserInterface from '../scenegraph2d/userinterface';
import DnD from '../dnd/dnd';
import Vector2D from '../geometry/vector2d';
import Box2D from '../geometry/box2d';
import { transact } from '../../../store/undo/actions';
import Fence from './fence';
import { dispatch } from '../../../store/index';
import { sortBlocksByIndexAndDepthExclude } from '../../../utils/ui/uiapi';

// # of pixels of mouse movement before a drag is triggered.
const dragThreshold = 8;
// if within this threshold of a block edge the edge is selected versus
// the entire blocks
const edgeThreshold = 20;

/**
 * user interface overlay for construct viewer
 */
export default class ConstructViewerUserInterface extends UserInterface {
  constructor(sg) {
    super(sg);
    // register ourselves as a drop target
    DnD.registerTarget(this.el, {
      dragEnter: this.onDragEnter.bind(this),
      dragLeave: this.onDragLeave.bind(this),
      dragOver: this.onDragOver.bind(this),
      drop: this.onDrop.bind(this),
      zorder: 0,
    });

    this.osType = this.checkOS();
  }

  /**
   * select all blocks within the given rectangle
   */
  selectNodesByRectangle(box) {
    const hits = this.sg.findNodesWithin(box);
    const parts = [];
    hits.forEach(node => {
      const element = this.layout.elementFromNode(node);
      if (element) {
        parts.push(element);
      } else {
        // check for list blocks as well, but ensure we only add the block once
        if (node.listParentBlock && parts.indexOf(node.listParentBlock.id) < 0) {
          parts.push(node.listParentBlock.id);
        }
      }
    });
    // combine with existing selection
    this.constructViewer.blockSelected(parts.concat(this.constructViewer.props.focus.blockIds));
  }

  /**
   * return the top most block at the given local ccordinates
   * @param  {Vector2D} point
   * @return {Part}
   */
  topNodeAt(point) {
    const hits = this.sg.findNodesAt(point);
    // nodes might include anything added to the scenegraph
    // so work backwards in the list and return the first
    // block found
    for (let i = hits.length - 1; i >= 0; i--) {
      // hit the title node
      if (hits[i].isNodeOrChildOf(this.layout.titleNode)) {
        return hits[i];
      }
      // a block node
      if (this.layout.elementFromNode(hits[i])) {
        return hits[i];
      }
      // if the node has a listParentBlock/Node property it is a list
      // child of another block i.e. from a template
      if (hits[i].listParentNode) {
        return hits[i].listParentNode;
      }
    }
    // no hits or no blocks in the hits
    return null;
  }

  /**
   * return the top most block at a given location
   *
   *
   */
  topBlockAt(point) {
    const top = this.topNodeAt(point);
    return top ? this.layout.elementFromNode(top) : null;
  }

  /**
   * true if the node is the title node for the construct
   */
  isConstructTitleNode(node) {
    return !!(node && node.isNodeOrChildOf(this.layout.titleNode));
  }

  /**
   * return the nearest block to the given location and an indication if the point is nearest the left, right or body of block.
   */
  nearestBlockAndOptionalVerticalEdgeAt(point, proxySize) {
    // get bounds of dragged object, clamp the proxy size since dragging two many blocks will create a very large hit area
    const maxProxyWidth = 100;
    const pwidth = Math.min(proxySize.x, maxProxyWidth);
    const pheight = Math.min(proxySize.y, maxProxyWidth);
    const pbox = new Box2D(point.x - pwidth / 2, point.y - pheight / 2, pwidth, pheight);
    // initial test is an intersection test between draggable and blocks...
    let bestItem = null;
    const allNodesAndBlocks = this.layout.allNodesAndBlocks();
    allNodesAndBlocks.forEach(item => {
      // bounds of node...
      item.AABB = item.node.getAABB();
      // intersection with dragged object
      const intersection = item.AABB.intersectWithBox(pbox);
      if (intersection) {
        // area of intersection
        const area = intersection.width * intersection.height;
        if (!bestItem || area > bestItem.area) {
          // decorate item with distance/bounds for comparison with other items
          item.area = area;
          bestItem = item;
        }
      }
    });
    // if no intersections then try a proximity test
    if (!bestItem) {
      allNodesAndBlocks.forEach(item => {
        // intersection with dragged object
        item.proximityX = item.AABB.proximityX(pbox);
        item.proximityY = item.AABB.proximityY(pbox);
        if (!bestItem) {
          bestItem = item;
        } else {
          // items that match in y are tested against x
          if (item.proximityY <= bestItem.proximityY) {
            if (item.proximityY === bestItem.proximityY && item.proximityX < bestItem.proximityX) {
              bestItem = item;
            } else {
              bestItem = item;
            }
          }
        }
      });
    }

    if (bestItem) {
      // the edgeThreshold is usually a small region at left/right of block
      // but if the block cannot have children then we expand to cover the entire block
      let threshold = edgeThreshold;
      if (!this.constructViewer.blockCanHaveChildren(bestItem.block)) {
        threshold = Math.ceil(bestItem.AABB.w / 2);
      }
      let edge = null;
      if (point.x <= bestItem.AABB.x + threshold) {
        edge = 'left';
      }
      if (point.x >= bestItem.AABB.right - threshold) {
        edge = 'right';
      }
      return { block: bestItem.block, edge };
    }
    // the construct must be empty
    return null;
  }

  /**
   * accessor for the construct in our constructviewer owner
   */
  get construct() {
    return this.constructViewer.props.construct;
  }
  // syntax sugar to determine if collapsed
  get collapsed() {
    return this.layout.collapsed;
  }
  /**
   * mouse enter/leave are used to ensure no block is in the hover state
   */
  mouseEnter(event) {
    this.setTitleHover();
  }

  mouseLeave(event) {
    this.setTitleHover();
  }


  /**
   * set hover state for title node
   */
  setTitleHover(hover) {
    // bail on no change
    if (this.layout.titleNode.hover === hover) {
      return;
    }

    this.layout.titleNode.set({
      hover,
    });
    this.layout.titleNode.updateBranch();
  }

  /**
   * double click handler
   */
  doubleClick(evt, point) {
    const top = this.topNodeAt(point);
    const block = this.layout.elementFromNode(top);
    if (block) {
      this.constructViewer.openInspector();
    }
  }

  /**
   * mouse move handler ( note, not the same as drag which is with a button held down )
   */
  mouseMove(evt, point) {
    let clickable = false;
    if (!this.collapsed) {
      const hits = this.sg.findNodesAt(point);
      const isTitle = this.isConstructTitleNode(hits.length ? hits.pop() : null);
      const isBlock = this.topBlockAt(point);
      if (this.construct.isAuthoring() || !this.construct.isFixed()) {
        this.setTitleHover(isTitle);
      }
      clickable = isTitle || isBlock;
    }
    this.setCursor(clickable ? 'pointer' : 'default');
  }

  /**
   * set the default cursor or change the cursor to the given style
   * https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
   * @param show
   * @param style
   */
  setCursor(style = 'default') {
    this.el.style.cursor = style;
  }

  /**
   * mouse down handler, selection occurs on up since we have to wait to
   * see if a drag occurs first.
   */
  mouseDown(evt, point) {
  }

  /**
   * Might signal the end of fence drag or just a normal click
   */
  mouseUp(evt, point) {
    // don't let it propagate to the canvas, it will register as a click and cause
    // an unfocus operation to undo what we are about to do.
    evt.stopPropagation();
    evt.preventDefault();
    if (this.fence) {
      // select blocks within the fence then dispose it
      this.selectNodesByRectangle(this.fence.getBox());
      this.fence.dispose();
      this.fence = null;
      this.constructViewer.props.endMouseScroll();
    } else {
      this.mouseSelect(evt, point);
    }
  }

  checkOS() {
    let osType = 'unknown';
    if (navigator.userAgent.indexOf('Windows', 0) >= 0) osType = 'win';
    else if (navigator.userAgent.indexOf('Mac', 0) >= 0) osType = 'mac';
    else if (navigator.userAgent.indexOf('Linux', 0) >= 0) osType = 'linux';
    else if (navigator.userAgent.indexOf('X11', 0) >= 0) osType = 'unix';

    return osType;
  }

  metaKey(evt) {
    return (this.osType === 'mac' ? evt.metaKey : evt.ctrlKey) || evt.altKey;
  }

  /**
   * context menu for blocks and constructs
   */
  contextMenu(evt, point) {
    evt.preventDefault();
    // select construct regardless of where click occurred.
    this.selectConstruct();
    // open construct menu for title according to position
    if (this.titleContextMenu(evt, point)) {
      return;
    }

    // show context menu for blocks if there are selections of the user is over a block
    const showMenu = () => {
      this.constructViewer.openPopup({
        blockPopupMenuOpen: true,
        menuPosition: this.mouseTrap.mouseToGlobal(evt),
      });
    };
    // if there are no selections try to select the block at the cursor
    if (!this.selections.length) {
      const block = this.topBlockAt(point);
      if (block) {
        this.constructViewer.blockSelected([block]);
        showMenu();
      }
    } else {
      showMenu();
    }
  }

  /**
   * run the title context menu if the point is over the title block.
   */
  titleContextMenu(evt, point) {
    const hits = this.sg.findNodesAt(point);
    if (this.isConstructTitleNode(hits.length ? hits.pop() : null)) {
      this.constructViewer.openPopup({
        constructPopupMenuOpen: true,
        menuPosition: this.mouseTrap.mouseToGlobal(evt),
      });
      return true;
    }
    return false;
  }
  /**
   * true if the point is in the title expander node ( looks like a triangle )
   * @param  {[type]} evt   [description]
   * @param  {[type]} point [description]
   * @return {Boolean}       [description]
   */
  constructExpander(evt, point) {
    const hits = this.sg.findNodesAt(point);
    const hit = hits.length ? hits.pop() : null;
    if (hit && hit.dataAttribute && hit.dataAttribute.value === 'moreLabel') {
      return true;
    }
    if (hit === this.layout.banner) {
      // inside the banner but should be within the triangle
      const AABB = this.layout.banner.getAABB();
      // just a box test, which is more forgiving for the user
      return point.x - AABB.x < AABB.height;
    }
    return false;
  }

  /**
   * select with mouse including handling ancillary actions like opening the context menu and toggle nested construct
   */
  mouseSelect(evt, point) {
    evt.preventDefault();
    // select construct whenever a selection occurs regardless of blocks hit etc
    this.selectConstruct();

    // text expander toggle first
    if (this.constructExpander(evt, point)) {
      this.layout.setCollapsed(!this.layout.collapsed);
      if (this.collapsed) {
        this.constructViewer.blockSelected([]);
      }
      this.constructViewer.update();
      return;
    }
    // ignore everything else if we are collapsed
    if (this.collapsed) {
      return;
    }

    // check for block select
    const block = this.topBlockAt(point);
    if (block) {
      // if the user clicks a sub component ( ... menu accessor or expand / collapse for example )
      // the clicked block is just added to the selections, otherwise it replaces the selection.
      // Also, if the shift key is used the block is added and does not replace the selection
      let action = 'replace';
      if (evt.shiftKey) {
        action = 'add';
      }
      if (this.metaKey(evt)) {
        action = 'toggle';
      }
      // act according to region clicked
      const globalPoint = this.mouseTrap.mouseToGlobal(evt);
      const region = this.getBlockRegion(block, globalPoint);
      switch (region.where) {

      case 'triangle':
        const node = this.layout.nodeFromElement(block);
        node.showChildren = !node.showChildren;
        this.constructViewer.update();
        // change replace to add if opening the menu
        if (action === 'replace') {
          action = 'add';
        }
        break;

      case 'option':
        // user might have clicked an 'empty list' placeholder, otherwise select the option
        if (region.optionId) {
          this.constructViewer.optionSelected(region.blockId, region.optionId);
          action = 'optionSelect';
        }
        break;

      default:
        break;
      }
      // perform the final selection action using block
      switch (action) {
      case 'toggle' :
        this.constructViewer.blockToggleSelected([block]);
        break;
      case 'add':
        this.constructViewer.blockAddToSelectionsRange(block, this.selectedElements);
        break;
      case 'optionSelect':
        break;
      default:
        if (this.blockIsFocused(block) && (this.construct.isAuthoring() || !this.construct.isFixed())) {
          const name = this.layout.partName(block);
          const bat = this.getBlockEditorBoundsAndTarget(block);
          this.constructViewer.showInlineEditor(value => {
            this.constructViewer.renameBlock(block, value);
          }, name, bat.bounds, 'inline-editor-block', bat.target);
        } else {
          this.constructViewer.blockSelected([block]);
        }
        break;
      }
    } else {
      // clear block selections
      this.constructViewer.blockSelected([]);
      // if they clicked the title node then select the construct and initiate editing
      // of the title of construct via an inline edit.
      if (this.construct.isAuthoring() || !this.construct.isFixed()) {
        const topNode = this.topNodeAt(point);
        if (this.isConstructTitleNode(topNode)) {
          this.selectConstruct();
          const bat = this.getTitleEditorBoundsAndTarget();
          this.constructViewer.showInlineEditor(value => {
            this.constructViewer.renameBlock(this.construct.id, value);
          }, this.construct.getName(), bat.bounds, 'inline-editor-construct-title', bat.target);
          topNode.set({ hover: false });
        }
      }
    }
  }

  /**
   * get the bounds for the block editor for the given block id
   * @param blockId
   */
  getBlockEditorBoundsAndTarget(blockId) {
    const node = this.layout.nodeFromElement(blockId);
    const target = node.el;
    const bounds = new Box2D(target.getBoundingClientRect());
    return {target, bounds};
  }

  /**
   * get the bounds for the construct title editor
   * @param blockId
   */
  getTitleEditorBoundsAndTarget() {
    const target = this.layout.titleNode.el;
    const bounds = new Box2D(target.getBoundingClientRect());
    const aabb = this.layout.getBlocksAABB();
    bounds.width = Math.min(this.layout.titleNodeTextWidth, aabb.width);
    bounds.width = Math.max(bounds.width, this.layout.sceneGraph.availableWidth / 2);
    bounds.top += 6;
    bounds.height -= 12;
    return {target, bounds};
  }

  /**
   * selected construct is lighter than unselected constructs
   *
   */
  update() {
    super.update();
    if (this.constructViewer.isFocused()) {
      this.lighten();
    } else {
      this.darken();
    }
  }

  /**
   * select the construct if not already selected
   */
  selectConstruct() {
    // select the construct if not already the selected construct ( changing
    // the construct will remove blocks that are not part of the construct from the selections )
    if (this.constructViewer.props.construct.id !== this.constructViewer.props.focus.constructId) {
      this.constructViewer.constructSelected(this.constructViewer.props.construct.id);
    }
  }

  /**
   * return an indication of where in the block this point lies.
   * {
   * 	where: ['none', 'main, 'dots', 'option']
   * 	// with additional properties as per the region hit
   * }
   */
  getBlockRegion(block, globalPoint) {
    // substract window scrolling from global point to get viewport coordinates
    const vpt = globalPoint.sub(new Vector2D(window.scrollX, window.scrollY));
    // compare against viewport bounds of node representing the block
    const node = this.layout.nodeFromElement(block);
    const box = node.el.getBoundingClientRect();
    // compare to bounds
    if (vpt.x < box.left || vpt.x > box.right || vpt.y < box.top || vpt.y > box.bottom) {
      // check list blocks which are outside the bounds of the parent
      for (let i = 0; i < node.children.length; i += 1) {
        const child = node.children[i];
        if (child.listParentBlock) {
          // node represents a list block
          const childBox = child.el.getBoundingClientRect();
          if (vpt.x >= childBox.left && vpt.x < childBox.right && vpt.y >= childBox.top && vpt.y < childBox.bottom) {
            return {
              where: 'option',
              blockId: child.listParentBlock.id,
              optionId: child.listBlock ? child.listBlock.id : null,
            };
          }
        }
      }
      return { where: 'none' };
    }

    // child expander, if present
    if (node.hasChildren) {
      const triSize = 18;     // width / height equilateral triangle, slightly larger than css but makes for a better feel
      const insetX = vpt.x - box.left;
      const insetY = vpt.y - box.top;
      if (insetX < triSize && insetY < triSize) {
        // whatever the x position is ( 0..triSize ), y must be less than trisize - x
        if (insetY <= (triSize - insetX)) {
          return { where: 'triangle' };
        }
      }
    }
    // in block but nowhere special
    return { where: 'main' };
  }

  /**
   * list of all selected blocks, based on our selected scenegraph blocks
   *
   */
  get selectedElements() {
    return this.selections.map((node) => {
      return this.layout.elementFromNode(node);
    });
  }

  /**
   * true if the given block ID is focused
   * @param blockId
   * @returns {boolean}
   */
  blockIsFocused(blockId) {
    return this.constructViewer.props.focus.blockIds.indexOf(blockId) >= 0;
  }
  /**
   * move drag handler, if the user initiates a drag of a block hand over
   * to the DND manager to handle
   */
  mouseDrag(evt, point, startPoint, distance) {
    // ignore if collapsed
    if (this.collapsed) {
      return;
    }

    // ignore drags until they reach a certain vector threshold
    if (distance > dragThreshold && !this.fence) {
      // start a block drag if we have one
      const blockId = this.topBlockAt(startPoint);
      // must be dragging a selected block
      if (blockId) {
        // cancel our own mouse operations for now
        this.mouseTrap.cancelDrag();
        // no mutation of frozen constructs
        if (this.construct.isFrozen()) {
          return;
        }
        // no mutation of fixed constructs unless authoring
        if (this.construct.isFixed() && !this.construct.isAuthoring()) {
          return;
        }
        // open an undo/redo transaction
        dispatch(transact());
        // if the block being dragging is one of the selections then single select it
        let draggables = this.selectedElements;
        if (!this.blockIsFocused(blockId)) {
          draggables = [blockId];
          this.constructViewer.blockSelected(draggables);
        }
        //this.constructViewer.blockAddToSelections([block]);
        // get global point as starting point for drag
        const globalPoint = this.mouseTrap.mouseToGlobal(evt);
        // proxy representing 1 ore more blocks
        const proxy = this.makeDragProxy(draggables);
        // remove the blocks, unless meta key pressed.
        const copying = evt.altKey;
        // filter our selected elements so they are in natural order
        // and with children of selected parents excluded.
        const blockIds = sortBlocksByIndexAndDepthExclude(draggables).map(info => info.blockId);
        if (!copying) {
          this.constructViewer.removePartsList(blockIds);
        }
        // start the drag with the proxy and the removed block as the payload
        // and indicate that the source of the drag is another construct viewer
        DnD.startDrag(proxy, globalPoint, {
          item: blockIds,
          source: 'construct-viewer',
          copying: copying,
        }, {
          undoRedoTransaction: true,
        });
      } else {
        // start a fence drag if not over a part
        if (!this.fence) {
          this.constructViewer.constructSelected(this.constructViewer.props.constructId);
          // clear current selections unless shift pressed
          if (!evt.shiftKey) {
            this.constructViewer.blockSelected([]);
          }
          this.fence = new Fence(this, point);
        }
      }
    } else {
      if (this.fence) {
        // mousetrap sends local mouse position but we want the global one for
        // autoscrolling in the canvas
        this.constructViewer.props.mouseScroll(this.mouseTrap.mouseToGlobal(evt));
        this.fence.update(point);
      }
    }
  }

  /**
   * make a drag proxy by gathering all the selected blocks into a group ( up to
   * a limit )
   */
  makeDragProxy(draggables) {
    // create a div to hold the first five blocks at most
    const div = document.createElement('div');
    div.style.display = 'inline-block';
    div.style.position = 'relative';
    const nodes = draggables.map(elem => this.layout.nodeFromElement(elem));
    const limit = Math.min(5, nodes.length);
    let x = 0;
    let width = 0;
    let height = 0;
    for (let i = 0; i < limit; i += 1) {
      const node = nodes[i].el;
      const clone = node.cloneNode(true);
      clone.style.position = 'absolute';
      clone.style.left = `${x}px`;
      clone.style.top = `0px`;
      clone.style.transform = null;
      clone.style.opacity = (1 / limit) * (limit - i);
      div.appendChild(clone);
      width += node.clientWidth;
      height = Math.max(height, node.clientHeight);
      x += node.clientWidth;
    }
    div.style.width = `${width}px`;
    div.style.height = `${height}px`;
    return div;
  }

  /**
   * a drag entered the construct viewer
   */
  onDragEnter(globalPoint, payload) {
    this.dragInside = true;
    this.hideEdgeInsertionPoint();
    this.hideBlockInsertionPoint();
    this.selectConstruct();
  }

  /**
   * drag left the construct viewer
   */
  onDragLeave() {
    this.dragInside = false;
    this.hideEdgeInsertionPoint();
    this.hideBlockInsertionPoint();
  }

  darken() {
    this.sg.darken();
  }

  lighten() {
    this.sg.lighten();
  }

  /**
   * drag over event
   */
  onDragOver(globalPosition, payload, proxySize) {
    // ignore if collapsed
    if (this.layout.collapsed) {
      return;
    }
    // select construct on drag over (unless collapsed)
    this.selectConstruct();
    // no drop on frozen or fixed constructs
    if (this.construct.isFrozen() || (this.construct.isFixed() && !this.construct.isAuthoring())) {
      return;
    }
    if (payload.item.isConstruct && payload.item.isConstruct() && payload.item.isTemplate()) {
      return;
    }
    // convert global point to local space via our mousetrap
    const localPosition = this.mouseTrap.globalToLocal(globalPosition, this.el);
    // user might be targeting the edge or center of block, or no block at all
    const hit = this.nearestBlockAndOptionalVerticalEdgeAt(localPosition, proxySize);
    if (hit) {
      if (hit.edge) {
        this.showInsertionPointForEdge(hit.block, hit.edge);
      } else {
        this.showInsertionPointForBlock(hit.block);
      }
    } else {
      this.showDefaultInsertPoint();
    }
  }

  /**
   * user dropped the payload on us at the given position. Defer the insertion
   * to our actual constructViewer which has all the necessary props
   */
  onDrop(globalPosition, payload, event) {
    // no drop on frozen or fixed constructs or collapsed
    if (this.layout.collapsed || this.construct.isFrozen() || (this.construct.isFixed() && !this.construct.isAuthoring())) {
      return;
    }
    // for now templates can only be dropped on the new construct target which is part of the canvas
    if (payload.item.isConstruct && payload.item.isConstruct() && payload.item.isTemplate()) {
      return;
    }

    // flatten dropped object and treats as new construct if we are empty.
    const blockids = this.constructViewer.addItemAtInsertionPoint(payload, this.insertion, event);
    this.constructViewer.constructSelected(this.constructViewer.props.constructId);
    this.constructViewer.blockSelected(blockids);
  }

  /**
   * show the insertion point at the top left of an empty construct.
   */
  showDefaultInsertPoint() {
    // insertion point may alternate so ensure we remove the block cursor
    this.hideBlockInsertionPoint();
    const point = this.layout.getInitialLayoutPoint();
    this.showInsertionPointForEdgeAt(point.x, point.y);
  }

  /**
   * show the insertion point at the given edge of the given block...usually
   * used when dropping a new block(s) into the construct
   */
  showInsertionPointForEdge(block, edge) {
    // insertion point may alternate so ensure we remove the block cursor
    this.hideBlockInsertionPoint();

    // get node representing this part and its AABB
    const node = this.layout.nodeFromElement(block);
    const AABB = node.getAABB();
    const xposition = edge === 'left' ? AABB.x : AABB.right;
    this.showInsertionPointForEdgeAt(Math.max(0, xposition - 3), AABB.y + 1);

    // save the current insertion point
    this.insertion = { block, node, edge };
  }

  /**
   * create and show insertion point for edge at the given position
   */
  showInsertionPointForEdgeAt(x, y) {
    // create insertion point as necessary
    if (!this.insertionEdgeEl) {
      this.insertionEdgeEl = document.createElement('div');
      this.insertionEdgeEl.className = 'edge-insertion-point';
      this.el.appendChild(this.insertionEdgeEl);
    }
    this.insertionEdgeEl.style.display = 'block';
    this.insertionEdgeEl.style.left = x + 'px';
    this.insertionEdgeEl.style.top = y - 10 + 'px';
  }

  /**
   * show the insertion point over the given block, usually used when dropping
   * an SBOL symbol onto an existing block.
   */
  showInsertionPointForBlock(block, edge) {
    // insertion point may alternate so ensure we remove the block cursor
    this.hideEdgeInsertionPoint();
    // create insertion point as necessary
    if (!this.insertionBlockEl) {
      this.insertionBlockEl = document.createElement('div');
      this.insertionBlockEl.className = 'block-insertion-point';
      this.el.appendChild(this.insertionBlockEl);
    }
    this.insertionBlockEl.style.display = 'block';

    // get node representing this part and its AABB
    const node = this.layout.nodeFromElement(block);
    const AABB = node.getAABB();
    // position insertion element at the appropriate edge
    this.insertionBlockEl.style.left = AABB.x - 6 + 'px';
    this.insertionBlockEl.style.top = AABB.y - 6 + 'px';
    this.insertionBlockEl.style.width = AABB.w + 1 + 'px';
    this.insertionBlockEl.style.height = AABB.h + 1 + 'px';

    // save the current insertion point
    this.insertion = { block, node };
  }

  /**
   * return the current insertion point if any
   *
   */
  getInsertionPoint() {
    return this.insertion;
  }

  /**
   * hide / deletion insertion point element
   */
  hideBlockInsertionPoint() {
    if (this.insertionBlockEl) {
      // this.el.removeChild(this.insertionBlockEl);
      // this.insertionBlockEl = null;
      this.insertionBlockEl.style.display = 'none';
    }
    this.insertion = null;
  }

  hideEdgeInsertionPoint() {
    if (this.insertionEdgeEl) {
      // this.el.removeChild(this.insertionEdgeEl);
      // this.insertionEdgeEl = null;
      this.insertionEdgeEl.style.display = 'none';
    }
    this.insertion = null;
  }
}
