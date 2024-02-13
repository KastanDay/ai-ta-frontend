'use client'
import {
  ColumnDirective,
  ColumnsDirective,
  GridComponent,
  Inject,
  Page,
  Sort,
  Filter,
  Group,
  Edit,
  Toolbar,
} from '@syncfusion/ej2-react-grids'
import { data } from '~/pages/[course_name]/Datasource'

export default function Home() {
  const pageSettings: object = { pageSize: 6 }
  const filterSettings: object = { type: 'Excel' }
  const editOptions = {
    allowEditing: true,
    allowAdding: true,
    allowDeleting: true,
  }
  return (
    <>
      <h2>Syncfusion React Grid Component</h2>
      <GridComponent
        dataSource={data}
        allowGrouping={true}
        allowSorting={true}
        allowFiltering={true}
        allowPdfExport={true}
        allowPaging={true}
        pageSettings={pageSettings}
        filterSettings={filterSettings}
        height={180}
        editSettings={editOptions}
      >
        <ColumnsDirective>
          <ColumnDirective field="OrderID" width="100" textAlign="Right" />
          <ColumnDirective field="CustomerID" width="100" />
          <ColumnDirective field="EmployeeID" width="100" textAlign="Right" />
          {/* <ColumnDirective field="EmployeeID" headerText="Ship Country" editType="multi-select" /> */}
          {/* <ColumnDirective field="EmployeeID" headerText="Ship Country" editType="multiselect" allowEditing={true} /> */}
          <ColumnDirective
            field="EmployeeID"
            headerText="Ship Country"
            editType="dropdownedit"
            allowEditing={true}
          />

          <ColumnDirective
            field="Freight"
            width="100"
            format="C2"
            textAlign="Right"
          />
          <ColumnDirective field="ShipCountry" width="100" />
        </ColumnsDirective>
        <Inject services={[Edit, Toolbar, Page, Sort, Filter, Group]} />
        {/* <Inject services={[]} /> */}
      </GridComponent>
    </>
  )
}
