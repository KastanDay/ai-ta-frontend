import { TextInput } from '@mantine/core'
import { IconAt } from '@tabler/icons-react'
import React, { KeyboardEvent, ChangeEvent, ClipboardEvent } from 'react'
import removeUserFromCourse from '~/pages/api/UIUC-api/removeUserFromCourse'
import setCourseMetadata from '~/pages/api/UIUC-api/setCourseMetadata'
import { CourseMetadata } from '~/types/courseMetadata'
// import ReactDOM from "react-dom";

type State = {
  email_addresses: string[]
  course_name: string
  value: string
  error: string | null
}

export default class EmailChips extends React.Component<object, State> {
  state: State = {
    email_addresses: [],
    course_name: '',
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

        // todo: check it works!
        console.log('Key down: ', value)
        this.setCourseMetadata({
          course_owner: 'your_course_owner_here', // Replace with the appropriate course_owner value
          course_admins: [], // Replace with the appropriate course_admins value (array of strings)
          approved_emails_list: this.state.email_addresses,
        })
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
      email_addresses: this.state.email_addresses.filter(
        (i) => i !== email_address,
      ),
    })
    console.log('Deleting email_address: ', email_address)
    this.removeUserFromCourse(email_address)
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

      // todo: check it works!
      console.log('Pasted email_addresses: ', toBeAdded)
      this.setCourseMetadata({
        course_owner: 'your_course_owner_here', // Replace with the appropriate course_owner value
        course_admins: [], // Replace with the appropriate course_admins value (array of strings)
        approved_emails_list: this.state.email_addresses,
      })
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

  setCourseMetadata = async (courseMetadata: CourseMetadata) => {
    try {
      const { course_owner, course_admins, approved_emails_list } =
        courseMetadata
      const course_name = this.state.course_name
      console.log(
        'inside setCourseMetadata()...',
        course_name,
        course_owner,
        approved_emails_list,
      )
      const url = new URL(
        '/api/UIUC-api/setCourseMetadata',
        window.location.origin,
      )
      url.search = new URLSearchParams({
        course_name,
        course_owner,
        course_admins: JSON.stringify(course_admins),
        approved_emails_list: JSON.stringify(approved_emails_list),
      }).toString()

      const response = await fetch(url.toString())
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error setting course metadata:', error)
      return false
    }
  }

  // Get and Set course exist in KV store
  removeUserFromCourse = async (email_to_remove: string) => {
    try {
      const course_name = this.state.course_name
      console.log(
        'inside removeUserFromCourse()...',
        course_name,
        email_to_remove,
      )
      const url = new URL(
        '/api/UIUC-api/removeUserFromCourse',
        window.location.origin,
      )
      url.search = new URLSearchParams({
        course_name: course_name,
        email_to_remove: email_to_remove,
      }).toString()

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Error removing user from course:', error)
      return false
    }
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
          className={'p-3 ' + (this.state.error && 'border-color: tomato')}
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
