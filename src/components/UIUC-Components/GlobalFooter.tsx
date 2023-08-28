import Link from 'next/link'; // Import the Link component

export default function Footer({ isNavbar = false }: { isNavbar?: boolean }) {
  return (
    <footer className="footer footer-center p-10 text-base-content rounded">
      <div className="grid grid-flow-col gap-4">
        <Link href="/disclaimer" className="link link-hover text-blue-500">
          Disclaimer
        </Link>
        <Link href="/terms" className="link link-hover text-blue-500">
          Terms
        </Link>
        <Link href="/privacy" className="link link-hover text-blue-500">
          Privacy
        </Link>
      </div> 
      <div>
        <Link href="https://github.com/kastanday/ai-ta-frontend" className="link link-hover text-blue-500">
          MIT Licensed
        </Link>
      </div>
    </footer>
  )
}
