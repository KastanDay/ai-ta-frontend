// import "./styles.css";
import Table from 'rowstack'

const data = [
  {
    id: 0,
    name: 'Uriel Russo',
    email: 'dolor.vitae@icloud.ca',
  },
  {
    id: 1,
    name: 'Priscilla Whitehead',
    email: 'egestas.aliquam@icloud.ca',
  },
  {
    id: 2,
    name: 'Mariam Christensen',
    email: 'lectus@google.com',
  },
  {
    id: 3,
    name: 'Elizabeth Hoffman',
    email: 'tellus.nunc@google.ca',
  },
  {
    id: 4,
    name: 'Zelda Hess',
    email: 'phasellus.libero.mauris@icloud.ca',
  },
]

const columns = [
  {
    id: 'name',
    name: 'Name',
  },
  {
    id: 'email',
    name: 'Email',
  },
]

export default function rowstack() {
  return (
    <div
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        // width: 800,
        // height: 600,
        border: '1px solid #ccc',
      }}
    >
      <Table data={data} columns={columns} />
    </div>
  )
}
