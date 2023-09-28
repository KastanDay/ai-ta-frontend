import { notifications } from '@mantine/notifications'
import { rem, Button, Input, Title, Text, useMantineTheme } from '@mantine/core'
import { IconWorldDownload } from '@tabler/icons-react'
import React, { useEffect, useState } from 'react'
import { Montserrat } from 'next/font/google'
import axios from 'axios'
import { useRouter } from 'next/router'
import { useMediaQuery } from '@mantine/hooks'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import { montserrat_heading, montserrat_paragraph } from 'fonts'

interface WebScrapeProps {
  is_new_course: boolean
  courseName: string
  isDisabled: boolean
  current_user_email: string
}

const validateUrl = (url: string) => {
  const courseraRegex = /^https?:\/\/(www\.)?coursera\.org\/learn\/.+/
  const mitRegex = /^https?:\/\/ocw\.mit\.edu\/.+/
  const webScrapingRegex = /^(https?:\/\/)?.+/

  return (
    courseraRegex.test(url) || mitRegex.test(url) || webScrapingRegex.test(url)
  )
}

const formatUrl = (url: string) => {
  if (!/^https?:\/\//i.test(url)) {
    url = 'http://' + url
  }
  return url
}

export const WebScrape = ({
  is_new_course,
  courseName,
  isDisabled,
  current_user_email,
}: WebScrapeProps) => {
  const [isUrlUpdated, setIsUrlUpdated] = useState(false)
  const [url, setUrl] = useState('')
  const [icon, setIcon] = useState(<IconWorldDownload size={'50%'} />)
  const [loadinSpinner, setLoadinSpinner] = useState(false)
  const router = useRouter()
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const theme = useMantineTheme()

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value
    console.log('newUrl: ', newUrl)
    setUrl(newUrl)
    if (newUrl.length > 0 && validateUrl(newUrl)) {
      setIsUrlUpdated(true)
    } else {
      setIsUrlUpdated(false)
    }
    // Change icon based on URL
    if (newUrl.includes('coursera.org')) {
      setIcon(
        <img
          src={'/media/coursera_logo_cutout.png'}
          alt="Coursera Logo"
          style={{ height: '50%', width: '50%' }}
        />,
      )
    } else if (newUrl.includes('ocw.mit.edu')) {
      setIcon(
        <img
          src={'/media/mitocw_logo.jpg'}
          alt="MIT OCW Logo"
          style={{ height: '50%', width: '50%' }}
        />,
      )
    } else {
      setIcon(<IconWorldDownload />)
    }
  }

  const handleSubmit = async () => {
    if (validateUrl(url)) {
      setLoadinSpinner(true)
      let data = null
      // Make API call based on URL
      if (url.includes('coursera.org')) {
        // TODO: coursera ingest
        alert(
          'Coursera ingest is not yet automated (auth is hard). Please email kvday2@illinois.edu to do it for you',
        )
      } else if (url.includes('ocw.mit.edu')) {
        data = downloadMITCourse(url, courseName, 'local_dir') // no await -- do in background

        showToast()

        if (is_new_course) {
          // Make course exist in kv store
          // Removing this for kv refactor
          // await setCourseExistsAPI(courseName)

          // set course exists in new metadata endpoint. Works great.
          const response = callSetCourseMetadata(courseName, {
            course_owner: current_user_email,
            // Don't set properties we don't know about. We'll just upsert and use the defaults.
            course_admins: [],
            approved_emails_list: [],
            is_private: false,
            banner_image_s3: undefined,
            course_intro_message: undefined,
            openai_api_key: undefined,
            example_questions: undefined,
          })

          if (!response) {
            throw new Error('Error while setting course metadata')
          }
          router.replace(`/${courseName}/materials`)
        }
        router.push(`/${courseName}/materials`)
      } else {
        showToast()

        const response = await fetch('/api/UIUC-api/webScrapeConfig')
        let webScrapeConfig = await response.json()
        webScrapeConfig = webScrapeConfig.config

        data = scrapeWeb(
          url,
          courseName,
          webScrapeConfig.num_sites,
          webScrapeConfig.recursive_depth,
          webScrapeConfig.timeout_sec,
        )

        // todo: consolidate both KV stores into one (remove setCourseExistsAPI).
        // todo: use KV store instead of /get-all to check if course exists.
        if (is_new_course) {
          // Make course exist in kv store
          // Removing this for kv refactor
          // await setCourseExistsAPI(courseName)

          // set course exists in new metadata endpoint. Works great.
          const response = callSetCourseMetadata(courseName, {
            course_owner: current_user_email,
            // Don't set properties we don't know about. We'll just upsert and use the defaults.
            course_admins: [],
            approved_emails_list: [],
            is_private: false,
            banner_image_s3: undefined,
            course_intro_message: undefined,
            openai_api_key: undefined,
            example_questions: undefined,
          })

          if (!response) {
            throw new Error('Error while setting course metadata')
          }
          router.replace(`/${courseName}/materials`)
        }
        router.push(`/${courseName}/materials`)
      }
    } else {
      alert('Invalid URL (please include https://)')
    }
    setLoadinSpinner(false)
    setUrl('') // clear url
  }

  const showToast = () => {
    return (
      // docs: https://mantine.dev/others/notifications/

      notifications.show({
        id: 'web-scrape-toast',
        withCloseButton: true,
        onClose: () => console.log('unmounted'),
        onOpen: () => console.log('mounted'),
        autoClose: 15000,
        // position="top-center",
        title: 'Web scraping started',
        message:
          "It'll scrape in the background, just wait for the results to show up in your project (~3 minutes total).\nThis feature is stable but the web is a messy place. If you have trouble, I'd love to fix it. Just shoot me an email: kvday2@illinois.edu.",
        icon: <IconWorldDownload />,
        styles: {
          root: {
            backgroundColor: theme.colors.nearlyWhite,
            borderColor: theme.colors.aiPurple,
          },
          title: {
            color: theme.colors.nearlyBlack,
          },
          description: {
            color: theme.colors.nearlyBlack,
          },
          closeButton: {
            color: theme.colors.nearlyBlack,
            '&:hover': {
              backgroundColor: theme.colors.dark[1],
            },
          },
        },
        loading: false,
      })
    )
  }

  const scrapeWeb = async (
    url: string | null,
    courseName: string | null,
    maxUrls: number,
    maxDepth: number,
    timeout: number,
  ) => {
    try {
      if (!url || !courseName) return null
      url = formatUrl(url) // ensure we have http://
      console.log('SCRAPING', url)
      const response = await axios.get(
        `https://flask-production-751b.up.railway.app/web-scrape`,
        {
          params: {
            url: url,
            course_name: courseName,
            max_urls: maxUrls,
            max_depth: maxDepth,
            timeout: timeout,
          },
        },
      )
      return response.data
    } catch (error) {
      console.error('Error during web scraping:', error)
      return null
    }
  }

  const downloadMITCourse = async (
    url: string | null,
    courseName: string | null,
    localDir: string | null,
  ) => {
    try {
      if (!url || !courseName || !localDir) return null
      console.log('calling downloadMITCourse')
      const response = await axios.get(
        `https://flask-production-751b.up.railway.app/mit-download`,
        {
          params: {
            url: url,
            course_name: courseName,
            local_dir: localDir,
          },
        },
      )
      return response.data
    } catch (error) {
      console.error('Error during MIT course download:', error)
      return null
    }
  }

  useEffect(() => {
    if (url && url.length > 0 && validateUrl(url)) {
      console.log('url updated : ', url)
      setIsUrlUpdated(true)
    } else {
      console.log('url empty')
      setIsUrlUpdated(false)
    }
  }, [url])

  return (
    <>
      <Title
        order={3}
        className={`w-full text-center ${montserrat_heading.variable} mt-6 font-montserratHeading`}
      >
        OR
      </Title>
      <Title
        order={4}
        className={`w-full text-center ${montserrat_heading.variable} mt-4 font-montserratHeading`}
      >
        Web scrape any website that allows it
      </Title>
      <Input
        icon={icon}
        className="mt-4 w-[70%] min-w-[20rem] disabled:bg-purple-200 lg:w-[50%]"
        wrapperProps={{ backgroundColor: '#020307', borderRadius: 'xl' }}
        placeholder="Enter URL"
        radius={'xl'}
        value={url}
        size={'lg'}
        disabled={isDisabled}
        onChange={(e) => {
          setUrl(e.target.value)
          if (e.target.value.includes('coursera.org')) {
            setIcon(
              <img
                src={'/media/coursera_logo_cutout.png'}
                alt="Coursera Logo"
                style={{ height: '50%', width: '50%' }}
              />,
            )
          } else if (e.target.value.includes('ocw.mit.edu')) {
            setIcon(
              <img
                src={'/media/mitocw_logo.jpg'}
                alt="MIT OCW Logo"
                style={{ height: '50%', width: '50%' }}
              />,
            )
          } else {
            setIcon(<IconWorldDownload />)
          }
        }}
        onKeyPress={(event) => {
          if (event.key === 'Enter') {
            handleSubmit()
          }
        }}
        rightSection={
          <Button
            onClick={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
            size="md"
            radius={'xl'}
            className={`rounded-s-md ${isUrlUpdated ? 'bg-purple-800' : 'border-purple-800'
              } overflow-ellipsis text-ellipsis p-2 ${isUrlUpdated ? 'text-white' : 'text-gray-500'
              } min-w-[5rem] -translate-x-1 transform hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none`}
            w={`${isSmallScreen ? 'auto' : 'auto'}`}
            disabled={isDisabled}
          >
            Ingest
          </Button>
        }
        rightSectionWidth={isSmallScreen ? 'auto' : 'auto'}
      />
      <Text
        size={rem(14)}
        className={`w-full text-center ${montserrat_paragraph.variable} mt-2 font-montserratParagraph`}
      >
        Looking for high quality reference material? We love{' '}
        <a
          className={'text-purple-600'}
          href="https://ocw.mit.edu/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'underline', paddingRight: '5px' }}
        >
          MIT Open Course Ware
        </a>
        <br></br>
        For Coursera and Canvas ingest please email kvday2@illinois.edu
      </Text>
    </>
  )
}
