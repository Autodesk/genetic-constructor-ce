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
import Vector2D from '../geometry/vector2d';
import Line2D from '../geometry/line2d';
import Node2D from '../scenegraph2d/node2d';
import Role2D from '../scenegraph2d/role2d';
import ListItem2D from '../scenegraph2d/listitem2d';
import EmptyListItem2D from '../scenegraph2d/emptylistitem2d';
import LineNode2D from '../scenegraph2d/line2d';
import kT from './layoutconstants';
import { values as objectValues } from 'lodash';
import invariant from 'invariant';
import { getLocal, setLocal } from '../../../utils/localstorage';

/**
 * layout and scene graph manager for the construct viewer
 */
export default class Layout {
  constructor(constructViewer, sceneGraph, options) {
    // we need a construct viewer, a scene graph, a construct and options
    this.constructViewer = constructViewer;
    this.sceneGraph = sceneGraph;
    // extend this with options
    Object.assign(this, {
      baseColor: 'white',
      showHeader: true,
      insetX: 0,
      insetY: 0,
      initialRowXLimit: -Infinity,
      rootLayout: true,
    }, options);

    // prep data structures for layout`
    this.rows = [];
    this.nodes2parts = {};
    this.parts2nodes = {};
    this.partUsage = {};
    this.nestedLayouts = {};
    this.connectors = {};
    this.listNodes = {};
    this.emptyMap = {};

    // this reference is incremented for each update. Blocks, lines are given
    // the latest reference whenever they are updated. Any elements without
    // the latest reference at the end of an update are no longer needed and
    // will be removed.
    this.updateReference = 0;
  }

  /**
   * size the scene graph to just accomodate all the nodes that are present.
   * This is only performed for the root layout ( nested constructs should not
   * perform this operation, as per the rootLayout property )
   *
   */
  autoSizeSceneGraph() {
    if (this.rootLayout) {
      const aabb = this.getBlocksAABB();
      this.sceneGraph.width = Math.max(aabb.right, kT.minWidth);
      if (this.collapsed) {
        this.sceneGraph.height = kT.collapsedHeight;
      } else {
        this.sceneGraph.height = Math.max(aabb.bottom, kT.minHeight) + kT.bottomPad;
      }
      this.sceneGraph.updateSize();
    }
  }

  /**
   * return the AABB for our block nodes only, including any nested layouts
   */
  getBlocksAABB() {
    // always include top left and available width to anchor the bounds
    let aabb = new Box2D(0, 0, this.sceneGraph.availableWidth, 0);
    // we should only autosize the nodes representing parts
    objectValues(this.parts2nodes).forEach(node => {
      aabb = aabb.union(node.getAABB());
      // add in any part list items for this block
      const blockId = this.elementFromNode(node);
      objectValues(this.listNodes[blockId]).forEach(node => {
        aabb = aabb.union(node.getAABB());
      });
    });
    // add any nested constructs
    objectValues(this.nestedLayouts).forEach(layout => {
      aabb = layout.getBlocksAABB().union(aabb);
    });
    return aabb;
  }

  /**
   * setup the bi drectional mapping between nodes / elements
   */
  map(part, node) {
    this.nodes2parts[node.uuid] = part;
    this.parts2nodes[part] = node;
  }

  /**
   * flag the part as currently in use i.e. should be rendered.
   * Parts that are found to be no longer be in use are removed after rendering
   * along with associated nodes
   */
  usePart(part) {
    this.partUsage[part] = this.updateReference;
  }

  /**
   * drop any parts that don't match the current update reference
   * Also drop nodes associated with the part.
   */
  dropParts() {
    const keys = Object.keys(this.partUsage);
    keys.forEach(part => {
      if (this.partUsage[part] < this.updateReference) {
        const node = this.parts2nodes[part];
        if (node) {
          delete this.nodes2parts[node.uuid];
          delete this.parts2nodes[part];
          delete this.partUsage[part];
          node.parent.removeChild(node);
        }
        // drop any associated list items with the part.
        //this.dropPartListItems(part);
      }
    });
  }

