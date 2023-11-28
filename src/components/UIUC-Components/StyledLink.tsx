interface StyledLinkProps {
    href?: string;
    title?: string;
    children: React.ReactNode;
}

const StyledLink = ({ href, title, children }: StyledLinkProps) => (
    <a
        href={href}
        target="_blank"
        title={title}
        rel="noopener noreferrer"
        className="styled-link"
    >
        {children}
    </a>
);