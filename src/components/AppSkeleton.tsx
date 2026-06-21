import { useLocation } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { BottomNav, type TabType } from './BottomNav';

/**
 * Skeleton / placeholder loading screens.
 *
 * Shimmer placeholders stand in only for data that is still being fetched
 * (group name, balances, expense rows). The static app chrome — logo/header
 * and bottom nav — does not depend on Firestore, so the real components are
 * rendered immediately; only the data regions shimmer.
 * The variant is picked from the current route so the placeholder matches what
 * is about to render (group list, dashboard, expenses, settlements, members).
 */

/** Single shimmering placeholder block. */
function Box({ className = '' }: { className?: string }) {
  return <div className={`skeleton-box ${className}`} aria-hidden="true" />;
}

/** A tactile card matching the app's bordered/offset-shadow card style. */
function Card({ children, className = '', delay = 0 }: { children?: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div
      className={`stagger-item bg-white rounded-[24px] border-3 border-main-text p-5 shadow-[4px_4px_0px_#1A1A2E] ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** A generic list row placeholder (label + trailing amount pill). */
function RowSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="stagger-item flex items-center justify-between p-3.5 border-2 border-main-text rounded-xl"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex flex-col gap-1.5 min-w-0 flex-1 pr-3">
        <Box className="h-4 w-2/3 rounded-md" />
        <Box className="h-2.5 w-1/3 rounded-md" />
      </div>
      <Box className="h-7 w-16 rounded-lg" />
    </div>
  );
}

/** Card header: little accent tick + a title bar. */
function CardHeading() {
  return (
    <div className="flex items-center gap-1.5 border-b-2 border-dashed border-main-text/10 pb-2.5 mb-4">
      <span className="w-1.5 h-3 bg-accent-orange/40 rotate-[15deg] rounded-sm" />
      <Box className="h-3.5 w-32 rounded-md" />
    </div>
  );
}

/** "My Groups" selection page skeleton. */
function GroupSelectionSkeleton() {
  return (
    <main className="w-full max-w-md mx-auto p-5 py-6 space-y-6 flex-1 flex flex-col">
      <div className="stagger-item flex flex-col items-center gap-2 py-2" style={{ animationDelay: '0ms' }}>
        <Box className="h-7 w-40 rounded-lg" />
        <Box className="h-3.5 w-56 rounded-md" />
      </div>

      <Card delay={60}>
        <CardHeading />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <RowSkeleton key={i} delay={120 + i * 60} />
          ))}
        </div>
      </Card>

      <Card delay={180} className="space-y-6">
        <div className="space-y-2.5">
          <Box className="h-3.5 w-28 rounded-md" />
          <Box className="h-12 w-full rounded-xl" />
          <Box className="h-12 w-full rounded-xl" />
        </div>
        <div className="space-y-2.5">
          <Box className="h-3.5 w-28 rounded-md" />
          <Box className="h-12 w-full rounded-xl" />
          <Box className="h-12 w-full rounded-xl" />
        </div>
      </Card>
    </main>
  );
}

/** Dashboard skeleton: title card, stat grid, actions, breakdown, recent. */
function DashboardSkeleton() {
  return (
    <main className="w-full mx-auto px-5 py-6 space-y-6 flex-1">
      {/* Group title + share */}
      <Card delay={0} className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Box className="h-7 w-2/3 rounded-lg" />
          <Box className="h-3 w-1/3 rounded-md" />
        </div>
        <Box className="h-10 w-20 rounded-xl" />
      </Card>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-4 stagger-item" style={{ animationDelay: '60ms' }}>
        {[0, 1].map((i) => (
          <div key={i} className="bg-white rounded-[20px] border-3 border-main-text p-4.5 shadow-[3px_3px_0px_#1A1A2E] space-y-3">
            <Box className="h-3 w-20 rounded-md" />
            <Box className="h-7 w-24 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <Card delay={120} className="space-y-3.5">
        <Box className="h-3 w-28 rounded-md" />
        <div className="grid grid-cols-2 gap-3">
          <Box className="h-11 rounded-xl" />
          <Box className="h-11 rounded-xl" />
        </div>
      </Card>

      {/* Member contribution breakdown */}
      <Card delay={180}>
        <CardHeading />
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <RowSkeleton key={i} delay={240 + i * 60} />
          ))}
        </div>
      </Card>

      {/* Recent expenses */}
      <Card delay={240}>
        <CardHeading />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <RowSkeleton key={i} delay={300 + i * 60} />
          ))}
        </div>
      </Card>
    </main>
  );
}

/** Generic in-group page (expenses / settlements / members) skeleton. */
function GroupContentSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <main className="w-full mx-auto px-5 py-6 space-y-6 flex-1">
      <Card delay={0} className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Box className="h-7 w-2/3 rounded-lg" />
          <Box className="h-3 w-1/3 rounded-md" />
        </div>
        <Box className="h-10 w-20 rounded-xl" />
      </Card>

      <Card delay={60}>
        <CardHeading />
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <RowSkeleton key={i} delay={120 + i * 60} />
          ))}
        </div>
      </Card>
    </main>
  );
}

function tabFromPath(pathname: string): TabType {
  if (/\/settlements\/?$/.test(pathname)) return 'settlements';
  if (/\/expenses\/?$/.test(pathname)) return 'expenses';
  if (/\/members\/?$/.test(pathname)) return 'members';
  return 'dashboard';
}

export function AppSkeleton() {
  const { pathname } = useLocation();

  // Group selection ("My Groups") — no bottom nav.
  const isGroupSelection = pathname === '/' || pathname === '';
  // Dashboard is /group/:id with no trailing segment.
  const isDashboard = /^\/group\/[^/]+\/?$/.test(pathname);
  const groupId = pathname.match(/^\/group\/([^/]+)/)?.[1];

  let content: React.ReactNode;
  if (isGroupSelection) {
    content = <GroupSelectionSkeleton />;
  } else if (isDashboard) {
    content = <DashboardSkeleton />;
  } else {
    content = <GroupContentSkeleton />;
  }

  return (
    <div
      className={`min-h-screen bg-page-bg text-main-text font-plus-jakarta flex flex-col ${isGroupSelection ? 'pb-10' : 'pb-28'}`}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading…</span>

      {/* Static chrome renders for real — it doesn't depend on fetched data. */}
      <AppHeader showProfile showGroups={!isGroupSelection} />

      {content}

      {/* Real bottom nav; add is inert until data finishes loading. */}
      {!isGroupSelection && (
        <BottomNav activeTab={tabFromPath(pathname)} groupId={groupId} onAddClick={() => {}} />
      )}
    </div>
  );
}