  /**
   * create a list part for the block
   */
  listBlockFactory() {
    const props = Object.assign({}, {
      dataAttribute: { name: 'nodetype', value: 'part' },
      sg: this.sceneGraph,
    }, kT.partAppearance);
    return new ListItem2D(props);
  }

  /**
   * create an empty list block
   */
  emptyListBlockFactory(blockId, parentNode) {
    let node = this.emptyMap[blockId];
    if (!node) {
      const props = Object.assign({}, {
        parent: parentNode,
        strokeWidth: 0,
        sg: this.sceneGraph,
      }, kT.partAppearance);
      node = this.emptyMap[blockId] = new EmptyListItem2D(props);
    }
    return node;
  }

  /**
   * drop nodes allocated with emptyListBlockFactory that are no longer needed
   *
   */
  dropEmptyBlocks() {
    Object.keys(this.emptyMap).forEach((parentBlockId) => {
      const node = this.emptyMap[parentBlockId];
      if (node.updateReference !== this.updateReference) {
        node.parent.removeChild(node);
        delete this.emptyMap[parentBlockId];
      }
    });
  }

  /**
   * create / update the list items for the block
   */
  updateListForBlock(block, pW) {
    // ignore if not a list block
    if (!block.isList()) {
      return;
    }
    // the node representing the parent block
    const parentNode = this.nodeFromElement(block.id);
    // get the focused list for this block
    const focusedOptionId = this.focusedOptions[block.id];
    // get only the options that are enabled for this block
    const enabled = Object.keys(block.options).filter(opt => block.options[opt]);
    // if block list is empty add a single placeholder block
    if (enabled.length === 0) {
      const node = this.emptyListBlockFactory(block.id, parentNode);
      node.set({
        bounds: new Box2D(0, kT.blockH + 1, pW, kT.optionH),
        fill: this.fillColor(block.id),
        updateReference: this.updateReference,
        listParentBlock: block,
        listParentNode: parentNode,
      });
    } else {
      // find the index of the focused list option, or default the first one
      let focusedIndex = enabled.findIndex(blockId => focusedOptionId === blockId);
      if (focusedIndex < 0) {
        focusedIndex = 0;
      }
      enabled.forEach((blockId, index) => {
        // ensure we have a hash of list nodes for this block.
        let nodes = this.listNodes[block.id];
        if (!nodes) {
          nodes = this.listNodes[block.id] = {};
        }
        // get the block in the list
        const listBlock = this.getListBlock(blockId);

        // create node as necessary for this block
        let listNode = nodes[blockId];
        if (!listNode) {
          listNode = nodes[blockId] = this.listBlockFactory();
          parentNode.appendChild(listNode);
        }
        // update position and other visual attributes of list part
        listNode.set({
          bounds: new Box2D(0, kT.blockH + 1 + index * kT.optionH, pW, kT.optionH),
          text: listBlock.metadata.name,
          fill: this.fillColor(block.id),
          color: this.fontColor(block.id),
          updateReference: this.updateReference,
          listParentBlock: block,
          listParentNode: this.nodeFromElement(block.id),
          listBlock,
          optionSelected: index === focusedIndex,
        });
      });
    }
  }

  /**
   * drop any list nodes that are not up tp date with the updateReference
   */
  dropListItems() {
    // outer loop will iterate over a hash of list node each block with list items
    Object.keys(this.listNodes).forEach(blockId => {
      const nodeHash = this.listNodes[blockId];
      Object.keys(nodeHash).forEach(key => {
        const node = nodeHash[key];
        if (node.updateReference !== this.updateReference) {
          node.parent.removeChild(node);
          delete nodeHash[key];
        }
      });
    });
  }

