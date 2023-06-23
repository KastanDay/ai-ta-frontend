import { TextInput } from '@mantine/core'
import { IconAt } from '@tabler/icons-react'
import React, { KeyboardEvent, ChangeEvent, ClipboardEvent } from 'react'
// import ReactDOM from "react-dom";

type State = {
  email_addresses: string[]
  value: string
  error: string | null
}

export default class EmailChips extends React.Component<object, State> {
  state: State = {
    email_addresses: [],
    
    value: '',
    error: null,
  }

  handleKeyDown = (evt: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', 'Tab', ','].includes(evt.key)) {
      evt.preventDefault()

      const value = this.state.value.trim()

      if (value && this.isValid(value)) {
        this.setState({
          email_addresses: [...this.state.email_addresses, this.state.value],
          value: '',
        })

        // todo: add to database
        console.log("Key down: ", value)
      }
    }
  }

  handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      value: evt.target.value,
      error: null,
    })
  }
  
  handleDelete = (email_address: string) => {
    this.setState({
      email_addresses: this.state.email_addresses.filter((i) => i !== email_address),
    })
    console.log("Deleting email_address: ", email_address)
  }
  
  handlePaste = (evt: ClipboardEvent<HTMLInputElement>) => {
    evt.preventDefault()
    
    const paste = evt.clipboardData.getData('text')
    const emails = paste.match(/[\w\d\.-]+@[\w\d\.-]+\.[\w\d\.-]+/g)
    
    if (emails) {
      const toBeAdded = emails.filter((email) => !this.isInList(email))
      
      this.setState({
        email_addresses: [...this.state.email_addresses, ...toBeAdded],
      })
      
      // todo: add to database
      console.log("Pasted email_addresses: ", toBeAdded)
    }
  }

  isValid(email: string) {
    let error = null

    if (this.isInList(email)) {
      error = `${email} has already been added.`
    }

    if (!this.isEmail(email)) {
      error = `${email} is not a valid email address.`
    }

    if (error) {
      this.setState({ error })

      return false
    }

    return true
  }

  isInList(item: string) {
    return this.state.email_addresses.includes(item)
  }

  isEmail(email: string) {
    return /[\w\d\.-]+@[\w\d\.-]+\.[\w\d\.-]+/.test(email)
  }

  render() {
    // const [focused, setFocused] = useState(false);

    return (
      <>
        <TextInput
          withAsterisk={true}
          icon={<IconAt />}
          size="md"
          style={{ minWidth: '38rem', maxWidth: '80%' }}
          placeholder="Type or paste email addresses, even messy lists from Outlook"
          className={"p-3 " + (this.state.error && "border-color: tomato")}
          value={this.state.value}
          onKeyDown={this.handleKeyDown}
          onChange={this.handleChange}
          onPaste={this.handlePaste}
        />
        {this.state.email_addresses.map((email_address) => (
          <div className="tag-item" key={email_address}>
            {email_address}
            <button
              type="button"
              className="button"
              onClick={() => this.handleDelete(email_address)}
            >
              &times;
            </button>
          </div>
        ))}
        {this.state.error && <p className="error">{this.state.error}</p>}
      </>
    )
  }
}