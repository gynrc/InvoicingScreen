"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "../styles/MaintainCustomers.module.css";
import { GoSidebarCollapse } from "react-icons/go";

const NAV_ITEMS = [
  { label: "Customer List", href: "/customers", shortLabel: "CL" },
  { label: "Sales Invoice List", href: "/sales/invoices", shortLabel: "IL" },
  { label: "Sales/Invoicing", href: "/sales/invoicing", shortLabel: "SI" },
  { label: "Maintain Customers", href: "/maintain-customers", shortLabel: "MC" },
] as const;

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

type NavigationSidebarProps = { collapsed: boolean; onToggleCollapsed: () => void };

export default function NavigationSidebar(props: NavigationSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<null | { uid: number; username: string; role: string }>(null);

  React.useEffect(() => {
    let ignore = false;

    async function loadSession() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (!res.ok) {
          if (!ignore) setUser(null);
          return;
        }
        const data = await res.json();
        if (!ignore) setUser(data.user ?? null);
      } catch {
        if (!ignore) setUser(null);
      }
    }

    void loadSession();
    return () => {
      ignore = true;
    };
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className={cx(styles.sidebar, props.collapsed && styles.sidebarCollapsed)}>
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarBrand}>
          {!props.collapsed && (
            <div>
              <div className={styles.sidebarKicker}>Workspace</div>
              <div className={styles.sidebarTitle}>Invoicing Suite</div>
            </div>
          )}
        </div>
        <button className={styles.sidebarCollapse} type="button" title="Toggle sidebar" onClick={props.onToggleCollapsed}>
          <GoSidebarCollapse />
        </button>
      </div>

      {!props.collapsed && <div className={styles.navSectionLabel}>Navigation</div>}
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(styles.navItem, active && styles.navItemActive)}
              title={props.collapsed ? item.label : undefined}
            >
              {props.collapsed ? (
                <span className={styles.navItemShort}>{item.shortLabel}</span>
              ) : (
                <span className={styles.navItemLabel}>{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {!props.collapsed && user && (
        <div className={styles.sidebarUserCard}>
          <div className={styles.sidebarUserEyebrow}>Signed In</div>
          <div className={styles.sidebarUserName}>{user.username}</div>
          <div className={styles.sidebarUserRole}>{user.role || `User #${user.uid}`}</div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className={styles.sidebarUserButton}
          >
            Log Out
          </button>
        </div>
      )}
    </aside>
  );
}