  /**
   * return the element from the data represented by the given node uuid.
   * This searches this construct and any nested construct to find the part
   */
  elementFromNode(node) {
    let part = this.nodes2parts[node.uuid];
    if (!part) {
      const nestedKeys = Object.keys(this.nestedLayouts);
      for (let i = 0; i < nestedKeys.length && !part; i += 1) {
        part = this.nestedLayouts[nestedKeys[i]].elementFromNode(node);
      }
    }
    return part;
  }

  /**
   * reverse mapping from anything with an 'uuid' property to a node
   * Looks into nested constructs as well.
   */
  nodeFromElement(element) {
    let node = this.parts2nodes[element];
    if (!node) {
      const nestedKeys = Object.keys(this.nestedLayouts);
      for (let i = 0; i < nestedKeys.length && !node; i += 1) {
        node = this.nestedLayouts[nestedKeys[i]].nodeFromElement(element);
      }
    }
    return node;
  }

  /**
   * return an array of {block, node} objects for this layout
   * and all nested layouts.
   */
  allNodesAndBlocks() {
    let list = Object.keys(this.parts2nodes).map(block => {
      return { block, node: this.parts2nodes[block] };
    });
    Object.keys(this.nestedLayouts).forEach(key => {
      list = list.concat(this.nestedLayouts[key].allNodesAndBlocks());
    });
    return list;
  }

  /**
   * create a node, if not already created for the given piece.
   * Add to our hash for tracking
   *
   *
   *
   */
  partFactory(part, appearance) {
    let node = this.nodeFromElement(part);
    if (!node) {
      const props = Object.assign({}, {
        dataAttribute: { name: 'nodetype', value: 'block' },
        sg: this.sceneGraph,
      }, appearance);
      props.roleName = this.isSBOL(part) ? this.blocks[part].rules.role || this.blocks[part].metadata.role : null;
      node = new Role2D(props);
      this.sceneGraph.root.appendChild(node);
      this.map(part, node);
      // set correct hover class
      node.set({
        hoverClass: props.roleName ? 'inline-editor-hover-block' : 'inline-editor-hover-block-noimage',
      });
    }
    // hide/show child expand/collapse glyph
    node.set({
      hasChildren: this.someChildrenVisible(part),
    });
    // mark part as in use
    this.usePart(part);
  }

  /**
   * return one of the meta data properties for a part.
   */
  partMeta(part, meta) {
    return this.blocks[part].metadata[meta];
  }

  /**
   * used specified color, or filler color for filler block or light gray
   */
  fillColor(part) {
    const block = this.blocks[part];

    if (this.blockColor) {
      return this.blockColor(part);
    }

    return block.getColor(this.palette);
  }

  /**
   * filler blocks get a special color
   */
  fontColor(part) {
    const block = this.blocks[part];
    if (block.isFiller()) return '#6B6F7C';
    return '#1d222d';
  }

  /**
   * NOTE: In authoring mode blocks are never hidden.
   * @param  {string} blockId
   * @return {boolean}
   */
  blockIsHidden(blockId) {
    if (this.isAuthoring()) {
      return false;
    }
    const block = this.blocks[blockId];
    return block.isHidden();
  }

  /**
   * return true if all the children of the given block are hidden.
   * Also returns true if the block has no children
   * @param  {string} blockId
   * @return {boolean}
   */
  allChildrenHidden(blockId) {
    return this.blocks[blockId].components.every(childId => this.blockIsHidden(childId));
  }

  /**
   * true if any of the children are visible
   * @param  {string} blockId
   0   * @return {boolean}
   */
  someChildrenVisible(blockId) {
    return this.blocks[blockId].components.some(childId => !this.blockIsHidden(childId));
  }

  /**
   * return true if the block appears to be an SBOL symbol
   */
  isSBOL(part) {
    return !!(this.blocks[part].rules.role || this.blocks[part].metadata.role);
  }

  /**
   * return true if the given block has children
   */
  hasChildren(blockId) {
    const block = this.blocks[blockId];
    invariant(block, 'expect to be able to find the block');
    return block.components && block.components.length;
  }

