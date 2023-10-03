import Link from 'next/link'
import GlobalHeader from '~/components/UIUC-Components/GlobalHeader'
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { createStyles, Header, Container, Anchor, Group, Burger, rem, Transition, Paper } from '@mantine/core';
import { Direction, File } from 'tabler-icons-react';
import { useRouter } from 'next/router';
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/nextjs'

const HEADER_HEIGHT = rem(84);

const useStyles = createStyles((theme) => ({
  inner: {
    height: HEADER_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  link: {
    textTransform: 'uppercase',
    fontSize: rem(13),
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
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
  burger: {
    [theme.fn.largerThan('sm')]: {
      display: 'none',
    },
  },
  signInButtonStyle: {
    fontSize: rem(13),
    fontWeight: 700,
    font: montserrat_heading.variable,
    color: '#f1f5f9',
  },
}));

// const IndexNavbar = ({ course_name = '', isgpt4 = false }) => {
//   const { classes, theme } = useStyles();
//   const router = useRouter();
//   const [activeLink, setActiveLink] = useState(router.asPath);
//   const [opened, { toggle }] = useDisclosure(false);

//   useEffect(() => {
//     setActiveLink(router.asPath);
//   }, [router.asPath]);

//   const handleLinkClick = (path: string) => {
//     setActiveLink(path);
//     toggle();
//   };

//   const items = [
//     { name: <button className={`${montserrat_heading.variable} font-montserratHeading`}>New Project</button>, icon: <FileIcon />, link: `/new` },
//   ];

//   return (
//     <div>
//       {items.map((item) => (
//         <Link href={item.link} onClick={() => handleLinkClick(item.link)} data-active={activeLink === item.link} className={classes.link}>
//           <span style={{ display: 'flex', alignItems: 'right' }}>
//             {item.icon}
//             {item.name}
//           </span>
//         </Link>
//       ))}
//       <Burger opened={opened} onClick={toggle} className={classes.burger} size="sm" />
//       <GlobalHeader isNavbar={true} />
//     </div>
//   )
// }


export function FileIcon() {
  return <File
    size={20}
    strokeWidth={2}
    color={'white'}
    style={{ marginRight: '5px' }}
  />;
}


export function LandingPageHeader({
  isNavbar = false,
}: {
  isNavbar?: boolean
}) {
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
export default LandingPageHeader
