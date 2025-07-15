'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/features', label: 'Reviewers' },
];

// In a real app, you'd get this from an auth context
const useAuth = () => ({
  user: null, // or { role: 'reviewer' }
  loading: false,
});


export default function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  return (
    <header className="bg-card/80 backdrop-blur-lg border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
            <nav className="hidden md:flex items-center space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    pathname.startsWith(link.href) ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
             {loading ? (
                <div className="w-24 h-8 bg-muted rounded-md animate-pulse" />
              ) : user ? (
                <>
                  <Button asChild variant="ghost">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button>Log Out</Button>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/apply">Apply to Review</Link>
                  </Button>
                </>
              )}
          </div>
        </div>
      </div>
    </header>
  );
}