  /**
   * return the first child of the given block or null if it has no children
   */
  firstChild(blockId) {
    const block = this.blocks[blockId];
    invariant(block, 'expect to be able to find the block');
    return block.components && block.components.length ? block.components[0] : null;
  }

  /**
   * first child then is not hidden
   * @param  {[type]} blockId [description]
   * @return {[type]}         [description]
   */
  firstVisibleChild(blockId) {
    const block = this.blocks[blockId];
    invariant(block, 'expect to be able to find the block');
    const cid = block.components.find(childId => !this.blockIsHidden(childId));
    invariant(cid, 'expect to find a visible child');
    return cid;
  }

  /**
   * return the two nodes that we need to graphically connect to show a connection.
   * The given block is the source block
   */
  connectionInfo(sourceBlockId) {
    const destinationBlockId = this.firstVisibleChild(sourceBlockId);
    invariant(destinationBlockId, 'expected a child if this method is called');
    return {
      sourceBlock: this.blocks[sourceBlockId],
      destinationBlock: this.blocks[destinationBlockId],
      sourceNode: this.nodeFromElement(sourceBlockId),
      destinationNode: this.nodeFromElement(destinationBlockId),
    };
  }

  /**
   * return the part ID or if metadata is available use the name property if available.
   * If the part is an SBOL symbol then use the symbol name preferentially
   */
  partName(part) {
    return this.blocks[part].getName('New Block', true);
  }

  /**
   * create the banner / bar for the construct ( contains the triangle )
   *
   */
  bannerFactory() {
    if (this.showHeader && !this.banner) {
      this.banner = new Node2D({
        sg: this.sceneGraph,
        glyph: 'construct-banner',
        dataAttribute: { name: 'nodetype', value: 'construct-banner' },
      });
      this.sceneGraph.root.appendChild(this.banner);
    }
    if (this.banner) {
      this.banner.set({
        fill: this.baseColor,
        stroke: this.baseColor,
        bounds: new Box2D(this.insetX, this.insetY, this.sceneGraph.availableWidth - this.insetX, kT.bannerHeight),
      });
    }
  }

  /**
   * create title as necessary
   *
   *
   */
  titleFactory() {
    if (this.showHeader) {
      if (!this.titleNode) {
        // node that carries the text
        this.titleNode = new Node2D(Object.assign({
          dataAttribute: { name: 'nodetype', value: 'construct-title' },
          sg: this.sceneGraph,
          hoverClass: 'inline-editor-hover-title',
          textIndent: 4,
        }, kT.titleAppearance));
        this.sceneGraph.root.appendChild(this.titleNode);
      }

      // update title to current position and text and width, also add gray text
      // to indicate template if appropriate
      let text = this.construct.getName('New Construct');
      if (this.construct.isTemplate()) {
        text += '<span style="color:gray">&nbsp;Template</span>';
      }
      if (this.isAuthoring()) {
        text += '<span style="color:gray">&nbsp;(Authoring)</span>';
      }
      this.titleNodeTextWidth = this.titleNode.measureText(text).x + kT.textPad;

      this.titleNode.set({
        text: text,
        color: this.baseColor,
        bounds: new Box2D(this.insetX, this.insetY + kT.bannerHeight, this.sceneGraph.availableWidth - this.insetX - kT.rightPad, kT.titleH),
        dataAttribute: { name: 'construct-title', value: text },
      });
    }
  }

  /**
   * create the vertical bar as necessary and update its color
   */
  verticalFactory() {
    if (!this.vertical) {
      this.vertical = new Node2D(Object.assign({
        sg: this.sceneGraph,
      }, kT.verticalAppearance));
      this.sceneGraph.root.appendChild(this.vertical);
    }
    this.vertical.set({
      fill: this.baseColor,
    });
  }

  /**
   * create or recycle a row on demand.
   */
  rowFactory(bounds) {
    // re-use existing if possible
    let row = this.rows.find(row => row.updateReference !== this.updateReference);
    if (!row) {
      row = new Node2D(Object.assign({
        sg: this.sceneGraph,
        strokeWidth: 0,
      }, kT.rowAppearance));
      this.sceneGraph.root.appendChild(row);
      this.rows.push(row);
    }
    // set bounds and update to current color
    row.set({
      bounds: bounds,
      fill: this.baseColor,
      strokeWidth: 0,
      updateReference: this.updateReference,
    });
    return row;
  }

