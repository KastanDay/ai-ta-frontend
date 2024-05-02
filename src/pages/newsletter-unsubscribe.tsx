import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { Title, Text, Input } from '@mantine/core'

import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { IconAt, IconError404, IconSunset2, IconX } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'

export default function Unsubscribe() {
  const handleSubmit = async (event: any) => {
    event.preventDefault() // Prevent default form submission behavior
    const formData = new FormData(event.target)
    const email = formData.get('email') // Assuming 'email' is the name attribute of your email input field

    if (!email) {
      notifications.show({
        id: 'error-notification',
        title: 'Please enter an email.',
        message: 'Looked like the box was empty 👀',
        autoClose: 20000,
        color: 'red',
        radius: 'lg',
        icon: <IconX />,
        className: 'my-notification-class',
        style: { backgroundColor: '#15162c' },
        loading: false,
      })
      return
    }

    try {
      const response = await fetch('/api/UIUC-api/newsletterUnsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        notifications.show({
          id: 'network-error-notification',
          title: 'Our database is having a bad day. 😢',
          message:
            "Seems like we couldn't unsubscribe you. Please try again later. Email help@uiuc.chat for assistance.",
          autoClose: 20000,
          color: 'red',
          radius: 'lg',
          icon: <IconX />,
          className: 'my-notification-class',
          style: { backgroundColor: '#15162c' },
          loading: false,
        })
        throw new Error('Network response was not ok')
      }

      notifications.show({
        id: 'success-notification',
        title: 'Successfully unsubscribed.',
        message: "See ya, wouldn't wanna be ya! 🌅",
        autoClose: 20000,
        // color: 'green',
        radius: 'lg',
        icon: <IconSunset2 />,
        className: 'my-notification-class',
        style: { backgroundColor: '#15162c' },
        loading: false,
      })
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error)
      notifications.show({
        id: 'network-error-notification',
        title: 'Our database is having a bad day. 😢',
        message: `Seems like we couldn't unsubscribe you. Please try again later. Email help@uiuc.chat for assistance. Full error: ${error}`,
        autoClose: 20000,
        color: 'red',
        radius: 'lg',
        icon: <IconX />,
        className: 'my-notification-class',
        style: { backgroundColor: '#15162c' },
        loading: false,
      })
    }
  }

  return (
    <MainPageBackground>
      <div className="w-full max-w-md space-y-6 rounded-lg bg-[#15162c] p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <Title
            size="h3"
            className={`label ${montserrat_heading.className} inline-block select-text p-0 text-neutral-200`}
          >
            Unsubscribe <span style={{ fontSize: '22px' }}>🎉</span>
          </Title>
        </div>
        <Text
          size="md"
          className={`label ${montserrat_paragraph.className} inline-block select-text p-0 text-neutral-200`}
        >
          Enter your email address to unsubscribe from the UIUC.chat email
          newsletter.
        </Text>
        <Text
          size="sm"
          className={`label ${montserrat_paragraph.className}select-text p-0 text-neutral-200`}
        >
          I guess your inbox just got a little bit cleaner, but less exciting 😒{' '}
        </Text>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input.Wrapper id="input-demo" label="Email Address">
            <Input
              icon={<IconAt />}
              radius="md"
              id="email-input"
              placeholder="hi@example.org"
              name="email"
            />
          </Input.Wrapper>
          <div>
            <button
              className="flex w-full justify-center rounded-md border border-transparent bg-[#9d4edd] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#8441ba] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              type="submit"
            >
              Unsubscribe
            </button>
          </div>
        </form>
      </div>
    </MainPageBackground>
  )
}
