import { TextInput } from '@mantine/core'
import { IconAt } from '@tabler/icons-react'
import React, {
  useState,
  KeyboardEvent,
  ChangeEvent,
  ClipboardEvent,
} from 'react'
import removeUserFromCourse from '~/pages/api/UIUC-api/removeUserFromCourse'
import setCourseMetadata from '~/pages/api/UIUC-api/setCourseMetadata'
import { CourseMetadata } from '~/types/courseMetadata'

const EmailChips = () => {
  const [emailAddresses, setEmailAddresses] = useState<string[]>([])
  const [courseName, setCourseName] = useState<string>('')
  const [value, setValue] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const handleKeyDown = (evt: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', 'Tab', ','].includes(evt.key)) {
      evt.preventDefault()

      const trimmedValue = value.trim()

      if (trimmedValue && isValid(trimmedValue)) {
        setEmailAddresses([...emailAddresses, trimmedValue])
        setValue('')

        // todo: add to database
        console.log('Key down: ', trimmedValue)
      }
    }
  }

  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    setValue(evt.target.value)
    setError(null)
  }

  const handleDelete = (email_address: string) => {
    setEmailAddresses(emailAddresses.filter((i) => i !== email_address))
    console.log('Deleting email_address: ', email_address)
    removeUserFromCourse(email_address)
  }

  const handlePaste = (evt: ClipboardEvent<HTMLInputElement>) => {
    evt.preventDefault()

    const paste = evt.clipboardData.getData('text')
    const emails = paste.match(/[\w\d\.-]+@[\w\d\.-]+\.[\w\d\.-]+/g)

    if (emails) {
      const toBeAdded = emails.filter((email) => !isInList(email))

      setEmailAddresses([...emailAddresses, ...toBeAdded])

      // todo: add to database
      console.log('Pasted email_addresses: ', toBeAdded)
      callSetCourseMetadata({
        course_owner: 'your_course_owner_here', // Replace with the appropriate course_owner value
        course_admins: [], // Replace with the appropriate course_admins value (array of strings)
        approved_emails_list: emailAddresses,
      })
    }
  }

  const isValid = (email: string) => {
    let localError = null

    if (isInList(email)) {
      localError = `${email} has already been added.`
    }

    if (!isEmail(email)) {
      localError = `${email} is not a valid email address.`
    }

    if (localError) {
      setError(localError)
      return false
    }

    return true
  }

  const isInList = (item: string) => {
    return emailAddresses.includes(item)
  }

  const isEmail = (email: string) => {
    return /[\w\d\.-]+@[\w\d\.-]+\.[\w\d\.-]+/.test(email)
  }

  const callSetCourseMetadata = async (courseMetadata: CourseMetadata) => {
    try {
      const { course_owner, course_admins, approved_emails_list } = courseMetadata;
      const course_name = courseName;
      console.log('inside setCourseMetadata()...', course_name, course_owner, approved_emails_list);

      const url = new URL('/api/UIUC-api/setCourseMetadata', window.location.origin);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_name,
          course_owner,
          course_admins,
          approved_emails_list,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error setting course metadata:', error);
      return false;
    }
  };

  // The rest of the code remains the same, just replace all instances of `this.state` with the corresponding state variables and `this.` with the corresponding function names.

  return (
    <>
      <TextInput
        withAsterisk={true}
        icon={<IconAt />}
        size="md"
        style={{ minWidth: '38rem', maxWidth: '80%' }}
        placeholder="Type or paste email addresses, even messy lists from Outlook"
        className={'p-3 ' + (error && 'border-color: tomato')}
        value={value}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onPaste={handlePaste}
      />
      {emailAddresses.map((email_address) => (
        <div className="tag-item" key={email_address}>
          {email_address}
          <button
            type="button"
            className="button"
            onClick={() => handleDelete(email_address)}
          >
            &times;
          </button>
        </div>
      ))}
      {error && <p className="error">{error}</p>}
    </>
  )
}

export default EmailChips