  /**
   * a map of the extant layout objects, so we can dispose unused ones after layout
   */
  resetNestedConstructs() {
    this.newNestedLayouts = {};
  }

  /**
   * dispose and unused rows
   */
  disposeRows() {
    // keep rows still in use, remove the others
    const keepers = [];
    this.rows.forEach(row => {
      if (row.updateReference === this.updateReference) {
        keepers.push(row);
      } else {
        this.sceneGraph.root.removeChild(row);
      }
    });
    this.rows = keepers;
  }

  /**
   * dispose any nested constructs no longer referenced.
   */
  disposeNestedLayouts() {
    Object.keys(this.nestedLayouts).forEach(key => {
      this.nestedLayouts[key].dispose();
    });
    this.nestedLayouts = this.newNestedLayouts;
  }

  /**
   * nested constructs may be indicate not authoring when the top level construct does
   * so always check the top level construct.
   * @return {Boolean}
   */
  isAuthoring() {
    // construct may not be present when used as a preview control in the order form
    if (this.constructViewer.props.construct) {
      return this.constructViewer.props.construct.isAuthoring();
    }
    return false;
  }

  /**
   * store layout information on our cloned copy of the data, constructing
   * display elements as required
   *
   */
  update(options) {
    this.options = options;
    this.construct = options.construct;
    this.palette = this.construct.metadata.palette;
    this.blocks = options.blocks;
    this.currentConstructId = options.currentConstructId;
    this.currentBlocks = options.currentBlocks;
    this.focusedOptions = options.focusedOptions || {};
    this.blockColor = options.blockColor;
    invariant(this.construct && this.blocks && this.currentBlocks && this.focusedOptions, 'missing required options');

    this.baseColor = this.construct.getColor();

    // get collapsed state, if present from local storage
    this.collapsed = getLocal(`${this.construct.id}-collapsed`, false);

    // perform layout and remember how much vertical was required
    const layoutResults = this.layoutWrap();

    // update connections etc after layout
    this.postLayout(layoutResults);

    // auto size scene after layout
    this.autoSizeSceneGraph();

    // return our layout results for our parent, if any
    return layoutResults;
  }

  /**
   * set collapsed state and persist to local storage
   */
  setCollapsed(state) {
    this.collapsed = state;
    setLocal(`${this.construct.id}-collapsed`, this.collapsed);
  }

  /**
   * one of several different layout algorithms
   *
   */
  layoutWrap() {
    return this.layout({
      xlimit: this.sceneGraph.availableWidth - this.insetX - kT.rightPad,
      condensed: false,
    });
  }

  /**
   */

  measureText(node, str) {
    return node.getPreferredSize(str);
  }

  /**
   * return the point where layout of actual blocks begins
   *
   */
  getInitialLayoutPoint() {
    return new Vector2D(this.insetX + kT.rowBarW, this.insetY + (this.showHeader ? kT.bannerHeight + kT.titleH + kT.rowBarH : kT.rowBarH));
  }

  /**
   * get list block from ether
   */
  getListBlock(id) {
    const item = this.blocks[id];
    invariant(item, 'list item not found');
    return item;
  }

