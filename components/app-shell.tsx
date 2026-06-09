import { MobileNav } from "./mobile-nav";

export function AppShell({
  children,
  showNav = true,
}: {
  children: React.ReactNode;
  showNav?: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div
        className={
          showNav
            ? "flex-1 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] sm:pb-0"
            : "flex-1"
        }
      >
        {children}
      </div>
      {showNav && <MobileNav />}
    </div>
  );
}
