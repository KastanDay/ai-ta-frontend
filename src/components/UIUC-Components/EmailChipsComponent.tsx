import { TextInput } from '@mantine/core'
import { IconAt } from '@tabler/icons-react'
import React, {
  useState,
  useEffect,
  KeyboardEvent,
  ChangeEvent,
  ClipboardEvent,
} from 'react'
import { CourseMetadata } from '~/types/courseMetadata'

const EmailChipsComponent = (
  course_name: string,
  course_owner: string,
  course_admins: string[],
) => {
  const [emailAddresses, setEmailAddresses] = useState<string[]>([])
  const [courseName, setCourseName] = useState<string>(course_name)
  const [value, setValue] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // fetch metadata on mount
  useEffect(() => {
    fetchCourseMetadata(course_name).then((metadata) => {
      if (metadata) {
        console.log('Course metadata:', metadata)
        setEmailAddresses(metadata.approved_emails_list)
      } else {
        console.log('Failed to fetch course metadata')
      }
    })
  }, [])

  const handleKeyDown = (evt: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', 'Tab', ','].includes(evt.key)) {
      evt.preventDefault()

      const trimmedValue = value.trim()

      if (trimmedValue && isValid(trimmedValue)) {
        setEmailAddresses([...emailAddresses, trimmedValue])
        setValue('')

        callSetCourseMetadata({
          course_owner: course_owner, // Replace with the appropriate course_owner value
          course_admins: course_admins, // Replace with the appropriate course_admins value (array of strings)
          approved_emails_list: [...emailAddresses, trimmedValue],
        })
      }
    }
  }

  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    setValue(evt.target.value)
    setError(null)
  }

  const handleDelete = (email_address: string) => {
    setEmailAddresses(emailAddresses.filter((i) => i !== email_address))
    callRemoveUserFromCourse(email_address)
  }

  const handlePaste = (evt: ClipboardEvent<HTMLInputElement>) => {
    evt.preventDefault()

    const paste = evt.clipboardData.getData('text')
    const emails = paste.match(/[\w\d\.-]+@[\w\d\.-]+\.[\w\d\.-]+/g)

    if (emails) {
      const toBeAdded = emails.filter((email) => !isInList(email))

      setEmailAddresses([...emailAddresses, ...toBeAdded])

      callSetCourseMetadata({
        course_owner: course_owner,
        course_admins: course_admins,
        approved_emails_list: [...emailAddresses, ...toBeAdded],
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
      const { course_owner, course_admins, approved_emails_list } =
        courseMetadata
      const course_name = courseName

      const url = new URL(
        '/api/UIUC-api/setCourseMetadata',
        window.location.origin,
      )
      url.searchParams.append('course_name', course_name)
      url.searchParams.append('course_owner', course_owner)
      url.searchParams.append('course_admins', JSON.stringify(course_admins))
      url.searchParams.append(
        'approved_emails_list',
        JSON.stringify(approved_emails_list),
      )

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error setting course metadata:', error)
      return false
    }
  }

  // Get and Set course exist in KV store
  const callRemoveUserFromCourse = async (email_to_remove: string) => {
    try {
      const course_name = courseName

      const url = new URL(
        '/api/UIUC-api/removeUserFromCourse',
        window.location.origin,
      )
      url.searchParams.append('course_name', course_name)
      url.searchParams.append('email_to_remove', email_to_remove)

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

  async function fetchCourseMetadata(course_name: string) {
    try {
      const response = await fetch(
        `/api/UIUC-api/getCourseMetadata?course_name=${course_name}`,
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success === false) {
          console.error('An error occurred while fetching course metadata')
          return null
        }
        return data.course_metadata
      } else {
        console.error(`Error fetching course metadata: ${response.status}`)
        return null
      }
    } catch (error) {
      console.error('Error fetching course metadata:', error)
      return null
    }
  }

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

export default EmailChipsComponent
