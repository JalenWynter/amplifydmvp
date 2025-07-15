
import Link from "next/link";
import Logo from "../logo";

export default function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground">Amplify your sound. Get real feedback.</p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Platform</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/features" className="text-muted-foreground hover:text-foreground">Features</Link></li>
              <li><Link href="/features" className="text-muted-foreground hover:text-foreground">Find a Reviewer</Link></li>
              <li><Link href="/apply" className="text-muted-foreground hover:text-foreground">Become a Reviewer</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Company</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact Us</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
            </ul>
          </div>
           <div>
            <h3 className="font-semibold text-foreground">Developer</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/dev-setup" className="text-muted-foreground hover:text-foreground">Dev Setup</Link></li>
              <li><Link href="/changelog.md" className="text-muted-foreground hover:text-foreground">Changelog</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Amplifyd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
