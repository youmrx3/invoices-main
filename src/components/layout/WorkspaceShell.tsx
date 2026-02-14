import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface WorkspaceShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const links = [
  { to: '/', label: 'Workspace', icon: Home },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/settings', label: 'Paper Settings', icon: Settings },
];

const WorkspaceShell = ({ title, subtitle, children, actions }: WorkspaceShellProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/85 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg lg:text-xl font-semibold truncate">{title}</h1>
            {subtitle ? <p className="text-xs lg:text-sm text-muted-foreground truncate">{subtitle}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap items-center gap-1 rounded-xl border bg-background/70 p-1">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink key={link.to} to={link.to} end={link.to === '/'}>
                    {({ isActive }) => (
                      <Button
                        type="button"
                        variant={isActive ? 'default' : 'ghost'}
                        size="sm"
                        className={cn('gap-2 rounded-lg', !isActive && 'text-muted-foreground')}
                      >
                        <Icon className="w-4 h-4" />
                        {link.label}
                      </Button>
                    )}
                  </NavLink>
                );
              })}
            </nav>
            {actions}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
};

export default WorkspaceShell;
