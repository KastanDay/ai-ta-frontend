
import Link from 'next/link'
import GlobalHeader from '~/components/UIUC-Components/GlobalHeader'
import { Flex } from '@mantine/core'
import ResumeToChat from './ResumeToChat'
import { useEffect, useState } from 'react';
import { createStyles, Header, Container, Anchor, Group, Burger, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { GoToQueryAnalysis } from './NavbarButtons';
import { MessageChatbot, Folder, ReportAnalytics, Settings } from 'tabler-icons-react';
import { useRouter } from 'next/router';



// a navbar the is inspired by github horizontal bar
const HEADER_HEIGHT = rem(84);

const useStyles = createStyles((theme) => ({
  inner: {
    height: HEADER_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  burger: {
    [theme.fn.largerThan('sm')]: {
      display: 'none',
    },
  },

  links: {
    paddingTop: theme.spacing.lg,
    // paddingTop: rem(100),
    height: HEADER_HEIGHT,
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
    padding: `1rem ${theme.spacing.lg}`,
    fontWeight: 700,
    transition: 'border-color 100ms ease, color 100ms ease, background-color 100ms ease',
    borderRadius: theme.radius.sm, // added to make the square edges round
    textAlign: 'center', // center the text

    '&:hover': {
      color: 'hsl(280,100%,70%)', // make the hovered color lighter
      backgroundColor: 'rgba(255, 255, 255, 0.1)', // change the hovered background color to semi-transparent white
      textDecoration: 'none',
      borderRadius: '10px', // added to make the square edges round when hovered
    },

    '&[data-active="true"]': {
      color: 'hsl(280,100%,70%)', // change the color to same as "AI" when it's on the link's page
      borderBottom: '3px solid hsl(280,100%,100%)', // make the bottom border of the square thicker and same color as "AI"
      textDecoration: 'none', // remove underline
      borderRadius: '10px', // added to make the square edges round when hovered
      backgroundColor: 'rgba(255, 255, 255, 0.1)', // add a background color when the link is active
    },
  }
}));

const Navbar = ({ course_name = '' }: { course_name?: string }) => {
  const classes = useStyles();
  const router = useRouter(); // import useRouter from next/router
  const [activeLink, setActiveLink] = useState(router.asPath); // useState to track the active link

  useEffect(() => {
    setActiveLink(router.asPath); // update the active link when the component mounts
    console.log(router.asPath);
  }, [router.asPath]);


  const handleLinkClick = (path: string) => {
    setActiveLink(path); // update the active link when a link is clicked
  };

  return (
    <>
      <div className="flex flex-col items-center bg-[#2e026d]">
        <div className="mt-4 w-full max-w-[95%]">
          <div className="navbar rounded-badge h-24 min-h-fit bg-[#15162c] shadow-lg shadow-purple-800">
            <div className="flex-1">
              <Link href="/">
                <h2 className="ms-8 cursor-pointer text-3xl font-extrabold tracking-tight text-white sm:text-[2rem] ">
                  UIUC Course <span className="text-[hsl(280,100%,70%)]">AI</span>
                </h2>
              </Link>
            </div>

<<<<<<< Updated upstream
            <Container className={classes.classes.inner}>
              <div className={classes.classes.links}>
                <Link href={`/${course_name}/gpt4`} onClick={() => handleLinkClick(`/${course_name}/gpt4`)} data-active={activeLink === `/${course_name}/gpt4`} className={classes.classes.link}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <MessageChatIcon />
                    Chat
                  </span>
                </Link>
                <Link href={`/${course_name}/materials`} onClick={() => handleLinkClick(`/${course_name}/materials`)} data-active={activeLink === `/${course_name}/materials`} className={classes.classes.link}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <FolderIcon />
                    Materials
                  </span></Link>
                <Link href={`/${course_name}/query-analysis`} onClick={() => handleLinkClick(`/${course_name}/query-analysis`)} data-active={activeLink === `/${course_name}/query-analysis`} className={classes.classes.link}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <ReportIcon />
                    Analysis
                  </span></Link>
                <Link href={`/${course_name}/setting`} onClick={() => handleLinkClick(`/${course_name}/setting`)} data-active={activeLink === `/${course_name}/setting`} className={classes.classes.link}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <SettingIcon />
                    Setting
                  </span></Link>
=======
            {bannerUrl && (
              <div style={{ ...styles.logoContainerBox }}>
                <Image
                  src={bannerUrl}
                  style={{ ...styles.thumbnailImage }}
                  // className=""
                  width={2000}
                  height={2000}
                  alt="The course creator uploaded a logo for this chatbot."
                />
              </div>
            )}


            <Transition transition="pop-top-right" duration={200} mounted={opened}>
              {(styles) => (
                <Paper className={classes.dropdown} withBorder style={styles}>
                  {items.map((item) => (
                    <Link href={item.link} onClick={() => handleLinkClick(item.link)} data-active={activeLink === item.link} className={classes.link}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
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
                {items.map((item) => (
                  <Link href={item.link} onClick={() => handleLinkClick(item.link)} data-active={activeLink === item.link} className={classes.link}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      {item.icon}
                      {item.name}
                    </span>
                  </Link>
                ))}
>>>>>>> Stashed changes
              </div>
            </Container>

            <GlobalHeader isNavbar={true} />
          </div >
        </div >
      </div >
    </>
  )
}

export default Navbar

export function MessageChatIcon() {
  return <MessageChatbot
    size={20}
    strokeWidth={2}
    color={'white'}
    style={{ marginRight: '5px' }}
  />;
}

export function FolderIcon() {
  return <Folder
    size={20}
    strokeWidth={2}
    color={'white'}
    style={{ marginRight: '5px' }}
  />;
}

export function ReportIcon() {
  return <ReportAnalytics
    size={20}
    strokeWidth={2}
    color={'white'}
    style={{ marginRight: '5px' }}
  />;
}

export function SettingIcon() {
  return <Settings
    size={20}
    strokeWidth={2}
    color={'white'}
    style={{ marginRight: '5px' }}
  />;
}

