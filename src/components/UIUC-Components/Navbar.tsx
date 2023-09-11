import Link from 'next/link'
import GlobalHeader from '~/components/UIUC-Components/GlobalHeader'
import { Flex } from '@mantine/core'
import ResumeToChat from './ResumeToChat'
import { useState } from 'react';
import { createStyles, Header, Container, Anchor, Group, Burger, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { GoToQueryAnalysis } from './NavbarButtons';



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
    // color: theme.colorScheme === 'dark' ? theme.colors.dark[1] : theme.colors.gray[6],
    padding: `${rem(7)} ${theme.spacing.sm}`,
    fontWeight: 700,
    // borderBottom: `${rem(2)} solid transparent`,
    transition: 'border-color 100ms ease, color 100ms ease',

    '&:hover': {
      color: theme.colorScheme === 'dark' ? theme.white : theme.black,
      textDecoration: 'none',
    },
  },
}));

//   const [isOpen, setOpen] = useState(false);


const Navbar = ({ course_name = '' }: { course_name?: string }) => {
  const classes = useStyles();

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
            <Flex direction="row" align="center" justify="center">
              <div className="ms-4 mt-4 flex flex-row items-center justify-center gap-2">
                <ResumeToChat course_name={course_name} />
              </div>
            </Flex>
            <div className="ms-4 mt-4 flex flex-row items-center justify-center gap-2">
              <GoToQueryAnalysis course_name={course_name} />
            </div>

            {/* <Header height={HEADER_HEIGHT} mb={120}> */}
            <Container className={classes.classes.inner}>
              <div className={classes.classes.links}>
                <Link href={`${course_name}/chat`} className={classes.classes.link}>Chat</Link>
                <Link href={`${course_name}/materials`} className={classes.classes.link}>Materials</Link>
                <Link href={`${course_name}/query-analysis`} className={classes.classes.link}>Analysis</Link>
                <Link href={`${course_name}/setting`} className={classes.classes.link}>Setting</Link>
              </div>
            </Container>
            {/* </Header> */}


            <GlobalHeader isNavbar={true} />
          </div>
        </div>
      </div>
    </>
  )
}

export default Navbar