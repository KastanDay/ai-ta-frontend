import React, { useEffect, useState } from 'react'
import {
  SpotlightProvider,
  SpotlightAction,
  SpotlightActionProps,
} from '@mantine/spotlight'
import { useFetchEnabledDocGroups } from '~/hooks/docGroupsQueries'
import { IconSearch } from '@tabler/icons-react'
import {
  Group,
  Switch,
  UnstyledButton,
  createStyles,
  rem,
  Text,
} from '@mantine/core'
import { montserrat_heading } from 'fonts'

interface ChatSpotlightProps {
  courseName: string
  actions: SpotlightAction[]
  setActions: (actions: SpotlightAction[]) => void
}

const useStyles = createStyles((theme) => ({
  action: {
    backgroundColor: theme.colorScheme === 'dark' ? '#15162c' : '#15162c',
    position: 'relative',
    display: 'block',
    width: '100%',
    padding: `${rem(10)} ${rem(12)}`,
    borderRadius: theme.radius.sm,
    ...theme.fn.hover({
      backgroundColor:
        theme.colorScheme === 'dark'
          ? 'rgba(42,42,64,0.4)'
          : theme.colors.gray[1],
    }),

    '&[data-hovered]': {
      backgroundColor:
        theme.colorScheme === 'dark'
          ? theme.colors.dark[4]
          : theme.colors.gray[1],
    },
  },
}))

const ChatSpotlight: React.FC<ChatSpotlightProps> = ({
  courseName,
  actions,
  setActions,
}) => {
  const [spotlightQuery, setSpotlightQuery] = useState('')
  const { classes } = useStyles()

  const handleToggleChecked = (id: string) => {
    setActions(
      actions.map((action) =>
        action.id === id ? { ...action, checked: !action.checked } : action,
      ),
    )
    // console.log('updated actions: ', actions)
  }

  const SpotlightSwitch = ({
    action,
    styles,
    classNames,
    hovered,
    checked,
    onTrigger,
    ...others
  }: SpotlightActionProps & {
    checked: boolean
    onTrigger: (id: string, checked: boolean) => void
  }) => {
    return (
      <UnstyledButton
        className={`${classes.action}  `}
        data-hovered={hovered || undefined}
        tabIndex={-1}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onTrigger(action.id as string, checked)}
        {...others}
      >
        <Group
          noWrap
          className={`font-montserratHeading ${montserrat_heading.variable}`}
        >
          <div style={{ flex: 1 }}>
            <Text
              className={`font-montserratHeading ${montserrat_heading.variable}`}
            >
              {action.title}
            </Text>

            {action.description && (
              <Text
                color="dimmed"
                size="xs"
                className={`font-montserratParagraph ${montserrat_heading.variable}`}
              >
                {action.description}
              </Text>
            )}
          </div>
          <Switch
            checked={checked}
            onChange={() => action.onTrigger}
            style={{ cursor: 'pointer' }}
          />
        </Group>
      </UnstyledButton>
    )
  }

  return (
    <SpotlightProvider
      actions={actions}
      query={spotlightQuery}
      onQueryChange={setSpotlightQuery}
      searchIcon={<IconSearch size="1.2rem" />}
      searchPlaceholder="Search for your favourite tools or document groups..."
      actionComponent={(props) => (
        <SpotlightSwitch
          {...props}
          checked={props.action.checked || false}
          onTrigger={() => {
            handleToggleChecked(props.action.id as string)
          }}
        />
      )}
      closeOnActionTrigger={false}
      classNames={{
        content: 'bg-[#15162c] rounded-lg',
        searchInput: `bg-[rgba(42,42,64,0.4)]`,
      }}
    ></SpotlightProvider>
  )
}

export default ChatSpotlight
