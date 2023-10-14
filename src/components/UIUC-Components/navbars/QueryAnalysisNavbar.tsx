import Link from 'next/link'
import GlobalHeader from '~/components/UIUC-Components/navbars/GlobalHeader'
import { Flex } from '@mantine/core'
import { GoToMaterials, ResumeToChat } from '../NavbarButtons'

const Navbar = ({ course_name = '' }) => (
  <div className="flex flex-col items-center bg-[#2e026d]">
    <div className="mt-4 w-full max-w-[95%]">
      <div className="navbar rounded-badge h-24 min-h-fit bg-[#15162c] shadow-lg shadow-purple-800">
        <div className="flex-1">
          <Link href="/">
            <h2 className="ms-8 cursor-pointer text-3xl font-extrabold tracking-tight text-white sm:text-[2rem] ">
              UIUC.<span className="text-[hsl(280,100%,70%)]">chat</span>
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
        <GlobalHeader isNavbar={true} />
      </div>
    </div>
  </div>
)

export default Navbar
