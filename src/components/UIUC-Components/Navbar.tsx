import Link from 'next/link'
import GlobalHeader from '~/components/UIUC-Components/GlobalHeader'
import { Flex } from '@mantine/core'
import { GoToQueryAnalysis, ResumeToChat } from './NavbarButtons'
import Image from 'next/image'

const styles: Record<string, React.CSSProperties> = {
  logoContainerBox: {
    // Control image-box size
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '80%',
    height: '100%', // Set height to 100% to match navbar height
    overflow: 'hidden', // Hide overflow to crop image
    position: 'relative',
    paddingRight: '80px',
    paddingLeft: '25px',
  },
  thumbnailImage: {
    // Control picture layout INSIDE of the box
    objectFit: 'cover', // Cover to ensure image fills the box
    objectPosition: 'center', // Center to ensure image is centered
    height: '100%', // Set height to 100% to match navbar height
    width: 'auto',
  },
}

const Navbar = ({ course_name = '', bannerUrl = '', isgpt4 = false }) => (
  <div className={`${isgpt4 ? 'bg-[#15162c]' : 'bg-[#2e026d]'}`}>
    <Flex direction="row" align="center" justify="center">
      <div className="mt-4 w-full max-w-[95%]">
        <div className="navbar rounded-badge h-24 bg-[#15162c] shadow-lg shadow-purple-800">
          <Link href="/">
            <h2 className="ms-8 cursor-pointer text-3xl font-extrabold tracking-tight text-white sm:text-[2rem] ">
              UIUC.<span className="text-[hsl(280,100%,70%)]">chat</span>
            </h2>
          </Link>

          {bannerUrl && (
            <div style={{ ...styles.logoContainerBox }}>
              <Image
                src={bannerUrl}
                style={{ ...styles.thumbnailImage }}
                // className=""
                width={2000}
                height={2000}
                alt="The course creator uploaded a logo for this chatbot."
              />
            </div>
          )}
          <div style={{ marginLeft: 'auto' }} className="ms-4 mt-4 gap-2">
            <GoToQueryAnalysis course_name={course_name} />
            <ResumeToChat course_name={course_name} />
          </div>
          <GlobalHeader isNavbar={true} />
        </div>
      </div>
    </Flex>
  </div>
)

export default Navbar
