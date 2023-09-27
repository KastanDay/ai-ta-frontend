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

  control: {
    position: 'absolute',
    width: rem(250),
    left: `calc(50% - ${rem(125)})`,
    bottom: rem(-20),
  },


  // For Accordion
  root: {
    padding: 0,
    borderRadius: theme.radius.xl,
    outline: 'none',
  },
  item: {
    backgroundColor: 'bg-transparent',
    // border: `${rem(1)} solid transparent`,
    border: `solid transparent`,
    borderRadius: theme.radius.xl,
    position: 'relative',
    zIndex: 0,
    transition: 'transform 150ms ease',
    outline: 'none',

    '&[data-active]': {
      transform: 'scale(1.03)',
      backgroundColor: 'bg-transparent',
      // boxShadow: theme.shadows.xl,
      // borderRadius: theme.radius.lg,
      zIndex: 1,
    },
    '&:hover': {
      backgroundColor: 'bg-transparent',
    },
  },

  chevron: {
    '&[data-rotate]': {
      transform: 'rotate(90deg)',
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
        // pl={27}
        // pr={27}
        pt={10}
        // pb={40}
        // m={-40}
        // style={{ borderRadius: 'theme.radius.xl', width: '112%', maxWidth: 'min(50rem, )', marginLeft: 'max(-1rem, -10%)' }}
        style={{ borderRadius: 'theme.radius.xl' }}
        // classNames={classes}
        classNames={{ item: classes.item, chevron: classes.chevron }}
        className={classes.root}
      >
        {/* ... Accordion items */}
        <Accordion.Item value="openai-key-details" className={classes.item}>
          <Accordion.Control>
            <Text
              className={`label ${montserrat_paragraph.variable} font-montserratParagraph inline-block p-0 text-neutral-200`}
              size={'md'}
            >
              <span className={'text-white'}>Read more</span>{' '}
              👇
            </Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text
              className={`label ${montserrat_paragraph.variable} font-montserratParagraph p-0 text-neutral-200`}
              size={'sm'}
            >
              Only set this key if you&apos;re comfortable with
              paying the OpenAI bill for users to chat with your
              documents. Without this, each user must bring their
              own key and enter it before using the app. Providing a
              key makes your page free and much simpler for your
              users. You can use the visibility controls below to
              limit access. Advanced rate-limit features are a work
              in progress.
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

    </>
  )
}

export default SupportedFileUploadTypes
