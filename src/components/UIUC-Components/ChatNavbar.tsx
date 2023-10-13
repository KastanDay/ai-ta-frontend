import Link from 'next/link'
import GlobalHeader from '~/components/UIUC-Components/GlobalHeader'
import { Flex, Stack } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { GoToQueryAnalysis, ResumeToChat } from './NavbarButtons'
import Image from 'next/image'
import { useEffect, useState, useContext, useRef } from 'react'
import {
  createStyles,
  Header,
  Container,
  Anchor,
  Group,
  Burger,
  rem,
  Transition,
  Paper,
} from '@mantine/core'
import {
  MessageChatbot,
  Folder,
  ReportAnalytics,
  Settings,
} from 'tabler-icons-react'
import {
  IconExternalLink,
  IconRobot,
  IconCloudUpload,
  // IconSettings,
} from '@tabler/icons-react'
import { useRouter } from 'next/router'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { useUser } from '@clerk/nextjs'
import { getCoursesByOwnerOrAdmin } from './getAllCourseMetaData';
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { type CourseMetadata } from '~/types/courseMetadata'
import HomeContext from '~/pages/api/home/home.context'
import { ModelSelect } from '../Chat/ModelSelect'



const styles: Record<string, React.CSSProperties> = {
  logoContainerBox: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    // height: '40%',
    height: '80px',
    // maxWidth: typeof window !== 'undefined' && window.innerWidth > 600 ? '80%' : '100%',
    maxWidth: '100%',
    paddingRight: typeof window !== 'undefined' && window.innerWidth > 600 ? '4px' : '25px',
    minWidth: '100px',
  },
  thumbnailImage: {
    objectFit: 'cover',
    objectPosition: 'center',
    height: '100%',
    width: 'auto',
  },
}

const HEADER = rem(60)
const HEADER_HEIGHT = parseFloat(HEADER) * 16

