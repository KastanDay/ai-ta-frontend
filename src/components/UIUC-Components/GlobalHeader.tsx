import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton
} from "@clerk/nextjs";

export default function Header() {
  return (
    <header
      // style={{ display: "flex", justifyContent: "space-between", padding: 20 }}
      style={{ backgroundColor: '#2e026d', display: 'flex', justifyContent: 'flex-end', padding: '2em'}}
      className='py-16'
    >
      <SignedIn>
        {/* Mount the UserButton component */}
        <UserButton afterSignOutUrl="/"/>
      </SignedIn>
      <SignedOut>
        {/* Signed out users get sign in button */}
        <SignInButton />
      </SignedOut>
    </header>
  );
}