  /**
   * layout, configured with various options:
   * xlimit: maximum x extent
   *
   */
  layout(layoutOptions) {
    // set the new reference key
    this.updateReference += 1;
    // shortcut
    const ct = this.construct;
    // construct the banner if required
    this.bannerFactory();
    // create and update title
    this.titleFactory();
    // maximum x position
    const mx = layoutOptions.xlimit - (this.collapsed ? kT.collapsedMessageWidth : 0);
    // reset nested constructs
    this.resetNestedConstructs();
    // layout all the various components, constructing elements as required
    // and wrapping when a row is complete
    const initialPoint = this.getInitialLayoutPoint();
    const startX = initialPoint.x;
    let xp = startX;
    const startY = initialPoint.y;
    let yp = startY;

    // used to determine when we need a new row
    let row = null;

    // additional vertical space consumed on every row for nested constructs
    let nestedVertical = 0;

    // additional height required by the tallest list on the row
    let maxListHeight = 0;

    // used to track the nested constructs on each row
    let nestedConstructs = [];

    // width of first row is effected by parent block, so we have to track
    // which row we are on.
    let rowIndex = 0;

    // if collapsed will track the number of clipped blocks
    let clippedBlocks = 0;

    // display only non hidden blocks
    const components = ct.components.filter(blockId => !this.blockIsHidden(blockId));

    // layout all non hidden blocks
    components.forEach(part => {
      // create a row bar as necessary
      if (!row) {
        row = this.rowFactory(new Box2D(this.insetX, yp - kT.rowBarH, 0, kT.rowBarH));
      }
      // resize row bar to current row width
      const rowStart = this.insetX;
      const rowEnd = rowIndex === 0 ? Math.max(xp, this.initialRowXLimit) : xp;
      const rowWidth = rowEnd - rowStart;
      row.set({ translateX: rowStart + rowWidth / 2, width: rowWidth });

      // create the node representing the part
      this.partFactory(part, kT.partAppearance);

      // get the node representing this part and the actual block from the part id.
      const node = this.nodeFromElement(part);
      const block = this.blocks[part];
      const name = this.partName(part);
      const listN = Object.keys(block.options).filter(opt => block.options[opt]).length;

      // set role part name if any
      node.set({
        roleName: this.isSBOL(part) ? block.rules.role || block.metadata.role : null,
      });

      // measure element text or used condensed spacing
      const td = this.measureText(node, name);

      // if collapsed and this isn't the first row then this block will be clipped
      if (rowIndex > 0 && this.collapsed) {
        clippedBlocks += 1;
      }

      // measure the max required width of all list blocks
      Object.keys(block.options).filter(opt => block.options[opt]).forEach(blockId => {
        let width = this.measureText(node, this.getListBlock(blockId).metadata.name).x;
        width += kT.optionDotW;
        td.x = Math.max(td.x, width);
      });

      // if position would exceed x limit then wrap
      if (xp + td.x > mx) {
        // ensure all nested constructs on the row are updated for list block height
        if (nestedConstructs.length && maxListHeight > 0) {
          nestedConstructs.forEach(child => {
            child.insetY += maxListHeight;
            child.update({
              construct: child.construct,
              blocks: this.blocks,
              currentBlocks: this.currentBlocks,
              currentConstructId: this.currentConstructId,
            });
          });
        }
        nestedConstructs = [];
        xp = startX;
        yp += kT.rowH + nestedVertical + maxListHeight;
        nestedVertical = 0;
        maxListHeight = 0;
        row = this.rowFactory(new Box2D(xp, yp - kT.rowBarH, 0, kT.rowBarH));
        rowIndex += 1;
      }

      // update maxListHeight based on how many list items this block has
      maxListHeight = Math.max(maxListHeight, listN * kT.optionH);
      invariant(isFinite(maxListHeight) && maxListHeight >= 0, 'expected a valid number');

      // update part, including its text and color and with height to accomodate list items
      node.set({
        bounds: new Box2D(xp, yp, td.x, kT.blockH),
        text: name,
        fill: this.fillColor(part),
        color: this.fontColor(part),
      });

      // update any list parts for this blocks
      this.updateListForBlock(block, td.x);

      // render children unless user has collapsed the block or it is hidden OR all its children are hidden
      if (node.showChildren && !this.blockIsHidden(part) && this.someChildrenVisible(part) && !this.collapsed) {
        // establish the position
        const nestedX = this.insetX + kT.nestedInsetX;
        const nestedY = yp + nestedVertical + kT.blockH + kT.nestedInsetY;
        // get or create the layout object for this nested construct
        let nestedLayout = this.nestedLayouts[part];
        if (!nestedLayout) {
          nestedLayout = this.nestedLayouts[part] = new Layout(this.constructViewer, this.sceneGraph, {
            showHeader: false,
            insetX: nestedX,
            insetY: nestedY,
            rootLayout: false,
          });
        }

        // track the nested layouts per row since they might need adjusting for list blocks
        // at the end of the row
        nestedConstructs.push(nestedLayout);

        // update base color of nested construct skeleton
        nestedLayout.baseColor = block.getColor() || this.baseColor;

        // update minimum x extent of first rowH
        nestedLayout.initialRowXLimit = this.getConnectionRowLimit(part);

        // ensure layout has the latest position ( parent may have moved )
        nestedLayout.insetX = nestedX;
        nestedLayout.insetY = nestedY;

        // layout with same options as ourselves
        nestedVertical += nestedLayout.update({
          construct: this.blocks[part],
          blocks: this.blocks,
          currentBlocks: this.currentBlocks,
          currentConstructId: this.currentConstructId,
        }).height + kT.nestedInsetY;

        // remove from old collection so the layout won't get disposed
        // and add to the new set of layouts
        this.newNestedLayouts[part] = nestedLayout;
        delete this.nestedLayouts[part];
      }
      // set next part position
      xp += td.x;
    });

    // ensure final row has the final row width
    if (row) {
      const rowStart = this.insetX + 1;
      const rowEnd = rowIndex === 0 ? Math.max(xp, this.initialRowXLimit) : xp;
      const rowWidth = rowEnd - rowStart;
      row.set({ translateX: rowStart + rowWidth / 2, width: rowWidth });

      // ensure all nested constructs on the row are updated for list block height
      if (nestedConstructs.length && maxListHeight > 0) {
        nestedConstructs.forEach(child => {
          child.insetY += maxListHeight;
          child.update({
            construct: child.construct,
            blocks: this.blocks,
            currentBlocks: this.currentBlocks,
            currentConstructId: this.currentConstructId,
          });
        });
      }
    }

    // cleanup any dangling rows
    this.disposeRows();

    // cleanup and dangling nested constructs
    this.disposeNestedLayouts();

    // drop unused parts and nodes
    this.dropParts();

    // drop unused list items
    this.dropListItems();

    // drop unused empty block placeholders
    this.dropEmptyBlocks();

    // create/show vertical bar
    this.verticalFactory();

    // position and size vertical bar
    const heightUsed = yp - startY + kT.blockH;
    let barHeight = heightUsed - kT.blockH + kT.rowBarH;
    // if the height is small just make zero since its not needed
    if (barHeight <= kT.rowBarH) {
      barHeight = 0;
    }
    this.vertical.set({
      bounds: new Box2D(this.insetX, startY - kT.rowBarH, kT.rowBarW, barHeight),
    });
    // filter the selections so that we eliminate those block we don't contain
    let selectedNodes = [];
    if (this.currentBlocks) {
      const containedBlockIds = this.currentBlocks.filter(blockId => {
        return !!this.nodeFromElement(blockId);
      });
      // get nodes for selected blocks
      selectedNodes = containedBlockIds.map(blockId => {
        return this.nodeFromElement(blockId);
      });
    }
    // apply selections to scene graph
    if (this.sceneGraph.ui) {
      this.sceneGraph.ui.setSelections(selectedNodes);
    }

    // return height and number of clipped blocks
    return {
      height: heightUsed + nestedVertical + kT.rowBarH + maxListHeight,
      clippedBlocks: this.collapsed && this.rootLayout ? clippedBlocks : 0,
    };
  }

