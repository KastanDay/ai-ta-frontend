import Link from 'next/link'
import GlobalHeader from '~/components/UIUC-Components/GlobalHeader'
import { Flex } from '@mantine/core'
import { GoToQueryAnalysis, ResumeToChat } from './NavbarButtons'
import Image from 'next/image'

const styles: Record<string, React.CSSProperties> = {
  logoContainerBox: {
    // Control box size
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '100%',
    minWidth: '40%',
    height: '80px',
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    // controls picture size inside of the box
    objectFit: 'cover',
    objectPosition: 'center',
    position: 'absolute',
    minHeight: '50px',
    minWidth: '50%',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
}

const Navbar = ({ course_name = '', bannerUrl = '', isgpt4 = false }) => (
  <div
    className={`flex flex-col items-center ${
      isgpt4 ? 'bg-[#15162c]' : 'bg-[#2e026d]'
    }`}
  >
    <div className="mt-4 w-full max-w-[95%]">
      <div className="navbar rounded-badge h-24 min-h-fit bg-[#15162c] shadow-lg shadow-purple-800">
        <div className="flex-1">
          <Link href="/">
            <h2 className="ms-8 cursor-pointer text-3xl font-extrabold tracking-tight text-white sm:text-[2rem] ">
              UIUC.<span className="text-[hsl(280,100%,70%)]">chat</span>
            </h2>
          </Link>
          {bannerUrl && (
            <div style={styles.logoContainerBox}>
              <Image
                src={bannerUrl}
                style={styles.thumbnailImage}
                className="pl-10"
                alt="User uploaded image"
                width={400}
                height={400}
              />
            </div>
          )}
          {/* // <div className="ms-4 border-l-2 border-purple-500 pl-4">
            //   <Image src={bannerUrl} alt="Banner" layout="fill" objectFit="cover" />
            // </div> */}
        </div>

        <Flex direction="row" align="center" justify="center">
          <div className="ms-4 mt-4 flex flex-row items-center justify-center gap-2">
            <GoToQueryAnalysis course_name={course_name} />
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
