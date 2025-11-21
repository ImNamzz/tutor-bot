"use client";

import { usePathname } from "next/navigation";
import Topbar from "./components/Topbar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showTopbar = !pathname.startsWith("/tutor");

  return (
    <>
      {showTopbar && (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 dark:bg-card/80 backdrop-blur-sm border-b border-border dark:border-border">
          <Topbar />
        </nav>
      )}
      {children}
    </>
  );
}
