"use client";

import React from "react";
import { BsSearch } from "react-icons/bs";
import styles from "../styles/MaintainCustomers.module.css";

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

const metricCards = [
  { label: "Open Invoices", value: "0", note: "Awaiting live data" },
  { label: "Proformas", value: "0", note: "Not yet linked" },
  { label: "Overdue", value: "0", note: "No feed configured" },
];

export default function InvoiceListScreen() {
  return (
    <div className={styles.container}>
      <section className={styles.card}>
        <div className={styles.cardBody}>
          <div className={styles.headerGrid}>
            <div className={styles.searchBlock}>
              <div className={styles.fieldLabel}>Invoice Search</div>
              <div className={styles.searchRow}>
                <input
                  className={styles.input}
                  placeholder="Search by invoice no., proforma no., customer, or licence plate"
                  disabled
                />
                <div className={styles.search}>
                  <BsSearch />
                </div>
              </div>
              <div className={styles.cardSubtitle}>
                Layout is ready. Data source and filters can be wired in once the invoice tables exist.
              </div>
            </div>

            <div className={styles.headerFields}>
              <label className={styles.field}>
                <div className={styles.fieldHeader}>
                  <span className={styles.fieldLabel}>Document Type</span>
                </div>
                <select className={styles.input} defaultValue="all" disabled>
                  <option value="all">All documents</option>
                </select>
              </label>

              <label className={styles.field}>
                <div className={styles.fieldHeader}>
                  <span className={styles.fieldLabel}>Status</span>
                </div>
                <select className={styles.input} defaultValue="all" disabled>
                  <option value="all">All statuses</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.grid} style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        {metricCards.map((card) => (
          <section key={card.label} className={styles.card}>
            <div className={styles.cardBody}>
              <div className={styles.cardSubtitle}>{card.label}</div>
              <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.35rem" }}>{card.value}</div>
              <div className={styles.cardSubtitle} style={{ marginTop: "0.4rem" }}>
                {card.note}
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Invoice Register</h2>
            <p className={styles.cardSubtitle}>
              This screen will list invoices and proformas once the backing invoice tables are in place.
            </p>
          </div>
          <div className={styles.actions}>
            <button type="button" className={cx(styles.btn, styles.btnDefault)} disabled>
              Export
            </button>
            <button type="button" className={cx(styles.btn, styles.btnPrimary)} disabled>
              New Invoice
            </button>
          </div>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.tableWrap}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead className={styles.thead}>
                  <tr>
                    {[
                      "Doc No.",
                      "Type",
                      "Status",
                      "Customer",
                      "Vehicle",
                      "Invoice Date",
                      "Due Date",
                      "Sales Rep",
                      "Total",
                    ].map((head) => (
                      <th key={head}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={9} className={styles.emptyCell}>
                      No invoice data is connected yet.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
