"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { BsSearch } from "react-icons/bs";
import styles from "../styles/InvoiceScreen.module.css";
import Receipt from "./Receipt";

type CustomerInfo = { customerId: string; customerName: string; email: string; address1: string; address2: string; city: string; parish: string; country: string };
type VehicleInfo = { make: string; model: string; year: string; color: string; chassisNo: string; engineNo: string; licensePlate: string };
type InvoiceDetails = { invoiceNo: string; invoiceDate: string; dueDate: string; salesRep: string; description: string; discountPercent: string };
type LineItem = { id: number; qty: number | string; description: string; unitPrice: number | string; tax: string; amount: number | string };
type SummaryItem = { label: string; value: string; strong?: boolean };
type InvoiceData = { customer: CustomerInfo; vehicle: VehicleInfo; invoice: InvoiceDetails; lineItems: LineItem[]; summary: SummaryItem[] };
type ProformaRecord = { proformaNo: number; customerId: string; customerName: string; address1: string; address2: string; parish: string; country: string; description: string; invoiceNo: string; invoiceDate: string; dueDate: string; salesRep: string; status: string; invoiceTotal: string };
type Suggestion = { kind: "customer" | "vehicle"; customerId: string; label: string; sublabel: string };
type SalesRep = { code: string; name: string; branch: string; initials: string };
type DbRow = Record<string, unknown>;
type LoadedVehicle = { id: string; regPlate: string; make: string; model: string; year: string; color: string; engineNum: string; chassisNum: string };

const initialLineItem: LineItem = { id: 1, qty: "", description: "", unitPrice: "", tax: "", amount: "" };
const initialInvoiceData: InvoiceData = {
  customer: { customerId: "", customerName: "", email: "", address1: "", address2: "", city: "", parish: "", country: "" },
  vehicle: { make: "", model: "", year: "", color: "", chassisNo: "", engineNo: "", licensePlate: "" },
  invoice: { invoiceNo: "New", invoiceDate: "", dueDate: "", salesRep: "", description: "", discountPercent: "" },
  lineItems: [{ ...initialLineItem }],
  summary: [
    { label: "Sales tax", value: "$0.00" },
    { label: "Other applied credits", value: "$0.00" },
    { label: "Amount paid at sale", value: "$0.00" },
    { label: "Invoice total", value: "$0.00", strong: true },
    { label: "Net due", value: "$0.00", strong: true },
  ],
};

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
const cacheKey = (proformaNo: number) => `invoiceProforma:${proformaNo}`;
const toStr = (value: unknown) => (typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim());
const toYear = (value: unknown) => typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
const MAX_DISCOUNT_PERCENT = 30;

function formatCurrencyInput(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return "";
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : "";
}

function calculateTotalsWithDiscount(items: LineItem[], discountPercent: number) {
  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item.qty) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const explicitAmount = Number(item.amount) || 0;
    return sum + (explicitAmount > 0 ? explicitAmount : qty * unitPrice);
  }, 0);
  const safeDiscountPercent = Math.max(0, Math.min(MAX_DISCOUNT_PERCENT, discountPercent || 0));
  const discountAmount = subtotal * (safeDiscountPercent / 100);
  const netDue = subtotal - discountAmount;
  return { subtotal, discountPercent: safeDiscountPercent, discountAmount, invoiceTotal: netDue, netDue };
}

function buildSummary(items: LineItem[], discountPercent: number): SummaryItem[] {
  const totals = calculateTotalsWithDiscount(items, discountPercent);
  return [
    { label: "Sales tax", value: "$0.00" },
    { label: `Discount (${totals.discountPercent.toFixed(2)}%)`, value: `-${formatCurrency(totals.discountAmount)}` },
    { label: "Amount paid at sale", value: "$0.00" },
    { label: "Invoice total", value: formatCurrency(totals.invoiceTotal), strong: true },
    { label: "Net due", value: formatCurrency(totals.netDue), strong: true },
  ];
}

