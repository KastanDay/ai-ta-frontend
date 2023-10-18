import {
  Button,
  Input,
  Title,
  Text,
  useMantineTheme,
  Tooltip,
  Checkbox,
} from '@mantine/core'
import React, { useEffect, useRef, useState } from 'react';
import { montserrat_heading } from 'fonts'

interface CanvasIngestProps {
  // You can add props here if needed
}

export const CanvasIngest = ({}: CanvasIngestProps) => {
  const [courseID, setCourseID] = useState<string>('');
  const [selectedContents, setSelectedContents] = useState<string[]>([]);
  const [showContentOptions, setShowContentOptions] = useState<boolean>(false);
  const isCourseIDUpdated = courseID.trim() !== '';

  const theme = useMantineTheme();
  const logoRef = useRef(null);  // Create a ref for the logo
  
  useEffect(() => {
    // Check if the logo has been rendered and is accessible
    if (logoRef.current) {
      const logoElement = logoRef.current as HTMLImageElement;
      
      // Adjust the width and height based on the logo's container or other criteria
      logoElement.style.width = '60%';
      logoElement.style.height = '60%';
      logoElement.style.position = 'relative';
      logoElement.style.top = '2px';
    }
  }, [logoRef.current]);

  const defaultIcon = (
    <img
      ref={logoRef}   // Attach the ref to the logo
      src="/media/canvas_logo.png"
      alt="Canvas logo"
    />
  );
  const [icon, setIcon] = useState(defaultIcon);  // Set default icon to Canvas logo

  const handleCheckboxChange = (values: string[]) => {
    setSelectedContents(values);
  };

  const handleSubmit = () => {
    console.log('Course ID:', courseID);
    console.log('Selected Contents:', selectedContents);
  };

  const checkboxStyle = {
    borderColor: theme.colors.gray[4] as string,
  };


  return (
    <>
      <Title
        order={3}
        className={`w-full text-center ${montserrat_heading.variable} pt-1 font-montserratHeading`}
      >
        OR
      </Title>
      <Title
        order={4}
        className={`w-full text-center ${montserrat_heading.variable} mt-4 font-montserratHeading`}
      >
        Ingest Canvas course content
      </Title>

      <Input
        icon={icon}
        className={`mt-4 w-[80%] min-w-[20rem] disabled:bg-purple-200 lg:w-[75%]`}
        wrapperProps={{ backgroundColor: '#020307', borderRadius: 'xl' }}
        placeholder="Enter Canvas course ID"
        radius={'xl'}
        value={courseID}
        size={'lg'}
        onChange={(e) => {
          setCourseID(e.target.value);
          setShowContentOptions(e.target.value.trim() !== '');
        }}
        onKeyPress={(event) => {
          if (event.key === 'Enter') {
            handleSubmit()
          }
        }}
        rightSection={
          <Button
            onClick={(e) => {
                e.preventDefault();
                handleSubmit();
            }}
            size="md"
            radius={'xl'}
            className={`rounded-s-md ${isCourseIDUpdated ? 'bg-purple-800' : 'border-purple-800'
              } overflow-ellipsis text-ellipsis p-2 ${isCourseIDUpdated ? 'text-white' : 'text-gray-500'
              } min-w-[5rem] -translate-x-1 transform hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none`}
            w={'auto'}
            disabled={false} // You can add additional conditions if needed
          >
              Ingest
          </Button>

        }        
        rightSectionWidth={'auto'}
      />


      {showContentOptions && (
          <>
            <form
              className="w-[70%] min-w-[20rem] lg:w-[70%] mt-3"
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <div>
                <div className="flex items-center mb-2">
                  <Tooltip
                    multiline
                    color="#15162b"
                    arrowPosition="side"
                    position="bottom-start"
                    arrowSize={8}
                    withArrow
                    label="Select this option to ingest all files from the Canvas course."
                  >
                    <Checkbox value="files" label="Files" size="md" style={checkboxStyle} />
                  </Tooltip>
                </div>
                <div className="flex items-center mb-2">
                  <Tooltip
                    multiline
                    color="#15162b"
                    arrowPosition="side"
                    position="bottom-start"                    
                    arrowSize={8}
                    withArrow
                    label="Select this option to ingest all pages from the Canvas course."
                  >
                    <Checkbox value="pages" label="Pages" size="md" style={checkboxStyle} />
                  </Tooltip>
                </div>
                <div className="flex items-center mb-2">
                  <Tooltip
                    multiline
                    color="#15162b"
                    arrowPosition="side"
                    position="bottom-start"                    
                    arrowSize={8}
                    withArrow
                    label="Select this option to ingest all modules from the Canvas course."
                  >
                    <Checkbox value="modules" label="Modules" size="md" style={checkboxStyle} />
                  </Tooltip>
                </div>
                <div className="flex items-center mb-2">
                  <Tooltip
                    multiline
                    color="#15162b"
                    arrowPosition="side"
                    position="bottom-start"                    
                    arrowSize={8}
                    withArrow
                    label="Select this option to ingest the course syllabus from Canvas."
                  >
                    <Checkbox value="syllabus" label="Syllabus" size="md" style={checkboxStyle} />
                  </Tooltip>
                </div>
                <div className="flex items-center mb-2">
                  <Tooltip
                    multiline
                    color="#15162b"
                    arrowPosition="side"
                    position="bottom-start"                    
                    arrowSize={8}
                    withArrow
                    label="Select this option to ingest all assignments from the Canvas course."
                  >
                    <Checkbox value="assignments" label="Assignments" size="md" style={checkboxStyle} />
                  </Tooltip>
                </div>
                <div className="flex items-center">
                  <Tooltip
                    multiline
                    color="#15162b"
                    arrowPosition="side"
                    position="bottom-start"
                    arrowSize={8}
                    withArrow
                    label="Select this option to ingest all discussions from the Canvas course."
                  >
                    <Checkbox value="discussions" label="Discussions" size="md" style={checkboxStyle} />
                  </Tooltip>
                </div>
              </div>
              <Text className="mt-4 text-lg font-bold underline text-red-600">
                  Please ensure that you have added the UIUC Chatbot as a student to your course on Canvas before you begin ingesting the course content. The bot email address is uiuc.chat@ad.uillinois.edu and the bot name is UIUC Course AI.
              </Text>
            </form>
          </>
      )}

    </>
  );
};