const useStyles = createStyles((theme) => ({
  inner: {
    height: HEADER_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  links: {
    padding: 'theme.spacing.lg, 1em, 1em',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    [theme.fn.smallerThan(1159)]: {
      display: 'none',
    },
  },
  link: {
    // textTransform: 'uppercase',
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
    [theme.fn.smallerThan(1159)]: {
      display: 'list-item',
      textAlign: 'right',
      borderRadius: 0,
      padding: theme.spacing.sm,
    },
  },
  burger: {
    [theme.fn.largerThan(1159)]: {
      display: 'none',
    },
  },
  dropdown: {
    position: 'absolute',
    top: HEADER_HEIGHT,
    left: '50%',
    right: '10%',
    zIndex: 10,
    borderRadius: '10px',
    overflow: 'hidden',
    [theme.fn.largerThan(1159)]: {
      display: 'none',
    },
  },
  modelSettings: {
    position: 'absolute',
    top: '100%',
    left: 0,
    zIndex: 10,
    borderRadius: '10px',
    boxShadow: '0px 8px 16px 0px rgba(0,0,0,0.2)',
  },
  modelButtonContainer: {
    position: 'relative',
    top: '100%',
  },
}))

const ChatNavbar = ({ course_name = '', bannerUrl = '', isgpt4 = true, className = '' }) => {
  const { classes, theme } = useStyles();
  const router = useRouter();
  const [activeLink, setActiveLink] = useState(router.asPath);
  const [opened, { toggle }] = useDisclosure(false);
  const [show, setShow] = useState(true);
  const [isAdminOrOwner, setIsAdminOrOwner] = useState(false);
  const clerk_user = useUser()
  const {
    state: { showModelSettings, selectedConversation },
    dispatch: homeDispatch,
  } = useContext(HomeContext)

  const modelSettingsContainer = useRef<HTMLDivElement | null>(null)
  const topBarRef = useRef<HTMLDivElement | null>(null)
  const getCurrentCourseName = () => {
    return router.asPath.split('/')[1]
  }

  useEffect(() => {
    const fetchCourses = async () => {
      if (clerk_user.isLoaded && clerk_user.isSignedIn) {
        const emails = extractEmailsFromClerk(clerk_user.user);
        const currUserEmail = emails[0];
        if (!currUserEmail) {
          throw new Error('No email found for the user');
        }
        const response = await fetch(`/api/UIUC-api/getAllCourseMetadata?currUserEmail=${currUserEmail}`);
        const rawData = await response.json();
        if (rawData) {
          const currentCourseName = getCurrentCourseName();
          if (currentCourseName) {
            const courseData = rawData.find((course: { [key: string]: CourseMetadata }) => Object.keys(course)[0] === currentCourseName);
            if (courseData) {
              const courseMetadata = courseData[currentCourseName];
              const isAdmin = courseMetadata.course_owner === currUserEmail ||
                (courseMetadata.course_admins && courseMetadata.course_admins.includes(currUserEmail));
              setIsAdminOrOwner(isAdmin);
            } else {
              setIsAdminOrOwner(false);
            }
          }
        }
      }
    }
    fetchCourses();
  }, [clerk_user.isLoaded, clerk_user.isSignedIn])


  const handleLinkClick = (path: string) => {
    setActiveLink(path)
    toggle()
  }



  const items = () => {
    if (isAdminOrOwner) {
      return [
        {
          name: <span className={`${montserrat_heading.variable} font-montserratHeading`}>Chat</span>,
          icon: <MessageChatIcon />,
          link: `/${getCurrentCourseName()}/gpt4`
        },
        {
          name: <span className={`${montserrat_heading.variable} font-montserratHeading`}>Materials</span>,
          icon: <FolderIcon />,
          link: `/${getCurrentCourseName()}/materials`
        },
        {
          name: <span className={`${montserrat_heading.variable} font-montserratHeading`}>Analysis</span>,
          icon: <ReportIcon />,
          link: `/${getCurrentCourseName()}/query-analysis`
        }
      ];
    } else {
      return [];
    }
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (
      event.target instanceof Node &&
      topBarRef.current &&
      topBarRef.current.contains(event.target)
    ) {
      // Do nothing, the click on button + and click outside should cancel out
    } else if (
      modelSettingsContainer.current &&
      topBarRef.current &&
      event.target instanceof Node &&
      !modelSettingsContainer.current.contains(event.target)
    ) {
      homeDispatch({ field: 'showModelSettings', value: false })
    }
  }
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [modelSettingsContainer])
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [topBarRef])

  return (
    <div
      className={`${isgpt4 ? 'bg-[#15162c]' : 'bg-[#2e026d]'}`}
      style={{ display: show ? 'block' : 'none' }}
    >


      <div className="mt-4 w-full max-w-[95%]" style={{ height: '50px', paddingTop: 'Opx' }}>
        {/* <div > */}
        {/* <Flex style={{ flexDirection: 'row' }} className="navbar rounded-badge h-24 bg-[#15162c] shadow-lg shadow-purple-800"> */}
        <Flex style={{ flexDirection: 'row', justifyContent: 'space-between' }} className="navbar rounded-badge h-24 bg-[#15162c] shadow-lg shadow-purple-800">


          <div style={{ justifyContent: 'flex-start' }} >
            <div style={{ ...styles.logoContainerBox, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
              <Link href="/">
                <h2 className="ms-8 cursor-pointer text-3xl font-extrabold tracking-tight text-white sm:text-[2rem] ">
                  UIUC.<span className="text-[hsl(280,100%,70%)]">chat</span>
                </h2>
              </Link>

              {bannerUrl && (
                <div style={{ ...styles.logoContainerBox, paddingLeft: '25px', }}>
                  <Image
                    src={bannerUrl}
                    style={{ ...styles.thumbnailImage }}
                    width={2000}
                    height={2000}
                    alt="The course creator uploaded a logo for this chatbot."
                  />
                </div>
              )}
            </div>
          </div>


          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Transition
              transition="pop-top-right"
              duration={200}
              mounted={opened}
            >
              {(styles) => (
                <Paper className={classes.dropdown} withBorder style={styles}>
                  {items().map((item, index) => (
                    <Link
                      key={index}
                      href={item.link}
                      onClick={() => handleLinkClick(item.link)}
                      data-active={activeLink === item.link}
                      className={classes.link}
                    >
                      <span style={{ display: 'flex', alignItems: 'right', justifyContent: 'flex-end' }}>
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
                {items().map((item, index) => (
                  <Link
                    key={index}
                    href={item.link}
                    onClick={() => handleLinkClick(item.link)}
                    data-active={activeLink === item.link}
                    className={classes.link}
                  >
                    <span style={{ display: 'flex', alignItems: 'right', justifyContent: 'flex-end' }}>
                      {item.icon}
                      {item.name}
                    </span>
                  </Link>
                ))}

              </div>
              <div style={{ display: 'block' }}>
                <button className={`${classes.link}`} style={{ padding: '3px 12px', minWidth: '120px' }}
                  onClick={() => {
                    homeDispatch({
                      field: 'showModelSettings',
                      value: !showModelSettings,
                    })
                  }}
                >
                  <div ref={topBarRef} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <IconRobot size={20} />
                    <span className="home-header_text-underline" style={{
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'bottom left',
                      backgroundSize: 'contain',
                      height: '40px',
                      position: 'relative',
                      top: '13px'
                    }}>
                      <span style={{ marginLeft: '5px' }} className={`${montserrat_heading.variable} font-montserratHeading`}>Model: {selectedConversation?.model.name}</span></span>
                  </div>
                </button>
              </div>
              {showModelSettings && <ModelSelect ref={modelSettingsContainer} style={{ width: '100%', backgroundColor: '#1d1f33' }} />}
            </Container>


            <div>
              {isAdminOrOwner && (
                <Burger
                  opened={opened} onClick={toggle}
                  className={classes.burger} size="sm"
                />
              )}
            </div>
            <GlobalHeader isNavbar={true} />
          </div>
        </Flex>
        {/* </div> */}
      </div >
    </div >
  )
}
export default ChatNavbar

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
      // color={'white'}
      style={{ marginRight: '5px', marginLeft: '5px' }}
    />
  )
}

export function SettingIcon() {
  return (
    <Settings
      size={20}
      strokeWidth={2}
      // color={'white'}
      style={{ marginRight: '5px', marginLeft: '5px' }}
    />
  )
}
