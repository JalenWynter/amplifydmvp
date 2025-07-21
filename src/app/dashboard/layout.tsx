
'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Music, Star, User, Settings, LogOut, Loader2, PanelLeft, Users } from 'lucide-react';
import Logo from '@/components/logo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/client';
import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { ensureUserProfileExists } from '@/lib/firebase/services';

const sidebarNavItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/submissions', label: 'Submissions', icon: Music },
  { href: '/dashboard/reviews', label: 'My Reviews', icon: Star },
  { href: '/dashboard/referrals', label: 'Referrals', icon: Users },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

const NavContent = ({ user, pathname }: { user: User, pathname: string }) => (
    <>
      <div className="flex h-16 items-center border-b px-6 lg:h-20">
          <Logo />
      </div>
      <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
              {sidebarNavItems.map((item) => (
                  <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                      pathname === item.href && 'bg-muted text-primary'
                  )}
                  >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  </Link>
              ))}
          </nav>
      </div>
       <div className="mt-auto border-t p-4">
            <div className='flex items-center gap-3 mb-4'>
                <Avatar>
                    <AvatarImage src={user.photoURL || "https://placehold.co/40x40.png"} alt="User" data-ai-hint="woman portrait" />
                    <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className='text-sm font-semibold'>{user.displayName || 'Reviewer'}</p>
                    <p className='text-xs text-muted-foreground'>{user.email}</p>
                </div>
            </div>
             <div className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start text-muted-foreground hover:text-primary">
                    <Link href="/dashboard/profile">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Link>
                </Button>
                 <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-primary" onClick={() => auth.signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    </>
);


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await ensureUserProfileExists(user);
        setUserRole('Reviewer'); // Assume reviewer role after ensuring profile exists
        setRoleLoading(false);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !user) {
    return (
       <div className="flex items-center justify-center min-h-screen">
        <p>Redirecting to login...</p>
      </div>
    )
  }

  // Show access denied for non-reviewers (but be more permissive in development)
  if (userRole !== 'Reviewer' && userRole !== null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            The reviewer dashboard is only accessible to approved reviewers.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Your role: {userRole || 'Not found'}
          </p>
          <Button asChild>
            <Link href="/apply">Apply to Become a Reviewer</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-background lg:block">
        <div className="flex h-full max-h-screen flex-col gap-2 fixed w-[280px]">
          <NavContent user={user} pathname={pathname} />
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-6 lg:h-20">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
               <NavContent user={user} pathname={pathname} />
            </SheetContent>
          </Sheet>
           <div className="flex-1">
             <h1 className="text-xl font-semibold">Reviewer Dashboard</h1>
           </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
