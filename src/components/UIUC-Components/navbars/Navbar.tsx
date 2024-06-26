import Link from 'next/link'
import GlobalHeader from '~/components/UIUC-Components/navbars/GlobalHeader'
import { Flex } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import {
  createStyles,
  Container,
  Burger,
  rem,
  Transition,
  Paper,
  // Header,
  // Anchor,
  // Group,
} from '@mantine/core'
import {
  ChartDots3,
  MessageChatbot,
  Folder,
  ReportAnalytics,
  // Settings,
  MessageCode,
  Key,
} from 'tabler-icons-react'
import { useRouter } from 'next/router'
import { montserrat_heading, montserrat_paragraph } from 'fonts'

const styles: Record<string, React.CSSProperties> = {
  logoContainerBox: {
    // Control image-box size
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    height: '100%',
    maxWidth:
      typeof window !== 'undefined' && window.innerWidth > 600 ? '80%' : '100%',
    paddingRight:
      typeof window !== 'undefined' && window.innerWidth > 600 ? '4px' : '25px',
    paddingLeft: '25px',
  },
  thumbnailImage: {
    // Control picture layout INSIDE of the box
    objectFit: 'cover', // Cover to ensure image fills the box
    objectPosition: 'center', // Center to ensure image is centered
    height: '100%', // Set height to 100% to match navbar height
    width: 'auto',
  },
}

const HEADER_HEIGHT = rem(114)

