import { useRouter } from 'next/router'
import { createStyles, Group, Text } from '@mantine/core'
import React, { useState } from 'react'
import { IconFolders, IconReportAnalytics } from '@tabler/icons-react'
import { montserrat_paragraph } from 'fonts'

const useStyles = createStyles((theme) => ({
  wrapper: {
    position: 'relative',
    marginBottom: theme.spacing.md,
    maxWidth: '340px',
    width: '100%',
  },

  button: {
    width: '100%',
    border: 'none',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.radius.md,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out',
    '--btn-text-case': 'none',
    height: '48px',
  },
}))

// The Navbar buttons buttons are defined individually below

export function GoToQueryAnalysis({ course_name }: { course_name?: string }) {
  const router = useRouter()
  const { classes, theme } = useStyles()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    // If ctrl/cmd key is not pressed, prevent default behavior and programmatically navigate
    if (!e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      setIsLoading(true)
      router.push(`/${course_name}/query-analysis`)
    }
    // If ctrl/cmd key is pressed, do nothing and let the browser handle the new tab opening
  }

  if (!course_name) {
    return null
  }

  return (
    <div className={classes.wrapper}>
      <a
        href={`/${course_name}/query-analysis`}
        onClick={handleClick}
        className={`btn rounded-full ${classes.button}`}
        style={{
          backgroundColor: 'transparent',
          outline: `solid 1.5px ${theme.colors.grape[8]}`,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minWidth: '100%', // Add this line to ensure the button maintains its width
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = theme.colors.grape[8])
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = 'transparent')
        }
      >
        <div style={{ visibility: isLoading ? 'hidden' : 'visible' }}>
          <Group style={{ gap: '5px' }}>
            <Text
              size={theme.fontSizes.sm}
              className={`${montserrat_paragraph.variable} font-montserratParagraph`}
              color={
                theme.colorScheme === 'dark'
                  ? theme.colors.gray[0]
                  : theme.black
              }
            >
              Query Analysis
            </Text>
            <IconReportAnalytics color="white" />
          </Group>
        </div>
        {isLoading && (
          <div style={{ position: 'absolute' }}>
            <span className="loading loading-spinner loading-xs"></span>
          </div>
        )}
      </a>
    </div>
  )
}

export function ResumeToChat({ course_name }: { course_name?: string }) {
  const router = useRouter()
  const { classes, theme } = useStyles()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    // If ctrl/cmd key is not pressed, prevent default behavior and programmatically navigate
    if (!e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      setIsLoading(true)
      router.push(`/${course_name}/gpt4`)
    }
    // If ctrl/cmd key is pressed, do nothing and let the browser handle the new tab opening
  }

  if (!course_name) {
    return null
  }

  return (
    <div className={classes.wrapper}>
      <a
        onClick={handleClick}
        href={`/${course_name}/gpt4`}
        className={`btn rounded-full ${classes.button}`}
        style={{
          backgroundColor: 'transparent',
          outline: `solid 1.5px ${theme.colors.grape[8]}`,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minWidth: '100%',
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = theme.colors.grape[8])
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = 'transparent')
        }
      >
        <div style={{ visibility: isLoading ? 'hidden' : 'visible' }}>
          <Group style={{ gap: '5px' }}>
            <Text
              size={theme.fontSizes.sm}
              className={`${montserrat_paragraph.variable} font-montserratParagraph`}
              color={
                theme.colorScheme === 'dark'
                  ? theme.colors.gray[0]
                  : theme.black
              }
            >
              Chat with Documents
            </Text>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 11h.01M8 11h.01M16 11h.01m-3.72 6.998C18.096 17.934 21 15.918 21 11c0-5-3-7-9-7s-9 2-9 7c0 3.077 1.136 5.018 3.409 6.056L5 21l7.29-3.002Z"
                stroke="#FFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Group>
        </div>
        {isLoading && (
          <div style={{ position: 'absolute' }}>
            <span className="loading loading-spinner loading-xs"></span>
          </div>
        )}
      </a>
    </div>
  )
}

export function GoToMaterials({ course_name }: { course_name?: string }) {
  const router = useRouter()
  const { classes, theme } = useStyles()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    // If ctrl/cmd key is not pressed, prevent default behavior and programmatically navigate
    if (!e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      setIsLoading(true)
      router.push(`/${course_name}/materials`)
    }
    // If ctrl/cmd key is pressed, do nothing and let the browser handle the new tab opening
  }

  if (!course_name) {
    return null
  }

  return (
    <div className={classes.wrapper}>
      <a
        onClick={handleClick}
        href={`/${course_name}/materials`}
        className={`btn rounded-full ${classes.button}`}
        style={{
          backgroundColor: 'transparent',
          outline: `solid 1.5px ${theme.colors.grape[8]}`,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minWidth: '100%',
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = theme.colors.grape[8])
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = 'transparent')
        }
      >
        <div style={{ visibility: isLoading ? 'hidden' : 'visible' }}>
          <Group style={{ gap: '5px' }}>
            <Text
              size={theme.fontSizes.sm}
              className={`${montserrat_paragraph.variable} font-montserratParagraph`}
              color={
                theme.colorScheme === 'dark'
                  ? theme.colors.gray[0]
                  : theme.black
              }
            >
              Go to Materials
            </Text>
            <IconFolders color="white" />
          </Group>
        </div>
        {isLoading && (
          <div style={{ position: 'absolute' }}>
            <span className="loading loading-spinner loading-xs"></span>
          </div>
        )}
      </a>
    </div>
  )
}
