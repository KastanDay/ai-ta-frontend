// src/pages/[course_name]/api.tsx
import { type NextPage } from 'next'
import MakeNewCoursePage from '~/components/UIUC-Components/MakeNewCoursePage'
import React, { useEffect, useState } from 'react'
import { Montserrat } from 'next/font/google'
import { useRouter } from 'next/router'
import { useUser } from '@clerk/nextjs'
import { CannotEditGPT4Page } from '~/components/UIUC-Components/CannotEditGPT4'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
import { Button, Card, Checkbox, CheckboxProps, Flex, Group, Input, MantineTheme, Select, Table, Text, Textarea, Title, useMantineTheme } from '@mantine/core'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { DEFAULT_SYSTEM_PROMPT } from '~/utils/app/const'
import { type CourseMetadata } from '~/types/courseMetadata'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import Navbar from '~/components/UIUC-Components/navbars/Navbar'
import Head from 'next/head'
import { useMediaQuery } from '@mantine/hooks'
import { IconAlertTriangle, IconCheck, IconExternalLink } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'

const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
})

const montserrat_light = Montserrat({
  weight: '400',
  subsets: ['latin'],
})

const CourseMain: NextPage = () => {
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [checked3, setChecked3] = useState(false);

  const theme = useMantineTheme()
  const router = useRouter()

  const GetCurrentPageName = () => {
    // return router.asPath.slice(1).split('/')[0]
    // Possible improvement.
    return router.query.course_name as string // Change this line
  }
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const course_name = GetCurrentPageName() as string
  const { user, isLoaded, isSignedIn } = useUser()
  const [courseData, setCourseData] = useState(null)
  const [courseExists, setCourseExists] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const clerk_user = useUser()
  const emails = extractEmailsFromClerk(clerk_user.user)
  const currUserEmail = emails[0]
  const [baseSystemPrompt, setBaseSystemPrompt] = useState('');
  const [thingsToDo, setThingsToDo] = useState('');
  const [thingsNotToDo, setThingsNotToDo] = useState('');
  const [originalSystemPrompt, setOriginalSystemPrompt] = useState('');

  useEffect(() => {
    const fetchCourseData = async () => {
      if (course_name == undefined) {
        return
      }
      const response = await fetch(
        `/api/UIUC-api/getCourseExists?course_name=${course_name}`,
      )
      const data = await response.json()
      setCourseExists(data)
      const response_metadata = await fetch(
        `/api/UIUC-api/getCourseMetadata?course_name=${course_name}`,
      )
      const courseMetadata = (await response_metadata.json()).course_metadata
      setCourseMetadata(courseMetadata)
      setSystemPrompt(courseMetadata.system_prompt || DEFAULT_SYSTEM_PROMPT)
      setBaseSystemPrompt(courseMetadata.system_prompt || DEFAULT_SYSTEM_PROMPT)
      setIsLoading(false)
    }
    fetchCourseData()
  }, [router.isReady])

  useEffect(() => {
    let newSystemPrompt = baseSystemPrompt;

    if (checked1) {
      newSystemPrompt += "\nContent includes equations; LaTeX notation preferred.";
    }

    if (checked2) {
      newSystemPrompt += "\nFocus exclusively on document-based references—avoid incorporating knowledge from outside sources. Essential for legal and similar fields to maintain response quality.";
    }

    if (checked3 && courseMetadata?.course_intro_message) {
      newSystemPrompt += `\n${courseMetadata.course_intro_message} If the user asks an introductory question or greeting along the lines of 'hello' or 'what can you do?' or 'What's in here ?' or 'what is ${course_name}?' or similar, then please respond with a warm welcome to ${course_name}, the AI ${course_name} assistant chatbot. Tell them that you can answer questions using the entire knowledge base of Extension. Feel free to ask!`;
    } else if (checked3) {
      newSystemPrompt += `\nIf the user asks an introductory question or greeting along the lines of 'hello' or 'what can you do?' or 'What's in here ?' or 'what is ${course_name}?' or similar, then please respond with a warm welcome to ${course_name}, the AI ${course_name} assistant chatbot. Tell them that you can answer questions using the entire knowledge base of Extension. Feel free to ask!`;
    }

    if (thingsToDo) {
      newSystemPrompt += "\nThings to do: " + thingsToDo;
    }
    if (thingsNotToDo) {
      newSystemPrompt += "\nThings NOT to do: " + thingsNotToDo;
    }

    setSystemPrompt(newSystemPrompt);
  }, [checked1, checked2, checked3, thingsToDo, thingsNotToDo, courseMetadata]);

  const handleSystemPromptSubmit = async () => {
    if (courseMetadata && course_name && systemPrompt) {

      courseMetadata.system_prompt = systemPrompt;
      const success = await callSetCourseMetadata(course_name, courseMetadata);

      if (!success) {
        console.log('Error updating course metadata')
        showToastOnPromptUpdate(theme, true)
      } else {
        showToastOnPromptUpdate(theme)
      }
    }
  }

  const resetSystemPrompt = async () => {
    if (courseMetadata && course_name) {
      courseMetadata.system_prompt = DEFAULT_SYSTEM_PROMPT
      const success = await callSetCourseMetadata(course_name, courseMetadata)
      if (!success) {
        alert('Error resetting system prompt')
        showToastOnPromptUpdate(theme, true)
      } else {
        showToastOnPromptUpdate(theme, false, true)
      }
    } else {
      alert('Error resetting system prompt')
    }
  }

  // Check auth - https://clerk.com/docs/nextjs/read-session-and-user-data
  if (!isLoaded || isLoading) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  if (!isSignedIn) {
    console.log('User not logged in', isSignedIn, isLoaded, course_name)
    return <AuthComponent course_name={course_name} />
  }

  const user_emails = extractEmailsFromClerk(user)

  // if their account is somehow broken (with no email address)
  if (user_emails.length == 0) {
    return (
      <MainPageBackground>
        <Title
          className={montserrat.className}
          variant="gradient"
          gradient={{ from: 'gold', to: 'white', deg: 50 }}
          order={3}
          p="xl"
          style={{ marginTop: '4rem' }}
        >
          You&apos;ve encountered a software bug!<br></br>Your account has no
          email address. Please shoot me an email so I can fix it for you:{' '}
          <a className="goldUnderline" href="mailto:kvday2@illinois.edu">
            kvday2@illinois.edu
          </a>
        </Title>
      </MainPageBackground>
    )
  }

  // Don't edit certain special pages (no context allowed)
  if (
    course_name.toLowerCase() == 'gpt4' ||
    course_name.toLowerCase() == 'global' ||
    course_name.toLowerCase() == 'extreme'
  ) {
    return <CannotEditGPT4Page course_name={course_name as string} />
  }

  if (courseExists === null) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  if (courseExists === false) {
    return (
      <MakeNewCoursePage
        course_name={course_name as string}
        current_user_email={user_emails[0] as string}
      />
    )
  }

  const pythonCode = `
    def fibonacci(n):
        if n <= 0:
            return []
        elif n == 1:
            return [0]
        elif n == 2:
            return [0, 1]
        else:
            fib = [0, 1]
            for i in range(2, n):
                fib.append(fib[i-1] + fib[i-2])
        return fib`;

  const elements = [
    {
      theSystemPrompt: "You are ChatGPT, a helpful assistant. Follow the user's instructions carefully. Respond using markdown.",
      user: pythonCode,
      response: `The provided Python function \`fibonacci(n)\` is designed to generate a list containing the Fibonacci sequence up to the \`n\`-th element. The Fibonacci sequence is a series of numbers where each number is the sum of the two preceding ones, usually starting with 0 and 1. The function handles different cases based on the value of \`n\`:

      - If \`n\` is less than or equal to 0, it returns an empty list, indicating that there are no elements in the sequence.
      - If \`n\` is 1, it returns a list containing only the first element of the Fibonacci sequence, \`[0]\`.
      - If \`n\` is 2, it returns the first two elements, \`[0, 1]\`.
      - For any other value of \`n\`, it initializes a list with the first two elements of the sequence, \`[0, 1]\`, and then enters a loop to calculate the remaining elements up to the \`n\`-th element. Each new element is the sum of the two previous elements in the list.
      
      The function concludes by returning the list \`fib\`, which contains the Fibonacci sequence up to the \`n\`-th element.
      
      This function is an example of a simple algorithm and does not directly relate to the provided course materials, as there is no mention of the Fibonacci sequence or related algorithms in the excerpts from the Stack Overflow Blog or the Object-Oriented Design Flowchart document.
      
      ### Relevant Sources:
      
      There are no relevant sources to cite for this response.`
    },
    {
      theSystemPrompt: "You are ChatGPT, a helpful assistant. Follow the user's instructions carefully. Respond using markdown. Your task is to analyze the provided Python code snippet and suggest improvements to optimize its performance. Identify areas where the code can be made more efficient, faster, or less resource-intensive. Provide specific suggestions for optimization, along with explanations of how these changes can enhance the code's performance. The optimized code should maintain the same functionality as the original code while demonstrating improved efficiency.",
      user: pythonCode,
      response: `The provided Python function \`fibonacci(n)\` generates a list of Fibonacci numbers up to the \`n\`-th element. Here are some suggestions for optimizing this function:

      1. **Avoid Recalculating Values**: The current implementation recalculates the Fibonacci numbers in each iteration of the loop. This is not necessary as we can simply keep track of the last two numbers and update them as we go.
      
      2. **Use Tuple Unpacking**: Instead of using an array to store all the Fibonacci numbers, we can use two variables and update them in each iteration. This will save memory as we don't need to store the entire sequence at all times.
      
      3. **Reduce Function Calls**: The multiple \`elif\` statements can be reduced to a single \`if-else\` block, which will reduce the number of checks and function calls.
      
      Here is the optimized version of the code:
      
      \`\`\`python
      def fibonacci(n):
          if n <= 0:
              return []
          elif n == 1:
              return [0]
          else:
              a, b = 0, 1
              fib = [a]
              for _ in range(1, n):
                  fib.append(b)
                  a, b = b, a + b
          return fib
      \`\`\`
      
      In this optimized version, we start with the first two Fibonacci numbers \`a\` and \`b\`. We then iterate \`n-1\` times, appending the next Fibonacci number to the list and updating \`a\` and \`b\` accordingly using tuple unpacking. This version is more efficient because it avoids the overhead of array indexing and reduces the memory footprint by not storing the entire sequence at all times.
      
      Please note that this code maintains the same functionality as the original code but demonstrates improved efficiency. There are no references to this specific code optimization in the provided documents, so this analysis is based on general programming best practices.`
    },
  ]


  return (
    <>
      <Navbar course_name={router.query.course_name as string} />
      <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
        <div className="items-left flex w-full flex-col justify-center py-0">

          <Flex direction="column" align="center" w="100%">
            <Card
              shadow="xs"
              padding="none"
              radius="xl"
              style={{ maxWidth: '85%', width: '100%', marginTop: '4%' }}
            >
              <Flex
                direction={isSmallScreen ? 'column' : 'row'}
                style={{ height: '100%' }}
              >
                <div
                  style={{
                    flex: isSmallScreen ? '1 1 100%' : '1 1 60%',
                    padding: '1rem',
                    color: 'white',
                    alignItems: 'center',
                  }}
                  className="min-h-full justify-center bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800"
                >
                  <div className="card flex h-full flex-col">
                    <Group
                      // spacing="lg"
                      m="3rem"
                      align="center"
                      variant="column"
                      style={{
                        justifyContent: 'center',
                        width: '90%',
                        alignSelf: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <Title
                        order={2}
                        variant="gradient"
                        gradient={{ from: 'gold', to: 'white', deg: 50 }}
                        style={{ marginBottom: '0.5rem' }}
                        align="center"
                        className={`label ${montserrat_heading.variable} font - montserratHeading`}
                      >
                        Customize system prompt
                      </Title>
                      <Title order={4} w={'90%'}>
                        For guidance on crafting prompts, consult the
                        <a
                          className={'pl-1 text-purple-600'}
                          href="https://platform.openai.com/docs/guides/prompt-engineering"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          official OpenAI documentation

                          <IconExternalLink
                            className="mr-2 inline-block"
                            style={{ position: 'relative', top: '-3px' }}
                          />
                        </a>
                      </Title>
                      <Title order={4} w={'90%'}>
                        Modify with caution. Unnecessary alterations might reduce
                        effectiveness, similar to overly restrictive coding. Changes
                        affect all project users.
                      </Title>
                      <div
                        style={{
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          background: '#15162c',
                          paddingTop: '1rem',
                          borderRadius: '1rem',
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#15162c',
                            paddingBottom: '1rem',
                          }}
                        >
                          <Title
                            order={3}
                            align="left"
                            variant="gradient"
                            gradient={{ from: 'gold', to: 'white', deg: 50 }}
                            style={{ flexGrow: 2, marginLeft: '1rem' }}
                          >
                            Example
                          </Title>

                          {/* <Select
                            placeholder="Select an option"
                            data={languageOptions}
                            value={selectedLanguage}
                            style={{ width: '7rem' }} // Ensures the button is wide enough to show all text and does not shrink
                            onChange={(value: string | null) => {
                              if (
                                value === 'curl' ||
                                value === 'python' ||
                                value === 'node'
                              ) {
                                setSelectedLanguage(value)
                              }
                            }}
                          // style={{ width: '30%', minWidth: '20px' }}
                          /> */}
                          {/* <Button
                            onClick={() =>
                              handleCopyCodeSnippet(codeSnippets[selectedLanguage])
                            }
                            variant="subtle"
                            size="xs"
                            className="ms-2 min-h-[2.5rem] transform rounded-bl-xl rounded-br-md rounded-tl-md rounded-tr-xl bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none"
                          >
                            {copiedCodeSnippet ? <IconCheck /> : <IconCopy />}
                          </Button> */}
                        </div>

                        <Table striped withBorder withColumnBorders>
                          <thead>
                            <tr>
                              <th>System Prompt</th>
                              {elements.map((element, index) => (
                                <td key={`prompt-${index}`}>{element.theSystemPrompt}</td>
                              ))}
                            </tr>
                            <tr>
                              <th>User</th>
                              {elements.map((element, index) => (
                                <td key={`user-${index}`}><pre><code>{element.user}</code></pre></td>
                              ))}
                            </tr>
                            <tr>
                              <th>Response</th>
                              {elements.map((element, index) => (
                                <td key={`response-${index}`}>{element.response}</td>
                              ))}
                            </tr>
                          </thead>
                        </Table>
                        {/* <Textarea
                          value={codeSnippets[selectedLanguage] as string}
                          autosize
                          variant="unstyled"
                          wrapperProps={{ overflow: 'hidden' }}
                          className="relative w-[100%] min-w-[20rem] overflow-hidden rounded-b-xl border-t-2 border-gray-400 bg-[#0c0c27] pl-8 text-white"
                          readOnly
                        /> */}
                      </div>
                    </Group>
                  </div>
                </div>
                <div
                  style={{
                    flex: isSmallScreen ? '1 1 100%' : '1 1 40%',
                    padding: '1rem',
                    backgroundColor: '#15162c',
                    color: 'white',
                  }}
                >
                  <div className="card flex h-full flex-col">
                    <Group position="left" m="3rem" variant="column">
                      <Title
                        className={`label ${montserrat_heading.variable} font - montserratHeading`}
                        variant="gradient"
                        gradient={{ from: 'gold', to: 'white', deg: 170 }}
                        order={3}
                        style={{ paddingTop: '18px' }}
                      >
                        System Prompt
                      </Title>
                      <Textarea
                        // label={<strong>System Prompt</strong>}
                        autosize
                        minRows={3}
                        maxRows={20}
                        style={{ width: '100%' }}
                        placeholder="Enter a system prompt"
                        className={`pt - 3 ${montserrat_paragraph.variable} font - montserratParagraph`}
                        value={systemPrompt}
                        onChange={(e) => {
                          setBaseSystemPrompt(e.target.value);
                          setSystemPrompt(e.target.value)
                        }}
                      />
                      <Checkbox
                        label={`Add greetings at the beginning of the conversation.`}
                        // wrapperProps={{}}
                        // description="Course is private by default."
                        className={`${montserrat_paragraph.variable} font - montserratParagraph`}
                        // style={{ marginTop: '4rem' }}
                        size="md"
                        // bg='#020307'
                        color="grape"
                        // icon={CheckboxIcon}
                        checked={checked3}
                        onChange={(event) => setChecked3(event.currentTarget.checked)}
                      // defaultChecked={isPrivate}
                      // onChange={handleCheckboxChange}
                      />
                      <Checkbox
                        label={`Content includes equations; LaTeX notation preferred.`}
                        // wrapperProps={{}}
                        // description="Course is private by default."
                        className={`${montserrat_paragraph.variable} font - montserratParagraph`}
                        // style={{ marginTop: '4rem' }}
                        size="md"
                        // bg='#020307'
                        color="grape"
                        // icon={CheckboxIcon}
                        checked={checked1}
                        onChange={(event) => setChecked1(event.currentTarget.checked)}
                      // defaultChecked={isPrivate}
                      // onChange={handleCheckboxChange}
                      />
                      <Checkbox
                        label={`Focus exclusively on document - based references—avoid incorporating knowledge from outside sources.Essential for legal and similar fields to maintain response quality.`}
                        // wrapperProps={{}}
                        // description="Course is private by default."
                        className={`${montserrat_paragraph.variable} font - montserratParagraph`}
                        // style={{ marginTop: '4rem' }}
                        size="md"
                        // bg='#020307'
                        color="grape"
                        // icon={CheckboxIcon}
                        checked={checked2}
                        onChange={(event) => setChecked2(event.currentTarget.checked)}
                      // defaultChecked={isPrivate}
                      // onChange={handleCheckboxChange}
                      />
                      <Title
                        className={`label ${montserrat_heading.variable} font - montserratHeading`}
                        variant="gradient"
                        gradient={{ from: 'gold', to: 'white', deg: 170 }}
                        order={4}
                      >
                        Things to do
                      </Title>
                      <Textarea
                        // label={<strong>Things to do</strong>}
                        autosize
                        minRows={3}
                        maxRows={20}
                        style={{ width: '100%', paddingTop: '0px' }}
                        placeholder="Enter guidelines that the chat response should adhere to..."
                        className={`pt - 3 ${montserrat_paragraph.variable} font - montserratParagraph`}
                        value={thingsToDo}
                        onChange={(e) => {
                          setThingsToDo(e.target.value)
                        }}
                      />
                      <Title
                        className={`label ${montserrat_heading.variable} font - montserratHeading`}
                        variant="gradient"
                        gradient={{ from: 'gold', to: 'white', deg: 170 }}
                        order={4}
                      >
                        Things NOT to do
                      </Title>
                      <Textarea
                        // label={<strong>Things NOT to do</strong>}
                        autosize
                        minRows={3}
                        maxRows={20}
                        style={{ width: '100%', paddingTop: '0px' }}
                        placeholder="Edit the guidelines that the chat response should not adhere to..."
                        className={`pt - 3 ${montserrat_paragraph.variable} font - montserratParagraph`}
                        value={thingsNotToDo}
                        onChange={(e) => {
                          setThingsNotToDo(e.target.value)
                        }}
                      />
                      <div style={{ paddingTop: '10px', width: '100%' }}>

                        <div
                          style={{
                            paddingTop: '10px',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >

                          <Button
                            className="relative m-1 self-end bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600"
                            type="submit"
                            onClick={handleSystemPromptSubmit}
                            style={{ minWidth: 'fit-content' }}
                          >
                            Update System Prompt
                          </Button>
                          <Button
                            className="relative m-1 self-end bg-red-500 text-white hover:border-red-600 hover:bg-red-600"
                            onClick={() => {
                              setSystemPrompt(DEFAULT_SYSTEM_PROMPT)
                              resetSystemPrompt()
                            }}
                            style={{ minWidth: 'fit-content' }}
                          >
                            Reset
                          </Button>
                        </div>
                      </div>

                    </Group>


                  </div>
                </div>
              </Flex>
            </Card>
          </Flex>
        </div>
      </main>
    </>
  )
}
export const showToastOnPromptUpdate = (
  theme: MantineTheme,
  was_error = false,
  isReset = false,
) => {
  return (
    notifications.show({
      id: 'prompt-updated',
      withCloseButton: true,
      onClose: () => console.log('unmounted'),
      onOpen: () => console.log('mounted'),
      autoClose: 12000,
      title: was_error ? 'Error updating prompt' : (isReset ? 'Resetting prompt...' : 'Updating prompt...'),
      message: was_error
        ? "An error occurred while updating the prompt. Please try again."
        : (isReset ? 'The prompt has been reset to default.' : 'The prompt has been updated successfully.'),
      icon: was_error ? <IconAlertTriangle /> : <IconCheck />,
      styles: {
        root: {
          backgroundColor: theme.colors.nearlyWhite,
          borderColor: was_error
            ? theme.colors.errorBorder
            : theme.colors.aiPurple,
        },
        title: {
          color: theme.colors.nearlyBlack,
        },
        description: {
          color: theme.colors.nearlyBlack,
        },
        closeButton: {
          color: theme.colors.nearlyBlack,
          '&:hover': {
            backgroundColor: theme.colors.dark[1],
          },
        },
        icon: {
          backgroundColor: was_error
            ? theme.colors.errorBackground
            : theme.colors.successBackground,
          padding: '4px',
        },
      },
      loading: false,
    })
  )
}
export default CourseMain
