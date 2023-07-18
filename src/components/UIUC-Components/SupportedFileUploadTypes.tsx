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
    width: '100px',
  },

  smallLogos: {
    // width: '30%',
    aspectRatio: '1/1',
    objectFit: 'contain',
    width: '45px',
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
        // style={{ marginTop: '1rem' }}
      >
        Supported File Types
      </Title>

      <Flex className="space-x-10">
        <Image
          src="/media/pdf_logo.png"
          width={720}
          height={100}
          quality={60}
          alt="PDF icon"
          className={classes.logos}
        />
        <Image
          src="/media/word_logo.png"
          width={720}
          height={100}
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
      </Flex>

      <Text size={'lg'} p={rem(20)} className={montserrat_non_bold.className}>
        Under development...
      </Text>

      <Flex className="space-x-5">
        <Image
          src="/media/video_logo.png"
          width={720}
          height={100}
          quality={60}
          alt="Generic video icon"
          className={classes.smallLogos}
        />
        <Image
          src="/media/audio_logo.png"
          width={720}
          height={100}
          quality={60}
          alt="Generic audio logo"
          className={classes.smallLogos}
        />
        <IconWorldDownload
          className={classes.smallLogos}
          stroke={rem(1.25)}
          color={'white'}
          size={50}
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
          src="/media/github-mark-white.png"
          width={720}
          height={100}
          quality={60}
          alt="Github logo"
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
      </Flex>
    </>
  )
}

export default SupportedFileUploadTypes
