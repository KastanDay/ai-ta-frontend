import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/nextjs'
import { IconFile } from '@tabler/icons-react'

export default function Header({ isNavbar = false }: { isNavbar?: boolean }) {
  return (
    <header
      // style={{ display: "flex", justifyContent: "space-between", padding: 20 }}
      style={{
        backgroundColor: isNavbar ? '#15162c' : '#2e026d',
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '1em',
      }}
      className="py-16"
    >
      <SignedIn>
        {/* Mount the UserButton component */}
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
      <SignedOut>
        {/* Signed out users get sign in button */}
        <SignInButton />
      </SignedOut>
    </header>
  )
}


import Link from 'next/link'
import { montserrat_heading } from 'fonts'
import { createStyles, rem } from '@mantine/core'

export function LandingPageHeader({ isNavbar = false }: { isNavbar?: boolean }) {
  const { classes, theme } = useStyles()

  const items = [
    // Header links
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
      // style={{ display: "flex", justifyContent: "space-between", padding: 20 }}
      style={{
        backgroundColor: isNavbar ? '#15162c' : '#2e026d',
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '1em',
      }}
      className="py-16"
    >
      {items.map((item, index) => (
        <Link
          key={index}
          href={item.link}
          // onClick={() => }
          // data-active={activeLink === item.link}
          className={classes.link}
        >
          <span style={{ display: 'flex', alignItems: 'center' }}>
            {item.icon}
            {item.name}
          </span>
        </Link>
      ))}
      <div className='p-2 pt-3'>
        <SignedIn>
          {/* Mount the UserButton component */}
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
        <SignedOut>
          {/* Signed out users get sign in button */}
          <SignInButton />
        </SignedOut>
      </div>
    </header>
  )
}

export function FileIcon() {
  return (
    <IconFile
      size={20}
      strokeWidth={2}
      style={{ marginRight: '5px' }}
    />
  )
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
    padding: '1em, 1em',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',

    [theme.fn.smallerThan('sm')]: {
      display: 'none',
    },
  },
  link: {
    textTransform: 'uppercase',
    fontSize: rem(13),
    color: '#f1f5f9',
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    margin: '0.35rem',
    fontWeight: 700,
    transition:
      'border-color 100ms ease, color 100ms ease, background-color 100ms ease',
    borderRadius: theme.radius.sm, // added to make the square edges round

    '&:hover': {
      color: 'hsl(280,100%,70%)', // make the hovered color lighter
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      textDecoration: 'none',
      borderRadius: '10px',
    },
    '&[data-active="true"]': {
      color: 'hsl(280,100%,70%)',
      borderBottom: '2px solid hsl(280,100%,70%)', // make the bottom border of the square thicker and same color as "AI"
      textDecoration: 'none', // remove underline
      borderRadius: '10px', // added to make the square edges round when hovered
      backgroundColor: 'rgba(255, 255, 255, 0.1)', // add a background color when the link is active
      textAlign: 'right', // align the text to the right
    },
  },
}))