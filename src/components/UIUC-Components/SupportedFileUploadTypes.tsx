import Image from 'next/image'
import {
  Text,
  rem,
  Title,
  Flex,
  createStyles,
  Group,
  Accordion,
  // Card,
  // Badge,
  // MantineProvider,
  // Button,
  // Group,
  // Stack,
  // createStyles,
  // FileInput,
  // Group,
  // Divider,
  // TextInput,
  // Tooltip,
} from '@mantine/core'
// const rubik_puddles = Rubik_Puddles({ weight: '400', subsets: ['latin'] })

// import Link from 'next/link'
import React from 'react'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import Link from 'next/link'

const useStyles = createStyles((theme) => ({
  // For Logos
  logos: {
    // width: '30%',
    aspectRatio: '3/2',
    objectFit: 'contain',
    width: '80px',
  },

  smallLogos: {
    // width: '30%',
    aspectRatio: '1/1',
    objectFit: 'contain',
    width: '45px',
  },

  codeStyledText: {
    backgroundColor: '#020307',
    borderRadius: '5px',
    padding: '1px 5px',
    fontFamily: 'monospace',
    alignItems: 'center',
    justifyItems: 'center',
  },

  // For Accordion
  root: {
    borderRadius: theme.radius.lg,
    outline: 'none',
    paddingTop: 20,
    paddingBottom: 20,
    '&[data-active]': {
      paddingTop: 20,
    }

  },
  control: {
    borderRadius: theme.radius.lg,
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)', // 20% white on hover
    },
  },
  content: {
    borderRadius: theme.radius.lg,
  },
  panel: {
    borderRadius: theme.radius.lg,
  },
  item: {
    backgroundColor: 'bg-transparent',
    // border: `${rem(1)} solid transparent`,
    border: `solid transparent`,
    borderRadius: theme.radius.lg,
    position: 'relative',
    // zIndex: 0,
    transition: 'transform 150ms ease',
    outline: 'none',

    '&[data-active]': {
      transform: 'scale(1.03)',
      backgroundColor: '#15162b',
      borderRadius: theme.radius.lg,
      boxShadow: theme.shadows.xl,
    },
    '&:hover': {
      backgroundColor: 'bg-transparent',
    },
  },

  chevron: {
    '&[data-rotate]': {
      transform: 'rotate(180deg)',
    },
  },
}))

