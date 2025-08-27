
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
import { getCurrentUserInfo } from '@/lib/firebase/users';
import type { User as AppUser } from '@/lib/types';

const reviewerNavItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/reviewer', label: 'Reviewer Dashboard', icon: Star },
  { href: '/dashboard/submissions', label: 'Submissions', icon: Music },
  { href: '/dashboard/reviews', label: 'My Reviews', icon: Star },
  { href: '/dashboard/referrals', label: 'Referrals', icon: Users },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

const artistNavItems = [
  { href: '/artist-dashboard', label: 'My Submissions', icon: Music },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

const NavContent = ({ user, pathname, userRole }: { user: AppUser, pathname: string, userRole: string | null }) => {
  const currentNavItems = userRole === 'artist' ? artistNavItems : reviewerNavItems;

  return (
    <>
      <div className="flex h-16 items-center border-b px-6 lg:h-20">
          <Logo />
      </div>
      <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
              {currentNavItems.map((item) => (
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
                    <AvatarImage src={user?.avatarUrl || "/USETHIS.png"} alt="User" data-ai-hint="woman portrait" />
                    <AvatarFallback>{user?.name?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className='text-sm font-semibold'>{user?.name || 'Reviewer'}</p>
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
};


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
  const [userInfo, setUserInfo] = useState<AppUser | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userInfo = await getCurrentUserInfo();
        if (userInfo) {
          setUserInfo(userInfo);
          setUserRole(userInfo.role);
          if (userInfo.role === 'admin') {
            router.push('/admin');
          } else if (userInfo.role === 'uploader') {
            router.push('/artist-dashboard');
          } else if (userInfo.role === 'reviewer') {
            // Reviewers stay on the dashboard
          } else {
            // Unknown role, redirect to apply
            router.push('/apply');
          }
          setRoleLoading(false);
        } else {
          // User exists in Auth but not in Firestore, redirect to apply
          console.warn(`User ${user.uid} not found in database. Redirecting to apply.`);
          router.push('/apply');
          setRoleLoading(false);
        }
      } else {
        router.push('/login');
        setRoleLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading || roleLoading || !userInfo) {
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

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-background lg:block">
        <div className="flex h-full max-h-screen flex-col gap-2 fixed w-[280px]">
          <NavContent user={userInfo} pathname={pathname} userRole={userRole} />
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
               <NavContent user={userInfo} pathname={pathname} userRole={userRole} />
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
