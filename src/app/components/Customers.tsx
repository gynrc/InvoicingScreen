"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "../styles/Customers.module.css";

type SearchField = "customerId" | "customerName" | "contact" | "telephone1" | "type" | "balance";

type Customer = {
  customerId: string;
  customerName: string;
  contact: string;
  telephone1: string;
  type: string;
  balance: number;
};

const searchFieldOptions: { label: string; value: SearchField }[] = [
  { label: "Customer Name", value: "customerName" },
  { label: "Customer ID", value: "customerId" },
  { label: "Contact", value: "contact" },
  { label: "Telephone 1", value: "telephone1" },
  { label: "Type", value: "type" },
  { label: "Balance", value: "balance" },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export default function CustomerListModern() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchField, setSearchField] = useState<SearchField>("customerName");
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  useEffect(() => {
    let ignore = false;

    const loadCustomers = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          search: appliedSearch,
          searchField,
        });

        const response = await fetch(`/api/customers?${params.toString()}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || `Failed to load customers: ${response.status}`);
        }

        const rows: Customer[] = Array.isArray(payload?.data) ? payload.data : [];

        if (!ignore) {
          setCustomers(rows);
          setTotalRecords(Number(payload?.totalRecords) || 0);
        }
      } catch (err: any) {
        if (!ignore) {
          console.error(err);
          setError(err?.message || "Unable to load customers from the database.");
          setCustomers([]);
          setTotalRecords(0);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadCustomers();

    return () => {
      ignore = true;
    };
  }, [includeInactive, page, pageSize, appliedSearch, searchField]);

  const totalBalance = useMemo(
    () => customers.reduce((sum, item) => sum + (Number(item.balance) || 0), 0),
    [customers]
  );

  const accountCustomers = useMemo(
    () => customers.filter((item) => Number(item.balance) > 0).length,
    [customers]
  );

  const onSearch = () => {
    setPage(1);
    setAppliedSearch(searchText);
  };

  const onClearSearch = () => {
    setSearchText("");
    setAppliedSearch("");
    setPage(1);
  };

  const startRecord = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalRecords);

  return (
    <div className={styles.customerPage}>
      <div className={styles.customerWindow}>
        <div className={styles.topBar}>
          <div className={styles.titleSection}>
            {/* <div className={styles.titleBadge}>CL</div> */}
            <div>
              <h1>Customers</h1>
              <p>Browse and manage customers</p>
            </div>
          </div>

          {/* <div className={styles.toolbar}>
            <button>New</button>
            <button>Export</button>
          </div> */}
        </div>

        <div className={styles.layout}>
          {/* <aside className={styles.sidebar}>
            <div className={`${styles.card} ${styles.stats}`}>
              <div>
                <label>Customers On Page</label>
                <h2>{customers.length}</h2>
              </div>

              <div>
                <label>Customers With Balance</label>
                <h2>{accountCustomers}</h2>
              </div>

              <div>
                <label>Page Balance Total</label>
                <h2>{currency.format(totalBalance)}</h2>
              </div>

              <div>
                <label>Total Records</label>
                <h2>{totalRecords}</h2>
              </div>
            </div>
          </aside> */}

          <main className={styles.content}>
            <div className={styles.searchBar}>
              <input
                placeholder="Search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
              />

              <select
                value={searchField}
                onChange={(e) => {
                  setSearchField(e.target.value as SearchField);
                  setPage(1);
                }}
              >
                {searchFieldOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button className={styles.primary} onClick={onSearch}>Search</button>
              <button onClick={onClearSearch}>Clear</button>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.tableWrapper}>
              <div className={styles.tableHeader}>
                <div className={styles.tableMeta}>
                  Showing {startRecord}-{endRecord} of {totalRecords} customers
                </div>

                <div className={styles.pageSizeWrap}>
                  <label htmlFor="pageSize">Rows per page</label>
                  <select
                    id="pageSize"
                    value={pageSize}
                    onChange={(e) => {
                      setPage(1);
                      setPageSize(Number(e.target.value));
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className={styles.loading}>Loading customers...</div>
              ) : customers.length === 0 ? (
                <div className={styles.empty}>No customers found</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Customer ID</th>
                      <th>Customer Name</th>
                      <th>Contact</th>
                      <th>Telephone</th>
                      <th>Type</th>
                      <th className={styles.right}>Balance</th>
                    </tr>
                  </thead>

                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.customerId}>
                        <td className={styles.id}>{customer.customerId}</td>
                        <td className={styles.name}>{customer.customerName}</td>
                        <td>{customer.contact || "-"}</td>
                        <td>{customer.telephone1 || "-"}</td>
                        <td>
                          <span className={styles.pill}>{customer.type}</span>
                        </td>

                        <td className={`${styles.right} ${styles.balance} ${Number(customer.balance) > 0 ? styles.positive : styles.zero}`}>
                          {currency.format(customer.balance || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className={styles.pagination}>
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </button>

              <div className={styles.pageInfo}>
                Page {page} of {totalPages}
              </div>

              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages || loading || totalRecords === 0}
              >
                Next
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
