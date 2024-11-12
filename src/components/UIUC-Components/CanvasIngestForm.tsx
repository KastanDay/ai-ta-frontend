import React, { useEffect, useRef, useState } from 'react'
import { Text, Card, Checkbox, Button, Input, ScrollArea } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
// import { APIKeyInput } from '../LLMsApiKeyInputForm'
// import { ModelToggles } from '../ModelToggles'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../Dialog'
// import { Checkbox } from '@radix-ui/react-checkbox'
import { Label } from '@radix-ui/react-label'
import { useRouter } from 'next/router'

export default function CanvasIngestForm({
  project_name,
}: {
  project_name: string
}): JSX.Element {
  const [isUrlUpdated, setIsUrlUpdated] = useState(false)
  const [isUrlValid, setIsUrlValid] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([
    'files',
    'pages',
    'modules',
    'syllabus',
    'assignments',
    'discussions',
  ])
  const [url, setUrl] = useState('')
  const logoRef = useRef(null) // Create a ref for the logo
  const [showContentOptions, setShowContentOptions] = useState(false)
  const [loadingSpinner, setLoadingSpinner] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [open, setOpen] = useState(false)
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setUrl(input)
    setIsUrlValid(validateUrl(input))
  }
  const validateUrl = (input: string) => {
    const regex = /^https?:\/\/canvas\.illinois\.edu\/courses\/\d+/
    return regex.test(input)
  }
  const router = useRouter()

  const getCurrentPageName = () => {
    return router.query.course_name as string
  }
  const courseName = getCurrentPageName() as string

  useEffect(() => {
    if (url && url.length > 0 && validateUrl(url)) {
      setIsUrlUpdated(true)
    } else {
      setIsUrlUpdated(false)
    }
  }, [url])
  const handleOptionChange = (option: string) => {
    setSelectedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option],
    )
  }

  const handleIngest = async () => {
    if (validateUrl(url)) {
      if (url.includes('canvas.illinois.edu/courses/')) {
        const response = await fetch('/api/UIUC-api/ingestCanvas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseName: courseName,
            canvas_url: url,
            selectedCanvasOptions: selectedOptions,
          }),
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        if (data && data.error) {
          throw new Error(data.error)
        }
        await new Promise((resolve) => setTimeout(resolve, 8000)) // wait a moment before redirecting
        console.log('Canvas content ingestion was successful!')
      }
      console.log('Ingesting:', url, 'with options:', selectedOptions)
    } else {
      alert('Invalid URL (please include https://)')
    }
  }

  return (
    <motion.div layout>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Card
            className="group relative cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-[#1c1c2e] to-[#2a2a40] p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            style={{ height: '100%' }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/30">
                  <img
                    src="/media/canvas_logo.png"
                    alt="Canvas logo"
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <Text className="text-xl font-semibold text-gray-100">
                  Canvas
                </Text>
              </div>
            </div>

            <Text className="mb-4 text-sm leading-relaxed text-gray-400">
              Import content directly from your Canvas course, including
              assignments, discussions, files, and more.
            </Text>

            <div className="mt-auto flex items-center text-sm text-purple-400">
              <span>Configure import</span>
              <IconArrowRight
                size={16}
                className="ml-2 transition-transform group-hover:translate-x-1"
              />
            </div>
          </Card>
        </DialogTrigger>

        <DialogContent className="max-w-2xl rounded-lg border-0 bg-[#1c1c2e] p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Ingest Canvas Course
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="mt-4 h-[60vh] pr-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="canvas-url" className="text-white">
                  Canvas Course URL
                </Label>
                <Input
                  id="canvas-url"
                  placeholder="https://canvas.illinois.edu/courses/12345"
                  value={url}
                  onChange={handleUrlChange}
                  className="border-gray-600 bg-[#1c1c2e] text-white"
                />
              </div>
              <div>
                <Label className="text-white">Select Content to Ingest</Label>
                {[
                  'Files',
                  'Pages',
                  'Modules',
                  'Syllabus',
                  'Assignments',
                  'Discussions',
                ].map((option) => (
                  <div
                    key={option}
                    className="mt-2 flex items-center space-x-2"
                  >
                    <Checkbox
                      id={option.toLowerCase()}
                      color="violet"
                      // styles={(theme) => ({
                      //   inner: {
                      //     // backgroundColor: 'purple !important',
                      //     borderColor: 'hsl(280,100%,80%) !important',
                      //   },
                      //   input: {
                      //     backgroundColor: 'transparent !important',
                      //     borderColor: 'hsl(280,100%,80%) !important',
                      //   },
                      //   icon: {
                      //     backgroundColor: 'purple !important',
                      //     borderColor: 'hsl(280,100%,80%) !important',
                      //   }
                      // })}
                      checked={selectedOptions.includes(option.toLowerCase())}
                      onChange={() => handleOptionChange(option.toLowerCase())}
                      // onCheckedChange={() => handleOptionChange(option.toLowerCase())}
                      className="border-gray-400 text-purple-600 focus:ring-purple-500"
                    />
                    <Label
                      htmlFor={option.toLowerCase()}
                      className="text-white"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="text-sm text-red-400">
                Please ensure that you have added the UIUC Chatbot as a student
                to your course on Canvas before you begin ingesting the course
                content. The bot email address is uiuc.chat@ad.uillinois.edu and
                the bot name is UIUC Course AI.
              </div>
              <Button
                onClick={handleIngest}
                disabled={!isUrlValid}
                className="w-full bg-purple-600 text-white hover:bg-purple-700"
              >
                Ingest Canvas Course
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}