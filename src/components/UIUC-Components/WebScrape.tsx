import { Button, Input, Title } from '@mantine/core'
import { IconWorldDownload } from '@tabler/icons-react'
import React, { useEffect, useState } from 'react'
import { Montserrat } from 'next/font/google'
import axios from 'axios'
import { useRouter } from 'next/router'
import { useMediaQuery } from '@mantine/hooks'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { callUpsertCourseMetadata } from '~/pages/api/UIUC-api/upsertCourseMetadata'
import { setCourseExistsAPI } from './Upload_S3'

interface WebScrapeProps {
  is_new_course: boolean
  courseName: string
  isDisabled: boolean
  current_user_email: string
}

const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
})

const validateUrl = (url: string) => {
  const courseraRegex = /^https?:\/\/(www\.)?coursera\.org\/learn\/.+/
  const mitRegex = /^https?:\/\/ocw\.mit\.edu\/.+/
  const webScrapingRegex = /^https?:\/\/.+/

  return (
    courseraRegex.test(url) || mitRegex.test(url) || webScrapingRegex.test(url)
  )
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
  const API_URL = 'https://flask-production-751b.up.railway.app'
  const router = useRouter()
  const isSmallScreen = useMediaQuery('(max-width: 960px)')

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
        // Coursera API call
      } else if (url.includes('ocw.mit.edu')) {
        // MIT API call
        data = await downloadMITCourse(url, courseName, 'local_dir')
        console.log(data)
        if (data?.success) {
          alert('Successfully scraped course!')
          await router.push(`/${courseName}/gpt4`)
        }
      } else {
        // Other API call
        // Move hardcoded values to KV database - any global data structure available?
        // const webScrapeConfig = await fetchWebScrapeConfig()

        const response = await fetch('/api/UIUC-api/webScrapeConfig')
        let webScrapeConfig = await response.json()
        webScrapeConfig = webScrapeConfig.config
        console.log('FETCH RESULT', webScrapeConfig)

        data = scrapeWeb(
          url,
          courseName,
          webScrapeConfig.num_sites,
          webScrapeConfig.recursive_depth,
          webScrapeConfig.timeout_sec,
        )

        // todo: consolidate both KV stores into one (remove setCourseExistsAPI).
        // todo: use KV store instead of /get-all to check if course exists.

        // Make course exist in kv store
        await setCourseExistsAPI(courseName)

        // set course exists in new metadata endpoint. Works great.
        await callUpsertCourseMetadata(courseName, {
          course_owner: current_user_email,

          // Don't set properties we don't know about. We'll just upsert and use the defaults.
          course_admins: undefined,
          approved_emails_list: undefined,
          is_private: undefined,
          banner_image_s3: undefined,
          course_intro_message: undefined,
        })

        router.push(`/${courseName}/materials`)
      }
    } else {
      alert('Invalid URL (please include https://)')
    }
    setLoadinSpinner(false)
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
      const response = await axios.get(`${API_URL}/web-scrape`, {
        params: {
          url: url,
          course_name: courseName,
          max_urls: maxUrls,
          max_depth: maxDepth,
          timeout: timeout,
        },
      })
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
      const response = await axios.get(`${API_URL}/mit-download`, {
        params: {
          url: url,
          course_name: courseName,
          local_dir: localDir,
        },
      })
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
      {is_new_course && (
        <Title
          order={3}
          className={`w-full text-center ${montserrat.className} mt-6`}
        >
          OR
        </Title>
      )}
      {is_new_course && (
        <Title
          order={4}
          className={`w-full text-center ${montserrat.className} mt-4`}
        >
          Enter the URL of any{' '}
          <a
            className={'text-purple-600'}
            href="https://ocw.mit.edu/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'underline', paddingRight: '5px' }}
          >
            OCW MIT
          </a>{' '}
          course or ANY website you want to ingest
        </Title>
      )}
      {is_new_course && (
        <Input
          icon={icon}
          className="mt-4 w-[70%] disabled:bg-purple-200 lg:w-[50%]"
          placeholder="Enter URL"
          radius={'xl'}
          value={url}
          size={'lg'}
          disabled={isDisabled}
          onChange={(e) => {
            setUrl(e.target.value)
            // Change icon based on URL
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
          rightSection={
            <Button
              onClick={handleSubmit}
              size="md"
              radius={'xl'}
              className={`rounded-s-md ${
                isUrlUpdated ? 'bg-purple-800' : 'border-purple-800'
              } overflow-ellipsis text-ellipsis p-2 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white`}
              w={`${isSmallScreen ? '90%' : '95%'}}`}
              disabled={isDisabled}
            >
              Ingest
            </Button>
          }
          rightSectionWidth={isSmallScreen ? '25%' : '20%'}
        />
      )}
      {loadinSpinner && (
        <div className={'flex items-center justify-center'}>
          <LoadingSpinner size={'lg'} />
        </div>
      )}
    </>
  )
}
