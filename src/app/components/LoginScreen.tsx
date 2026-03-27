"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import isLogo from "../../../screens/is-logo.png";
import styles from "../styles/MaintainCustomers.module.css";

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Login failed.");

      router.push("/maintain-customers");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px",
        background:
          "radial-gradient(circle at 18% 30%, rgba(37,99,235,0.78), rgba(37,99,235,0) 26%), radial-gradient(circle at 78% 74%, rgba(37,99,235,0.36), rgba(37,99,235,0) 24%), linear-gradient(135deg, #7aa4d0 0%, #8bb0d8 32%, #92b7de 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <section
        className={styles.card}
        style={{
          width: "100%",
          maxWidth: "380px",
          margin: "0 auto",
          padding: "40px 30px 30px",
          textAlign: "left",
          borderRadius: "34px",
          boxShadow: "0 28px 70px rgba(30,64,175,0.28)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
          <Image src={isLogo} alt="Invoicing Suite" width={152} height={50} style={{ height: "auto", width: "180px" }} />
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            width: "100%",
          }}
        >
          <div className={styles.field}>
            <input
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="Username"
              style={{
                borderRadius: "999px",
                minHeight: "54px",
                paddingInline: "20px",
                borderColor: "#d6dde8",
                boxShadow: "none",
                width: "100%",
              }}
            />
          </div>

          <div className={styles.field}>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Password"
              style={{
                borderRadius: "999px",
                minHeight: "54px",
                paddingInline: "20px",
                borderColor: "#d6dde8",
                boxShadow: "none",
                width: "100%",
              }}
            />
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              marginTop: "-2px",
              marginBottom: "6px",
              color: "#bbc6d4",
              fontSize: "0.9rem",
              width: "100%",
            }}
          >
            {/* <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input type="checkbox" />
              <span>Remember me</span>
            </label> */}
            {/* <span style={{ color: "#2f8cff" }}>Forgot password?</span> */}
          </div>

          <div className={styles.actions} style={{ justifyContent: "center", marginTop: "4px" }}>
            <button
              type="submit"
              className={cx(styles.btn, styles.btnPrimary)}
              disabled={isSubmitting}
              style={{
                width: "100%",
                borderRadius: "999px",
                minHeight: "54px",
                fontSize: "1.05rem",
                boxShadow: "0 16px 32px rgba(37,99,235,0.24)",
              }}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
