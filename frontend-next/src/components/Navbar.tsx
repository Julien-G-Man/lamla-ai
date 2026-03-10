'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, Sparkles, Sun, Moon, Brain, Bot, Layers, Microscope, BarChart3, FolderOpen } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface NavbarProps {
  brandOnly?: boolean;
}

const features = [
  { icon: Brain, label: 'Quiz', href: '/quiz/create' },
  { icon: Bot, label: 'AI Tutor', href: '/ai-tutor' },
  { icon: Layers, label: 'Flashcards', href: '/flashcards' },
  { icon: Microscope, label: 'Exam Analysis', href: '/ai-tutor' },
  { icon: BarChart3, label: 'Performance Analytics', href: '/dashboard' },
  { icon: FolderOpen, label: 'Exam Materials', href: '/materials' },
];

const Navbar = ({ brandOnly = false }: NavbarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';
  const { isAuthenticated, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);

  const profileImageUrl = user?.profile_image || null;

  useEffect(() => {
    if (!isHome) {
      setIsScrolled(true);
      return;
    }
    setIsScrolled(window.scrollY > 60);
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const scrollTop = (e: React.MouseEvent) => {
    if (isHome) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-background/80 backdrop-blur-md border-b border-border/60 shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between relative">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2 group z-10" onClick={scrollTop}>
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center shadow-md group-hover:glow-blue transition-all duration-300">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">Lamla.ai</span>
          </Link>

          {!brandOnly && (
            <>
              {/* Center: Nav links — desktop only */}
              <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2">
                <NavigationMenu viewport={false}>
                  <NavigationMenuList className="gap-0">
                    {/* Home */}
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/"
                          onClick={scrollTop}
                          className={cn(
                            'inline-flex h-9 items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                            pathname === '/'
                              ? 'text-primary'
                              : 'text-muted-foreground hover:text-foreground hover:bg-border/40'
                          )}
                        >
                          Home
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>

                    {/* Features dropdown */}
                    <NavigationMenuItem>
                      <NavigationMenuTrigger
                        className={cn(
                          'h-9 px-3 py-1.5 text-sm font-medium rounded-md bg-transparent transition-colors',
                          'text-muted-foreground hover:text-foreground hover:bg-border/40',
                          'data-open:text-primary'
                        )}
                      >
                        Features
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="glass rounded-xl border border-border/60 shadow-xl p-2 w-56">
                        <div className="flex flex-col gap-0.5">
                          {features.map(({ label, href }) => (
                            <NavigationMenuLink key={label} asChild>
                              <Link
                                href={href}
                                className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-border/40 transition-colors whitespace-nowrap"
                              >
                                {label}
                              </Link>
                            </NavigationMenuLink>
                          ))}
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* Dashboard */}
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/dashboard"
                          className={cn(
                            'inline-flex h-9 items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                            pathname === '/dashboard'
                              ? 'text-primary'
                              : 'text-muted-foreground hover:text-foreground hover:bg-border/40'
                          )}
                        >
                          Dashboard
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>

                    {/* About us */}
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/about"
                          className={cn(
                            'inline-flex h-9 items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                            pathname === '/about'
                              ? 'text-primary'
                              : 'text-muted-foreground hover:text-foreground hover:bg-border/40'
                          )}
                        >
                          About us
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </nav>

              {/* Right: always-visible theme toggle + desktop auth + mobile dropdown */}
              <div className="flex items-center gap-2 z-10">
                {/* Theme toggle — all screens */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-border/40 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                </button>

                {/* Desktop auth buttons */}
                <div className="hidden md:flex items-center gap-2">
                  {isAuthenticated ? (
                    <>
                      <Link href="/profile">
                        {profileImageUrl ? (
                          <Image
                            src={profileImageUrl}
                            alt="Profile"
                            width={32}
                            height={32}
                            className="rounded-full object-cover ring-2 ring-border hover:ring-primary transition-all duration-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-sm font-bold text-white hover:glow-blue-sm transition-all duration-200">
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-border/40"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/login"
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-border/40"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/signup"
                        className="text-sm font-semibold gradient-bg text-white px-4 py-1.5 rounded-md hover:opacity-90 transition-opacity glow-blue-sm"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>

                {/* Mobile / tablet: hamburger dropdown */}
                <div className="md:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-border/40 transition-colors"
                        aria-label="Toggle navigation"
                      >
                        <Menu size={20} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 bg-popover border-border shadow-lg text-foreground **:data-[slot=dropdown-menu-item]:text-muted-foreground **:data-[slot=dropdown-menu-item]:focus:bg-primary/10 **:data-[slot=dropdown-menu-item]:focus:text-primary **:data-[slot=dropdown-menu-sub-trigger]:text-muted-foreground **:data-[slot=dropdown-menu-sub-trigger]:focus:bg-primary/10 **:data-[slot=dropdown-menu-sub-trigger]:focus:text-primary **:data-[slot=dropdown-menu-sub-trigger]:data-open:bg-primary/10 **:data-[slot=dropdown-menu-sub-trigger]:data-open:text-primary"
                    >
                      {/* Nav links */}
                      <DropdownMenuItem asChild>
                        <Link href="/" onClick={scrollTop} className="cursor-pointer transition-colors duration-150">
                          Home
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="transition-colors duration-150">Features</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="bg-popover border-border shadow-lg w-52 text-foreground **:data-[slot=dropdown-menu-item]:text-muted-foreground **:data-[slot=dropdown-menu-item]:focus:bg-primary/10 **:data-[slot=dropdown-menu-item]:focus:text-primary">
                          {features.map(({ label, href }) => (
                            <DropdownMenuItem key={label} asChild>
                              <Link href={href} className="cursor-pointer transition-colors duration-150">
                                {label}
                              </Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer transition-colors duration-150">
                          Dashboard
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link href="/about" className="cursor-pointer transition-colors duration-150">
                          About us
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {/* Auth */}
                      {isAuthenticated ? (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/profile" className="cursor-pointer transition-colors duration-150">
                              Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={handleLogout}
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer transition-colors duration-150"
                          >
                            Logout
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/auth/login" className="cursor-pointer transition-colors duration-150">
                              Sign In
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/auth/signup" className="cursor-pointer font-semibold text-primary focus:text-primary transition-colors duration-150">
                              Get Started
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
};

export default Navbar;
