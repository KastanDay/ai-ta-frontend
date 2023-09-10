import Link from 'next/link'
import GlobalHeader from '~/components/UIUC-Components/GlobalHeader'
import { Flex } from '@mantine/core'
import { ResumeToChat } from './ResumeToChat'
import { GoToMaterials } from './GoToMaterials'

const Navbar = ({ course_name = '' }) => (
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
            <GoToMaterials course_name={course_name} />
          </div>
          <div className="ms-4 mt-4 flex flex-row items-center justify-center gap-2">
            <ResumeToChat course_name={course_name} />
          </div>
        </Flex>

        {/* THIS BUTTON IS FOR "GPT4" CHAT */}
        {/* <button
              className={`btn-circle btn mb-1 ms-4`}
              style={{
                position: 'relative',
                boxSizing: 'border-box',
                display: 'flex',
                color: theme.colors.grape[8],
                fontSize: '11px',
                alignItems: 'center',
                justifyContent: 'center',
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                transition: 'background-color 0.2s ease-in-out',
                height: '52px', // Adjusted icon size to match ResumeToChat button
                width: '52px', // Adjusted icon size to match ResumeToChat button
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.grape[9]
                e.currentTarget.style.width = '48px'
                e.currentTarget.style.height = '40px'
                e.currentTarget.style.marginBottom = '0px'
                ;(e.currentTarget.children[0] as HTMLElement).style.display =
                  'none'
                ;(e.currentTarget.children[1] as HTMLElement).style.display =
                  'none'
                ;(e.currentTarget.children[2] as HTMLElement).style.display =
                  'block'
                ;(
                  (e.currentTarget.children[2] as HTMLElement)
                    .children[0] as HTMLElement
                ).style.stroke = theme.white
                ;(
                  (e.currentTarget.children[2] as HTMLElement)
                    .children[0] as HTMLElement
                ).style.color = theme.white
                // ((e.currentTarget.children[2] as HTMLElement).children[0] as HTMLElement).style. = theme.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.width = '52px'
                e.currentTarget.style.height = '52px'
                e.currentTarget.style.backgroundColor = 'transparent'
                ;(e.currentTarget.children[0] as HTMLElement).style.display =
                  'block'
                ;(e.currentTarget.children[1] as HTMLElement).style.display =
                  'block'
                ;(e.currentTarget.children[2] as HTMLElement).style.display =
                  'none'
                ;(
                  (e.currentTarget.children[2] as HTMLElement)
                    .children[0] as HTMLElement
                ).style.stroke = 'currentColor'
              }}
              onClick={() => router.push(`/${course_name}/gpt4`)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-message-circle-2"
                width="48" // Adjusted icon size to match ResumeToChat button
                height="48" // Adjusted icon size to match ResumeToChat button
                viewBox="0 0 22 22"
                strokeWidth="1.5"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <path d="M3 20l1.3 -3.9a9 8 0 1 1 3.4 2.9l-4.7 1"></path>
              </svg>
              <span
                style={{
                  position: 'absolute',
                  color: 'white',
                  top: '54%',
                  left: '54%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                GPT4
              </span>{' '}
              {/* Adjusted the vertical position of the text */}
        {/* <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                style={{
                  width: '16px',
                  height: '16px',
                  position: 'absolute',
                  display: 'none',
                }} // Adjusted size
              >
                <path
                  fillRule="evenodd"
                  d="M8.25 3.75H19.5a.75.75 0 01.75.75v11.25a.75.75 0 01-1.5 0V6.31L5.03 20.03a.75.75 0 01-1.06-1.06L17.69 5.25H8.25a.75.75 0 010-1.5z"
                  clipRule="evenodd"
                />
              </svg>
            </button> */}

        <GlobalHeader isNavbar={true} />
      </div>
    </div>
  </div>
)

export default Navbar
