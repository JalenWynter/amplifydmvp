
'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client'; // Import auth and db
import {
  Home,
  Users,
  CheckSquare,
  KeyRound,
  Shield,
  FileCode,
  Wrench,
  DollarSign,
  LogOut,
  Settings,
  PanelLeft,
} from 'lucide-react';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subpath?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const adminNavGroups: NavGroup[] = [
  {
    title: 'Platform',
    items: [
      { href: '/admin', label: 'Dashboard', icon: Home },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/applications', label: 'Applications', icon: CheckSquare },
      { href: '/admin/submissions', label: 'Submissions', icon: FileCode },
    ],
  },
  {
    title: 'Business',
    items: [
      {
        href: '/admin/financials',
        label: 'Financials',
        icon: DollarSign,
        subpath: '/payouts|/transactions'
      },
      {
        href: '/admin/referrals',
        label: 'Referrals',
        icon: KeyRound,
        subpath: '/generate'
      },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings },
      { href: '/admin/security', label: 'Security', icon: Shield },
      { href: '/admin/api-logs', label: 'API Logs', icon: FileCode },
      { href: '/dev-setup', label: 'Dev Tools', icon: Wrench },
    ],
  },
];

const isActive = (pathname: string, href: string, subpath?: string) => {
    if (href === '/admin' && pathname === href) return true;
    if (href !== '/admin' && pathname.startsWith(href)) return true;
    if (subpath) {
        const subpaths = subpath.split('|');
        return subpaths.some(path => pathname.startsWith(`${href}${path}`));
    }
    return false;
}

const NavContent = ({ pathname }: { pathname: string }) => (
    <>
        <div className="flex h-16 items-center border-b px-6">
          <Logo />
        </div>
        <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
            {adminNavGroups.map((group) => (
                <div key={group.title} className="py-2">
                    <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">{group.title}</h2>
                    <div className="space-y-1">
                    {group.items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                                isActive(pathname, item.href, item.subpath) && 'bg-muted text-primary'
                            )}
                            >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                    </div>
                </div>
            ))}
            </nav>
        </div>
        <div className="mt-auto border-t p-4">
            <div className='flex items-center gap-3 mb-4'>
                    <Avatar className="h-9 w-9">
                    <AvatarImage src="https://placehold.co/40x40.png" alt="Admin User" data-ai-hint="man portrait" />
                    <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <div>
                    <p className='text-sm font-semibold'>Admin User</p>
                    <p className='text-xs text-muted-foreground'>jwynterthomas@gmail.com</p>
                </div>
            </div>
            <Button variant="ghost" className="w-full justify-start">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
        </div>
    </>
);


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                // No user is signed in, redirect to login
                router.push('/login');
                return;
            }

            // User is signed in, check their role
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                if (userData?.role === 'admin') {
                    setLoading(false); // User is an admin, allow access
                } else {
                    // User is not an admin, redirect to dashboard or unauthorized page
                    router.push('/dashboard'); // Or a specific unauthorized page
                }
            } else {
                // User document not found, redirect (shouldn't happen if user creation is robust)
                router.push('/login');
            }
        });

        return () => unsubscribe(); // Cleanup subscription
    }, [router]);

    if (loading) {
        // You can render a loading spinner or a blank page here
        return <div className="flex items-center justify-center min-h-screen">Loading admin panel...</div>;
    }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/40 lg:block">
            <div className="flex h-full max-h-screen flex-col gap-2 fixed w-[280px]">
                <NavContent pathname={pathname} />
            </div>
        </div>
        <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 lg:h-[60px]">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                            <PanelLeft className="h-5 w-5" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="flex flex-col p-0">
                        <NavContent pathname={pathname} />
                    </SheetContent>
                </Sheet>
                <div className="flex-1">
                    <h1 className="text-xl font-semibold">Admin Panel</h1>
                </div>
            </header>
            <main className="flex-1 p-6">{children}</main>
        </div>
    </div>
  );
}
