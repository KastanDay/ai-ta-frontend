import * as ReactDOM from 'react-dom'
import * as React from 'react'
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
} from '@syncfusion/ej2-react-grids'
import { orderDetails } from './data'
import { SampleBase } from '../common/sample-base'

export class Default extends SampleBase<{}, {}> {
  render() {
    return (
      <div className="control-pane">
        <div className="control-section">
          <GridComponent dataSource={orderDetails} height="350">
            <ColumnsDirective>
              <ColumnDirective
                field="OrderID"
                headerText="Order ID"
                width="120"
                textAlign="Right"
              ></ColumnDirective>
              <ColumnDirective
                field="CustomerName"
                headerText="Customer Name"
                width="150"
              ></ColumnDirective>
              <ColumnDirective
                field="OrderDate"
                headerText="Order Date"
                width="130"
                format="yMd"
                textAlign="Right"
              />
              <ColumnDirective
                field="Freight"
                headerText="Freight"
                width="120"
                format="C2"
                textAlign="Right"
              />
              <ColumnDirective
                field="ShippedDate"
                headerText="Shipped Date"
                width="130"
                format="yMd"
                textAlign="Right"
              ></ColumnDirective>
              <ColumnDirective
                field="ShipCountry"
                headerText="Ship Country"
                width="150"
              ></ColumnDirective>
            </ColumnsDirective>
          </GridComponent>
        </div>
      </div>
    )
  }
}
