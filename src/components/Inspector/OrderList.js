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
import React, { PropTypes } from 'react';

import '../../styles/OrderList.css';

export default function OrderList({ orders, onClick, ...rest }) {
  if (!orders.length) {
    return null;
  }

  return (
    <div className="OrderList">
      {orders.map(order => {
        const { constructNames } = order.metadata;
        const orderedNames = (constructNames && constructNames.length) ? constructNames.join(', ') : null;
        return (
          <div className="OrderList-group"
               key={order.id}>
            <div className="OrderList-group-heading">{order.getName()}</div>
            {orderedNames && <div className="OrderList-group-names">{orderedNames}</div>}
            <div className="OrderList-group-time">
              {(new Date(order.dateSubmitted())).toLocaleString()}
              <a className="OrderList-group-action"
                 onClick={() => onClick(order.id)}>Order Details...</a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

OrderList.propTypes = {
  orders: PropTypes.array.isRequired,
  onClick: PropTypes.func.isRequired,
};
