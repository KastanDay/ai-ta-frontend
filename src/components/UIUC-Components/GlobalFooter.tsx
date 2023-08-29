import Link from 'next/link' // Import the Link component

export default function Footer({ isNavbar = false }: { isNavbar?: boolean }) {
  return (
    <footer className="footer footer-center rounded p-10 text-base-content">
      <div className="grid grid-flow-col gap-4">
        <Link
          href="/disclaimer"
          className="link-hover link text-blue-500"
          target="_blank"
          rel="noopener noreferrer"
        >
          Disclaimer
        </Link>
        <Link
          href="/terms"
          className="link-hover link text-blue-500"
          target="_blank"
          rel="noopener noreferrer"
        >
          Terms
        </Link>
        <Link
          href="/privacy"
          className="link-hover link text-blue-500"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy
        </Link>
        <span>
          MIT Licensed{' '}
          <Link
            href="https://github.com/kastanday/ai-ta-frontend"
            className="link-hover link text-blue-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            frontend
          </Link>{' '}
          and{' '}
          <Link
            href="https://github.com/UIUC-Chatbot/ai-ta-backend"
            className="link-hover link text-blue-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            backend
          </Link>{' '}
          code.
        </span>
      </div>
    </footer>
  )
}
