'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Briefcase,
  Building2,
  LineChart,
  Settings,
  Search,
  Sparkles,
  FolderOpen,
  Users,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const mainNav = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Ask AI',
    href: '/chat',
    icon: MessageSquare,
  },
  {
    title: 'Search',
    href: '/search',
    icon: Search,
  },
];

const knowledgeNav = [
  {
    title: 'Knowledge Base',
    href: '/knowledge',
    icon: FileText,
  },
  {
    title: 'Collections',
    href: '/knowledge/collections',
    icon: FolderOpen,
  },
];

const investmentNav = [
  {
    title: 'Deal Flow',
    href: '/deals',
    icon: Briefcase,
  },
  {
    title: 'Portfolio',
    href: '/portfolio',
    icon: Building2,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: LineChart,
  },
];

const settingsNav = [
  {
    title: 'Team',
    href: '/settings/team',
    icon: Users,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">AlphaIntel</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start',
                      isActive && 'bg-primary/10 text-primary'
                    )}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.title}
                  </Button>
                </Link>
              );
            })}
          </div>

          <Separator />

          {/* Knowledge Base */}
          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
              Knowledge
            </p>
            <div className="space-y-1">
              {knowledgeNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start',
                        isActive && 'bg-primary/10 text-primary'
                      )}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.title}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Investment */}
          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
              Investments
            </p>
            <div className="space-y-1">
              {investmentNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start',
                        isActive && 'bg-primary/10 text-primary'
                      )}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.title}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Settings */}
          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
              Settings
            </p>
            <div className="space-y-1">
              {settingsNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start',
                        isActive && 'bg-primary/10 text-primary'
                      )}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.title}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Usage Stats */}
      <div className="border-t p-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">AI Queries</span>
            <span className="font-medium">234 / 1000</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div className="h-1.5 w-[23.4%] rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
