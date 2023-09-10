import { useRouter } from 'next/router'
import { createStyles, rem, Title, useMantineTheme, Text } from '@mantine/core'
import React, { useState } from 'react'
import { Montserrat } from 'next/font/google'

const montserrat = Montserrat({ weight: '700', subsets: ['latin'] })

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

export function GoToQueryAnalysis({ course_name }: { course_name?: string }) {
  const router = useRouter()
  const { classes, theme } = useStyles()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = () => {
    setIsLoading(true)
    router.push(`/${course_name}/query-analysis`)
  }

  if (!course_name) {
    return null
  }

  return (
    <div className={classes.wrapper}>
      <button
        onClick={handleClick}
        className={`btn rounded-full ${classes.button}`}
        style={{
          backgroundColor: 'transparent',
          outline: `solid 1.5px ${theme.colors.grape[8]}`,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = theme.colors.grape[8])
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = 'transparent')
        }
      >
        {isLoading ? (
          <>
            <span className="loading loading-spinner loading-xs"></span>
          </>
        ) : (
          <>
            <Text
              size={theme.fontSizes.sm}
              color={
                theme.colorScheme === 'dark'
                  ? theme.colors.gray[0]
                  : theme.black
              }
            >
              Go to Query Analysis
            </Text>
          </>
        )}
      </button>
    </div>
  )
}
