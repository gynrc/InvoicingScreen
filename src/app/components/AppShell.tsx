"use client";

import React from "react";
import styles from "../styles/MaintainCustomers.module.css";
import NavigationSidebar from "./NavigationSidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell(props: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <NavigationSidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((prev) => !prev)}
        />
        <main className={styles.main}>{props.children}</main>
      </div>
    </div>
  );
}
