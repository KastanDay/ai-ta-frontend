import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/nextjs'
import { IconFile } from '@tabler/icons-react'
import Link from 'next/link'
import { montserrat_heading } from 'fonts'
import { createStyles, Group, rem } from '@mantine/core'

export function LandingPageHeader({ isNavbar = false }) {
  const { classes, theme } = useStyles()

  const items = [
    {
      name: (
        <span
          className={`${montserrat_heading.variable} font-montserratHeading`}
        >
          New Project
        </span>
      ),
      icon: <FileIcon />,
      link: `/new`,
    },
  ]

  return (
    <header
      style={{
        backgroundColor: isNavbar ? '#15162c' : '#2e026d',
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '1em',
      }}
      className="py-16"
    >
      <Group>
        {items.map((item, index) => (
          <Link
            key={index}
            href={item.link}
            className={classes.link}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {item.icon}
              {item.name}
            </span>
          </Link>
        ))}
        <div className={`${classes.signInButtonStyle} pr-2`}>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton />
          </SignedOut>
        </div>
      </Group>
    </header>
  )
}

export function FileIcon() {
  return <IconFile size={20} strokeWidth={2} style={{ marginRight: '5px' }} />
}

const HEADER_HEIGHT = rem(84)

const useStyles = createStyles((theme) => ({
  inner: {
    height: HEADER_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  links: {
    padding: '.2em, 1em',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    [theme.fn.smallerThan('sm')]: {
      display: 'none',
    },
  },
  signInButtonStyle: {
    fontSize: rem(13),
    fontWeight: 700,
    font: montserrat_heading.variable,
    color: '#f1f5f9',
  },
  link: {
    fontSize: rem(13),
    color: '#f1f5f9',
    padding: `${theme.spacing.sm} ${theme.spacing.sm}`,
    margin: '0.35rem',
    fontWeight: 700,
    transition: 'border-color 100ms ease, color 100ms ease, background-color 100ms ease',
    borderRadius: theme.radius.sm,
    '&:hover': {
      color: 'hsl(280,100%,70%)',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      textDecoration: 'none',
      borderRadius: '10px',
    },
    '&[data-active="true"]': {
      color: 'hsl(280,100%,70%)',
      borderBottom: '2px solid hsl(280,100%,70%)',
      textDecoration: 'none',
      borderRadius: '10px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      textAlign: 'right',
    },
  },
}))

export default LandingPageHeader
