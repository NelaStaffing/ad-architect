import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Layers, LayoutGrid, Plus, LogOut, User, Users, LayoutDashboard, Shield } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut, isManager, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="h-full max-w-screen-2xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/ads" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground hidden sm:block">Print Ad Generator</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button
                variant={location.pathname === '/dashboard' ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
            {isManager && (
              <Link to="/manager">
                <Button
                  variant={location.pathname === '/manager' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Team</span>
                </Button>
              </Link>
            )}
            <Link to="/ads">
              <Button
                variant={location.pathname === '/ads' ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Ads</span>
              </Button>
            </Link>
            <Link to="/clients">
              <Button
                variant={location.pathname.startsWith('/clients') ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Clients</span>
              </Button>
            </Link>
            <Link to="/ads/new">
              <Button
                variant={location.pathname === '/ads/new' ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Ad</span>
              </Button>
            </Link>
          </nav>

          {/* Notifications & User menu */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-3 h-3 text-primary" />
                </div>
                <span className="hidden sm:inline text-sm text-muted-foreground truncate max-w-[120px]">
                  {user?.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                {user?.email}
              </DropdownMenuItem>
              {role !== 'user' && (
                <DropdownMenuItem disabled className="text-xs">
                  <Shield className="w-3 h-3 mr-2" />
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