  /**
   * update connections after the layout
   */
  postLayout(layoutResults) {
    if (!this.collapsed) {
      // update / make all the parts
      this.construct.components.forEach(part => {
        // render children ( nested constructs )
        if (this.hasChildren(part) && !this.blockIsHidden(part) && !this.allChildrenHidden(part) &&
          this.nodeFromElement(part).showChildren) {
          // update / create connection
          this.updateConnection(part);
        }
      });
      if (this.collapsedLabel) {
        this.collapsedLabel.detach();
        this.collapsedLabel = null;
      }
    } else {
      // if collapsed and there were clipped blocks, display the number
      if (!this.collapsedLabel) {
        this.collapsedLabel = new Node2D(Object.assign({}, {
          sg: this.sceneGraph,
          glyph: 'rectangle',
          dataAttribute: { name: 'nodetype', value: 'moreLabel' },
        }, kT.labelAppearance));
        this.sceneGraph.root.appendChild(this.collapsedLabel);
      }
      const text = layoutResults.clippedBlocks ? `${layoutResults.clippedBlocks} more...` : 'More';
      this.collapsedLabel.set({
        text,
        bounds: new Box2D(this.sceneGraph.availableWidth - kT.collapsedMessageWidth,
          this.getInitialLayoutPoint().y,
          kT.collapsedMessageWidth,
          kT.blockH),
      });
    }
    // dispose dangling connections
    this.disposeConnections();
  }

