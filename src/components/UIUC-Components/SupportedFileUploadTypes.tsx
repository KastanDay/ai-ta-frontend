import { IconWorldDownload } from '@tabler/icons-react'
// import {
//   IconWorldDownload,
// } from 'tabler-icons-react'
import Image from 'next/image'
import {
  Montserrat,
  // Inter,
  // Rubik_Puddles,
  // Audiowide,
} from 'next/font/google'
import {
  Text,
  rem,
  Title,
  Flex,
  createStyles,
  Group,
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
const montserrat = Montserrat({ weight: '700', subsets: ['latin'] })
const montserrat_non_bold = Montserrat({ weight: '500', subsets: ['latin'] })
// import Link from 'next/link'
import React from 'react'

const useStyles = createStyles((theme) => ({
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
}))

const SupportedFileUploadTypes = () => {
  const { classes, theme } = useStyles()
  // className={classes.wrapper}

  return (
    <>
      <Title
        className={montserrat.className}
        variant="gradient"
        gradient={{ from: 'gold', to: 'white', deg: 50 }}
        order={4}
        p="xl"
      >
        Supported File Types
      </Title>

      <Flex className="space-x-3">
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

      <Text size={'lg'} p={rem(20)} className={montserrat_non_bold.className}>
        Under development...
      </Text>

      <Flex className="space-x-5">
        <IconWorldDownload
          className={classes.smallLogos}
          stroke={rem(1.25)}
          color={'white'}
          size={50}
        />
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
        <Image
          src="/media/mitocw_logo.jpg"
          width={720}
          height={100}
          quality={60}
          alt="MIT Open Courseware logo"
          className={classes.smallLogos}
        />
        <Image
          src="/media/canvas_logo.png"
          width={720}
          height={100}
          quality={60}
          alt="Canvas logo"
          className={classes.smallLogos}
        />
      </Flex>
    </>
  )
}

export default SupportedFileUploadTypes
