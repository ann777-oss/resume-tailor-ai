'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, User, FileText, CirclePlus as PlusCircle, History, LogOut, Sparkles, ChevronRight, Kanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { href: '/profile', label: '职业档案', icon: User },
  { href: '/jobs/new', label: '新建求职', icon: PlusCircle },
  { href: '/resumes/board', label: '简历看板', icon: Kanban },
  { href: '/resumes', label: '简历历史', icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <aside data-tour="sidebar" className="w-64 h-screen flex flex-col bg-white border-r border-gray-100 sticky top-0">
      <div className="p-6 border-b border-gray-100">
        <Link href="/dashboard" data-tour="app-logo" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900 text-sm leading-none block">ResumeTailor</span>
            <span className="text-[10px] font-medium text-blue-600 tracking-wide uppercase">AI</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/resumes' && pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={
                item.href === '/profile'
                  ? 'nav-profile'
                  : item.href === '/jobs/new'
                    ? 'nav-new-job'
                    : item.href === '/resumes'
                      ? 'nav-resumes'
                      : undefined
              }
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600')} />
              {item.label}
              {isActive && <ChevronRight className="w-3 h-3 ml-auto text-blue-400" />}
            </Link>
          );
        })}
      </nav>

      <div data-tour="account-panel" className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-blue-700">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">
              {user?.user_metadata?.full_name ?? '用户'}
            </p>
            <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start gap-2 text-gray-500 hover:text-red-600 hover:bg-red-50 text-xs px-3"
        >
          <LogOut className="w-3.5 h-3.5" />
          退出登录
        </Button>
      </div>
    </aside>
  );
}