  // the connector drops from the center of the source part, so the initial
  // row limit for the child is the right edge of this point
  getConnectionRowLimit(sourcePart) {
    const cnodes = this.connectionInfo(sourcePart);
    const sourceRectangle = cnodes.sourceNode.getAABB();
    return sourceRectangle.center.x + kT.rowBarW / 2;
  }

  /**
   * update / create the connection between the part which must be the
   * parent of a nested construct.
   */
  updateConnection(part) {
    const cnodes = this.connectionInfo(part);
    if (!cnodes.destinationNode) {
      return;
    }
    // the source and destination node id's are used to as the cache key for the connectors
    const key = `${cnodes.sourceBlock.id}-${cnodes.destinationBlock.id}`;
    // get or create connection line
    let connector = this.connectors[key];
    if (!connector) {
      const line = new LineNode2D({
        line: new Line2D(new Vector2D(), new Vector2D()),
        strokeWidth: kT.rowBarW,
        sg: this.sceneGraph,
        parent: this.sceneGraph.root,
        dataAttribute: { name: 'connection', value: cnodes.sourceBlock.id },
      });
      connector = { line };
      this.connectors[key] = connector;
    }
    // update connector position
    const sourceRectangle = cnodes.sourceNode.getAABB();
    const destinationRectangle = cnodes.destinationNode.getAABB();
    connector.line.set({
      stroke: this.fillColor(cnodes.sourceBlock.id),
      line: new Line2D(sourceRectangle.center, new Vector2D(sourceRectangle.center.x, destinationRectangle.y)),
    });
    // ensure the connectors are always behind the blocks
    connector.line.sendToBack();

    // update its reference
    connector.updateReference = this.updateReference;
  }

  /**
   * remove any connections that are no longer in use
   */
  disposeConnections() {
    Object.keys(this.connectors).forEach(key => {
      const connector = this.connectors[key];
      if (connector.updateReference !== this.updateReference) {
        this.removeNode(connector.line);
        delete this.connectors[key];
      }
    });
  }

  /**
   * remove any nodes we have created from the scenegraph. Recursively remove
   * the nodes of nested constructs as well
   */
  dispose() {
    invariant(!this.disposed, 'Layout already disposed');
    this.disposed = true;
    this.removeNode(this.banner);
    this.removeNode(this.titleNode);
    this.removeNode(this.vertical);
    this.rows.forEach(node => {
      this.removeNode(node);
    });
    Object.keys(this.parts2nodes).forEach(part => {
      this.removeNode(this.parts2nodes[part]);
    });
    Object.keys(this.connectors).forEach(key => {
      this.removeNode(this.connectors[key].line);
    });
    this.disposeNestedLayouts();
  }

  /**
   * remove a node
   */
  removeNode(node) {
    if (node && node.parent) {
      node.parent.removeChild(node);
    }
  }

}