const useStyles = createStyles((theme) => ({
  burger: {
    [theme.fn.largerThan('md')]: {
      display: 'none',
    },
  },
  links: {
    padding: 'theme.spacing.lg, 1em, 1em',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',

    [theme.fn.smallerThan('md')]: {
      display: 'none',
    },
  },

  inner: {
    height: HEADER_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  link: {
    // textTransform: 'uppercase',
    fontSize: rem(13),
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
    [theme.fn.smallerThan('md')]: {
      display: 'list-item', // change the display to list-item when 'sm'
      textAlign: 'center',
      borderRadius: 0,
      padding: theme.spacing.sm,
    },
  },

  dropdown: {
    position: 'absolute',
    top: HEADER_HEIGHT,
    // left: '50%',
    right: '20px',
    zIndex: 2,
    borderRadius: '10px',
    overflow: 'hidden',
    width: '200px',
    [theme.fn.largerThan('md')]: {
      display: 'none',
    },
  },
}))

const Navbar = ({
  course_name = '',
  bannerUrl = '',
  isgpt4 = true,
  isPlain = false,
}) => {
  // if (!course_name) {
  //   return null;
  // }
  const { classes, theme } = useStyles()
  const router = useRouter() // import useRouter from next/router
  const [activeLink, setActiveLink] = useState(router.asPath) // useState to track the active link
  const [opened, { toggle }] = useDisclosure(false)

  useEffect(() => {
    setActiveLink(router.asPath) // update the active link when the component mounts
  }, [router.asPath])

  const handleLinkClick = (path: string) => {
    setActiveLink(path) // update the active link when a link is clicked
    toggle() // close the mobile menu when a link is clicked
  }

  const getCurrentCourseName = () => {
    // Extract the course name from the current URL path
    // Example: /CS-125/materials --> CS-125
    return router.asPath.split('/')[1]
  }

  const items = [
    {
      name: (
        <span
          className={`${montserrat_heading.variable} font-montserratHeading`}
        >
          Chat
        </span>
      ),
      icon: <MessageChatIcon />,
      link: `/${getCurrentCourseName()}/chat`,
    },
    {
      name: (
        <span
          className={`${montserrat_heading.variable} font-montserratHeading`}
        >
          Materials
        </span>
      ),
      icon: <FolderIcon />,
      link: `/${getCurrentCourseName()}/materials`,
    },
    {
      name: (
        <span
          className={`${montserrat_heading.variable} font-montserratHeading`}
        >
          Analysis
        </span>
      ),
      icon: <ReportIcon />,
      link: `/${getCurrentCourseName()}/query-analysis`,
    },
    {
      name: (
        <span
          className={`${montserrat_heading.variable} font-montserratHeading`}
        >
          Prompting
        </span>
      ),
      icon: <MessageCodeIcon />,
      link: `/${getCurrentCourseName()}/prompt`,
    },
    {
      name: (
        <span
          className={`${montserrat_heading.variable} font-montserratHeading`}
        >
          Tools
        </span>
      ),
      icon: <ChartDots3Icon />,
      link: `/${getCurrentCourseName()}/tools`,
    },
    {
      name: (
        <span
          className={`${montserrat_heading.variable} font-montserratHeading`}
        >
          API
        </span>
      ),
      icon: <KeyIcon />,
      link: `/${getCurrentCourseName()}/api`,
    },
  ]

  return (
    <div className="bg-[#2e026d]">
      <Flex direction="row" align="center" justify="center">
        <div className="mt-4 w-full max-w-[95%]">
          <div className="navbar rounded-badge h-24 bg-[#15162c] shadow-lg shadow-purple-800">
            <div className="flex-1">
              <Link href="/">
                <h2 className="ms-8 cursor-pointer text-3xl font-extrabold tracking-tight text-white sm:text-[2rem] ">
                  UIUC.<span className="text-[hsl(280,100%,70%)]">chat</span>
                </h2>
              </Link>
            </div>

            {/* TODO: Make sticky-left Remove the Banner image bceause I can't get it centered properly (works on /chat page tho) */}
            {bannerUrl && (
              <div style={{ ...styles.logoContainerBox }}>
                <Image
                  src={bannerUrl}
                  style={{ ...styles.thumbnailImage }}
                  width={2000}
                  height={2000}
                  alt="The course creator uploaded a logo for this chatbot."
                  aria-label="The course creator uploaded a logo for this chatbot."
                  onError={(e) => (e.currentTarget.style.display = 'none')} // display nothing if image fails
                />
              </div>
            )}

            {!isPlain && (
              <>
                <Transition
                  transition="pop-top-right"
                  duration={200}
                  mounted={opened}
                >
                  {(styles) => (
                    <Paper
                      className={classes.dropdown}
                      withBorder
                      style={styles}
                    >
                      {items.map((item, index) => (
                        <Link
                          key={index}
                          href={item.link}
                          onClick={() => handleLinkClick(item.link)}
                          data-active={activeLink === item.link}
                          className={classes.link}
                        >
                          <span
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            {item.icon}
                            {item.name}
                          </span>
                        </Link>
                      ))}
                    </Paper>
                  )}
                </Transition>
                <Container className={classes.inner}>
                  <div className={classes.links}>
                    {items.map((item, index) => (
                      <Link
                        key={index}
                        href={item.link}
                        onClick={() => handleLinkClick(item.link)}
                        data-active={activeLink === item.link}
                        className={classes.link}
                      >
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                          {item.icon}
                          {item.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </Container>
                <Burger
                  opened={opened}
                  onClick={toggle}
                  className={classes.burger}
                  size="sm"
                />
              </>
            )}

            <GlobalHeader isNavbar={true} />
          </div>
        </div>
      </Flex>
    </div>
  )
}

export default Navbar

export function MessageChatIcon() {
  return (
    <MessageChatbot
      size={20}
      strokeWidth={2}
      // color={'white'}
      style={{ marginRight: '5px', marginLeft: '5px' }}
    />
  )
}

export function MessageCodeIcon() {
  return (
    <MessageCode
      size={20}
      strokeWidth={2}
      // color={'white'}
      style={{ marginRight: '5px', marginLeft: '5px' }}
    />
  )
}

export function FolderIcon() {
  return (
    <Folder
      size={20}
      strokeWidth={2}
      // color={'white'}
      style={{ marginRight: '5px', marginLeft: '5px' }}
    />
  )
}

export function ReportIcon() {
  return (
    <ReportAnalytics
      size={20}
      strokeWidth={2}
      // color={isSelected ? 'hsl(280,100%,70%)' : 'white'}
      style={{ marginRight: '5px', marginLeft: '5px' }}
    />
  )
}

export function KeyIcon() {
  return (
    <Key
      size={20}
      strokeWidth={2}
      // color={isSelected ? 'hsl(280,100%,70%)' : 'white'}
      style={{ marginRight: '5px', marginLeft: '5px' }}
    />
  )
}

export function ChartDots3Icon() {
  return (
    <ChartDots3
      size={20}
      strokeWidth={2}
      // color={'white'}
      style={{ marginRight: '4px', marginLeft: '4px' }}
    />
  )
}

// export function SettingIcon() {
//   return (
//     <Settings
//       size={20}
//       strokeWidth={2}
//       color={'white'}
//       style={{ marginRight: '5px', marginLeft: '5px' }}
//     />
//   )
// }