const SupportedFileUploadTypes = () => {
  const { classes, theme } = useStyles()
  // className={classes.wrapper}

  return (
    <>
      <Title
        className={`${montserrat_heading.variable} font-montserratHeading`}
        variant="gradient"
        gradient={{ from: 'gold', to: 'white', deg: 50 }}
        order={4}
        p="xl"
      >
        Supported File Types
      </Title>

      <Flex className="space-x-0">
        <Image
          src="/media/pdf_logo.png"
          width={720}
          height={100}
          quality={60}
          alt="PDF icon"
          className={classes.logos}
        // className="logos w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 object-contain"
        />
        <Image
          src="/media/word_logo.png"
          width={2000}
          height={2000}
          quality={60}
          alt="Word logo"
          className={classes.logos}
        />
        <Image
          src="/media/ppt_logo.png"
          width={720}
          height={100}
          quality={60}
          alt="Powerpoint logo"
          className={classes.logos}
        />
        <Image
          src="/media/video_logo.png"
          width={720}
          height={100}
          quality={60}
          alt="Generic video icon"
          className={classes.logos}
        />
        <Image
          src="/media/audio_logo.png"
          width={720}
          height={100}
          quality={60}
          alt="Generic audio icon"
          className={classes.logos}
        />
        <Image
          src="/media/cc_logo.jpg"
          width={720}
          height={100}
          quality={60}
          alt="Closed caption icon"
          className={classes.logos}
        />
        {/* <>
          <Group
            style={{
              justifyContent: 'center',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Image
              src="/media/cc_logo.jpg"
              width={720}
              height={100}
              quality={60}
              alt="Closed caption audio icon"
              // className={classes.logos}
              style={{
                // aspectRatio: '6/2',
                objectFit: 'contain',
                width: '55px',
                alignItems: 'center',
                justifyItems: 'center',
              }}
            />
            <Text>
              <code className={classes.codeStyledText}>.srt</code> &{' '}
              <code className={classes.codeStyledText}>.vtt</code>
            </Text>
          </Group>
        </> */}
      </Flex>

      <Text style={{ paddingTop: '8px' }}>
        And <code className={classes.codeStyledText}>.txt</code>,{' '}
        <code className={classes.codeStyledText}>.py</code>,{' '}
        <code className={classes.codeStyledText}>.html</code>,{' '}
        <code className={classes.codeStyledText}>.srt</code>,{' '}
        <code className={classes.codeStyledText}>.vtt</code>
      </Text>

      <Text
        size={'lg'}
        p={rem(20)}
        className={`${montserrat_paragraph.variable} font-montserratParagraph`}
      >
        Under development...
      </Text>

      <Flex className="space-x-5">
        <Image
          src="/media/github-mark-white.png"
          width={720}
          height={100}
          quality={60}
          alt="Github logo"
          className={classes.smallLogos}
        // style={{mixBlendMode: 'multiply' }}
        />
        <Image
          src="/media/notion_logo.png"
          width={720}
          height={100}
          quality={60}
          alt="Notion logo"
          className={classes.smallLogos}
        // style={{mixBlendMode: 'multiply' }}
        />
        <Image
          src="/media/coursera_logo_cutout.png"
          width={720}
          height={100}
          quality={60}
          alt="Coursera logo"
          className={classes.smallLogos}
        // style={{mixBlendMode: 'multiply' }}
        />
        {/* <Image
          src="/media/mitocw_logo.jpg"
          width={720}
          height={100}
          quality={60}
          alt="MIT Open Courseware logo"
          className={classes.smallLogos}
        /> */}
        <Image
          src="/media/canvas_logo.png"
          width={720}
          height={100}
          quality={60}
          alt="Canvas logo"
          className={classes.smallLogos}
        />
      </Flex>
      <Accordion
        style={{ borderRadius: 'theme.radius.lg' }}
        classNames={{ item: classes.item, chevron: classes.chevron, panel: classes.panel }}
        className={classes.root}
      >
        <Accordion.Item value="openai-key-details" className={classes.item}>
          <Accordion.Control className={classes.control}>
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', borderRadius: theme.radius.lg }}>
              <Text
                className={`label ${montserrat_paragraph.variable} font-montserratParagraph inline-block p-0 text-neutral-200`}
                size={'md'}
              >
                <span className={'text-white'}>Read more</span>{' '}
                👇
              </Text>
            </div>
          </Accordion.Control>
          <Accordion.Panel bg={'#15162b'} >
            <Text
              className={`${montserrat_paragraph.variable} font-montserratParagraph p-0 text-neutral-200`}
              size={'sm'}
              style={{ textAlign: 'left' }}
            >
              <strong>For GitHub ingest</strong>, just paste a URL like <code>github.com/USER/REPO</code>, for example:{' '}
              <span className={'text-purple-600'}>
                <a target="_blank"
                  rel="noreferrer"
                  className='inline-block' href={'https://github.com/langchain-ai/langchain'}>https://github.com/langchain-ai/langchain</a>
              </span>.{' '}
              We&apos;ll ingest all files in the main branch. Ensure the repository is public.
              <br></br>
              <br></br>

              <strong>For MIT Open Course Ware ingest</strong>, just paste a URL like <code>ocw.mit.edu/courses/ANY_COURSE</code> for example:{' '}
              <span className={'text-purple-600'}>
                <a target="_blank"
                  rel="noreferrer"
                  className='inline-block' href={'https://ocw.mit.edu/courses/8-321-quantum-theory-i-fall-2017'}>https://ocw.mit.edu/courses/8-321-quantum-theory-i-fall-2017</a>
              </span>
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

    </>
  )
}

export default SupportedFileUploadTypes
