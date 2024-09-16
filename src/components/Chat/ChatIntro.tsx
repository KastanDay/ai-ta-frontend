// src/components/Chat/ChatIntro.tsx
import React from 'react'
import { Button, Text } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import { CourseMetadata } from '~/types/courseMetadata'
import { CropwizardLicenseDisclaimer } from '~/pages/cropwizard-licenses'
import { montserrat_heading, montserrat_paragraph } from 'fonts'

interface ChatIntroProps {
  statements: string[]
  setInputContent: React.Dispatch<React.SetStateAction<string>>
  courseMetadata: CourseMetadata
  getCurrentPageName: () => string
}

const ChatIntro: React.FC<ChatIntroProps> = ({
  statements,
  setInputContent,
  courseMetadata,
  getCurrentPageName,
}) => {
  return (
    <div className="xs:mx-2 mt-4 max-w-3xl gap-3 px-4 last:mb-2 sm:mx-4 md:mx-auto lg:mx-auto ">
      <div className="backdrop-filter-[blur(10px)] rounded-lg border-2 border-[rgba(42,42,120,0.55)] bg-[rgba(42,42,64,0.4)] p-6">
        <Text
          className={`mb-2 text-lg text-white ${montserrat_heading.variable} font-montserratHeading`}
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {courseMetadata?.course_intro_message}
        </Text>

        <h4
          className={`text-md mb-2 text-white ${montserrat_paragraph.variable} font-montserratParagraph`}
        >
          {getCurrentPageName() === 'cropwizard-1.5' && (
            <CropwizardLicenseDisclaimer />
          )}
          Start a conversation below or try the following examples
        </h4>
        <div className="mt-4 flex flex-col items-start space-y-2 overflow-hidden">
          {statements.map((statement, index) => (
            <div
              key={index}
              className="w-full rounded-lg border-b-2 border-[rgba(42,42,64,0.4)] hover:cursor-pointer hover:bg-[rgba(42,42,64,0.9)]"
              onClick={() => setInputContent(statement)}
            >
              <Button
                variant="link"
                className={`text-md h-auto p-2 font-bold leading-relaxed text-white hover:underline ${montserrat_paragraph.variable} font-montserratParagraph `}
              >
                <IconArrowRight size={25} className="mr-2 min-w-[40px]" />
                <p className="whitespace-break-spaces">{statement}</p>
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div
        className="h-[162px]"
        // This div is kept here to maintain scrolling behavior
      />
    </div>
  )
}

export default React.memo(ChatIntro)
