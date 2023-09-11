import { useRouter } from 'next/router'
import { createStyles, Group, Text } from '@mantine/core'
import React, { useState } from 'react'
import { IconFolders } from '@tabler/icons-react'
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

export function GoToMaterials({ course_name }: { course_name?: string }) {
  const router = useRouter()
  const { classes, theme } = useStyles()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = () => {
    setIsLoading(true)
    router.push(`/${course_name}/materials`)
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
      </button>
    </div>
  )
}