function mapCustomer(db: DbRow): CustomerInfo {
  const firstName = toStr(db.First_Name);
  const lastName = toStr(db.Last_Name);
  return {
    customerId: toStr(db.CustomerID),
    customerName: [firstName, lastName].filter(Boolean).join(" ").trim(),
    email: toStr(db.Email),
    address1: toStr(db.Address1),
    address2: toStr(db.Address2),
    city: toStr(db.Parish),
    parish: toStr(db.Parish),
    country: toStr(db.Country),
  };
}

function mapVehicle(db: DbRow): LoadedVehicle {
  const customerId = toStr(db.CustomerID);
  const regPlate = toStr(db.RegNo);
  return {
    id: `${customerId}-${regPlate}`,
    regPlate,
    make: toStr(db.Make),
    model: toStr(db.Model),
    year: toYear(db.ModelYear),
    color: toStr(db.Color),
    engineNum: toStr(db.EngineNo),
    chassisNum: toStr(db.SerialNo),
  };
}

export default function InvoiceScreen() {
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const suggestWrapRef = useRef<HTMLDivElement | null>(null);
  const lineInputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});
  const skipNextSuggestRef = useRef(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(initialInvoiceData);
  const [activeView, setActiveView] = useState<"form" | "proformas">("form");
  const [proformas, setProformas] = useState<ProformaRecord[]>([]);
  const [isLoadingProformas, setIsLoadingProformas] = useState(false);
  const [isSavingProforma, setIsSavingProforma] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<LoadedVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loadingSalesReps, setLoadingSalesReps] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const { customer, vehicle, invoice, lineItems, summary } = invoiceData;

  const selectedVehicle = useMemo(
    () => vehicles.find((item) => item.id === selectedVehicleId) ?? null,
    [vehicles, selectedVehicleId]
  );

  useEffect(() => {
    void loadProformas();
    void loadSalesReps();
  }, []);

  useEffect(() => {
    setInvoiceData((prev) => {
      const nextSummary = buildSummary(prev.lineItems, Number(prev.invoice.discountPercent) || 0);
      return JSON.stringify(prev.summary) === JSON.stringify(nextSummary) ? prev : { ...prev, summary: nextSummary };
    });
  }, [lineItems, invoice.discountPercent]);

  useEffect(() => {
    if (!selectedVehicle) return;
    setInvoiceData((prev) => ({
      ...prev,
      vehicle: {
        make: selectedVehicle.make,
        model: selectedVehicle.model,
        year: selectedVehicle.year,
        color: selectedVehicle.color,
        chassisNo: selectedVehicle.chassisNum,
        engineNo: selectedVehicle.engineNum,
        licensePlate: selectedVehicle.regPlate,
      },
    }));
  }, [selectedVehicle]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const el = suggestWrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpenSuggest(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (skipNextSuggestRef.current) {
      skipNextSuggestRef.current = false;
      setSuggestions([]);
      setOpenSuggest(false);
      setSuggestError(null);
      setSuggestLoading(false);
      return;
    }
    if (q.length < 2) {
      setSuggestions([]);
      setOpenSuggest(false);
      setSuggestError(null);
      setSuggestLoading(false);
      return;
    }

    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      setSuggestLoading(true);
      setSuggestError(null);
      try {
        const res = await fetch(`/api/customers/search?action=suggest&q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Suggest failed");
        setSuggestions(data.suggestions ?? []);
        setOpenSuggest(true);
      } catch (error: unknown) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSuggestError(error instanceof Error ? error.message : "Suggest failed");
        }
      } finally {
        setSuggestLoading(false);
      }
    }, 250);

    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [query]);

  async function loadProformas() {
    setIsLoadingProformas(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/invoices/proformas");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Failed to load proformas.");
      setProformas((data.proformas ?? []).map((p: { proformaNo: number; customerId?: string; customerName?: string; address1?: string; address2?: string; parish?: string; country?: string; description?: string; invoiceDate?: string; dueDate?: string; salesRep?: string; status?: string; invoiceTotal?: number }) => ({
        proformaNo: p.proformaNo,
        customerId: p.customerId ?? "",
        customerName: p.customerName ?? "",
        address1: p.address1 ?? "",
        address2: p.address2 ?? "",
        parish: p.parish ?? "",
        country: p.country ?? "",
        description: p.description ?? "",
        invoiceNo: String(p.proformaNo ?? ""),
        invoiceDate: p.invoiceDate ?? "",
        dueDate: p.dueDate ?? "",
        salesRep: p.salesRep ?? "",
        status: p.status ?? "Proforma",
        invoiceTotal: formatCurrency(Number(p.invoiceTotal ?? 0)),
      })));
    } catch (error) {
      setProformas([]);
      setErrorMessage(error instanceof Error ? error.message : "Failed to load proformas.");
    } finally {
      setIsLoadingProformas(false);
    }
  }

  async function loadSalesReps() {
    setLoadingSalesReps(true);
    try {
      const res = await fetch("/api/sales-reps");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Failed to load sales reps.");
      setSalesReps(data.salesReps ?? []);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load sales reps.");
    } finally {
      setLoadingSalesReps(false);
    }
  }

  function readCachedProforma(proformaNo: number): InvoiceData | null {
    try {
      const saved = localStorage.getItem(cacheKey(proformaNo));
      return saved ? (JSON.parse(saved) as InvoiceData) : null;
    } catch {
      return null;
    }
  }

  function writeCachedProforma(proformaNo: number, data: InvoiceData) {
    try { localStorage.setItem(cacheKey(proformaNo), JSON.stringify(data)); } catch {}
  }

  async function loadCustomerById(customerId: string, preferredPlate?: string) {
    setLoadingCustomer(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/customers/search?action=load&customerId=${encodeURIComponent(customerId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Load failed");
      if (!data.customer) {
        setInvoiceData((prev) => ({ ...prev, customer: initialInvoiceData.customer, vehicle: initialInvoiceData.vehicle }));
        setVehicles([]);
        setSelectedVehicleId("");
        return;
      }

      const mappedCustomer = mapCustomer(data.customer);
      const mappedVehicles: LoadedVehicle[] = (data.vehicles ?? []).map(mapVehicle);
      const preferredVehicle = mappedVehicles.find((item) => item.regPlate.toLowerCase() === (preferredPlate ?? "").toLowerCase());
      setInvoiceData((prev) => ({ ...prev, customer: mappedCustomer }));
      setVehicles(mappedVehicles);
      setSelectedVehicleId(preferredVehicle?.id ?? mappedVehicles[0]?.id ?? "");
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong loading customer");
    } finally {
      setLoadingCustomer(false);
    }
  }

  async function resolveSearch() {
    const q = query.trim();
    if (!q) return;
    skipNextSuggestRef.current = true;
    setSuggestions([]);
    setOpenSuggest(false);
    setLoadingCustomer(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/customers/search?action=resolve&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Search failed");
      if (!data.customer) {
        setInvoiceData((prev) => ({ ...prev, customer: initialInvoiceData.customer, vehicle: initialInvoiceData.vehicle }));
        setVehicles([]);
        setSelectedVehicleId("");
        setOpenSuggest(false);
        return;
      }

      const mappedCustomer = mapCustomer(data.customer);
      const mappedVehicles: LoadedVehicle[] = (data.vehicles ?? []).map(mapVehicle);
      const matchByPlate = mappedVehicles.find((item) => item.regPlate.replace(/\s+/g, "").toLowerCase() === q.replace(/\s+/g, "").toLowerCase());
      setInvoiceData((prev) => ({ ...prev, customer: mappedCustomer }));
      setVehicles(mappedVehicles);
      setSelectedVehicleId(matchByPlate?.id ?? mappedVehicles[0]?.id ?? "");
      setOpenSuggest(false);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Search failed");
    } finally {
      setLoadingCustomer(false);
    }
  }

  async function onPickSuggestion(suggestion: Suggestion) {
    skipNextSuggestRef.current = true;
    setQuery(suggestion.label);
    setSuggestions([]);
    setOpenSuggest(false);
    await loadCustomerById(suggestion.customerId, suggestion.kind === "vehicle" ? suggestion.label : undefined);
  }

  async function saveProforma() {
    setIsSavingProforma(true);
    setErrorMessage(null);
    try {
      const totals = calculateTotalsWithDiscount(invoiceData.lineItems, Number(invoice.discountPercent) || 0);
      const res = await fetch("/api/invoices/proformas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.customerId || null,
          customerName: customer.customerName,
          address1: customer.address1,
          address2: customer.address2,
          parish: customer.parish || customer.city,
          country: customer.country,
          salesPerson: invoice.salesRep || null,
          description: invoice.description,
          invoiceDate: invoice.invoiceDate || null,
          dueDate: invoice.dueDate || null,
          invoiceAmount: totals.invoiceTotal,
          gct: 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Failed to save proforma.");
      const nextInvoiceData = {
        ...invoiceData,
        invoice: { ...invoiceData.invoice, invoiceNo: String(data.proformaNo), invoiceDate: data.invoiceDate || invoice.invoiceDate, dueDate: data.dueDate ?? invoice.dueDate },
        summary: buildSummary(invoiceData.lineItems, Number(invoice.discountPercent) || 0),
      };
      setInvoiceData(nextInvoiceData);
      writeCachedProforma(data.proformaNo, nextInvoiceData);
      await loadProformas();
      alert(`Proforma ${data.proformaNo} saved successfully.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save proforma.";
      setErrorMessage(message);
      alert(message);
    } finally {
      setIsSavingProforma(false);
    }
  }

  function openProforma(proforma: ProformaRecord) {
    const cached = readCachedProforma(proforma.proformaNo);
    if (cached) {
      setInvoiceData(cached);
      setActiveView("form");
      return;
    }
    const amount = Number(proforma.invoiceTotal.replace(/[$,]/g, "")) || 0;
    const lineItem = { ...initialLineItem, amount: amount ? amount.toFixed(2) : "" };
    setInvoiceData({
      customer: { customerId: proforma.customerId, customerName: proforma.customerName, email: "", address1: proforma.address1, address2: proforma.address2, city: "", parish: proforma.parish, country: proforma.country },
      vehicle: { ...initialInvoiceData.vehicle },
      invoice: { invoiceNo: proforma.invoiceNo, invoiceDate: proforma.invoiceDate, dueDate: proforma.dueDate, salesRep: proforma.salesRep, description: proforma.description },
      lineItems: [lineItem],
      summary: buildSummary([lineItem], 0),
    });
    setVehicles([]);
    setSelectedVehicleId("");
    setActiveView("form");
  }

  const handleInvoiceChange = (field: keyof InvoiceDetails, value: string) => {
    if (field === "discountPercent") {
      const numeric = Number(value || 0);
      const overMax = Number.isFinite(numeric) && numeric > MAX_DISCOUNT_PERCENT;
      setDiscountError(
        overMax ? `Maximum discount allowed is ${MAX_DISCOUNT_PERCENT}%.` : null
      );
      setInvoiceData((prev) => ({
        ...prev,
        invoice: {
          ...prev.invoice,
          discountPercent: value === "" ? "" : String(Math.max(0, Math.min(MAX_DISCOUNT_PERCENT, numeric))),
        },
      }));
      return;
    }

    setInvoiceData((prev) => ({
      ...prev,
      invoice: {
        ...prev.invoice,
        [field]: value,
      },
    }));
  };
  const handleCustomerChange = (field: keyof CustomerInfo, value: string) => setInvoiceData((prev) => ({ ...prev, customer: { ...prev.customer, [field]: value } }));
  const handleVehicleChange = (field: keyof VehicleInfo, value: string) => setInvoiceData((prev) => ({ ...prev, vehicle: { ...prev.vehicle, [field]: value } }));
  const handleLineItemChange = (id: number, field: keyof LineItem, value: string) => setInvoiceData((prev) => ({
    ...prev,
    lineItems: prev.lineItems.map((item) =>
      item.id === id
        ? {
            ...item,
            [field]:
              field === "amount" || field === "unitPrice"
                ? value.replace(/[^0-9.]/g, "")
                : value,
          }
        : item
    ),
  }));
  const addLineItem = () => setInvoiceData((prev) => ({ ...prev, lineItems: [...prev.lineItems, { ...initialLineItem, id: prev.lineItems.length + 1 }] }));

  function handleLineItemKeyDown(
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIndex: number,
    field: keyof LineItem
  ) {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const isLastRow = rowIndex === lineItems.length - 1;
    if (isLastRow) {
      const nextRowId = lineItems.length + 1;
      addLineItem();
      window.setTimeout(() => {
        const nextRef = lineInputRefs.current[`${nextRowId}:${field}`];
        nextRef?.focus();
      }, 0);
      return;
    }

    const nextRef = lineInputRefs.current[`${lineItems[rowIndex + 1].id}:${field}`];
    nextRef?.focus();
  }

  function handlePrintReceipt() {
    if (!receiptRef.current) return;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map((node) => node.outerHTML).join("");
    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>${stylesheets}<style>html,body{margin:0;padding:0;background:#fff}.print-wrapper{padding:20px}@page{margin:12mm}</style></head><body><div class="print-wrapper">${receiptRef.current.outerHTML}</div></body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); printWindow.close(); }, 500);
  }

  return (
    <div className={styles["invoice-page"]}>
      <div className={styles["invoice-shell"]}>
        <header className={styles["invoice-header"]}>
          <div className={styles["header-left"]}>
            <button className={`${styles.btn} ${styles["btn-secondary"]}`} type="button" onClick={() => { void loadProformas(); setActiveView("proformas"); }}>View Proformas</button>
          </div>
          <div className={styles["header-right"]}>
            <button className={`${styles.btn} ${styles["btn-primary"]}`} type="button" onClick={() => void saveProforma()} disabled={isSavingProforma}>{isSavingProforma ? "Saving..." : "Save Proforma"}</button>
            <button className={`${styles.btn} ${styles["btn-secondary"]}`} onClick={() => setShowReceiptPreview(true)} type="button">Preview Receipt</button>
            <button className={`${styles.btn} ${styles["btn-secondary"]}`} type="button">Email Invoice</button>
          </div>
        </header>
        <div className={styles["invoice-layout"]}>
          <main className={styles["invoice-main"]}>
            {activeView === "proformas" ? (
              <section className={styles.card}>
                <div className={styles["section-toolbar"]}>
                  <div>
                    <h2 className={styles["section-title"]}>Invoice Proformas</h2>
                    <p className={styles["section-copy"]}>Saved proformas are listed below and can later be converted into invoices.</p>
                  </div>
                  <div className={styles["toolbar-actions"]}>
                    <button className={`${styles.btn} ${styles["btn-secondary"]}`} type="button" onClick={() => setActiveView("form")}>Back to Invoice</button>
                  </div>
                </div>
                <div className={styles["table-wrap"]}>
                  <table className={styles["invoice-table"]}>
                    <thead><tr><th>Customer ID</th><th>Customer Name</th><th>Proforma No.</th><th>Invoice Date</th><th>Due Date</th><th>Sales Rep</th><th>Status</th><th>Invoice Total</th><th>Action</th></tr></thead>
                    <tbody>
                      {isLoadingProformas ? <tr><td colSpan={9} style={{ textAlign: "center", padding: "1rem" }}>Loading proformas...</td></tr> : proformas.length > 0 ? proformas.map((proforma) => (
                        <tr key={proforma.proformaNo}>
                          <td>{proforma.customerId || "-"}</td><td>{proforma.customerName || "-"}</td><td>{proforma.invoiceNo || "-"}</td><td>{proforma.invoiceDate || "-"}</td><td>{proforma.dueDate || "-"}</td><td>{proforma.salesRep || "-"}</td><td>{proforma.status}</td><td>{proforma.invoiceTotal}</td>
                          <td><button className={`${styles.btn} ${styles["btn-secondary"]}`} type="button" onClick={() => openProforma(proforma)}>Open</button></td>
                        </tr>
                      )) : <tr><td colSpan={9} style={{ textAlign: "center", padding: "1rem" }}>No proformas saved yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : (
              <>
                {errorMessage && <section className={styles.card}><p className={styles["section-copy"]} style={{ color: "#b42318" }}>{errorMessage}</p></section>}
                <section className={`${styles.card} ${styles["card-muted"]}`}>
                  <div className={styles["top-grid"]}>
                    <div className={styles["stack-lg"]}>
                      <label className={styles.field}>
                        <span className={styles["field-label"]}>Customer / Vehicle Search</span>
                        <div ref={suggestWrapRef} style={{ position: "relative" }}>
                          <div className={`${styles["field-inline"]} ${styles["vehicle-search"]}`}>
                            <input value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => suggestions.length > 0 && setOpenSuggest(true)} onKeyDown={(e) => { if (e.key === "Enter") void resolveSearch(); if (e.key === "Escape") setOpenSuggest(false); }} placeholder="Search by licence plate, customer name, or customer ID" />
                            <button className={`${styles.btn} ${styles["btn-secondary"]}`} type="button" onClick={() => void resolveSearch()}><BsSearch /></button>
                          </div>
                          {openSuggest && (
                            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20, background: "#fff", border: "1px solid #d0d5dd", borderRadius: 12, boxShadow: "0 10px 24px rgba(16,24,40,0.12)", overflow: "hidden" }}>
                              {suggestLoading && <div style={{ padding: "0.75rem 1rem" }}>Loading...</div>}
                              {suggestError && <div style={{ padding: "0.75rem 1rem" }}>{suggestError}</div>}
                              {!suggestLoading && !suggestError && suggestions.length === 0 && <div style={{ padding: "0.75rem 1rem" }}>No matches</div>}
                              {!suggestLoading && !suggestError && suggestions.map((s, idx) => (
                                <button key={`${s.kind}-${s.customerId}-${idx}`} type="button" onClick={() => void onPickSuggestion(s)} style={{ display: "block", width: "100%", textAlign: "left", padding: "0.85rem 1rem", border: 0, borderTop: idx === 0 ? 0 : "1px solid #eaecf0", background: "transparent", cursor: "pointer" }}>
                                  <div style={{ fontWeight: 600 }}>{s.kind === "vehicle" ? `Reg: ${s.label}` : s.label}</div>
                                  <div style={{ color: "#667085", fontSize: "0.9rem" }}>{s.sublabel}</div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </label>
                      {vehicles.length > 0 && (
                        <label className={styles.field}>
                          <span className={styles["field-label"]}>Vehicle</span>
                          <select value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)}>
                            {vehicles.map((item) => <option key={item.id} value={item.id}>{item.regPlate} - {item.make} {item.model} {item.year}</option>)}
                          </select>
                        </label>
                      )}
                      <div className={`${styles.card} ${styles["inner-card"]}`}>
                        <div className={styles["section-head"]}><h2>Bill to</h2></div>
                        <div className={styles["stack-md"]}>
                          <input value={customer.customerId} onChange={(e) => handleCustomerChange("customerId", e.target.value)} placeholder="Customer ID" />
                          <input value={customer.customerName} onChange={(e) => handleCustomerChange("customerName", e.target.value)} placeholder="Customer name" />
                          <input type="email" value={customer.email} onChange={(e) => handleCustomerChange("email", e.target.value)} placeholder="Email" />
                          <input value={customer.address1} onChange={(e) => handleCustomerChange("address1", e.target.value)} placeholder="Address line 1" />
                          <input value={customer.address2} onChange={(e) => handleCustomerChange("address2", e.target.value)} placeholder="Address line 2" />
                          <input value={customer.parish} onChange={(e) => handleCustomerChange("parish", e.target.value)} placeholder="Parish" />
                          <input value={customer.country} onChange={(e) => handleCustomerChange("country", e.target.value)} placeholder="Country" />
                        </div>
                      </div>
                    </div>
                    <div className={styles["stack-lg"]}>
                      <div className={`${styles.card} ${styles["inner-card"]}`}>
                        <div className={styles["section-head"]}><h2>Vehicle information</h2></div>
                        <div className={styles["ship-grid"]}>
                          <input value={vehicle.licensePlate} onChange={(e) => handleVehicleChange("licensePlate", e.target.value)} placeholder="Licence plate" />
                          <input value={vehicle.make} onChange={(e) => handleVehicleChange("make", e.target.value)} placeholder="Make" />
                          <input value={vehicle.model} onChange={(e) => handleVehicleChange("model", e.target.value)} placeholder="Model" />
                          <input value={vehicle.year} onChange={(e) => handleVehicleChange("year", e.target.value)} placeholder="Year" />
                          <input value={vehicle.color} onChange={(e) => handleVehicleChange("color", e.target.value)} placeholder="Color" />
                          <input value={vehicle.chassisNo} onChange={(e) => handleVehicleChange("chassisNo", e.target.value)} placeholder="Chassis no." />
                          <input value={vehicle.engineNo} onChange={(e) => handleVehicleChange("engineNo", e.target.value)} placeholder="Engine no." />
                        </div>
                      </div>
                    </div>
                    <div className={styles["stack-lg"]}>
                      <div className={`${styles.card} ${styles["inner-card"]}`}>
                        <div className={`${styles["section-head"]} ${styles.simple}`}><h2>Invoice details</h2></div>
                        <div className={styles["stack-md"]}>
                          <label className={styles.field}><span className={styles["field-label"]}>Invoice no.</span><input value={invoice.invoiceNo} readOnly /></label>
                          <label className={styles.field}><span className={styles["field-label"]}>Invoice date</span><input type="date" value={invoice.invoiceDate} onChange={(e) => handleInvoiceChange("invoiceDate", e.target.value)} /></label>
                          <label className={styles.field}><span className={styles["field-label"]}>Due date</span><input type="date" value={invoice.dueDate} onChange={(e) => handleInvoiceChange("dueDate", e.target.value)} /></label>
                          <label className={styles.field}>
                            <span className={styles["field-label"]}>Sales rep</span>
                            <select value={invoice.salesRep} onChange={(e) => handleInvoiceChange("salesRep", e.target.value)} disabled={loadingSalesReps}>
                              <option value="" disabled>{loadingSalesReps ? "Loading sales reps..." : "Select sales rep"}</option>
                              {salesReps.map((rep) => <option key={rep.code || rep.name} value={rep.code}>{rep.name}</option>)}
                            </select>
                          </label>
                          {loadingCustomer && <p className={styles["section-copy"]}>Loading customer...</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                <section className={styles.card}>
                  <div className={styles["section-toolbar"]}>
                    <div><h2 className={styles["section-title"]}>Line items</h2><p className={styles["section-copy"]}>{invoice.description || "Enter invoice details below."}</p></div>
                    <div className={styles["toolbar-actions"]}><button className={`${styles.btn} ${styles["btn-accent"]}`} onClick={addLineItem} type="button">Add line item</button></div>
                  </div>
                  <div className={styles["table-wrap"]}>
                    <table className={styles["invoice-table"]}>
                      <thead><tr><th>Qty</th><th>Description</th><th>Unit Price</th><th>Tax</th><th>Amount</th></tr></thead>
                      <tbody>
                        {lineItems.map((item) => (
                          <tr key={item.id}>
                            <td><input ref={(el) => { lineInputRefs.current[`${item.id}:qty`] = el; }} value={item.qty} onChange={(e) => handleLineItemChange(item.id, "qty", e.target.value)} onKeyDown={(e) => handleLineItemKeyDown(e, lineItems.findIndex((row) => row.id === item.id), "qty")} className={styles["table-sm"]} /></td>
                            <td style={{ minWidth: "320px" }}><input ref={(el) => { lineInputRefs.current[`${item.id}:description`] = el; }} value={item.description} onChange={(e) => handleLineItemChange(item.id, "description", e.target.value)} onKeyDown={(e) => handleLineItemKeyDown(e, lineItems.findIndex((row) => row.id === item.id), "description")} placeholder="Item description" style={{ width: "100%", minWidth: "300px" }} /></td>
                            <td><input ref={(el) => { lineInputRefs.current[`${item.id}:unitPrice`] = el; }} value={item.unitPrice} onChange={(e) => handleLineItemChange(item.id, "unitPrice", e.target.value)} onBlur={(e) => handleLineItemChange(item.id, "unitPrice", formatCurrencyInput(e.target.value))} onKeyDown={(e) => handleLineItemKeyDown(e, lineItems.findIndex((row) => row.id === item.id), "unitPrice")} className={styles["table-md"]} /></td>
                            <td><select ref={(el) => { lineInputRefs.current[`${item.id}:tax`] = el; }} value={item.tax} onChange={(e) => handleLineItemChange(item.id, "tax", e.target.value)} onKeyDown={(e) => handleLineItemKeyDown(e, lineItems.findIndex((row) => row.id === item.id), "tax")} className={styles["table-sm"]}><option value="">Select</option><option value="VAT">VAT</option><option value="GCT">GCT</option><option value="None">None</option></select></td>
                            <td><input ref={(el) => { lineInputRefs.current[`${item.id}:amount`] = el; }} value={item.amount} onChange={(e) => handleLineItemChange(item.id, "amount", e.target.value)} onBlur={(e) => handleLineItemChange(item.id, "amount", formatCurrencyInput(e.target.value))} onKeyDown={(e) => handleLineItemKeyDown(e, lineItems.findIndex((row) => row.id === item.id), "amount")} className={styles["table-md"]} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className={styles["line-footer"]}>
                      <div className={styles["summary-card"]}>
                        <div className={styles["summary-row"]}>
                          <span>Discount %</span>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          step="0.01"
                          value={invoice.discountPercent}
                          onChange={(e) => handleInvoiceChange("discountPercent", e.target.value)}
                          placeholder="0.00"
                          className={styles["table-md"]}
                          style={{ maxWidth: "84px", padding: "6px 8px", textAlign: "right", background: "#ffffff", color: "#0f172a", border: "1px solid #d0d5dd" }}
                        />
                      </div>
                      {discountError && (
                        <div className={styles["summary-row"]} style={{ color: "#b42318" }}>
                          <span>{discountError}</span>
                          <span />
                        </div>
                      )}
                      {summary.map((item) => <div key={item.label} className={`${styles["summary-row"]} ${item.strong ? styles.strong : ""}`}><span>{item.label}</span><span>{item.value}</span></div>)}
                    </div>
                  </div>
                </section>
              </>
            )}
          </main>
          {showReceiptPreview && (
            <div className={styles.previewOverlay}>
              <div className={styles.previewModal}>
                <div className={styles.previewHeader}>
                  <h2 className={styles.previewTitle}>Receipt Preview</h2>
                  <div className={styles["invoice-header-actions"]}>
                    <button className={`${styles.btn} ${styles["btn-secondary"]}`} onClick={handlePrintReceipt} type="button">Print</button>
                    <button className={`${styles.btn} ${styles["btn-secondary"]}`} onClick={() => setShowReceiptPreview(false)} type="button">Close</button>
                  </div>
                </div>
                <div className={styles.previewBody}>
                  <div ref={receiptRef} id="receipt-print-area" className={styles.printArea}><Receipt invoiceData={invoiceData} /></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
