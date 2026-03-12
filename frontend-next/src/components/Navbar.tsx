'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Menu, X, Sun, Moon,
  Brain, Bot, Layers, Microscope, BarChart3, FolderOpen,
  Home, LayoutDashboard, Info, ChevronDown, LogOut, User, UserRound,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface NavbarProps {
  brandOnly?: boolean;
}

const features = [
  { icon: Brain,       label: 'Quiz',                  href: '/quiz/create' },
  { icon: Bot,         label: 'AI Tutor',               href: '/ai-tutor' },
  { icon: Layers,      label: 'Flashcards',             href: '/flashcards' },
  { icon: Microscope,  label: 'Exam Analysis',          href: '/ai-tutor' },
  { icon: BarChart3,   label: 'Performance Analytics',  href: '/dashboard' },
  { icon: FolderOpen,  label: 'Exam Materials',         href: '/materials' },
];

const Navbar = ({ brandOnly = false }: NavbarProps) => {
  const pathname   = usePathname();
  const router     = useRouter();
  const isHome     = pathname === '/';
  const { isAuthenticated, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled,    setIsScrolled]    = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [featuresOpen,  setFeaturesOpen]  = useState(false);

  const profileImageUrl = user?.profile_image || null;

  useEffect(() => {
    if (!isHome) { setIsScrolled(true); return; }
    setIsScrolled(window.scrollY > 60);
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const close = () => { setMobileOpen(false); setFeaturesOpen(false); };

  const handleLogout = async () => {
    await logout();
    close();
    router.push('/');
  };

  const scrollTop = (e: React.MouseEvent) => {
    if (isHome) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };
  const scrolledHeaderClass = 'bg-background';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? scrolledHeaderClass
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between relative">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group z-10" onClick={scrollTop}>
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md group-hover:glow-blue transition-all duration-300 shrink-0">
              <Image src="/lamla_logo.png" alt="Lamla AI" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-bold gradient-text">Lamla.ai</span>
          </Link>

          {!brandOnly && (
            <>
              {/* Center nav — desktop */}
              <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2">
                <NavigationMenu viewport={false}>
                  <NavigationMenuList className="gap-0">
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link href="/" onClick={scrollTop}
                          className={cn('inline-flex h-9 items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                            pathname === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-border/40')}
                        >Home</Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <NavigationMenuTrigger className={cn('h-9 px-3 py-1.5 text-sm font-medium rounded-md bg-transparent transition-colors',
                        'text-muted-foreground hover:text-foreground hover:bg-border/40 data-open:text-primary')}>
                        Features
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="glass rounded-xl border border-border/60 shadow-xl p-2 w-56">
                        <div className="flex flex-col gap-0.5">
                          {features.map(({ label, href, icon: Icon }) => (
                            <NavigationMenuLink key={label} asChild>
                              <Link href={href}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-border/40 transition-colors">
                                <Icon size={14} className="text-primary shrink-0" />
                                {label}
                              </Link>
                            </NavigationMenuLink>
                          ))}
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link href="/dashboard"
                          className={cn('inline-flex h-9 items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                            pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-border/40')}>
                          Dashboard
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link href="/about"
                          className={cn('inline-flex h-9 items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                            pathname === '/about' ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-border/40')}>
                          About us
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </nav>

              {/* Right actions */}
              <div className="flex items-center gap-2 z-10">
                {/* Desktop auth */}
                <div className="hidden md:flex items-center gap-2">
                  {isAuthenticated ? (
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 transition-all duration-200" aria-label="Profile menu">
                          {profileImageUrl ? (
                            <Image src={profileImageUrl} alt="Profile" width={32} height={32}
                              className="rounded-full object-cover ring-2 ring-border hover:ring-primary transition-all duration-200" />
                          ) : (
                            <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-sm font-bold text-white hover:glow-blue-sm transition-all duration-200">
                              {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 mt-1">
                        <DropdownMenuLabel className="flex flex-col gap-0.5 pb-2">
                          <span className="text-sm font-semibold text-foreground truncate">{user?.username || 'User'}</span>
                          <span className="text-xs font-normal text-muted-foreground truncate">{user?.email}</span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary cursor-pointer">
                          <Link href="/profile" className="flex items-center gap-2">
                            <UserRound size={14} />
                            Edit Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={toggleTheme}
                          className="flex items-center gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
                        >
                          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleLogout}
                          className="flex items-center gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                        >
                          <LogOut size={14} />
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Link href="/auth/login"
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-border/40">
                        Sign In
                      </Link>
                      <Link href="/auth/signup"
                        className="text-sm font-semibold gradient-bg text-white px-4 py-1.5 rounded-md hover:opacity-90 transition-opacity glow-blue-sm">
                        Get Started
                      </Link>
                    </>
                  )}
                </div>

                {/* Mobile hamburger */}
                <button
                  onClick={() => setMobileOpen(true)}
                  className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-border/40 transition-colors"
                  aria-label="Open menu"
                >
                  <Menu size={20} />
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Spacer */}
      <div className="h-16" />

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              className="fixed top-0 right-0 bottom-0 z-[70] w-[300px] bg-background border-l border-border flex flex-col md:hidden shadow-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
                <Link href="/" className="flex items-center gap-2" onClick={close}>
                  <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
                    <Image src="/lamla_logo.png" alt="Lamla AI" width={28} height={28} className="w-full h-full object-cover" />
                  </div>
                  <span className="font-bold gradient-text">Lamla.ai</span>
                </Link>
                <button onClick={close}
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-border/40 transition-colors"
                  aria-label="Close menu">
                  <X size={18} />
                </button>
              </div>

              {/* Drawer body — scrollable */}
              <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-1">

                {/* Main links */}
                <Link href="/" onClick={(e) => { scrollTop(e); close(); }}
                  className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    pathname === '/' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-surface-hover')}>
                  <Home size={16} className="shrink-0" /> Home
                </Link>

                <Link href="/dashboard" onClick={close}
                  className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    pathname === '/dashboard' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-surface-hover')}>
                  <LayoutDashboard size={16} className="shrink-0" /> Dashboard
                </Link>

                <Link href="/about" onClick={close}
                  className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    pathname === '/about' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-surface-hover')}>
                  <Info size={16} className="shrink-0" /> About Us
                </Link>

                {/* Features accordion */}
                <div>
                  <button
                    onClick={() => setFeaturesOpen((o) => !o)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-surface-hover transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <Brain size={16} className="shrink-0 text-primary" /> Features
                    </span>
                    <motion.span animate={{ rotate: featuresOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={15} className="text-muted-foreground" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {featuresOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="pl-4 pr-1 pb-1 flex flex-col gap-0.5 mt-0.5">
                          {features.map(({ icon: Icon, label, href }) => (
                            <Link key={label} href={href} onClick={close}
                              className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                                pathname === href ? 'text-primary bg-primary/8' : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover')}>
                              <Icon size={14} className="shrink-0 text-primary" />
                              {label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

              {/* ── Drawer bottom — profile / auth + theme ── */}
              <div className="border-t border-border shrink-0">
                {isAuthenticated ? (
                  <>
                    {/* User profile row */}
                    <Link href="/profile" onClick={close}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-hover transition-colors">
                      {profileImageUrl ? (
                        <Image src={profileImageUrl} alt="Profile" width={38} height={38}
                          className="rounded-full object-cover ring-2 ring-border shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-sm font-bold text-white shrink-0">
                          {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{user?.username || 'User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      <User size={14} className="text-muted-foreground shrink-0" />
                    </Link>

                    {/* Theme + Logout row */}
                    <div className="flex items-center border-t border-border">
                      <button onClick={toggleTheme}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors">
                        {theme === 'dark' ? <Sun size={15} className="shrink-0" /> : <Moon size={15} className="shrink-0" />}
                        {theme === 'dark' ? 'Light' : 'Dark'}
                      </button>
                      <div className="w-px h-8 bg-border" />
                      <button onClick={handleLogout}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
                        <LogOut size={15} className="shrink-0" /> Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="px-4 pt-4 pb-3 flex flex-col gap-2">
                    <Link href="/auth/login" onClick={close}
                      className="flex items-center justify-center px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-surface-hover transition-colors">
                      Sign In
                    </Link>
                    <Link href="/auth/signup" onClick={close}
                      className="flex items-center justify-center px-4 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-opacity glow-blue-sm">
                      Get Started Free
                    </Link>
                    <div className="h-px bg-border mt-1" />
                    <button onClick={toggleTheme}
                      className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors">
                      {theme === 'dark' ? <Sun size={15} className="shrink-0" /> : <Moon size={15} className="shrink-0" />}
                      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
