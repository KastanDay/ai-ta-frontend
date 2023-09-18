import Link from 'next/link'
import GlobalHeader from '~/components/UIUC-Components/GlobalHeader'
import { Flex } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks';
import { GoToQueryAnalysis, ResumeToChat } from './NavbarButtons'
import Image from 'next/image'
import { useEffect, useState } from 'react';
import { createStyles, Header, Container, Anchor, Group, Burger, rem, Transition, Paper } from '@mantine/core';
import { MessageChatbot, Folder, ReportAnalytics, Settings } from 'tabler-icons-react';
import { useRouter } from 'next/router';
import { montserrat_heading, montserrat_paragraph } from 'fonts'



const styles = {
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

const HEADER_HEIGHT = rem(84);

const useStyles = createStyles((theme) => ({
  inner: {
    height: HEADER_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  links: {
    paddingTop: theme.spacing.lg,
    // paddingTop: rem(100),
    // height: HEADER_HEIGHT,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',

    [theme.fn.smallerThan('sm')]: {
      display: 'none',
    },
  },



}));

const PlainNavbar = ({ isgpt4 = false }) => {
  const router = useRouter(); // import useRouter from next/router


  return (
    <div className={`${isgpt4 ? 'bg-[#15162c]' : 'bg-[#2e026d]'}`}>
      <Flex direction="row" align="center" justify="center">
        <div className="mt-4 w-full max-w-[95%]">
          <div className="navbar rounded-badge h-24 bg-[#15162c] shadow-lg shadow-purple-800">
            <Link href="/">
              <h2 className="ms-8 cursor-pointer text-3xl font-extrabold tracking-tight text-white sm:text-[2rem] ">
                UIUC.<span className="text-[hsl(280,100%,70%)]">chat</span>
              </h2>
            </Link>
            <div className="ml-auto">
              <GlobalHeader isNavbar={true} />
            </div>
          </div>
        </div>
      </Flex>
    </div>
  )
}

export default PlainNavbar
