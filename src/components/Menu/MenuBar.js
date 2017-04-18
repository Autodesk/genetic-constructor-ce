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
import Menu from './Menu';

import '../../styles/Menu.css';

export default class MenuBar extends Component {
  static propTypes = {
    menus: PropTypes.array.isRequired,
  };

  state = {
    openMenu: null,
  };

  toggleMenu(menuId, forceVal) {
    const lastOpen = this.state.openMenu;
    const requested = menuId;
    const isOpen = (forceVal === true || forceVal === false) ? forceVal : (lastOpen !== requested);
    const openMenu = isOpen ? requested : null;

    this.setState({
      openMenu,
    });
  }

  render() {
    return (
      <div className="menu-bar">
        {this.props.menus.map((menu) => {
          const menuId = menu.text;
          return (<Menu key={menuId}
                        title={menu.text}
                        isOpen={this.state.openMenu === menuId}
                        onToggle={(forceVal) => this.toggleMenu(menuId, forceVal)}
                        menuItems={menu.items}/> );
        })}
      </div>
    );
  }
}
