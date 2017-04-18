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
import React, { Component, PropTypes } from 'react';
import { setAttribute } from '../containers/graphics/utils';

const serializer = navigator.userAgent.indexOf('Node.js') < 0 ? new XMLSerializer() : {
  serializeToString: () => {return '<SVG/>';},
};

//todo - should generalize this class (or wrap the SBOL ones) so that not tied to the sbol-svg namespace (e.g. for lock icon)

export default class RoleSvg extends Component {
  static propTypes = {
    symbolName: PropTypes.string,
    color: PropTypes.string,
    fill: PropTypes.string,
    width: PropTypes.string,
    height: PropTypes.string,
    styles: PropTypes.object,
    stroke: PropTypes.number,
  };

  static defaultProps = {
    color: 'white',
    fill: null,
    styles: {},
  };

  render() {
    if (!this.markup) {
      // clone the template
      const templateId = `sbol-svg-${this.props.symbolName}`;
      const template = document.getElementById(templateId);
      // some role symbols may not be supported so ignore the ones without templates
      if (template) {
        const svg = template.cloneNode(true);
        // ensure svg is stroked in our color
        setAttribute(svg, 'stroke', this.props.color, true);

        if (this.props.fill) {
          setAttribute(svg, 'fill', this.props.fill, true);
        }

        // remove the ID attribute from the clone to avoid duplicates
        svg.removeAttribute('id');
        // set width on top level SVG element
        if (this.props.width) {
          svg.setAttribute('width', this.props.width);
        }
        if (this.props.height) {
          svg.setAttribute('height', this.props.height);
        }
        // if the owner wants to modify the stroke width apply
        if (this.props.stroke) {
          setAttribute(svg, 'stroke-width', this.props.stroke, true);
        }
        this.markup = serializer.serializeToString(svg);
      } else {
        // add a placeholder element
        const div = document.createElement('div');
        div.style.width = '100%';
        div.style.height = '100%';
        div.style.backgroundColor = 'transparent';
        this.markup = serializer.serializeToString(div);
      }
    }

    const style = Object.assign({
      display: 'inline-block',
    }, this.props.styles);
    if (this.props.width) {
      style.width = this.props.width;
    }
    if (this.props.height) {
      style.height = this.props.height;
    }
    return <div style={style} className="RoleSvg" dangerouslySetInnerHTML={{__html: this.markup}}/>;
  }
}
