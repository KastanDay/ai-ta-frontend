import { TextInput } from '@mantine/core'
import { IconAt } from '@tabler/icons-react'
import React, { useState } from 'react'
// import ReactDOM from "react-dom";

// import "./email_chips_styles.css";

export default class EmailChips extends React.Component {
  state = {
    items: [],
    value: '',
    error: null,
  }

  handleKeyDown = (evt) => {
    if (['Enter', 'Tab', ','].includes(evt.key)) {
      evt.preventDefault()

      var value = this.state.value.trim()

      if (value && this.isValid(value)) {
        this.setState({
          items: [...this.state.items, this.state.value],
          value: '',
        })
      }
    }
  }

  handleChange = (evt) => {
    this.setState({
      value: evt.target.value,
      error: null,
    })
  }

  handleDelete = (item) => {
    this.setState({
      items: this.state.items.filter((i) => i !== item),
    })
  }

  handlePaste = (evt) => {
    evt.preventDefault()

    var paste = evt.clipboardData.getData('text')
    var emails = paste.match(/[\w\d\.-]+@[\w\d\.-]+\.[\w\d\.-]+/g)

    if (emails) {
      var toBeAdded = emails.filter((email) => !this.isInList(email))

      this.setState({
        items: [...this.state.items, ...toBeAdded],
      })
    }
  }

  isValid(email) {
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

  isInList(email) {
    return this.state.items.includes(email)
  }

  isEmail(email) {
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
          style={{ minWidth: '50%', maxWidth: '80%' }}
          className="p-3"
          placeholder="Type or paste email addresses and press `Enter`..."
          // onFocus={() => setFocused(true)}
          // onBlur={() => setFocused(false)}
          // className={"input " + (this.state.error && " has-error")}
          value={this.state.value}
          // placeholder="Type or paste email addresses and press `Enter`..."
          onKeyDown={this.handleKeyDown}
          onChange={this.handleChange}
          onPaste={this.handlePaste}
        />
        {this.state.items.map((item) => (
          <div className="tag-item" key={item}>
            {item}
            <button
              type="button"
              className="button"
              onClick={() => this.handleDelete(item)}
            >
              &times;
            </button>
          </div>
        ))}

        {/* <input
          className={"input " + (this.state.error && " has-error")}
          value={this.state.value}
          placeholder="Type or paste email addresses and press `Enter`..."
          onKeyDown={this.handleKeyDown}
          onChange={this.handleChange}
          onPaste={this.handlePaste}
        /> */}

        {this.state.error && <p className="error">{this.state.error}</p>}
      </>
    )
  }
}

// const rootElement = document.getElementById("root");
// ReactDOM.render(<App />, rootElement);
