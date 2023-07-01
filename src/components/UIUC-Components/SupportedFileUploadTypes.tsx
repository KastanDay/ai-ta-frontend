import Image from 'next/image'
import {
  Montserrat,
  // Inter,
  // Rubik_Puddles,
  // Audiowide,
} from 'next/font/google'
import {
  // Card,
  Text,
  // Badge,
  // MantineProvider,
  // Button,
  // Group,
  // Stack,
  // createStyles,
  // FileInput,
  rem,
  Title,
  Flex,
  Group,
  createStyles,
  Divider,
  // TextInput,
  // Tooltip,
} from '@mantine/core'
// const rubik_puddles = Rubik_Puddles({ weight: '400', subsets: ['latin'] })
const montserrat = Montserrat({ weight: '700', subsets: ['latin'] })
const montserrat_non_bold = Montserrat({ weight: '500', subsets: ['latin'] })
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import { object } from 'zod'
import { ThemeContext } from '@emotion/react'
import { grayscale } from 'react-syntax-highlighter/dist/esm/styles/hljs'

const useStyles = createStyles((theme) => ({
  logos: {
    // width: rem(550),
    // width: '30%',
    aspectRatio: '5/2',
    objectFit: 'contain',
    minWidth: '70px',
    maxWidth: '150px',
    // minHeight: '50px',
    // maxHeight: '200px',
    // mixBlendMode: 'multiply',
  },

  smallLogos: {
    // width: rem(550),
    // width: '30%',
    aspectRatio: '5/2',
    objectFit: 'contain',
    minWidth: '70px',
    maxWidth: '120px',
    // minHeight: '50px',
    // maxHeight: '200px',
    // mixBlendMode: 'multiply',
  },

  greyedOutLogo: {
    // width: '25%',
    aspectRatio: '3/2',
    objectFit: 'contain',
    width: rem(550),
    // minWidth: rem(250),
    // maxWidth: '100px',
    // mixBlendMode: 'multiply',
    opacity: '0.4',
    filter: 'grayscale(100%)',
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
      <Flex>
        <Image
          src="/media/pdf_logo.png"
          width={720}
          height={100}
          quality={60}
          alt="Powerpoint logo"
          className={classes.logos}
        />
        <Image
          src="/media/word_logo.png"
          width={720}
          height={100}
          quality={60}
          alt="Powerpoint logo"
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

      <Flex>
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

        <Image
          src="/media/coursera_logo_cutout.png"
          width={720}
          height={100}
          quality={60}
          alt="Generic audio logo"
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
