"use client";

import React, { useMemo, useRef, useState } from "react";
import styles from "../styles/MaintainCustomers.module.css";
import VehicleModal from "./VehicleModal";
import CustomerModal, { CustTypeOption } from "./CustomerModal";
import { BsSearch } from "react-icons/bs";

type OilType = "regular" | "liqui moly" | "amsoil";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  regPlate: string;
  mileage: number;
  engineNum: string;
  chassisNum: string;
  lastServiceDate: string;
  oilType?: OilType;
  nextServiceMileage?: number;
  description?: string;
};

type Customer = {
  customerId: string;
  name: string;
  customerType: string;
  firstName: string;
  lastName: string;
  billToContact: string;
  accountNumber: string;
  telephone1: string;
  telephone2: string;
  fax: string;
  email: string;
  website: string;
  billingAddress1: string;
  billingAddress2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  salesTax: string;
};

type CustomFieldConfig = {
  key: string;
  label: string;
  placeholder?: string;
  colSpan?: 1 | 2;
  type?: "text" | "date";
};

type Suggestion =
  | { kind: "customer"; customerId: string; label: string; sublabel: string }
  | { kind: "vehicle"; customerId: string; label: string; sublabel: string };

const emptyCustomer: Customer = {
  customerId: "",
  name: "",
  customerType: "",
  firstName: "",
  lastName: "",
  billToContact: "",
  accountNumber: "",
  telephone1: "",
  telephone2: "",
  fax: "",
  email: "",
  website: "",
  billingAddress1: "",
  billingAddress2: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  salesTax: "",
};

const customizableFields: CustomFieldConfig[] = [
  { key: "vehicleDetails", label: "1. Vehicle Description", placeholder: "Notes / extra details", colSpan: 2 },
  { key: "engineNo", label: "2. Engine No", placeholder: "Enter engine number", colSpan: 1 },
  { key: "chassisNo", label: "3. Chassis No", placeholder: "Enter chassis number", colSpan: 1 },
  { key: "mileage", label: "4. Mileage", placeholder: "Enter mileage", colSpan: 1 },
  { key: "serviceDate", label: "5. Service Date", colSpan: 1, type: "date" },
  { key: "oilType", label: "6. Oil Type", colSpan: 1 },
];

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: "text" | "date";
  children?: React.ReactNode;
  labelRight?: React.ReactNode;
}) {
  return (
    <label className={styles.field}>
      <div className={styles.fieldHeader}>
        <span className={styles.fieldLabel}>{props.label}</span>
        {props.labelRight && <span className={styles.fieldLabelRight}>{props.labelRight}</span>}
      </div>

      {props.children ? (
        props.children
      ) : (
        <input
          type={props.type ?? "text"}
          className={cx(styles.input, props.disabled && styles.inputDisabled)}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          disabled={props.disabled}
        />
      )}
    </label>
  );
}

function Button(props: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "danger";
  disabled?: boolean;
}) {
  const variantClass =
    props.variant === "primary"
      ? styles.btnPrimary
      : props.variant === "danger"
      ? styles.btnDanger
      : styles.btnDefault;

  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cx(styles.btn, variantClass)}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
}

type DbRow = Record<string, unknown>;

const toStr = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const toNum = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

function toDateInput(value: unknown): string {
  if (!value) return "";
  const raw = String(value);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

const OIL_SERVICE_KM: Record<OilType, number> = {
  regular: 5000,
  "liqui moly": 7000,
  amsoil: 10000,
};

function calculateNextServiceMileage(mileage: number, oilType: OilType): number {
  return Number(mileage || 0) + OIL_SERVICE_KM[oilType];
}

function getServiceBadge(lastServiceDate: string) {
  if (!lastServiceDate) {
    return null;
  }

  const serviceDate = new Date(lastServiceDate);
  if (Number.isNaN(serviceDate.getTime())) {
    return null;
  }

  const today = new Date();
  const dueDate = new Date(serviceDate);
  dueDate.setMonth(dueDate.getMonth() + 6);

  if (today >= dueDate) {
    return { label: "Needs Servicing", className: styles.serviceDueBadge };
  }

  return { label: "OK", className: styles.serviceOkBadge };
}

function mapCustomer(db: DbRow): Customer {
  const firstName = toStr(db.First_Name);
  const lastName = toStr(db.Last_Name);
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    customerId: toStr(db.CustomerID),
    name: fullName,
    customerType: db.CustomerType as string,
    firstName,
    lastName,
    billToContact: toStr(db.PrimaryContact) || fullName,
    accountNumber: "",
    telephone1: toStr(db.Telephone_1),
    telephone2: toStr(db.Telephone_2),
    fax: toStr(db.Fax_no),
    email: toStr(db.Email),
    website: "",
    billingAddress1: toStr(db.Address1),
    billingAddress2: toStr(db.Address2),
    city: toStr(db.Parish),
    state: "",
    zip: toStr(db.Zipcode),
    country: toStr(db.Country),
    salesTax: "",
  };
}

function mapVehicle(db: DbRow): Vehicle {
  const oilTypeRaw = toStr(db.OilType).toLowerCase() as OilType;
  const oilType: OilType =
    oilTypeRaw === "regular" || oilTypeRaw === "liqui moly" || oilTypeRaw === "amsoil"
      ? oilTypeRaw
      : "regular";

  const mileage = toNum(db.Mileage);

  return {
    id: `${toStr(db.CustomerID)}-${toStr(db.RegNo)}`,
    make: toStr(db.Make),
    model: toStr(db.Model),
    year: toNum(db.ModelYear),
    regPlate: toStr(db.RegNo),
    mileage,
    engineNum: toStr(db.EngineNo),
    chassisNum: toStr(db.SerialNo),
    lastServiceDate: toDateInput(db.LastServiceDate),
    oilType,
    nextServiceMileage: calculateNextServiceMileage(mileage, oilType),
    description: toStr(db.DEscription),
  };
}

export default function MaintainCustomersScreen() {
  const skipNextSuggestRef = useRef(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const [customer, setCustomer] = useState<Customer>(emptyCustomer);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");

  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [updatingVehicle, setUpdatingVehicle] = useState(false);
  const [removingVehicle, setRemovingVehicle] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);

  const [custTypes, setCustTypes] = useState<CustTypeOption[]>([]);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedVehicleId) ?? null,
    [vehicles, selectedVehicleId]
  );

  const [customFields, setCustomFields] = useState<Record<string, string>>({
    vehicleDetails: "",
    engineNo: "",
    chassisNo: "",
    mileage: "",
    serviceDate: "",
    oilType: "regular",
  });

  React.useEffect(() => {
    let ignore = false;

    async function loadCustTypes() {
      try {
        const res = await fetch("/api/cust-types");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Failed to load customer types");
        if (!ignore) setCustTypes(data.data ?? []);
        console.log("Types:", data.data);
      } catch (err) {
        console.error(err);
      }
    }

    loadCustTypes();
    return () => {
      ignore = true;
    };
  }, []);

  React.useEffect(() => {
    if (!selectedVehicle) return;

    setCustomFields({
      vehicleDetails: selectedVehicle.description ?? "",
      engineNo: selectedVehicle.engineNum,
      chassisNo: selectedVehicle.chassisNum,
      mileage: String(selectedVehicle.mileage ?? ""),
      serviceDate: selectedVehicle.lastServiceDate ?? "",
      oilType: selectedVehicle.oilType ?? "regular",
    });
  }, [selectedVehicle]);

  const suggestWrapRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const el = suggestWrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpenSuggest(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  React.useEffect(() => {
    const q = query.trim();
    setLoadError(null);
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
        const res = await fetch(`/api/customers/search?action=suggest&q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Suggest failed");

        setSuggestions(data.suggestions ?? []);
        setOpenSuggest(true);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Suggest error";
        if (!(e instanceof DOMException && e.name === "AbortError")) setSuggestError(message);
      } finally {
        setSuggestLoading(false);
      }
    }, 250);

    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [query]);

  async function loadCustomerById(customerId: string) {
    setLoadingCustomer(true);
    setLoadError(null);

    try {
      const res = await fetch(`/api/customers/search?action=load&customerId=${encodeURIComponent(customerId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Load failed");

      if (!data.customer) {
        setCustomer(emptyCustomer);
        setVehicles([]);
        setSelectedVehicleId("");
        return;
      }

      const mappedCustomer = mapCustomer(data.customer);
      const mappedVehicles: Vehicle[] = (data.vehicles ?? []).map(mapVehicle);

      setCustomer(mappedCustomer);
      setVehicles(mappedVehicles);
      setSelectedVehicleId(mappedVehicles[0]?.id ?? "");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong loading customer";
      setLoadError(message);
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
    setLoadError(null);

    try {
      const res = await fetch(`/api/customers/search?action=resolve&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Search failed");

      if (!data.customer) {
        setCustomer(emptyCustomer);
        setVehicles([]);
        setSelectedVehicleId("");
        setOpenSuggest(false);
        return;
      }

      setCustomer(mapCustomer(data.customer));
      const mappedVehicles: Vehicle[] = (data.vehicles ?? []).map(mapVehicle);
      setVehicles(mappedVehicles);
      setSelectedVehicleId(mappedVehicles[0]?.id ?? "");
      setOpenSuggest(false);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Search error";
      setLoadError(message);
    } finally {
      setLoadingCustomer(false);
    }
  }

  async function handleVehicleUpdate() {
    if (!selectedVehicle || !customer.customerId) return;

    const oilType = (customFields.oilType as OilType) || "regular";
    const mileage = Number(customFields.mileage || 0);
    const nextServiceMileage = calculateNextServiceMileage(mileage, oilType);

    const confirmed = window.confirm(
      `Selected oil type: ${oilType.toUpperCase()}\n\nCurrent mileage: ${mileage.toLocaleString()} km\nNext service mileage: ${nextServiceMileage.toLocaleString()} km\n\nDo you want to continue with this update?`
    );

    if (!confirmed) return;

    setUpdatingVehicle(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/vehicles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.customerId,
          regPlate: selectedVehicle.regPlate,
          vehicleDetails: customFields.vehicleDetails,
          engineNo: customFields.engineNo,
          chassisNo: customFields.chassisNo,
          mileage: customFields.mileage,
          serviceDate: customFields.serviceDate,
          oilType,
          nextServiceMileage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Failed to update vehicle.");

      const updated = mapVehicle({
        ...data.vehicle,
        OilType: oilType,
        NextServiceMileage: nextServiceMileage,
      });

      setVehicles((prev) => prev.map((v) => (v.id === selectedVehicle.id ? updated : v)));
      setSelectedVehicleId(updated.id);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Vehicle update failed";
      setLoadError(message);
    } finally {
      setUpdatingVehicle(false);
    }
  }

  async function onPickSuggestion(s: Suggestion) {
    skipNextSuggestRef.current = true;
    setQuery(s.label);
    setSuggestions([]);
    setOpenSuggest(false);
    await loadCustomerById(s.customerId);
  }

  const filteredVehicles = useMemo(() => vehicles, [vehicles]);

  const handleAddVehicle = async (vehicle: Omit<Vehicle, "id">) => {
    if (!customer.customerId) {
      setLoadError("Please load or create a customer before adding a vehicle.");
      return false;
    }

    setLoadError(null);

    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: customer.customerId,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year || null,
          regPlate: vehicle.regPlate,
          mileage: vehicle.mileage || null,
          engineNum: vehicle.engineNum || null,
          chassisNum: vehicle.chassisNum || null,
          description: vehicle.description || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to save vehicle.");
      }

      const savedVehicle = data.vehicle;
      const mappedVehicle: Vehicle = mapVehicle(savedVehicle);

      setVehicles((prev) => [mappedVehicle, ...prev]);
      setSelectedVehicleId(mappedVehicle.id);

      return true;
    } catch (error) {
      console.error("Error saving vehicle:", error);
      setLoadError(error instanceof Error ? error.message : "Failed to save vehicle.");
      return false;
    }
  };

  const handleRemoveVehicle = async () => {
    if (!selectedVehicle || !customer.customerId) return;
    setRemovingVehicle(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/vehicles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.customerId,
          regPlate: selectedVehicle.regPlate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message ?? "Failed to remove vehicle.");
      }

      setVehicles((prev) => {
        const nextVehicles = prev.filter((vehicle) => vehicle.id !== selectedVehicle.id);
        setSelectedVehicleId(nextVehicles[0]?.id ?? "");
        return nextVehicles;
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to remove vehicle");
    } finally {
      setRemovingVehicle(false);
    }
  };

  const handleAddCustomer = async (newCustomer: {
    custType: string;
    firstName: string;
    lastName: string;
    address1: string;
    address2: string;
    parish: string;
    country: string;
    telephone1: string;
    telephone2: string;
    email: string;
    fax: string;
    zip: string;
    primaryContact: string;
  }) => {
    try {
      const res = await fetch("/api/customers/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCustomer),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Failed to save customer");
      }

      const saved = data.customer;

      setCustomer({
        customerId: saved?.CustomerID ?? saved?.customerId ?? "",
        name: [saved?.First_Name ?? newCustomer.firstName, saved?.Last_Name ?? newCustomer.lastName]
          .filter(Boolean)
          .join(" "),
        customerType: saved?.CustomerType ?? newCustomer.custType,
        firstName: saved?.First_Name ?? newCustomer.firstName,
        lastName: saved?.Last_Name ?? newCustomer.lastName,
        billToContact: saved?.PrimaryContact ?? newCustomer.primaryContact,
        accountNumber: "",
        telephone1: saved?.Telephone_1 ?? newCustomer.telephone1,
        telephone2: saved?.Telephone_2 ?? newCustomer.telephone2,
        fax: saved?.Fax_no ?? newCustomer.fax,
        email: saved?.Email ?? newCustomer.email,
        website: "",
        billingAddress1: saved?.Address1 ?? newCustomer.address1,
        billingAddress2: saved?.Address2 ?? newCustomer.address2,
        city: saved?.Parish ?? newCustomer.parish,
        state: "",
        zip: saved?.Zipcode ?? newCustomer.zip,
        country: saved?.Country ?? newCustomer.country,
        salesTax: "",
      });

      setVehicles([]);
      setSelectedVehicleId("");
      setQuery(
        [saved?.First_Name ?? newCustomer.firstName, saved?.Last_Name ?? newCustomer.lastName]
          .filter(Boolean)
          .join(" ")
      );

      return true;
    } catch (error) {
      console.error("Error saving customer:", error);
      setLoadError(error instanceof Error ? error.message : "Failed to save customer");
      return false;
    }
  };

  const handleCustomerSave = async () => {
    if (!customer.customerId) return;

    setSavingCustomer(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.customerId,
          custType: customer.customerType,
          firstName: customer.firstName,
          lastName: customer.lastName,
          address1: customer.billingAddress1,
          address2: customer.billingAddress2,
          parish: customer.city,
          country: customer.country,
          telephone1: customer.telephone1,
          telephone2: customer.telephone2,
          fax: customer.fax,
          email: customer.email,
          zip: customer.zip,
          primaryContact: customer.billToContact,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? data?.message ?? "Failed to save customer");
      }

      if (data?.customer) {
        setCustomer(mapCustomer(data.customer));
      } else {
        setCustomer((prev) => ({
          ...prev,
          name: [prev.firstName, prev.lastName].filter(Boolean).join(" ").trim(),
        }));
      }

      setQuery([customer.firstName, customer.lastName].filter(Boolean).join(" ").trim());
    } catch (error) {
      console.error("Error updating customer:", error);
      setLoadError(error instanceof Error ? error.message : "Failed to save customer");
    } finally {
      setSavingCustomer(false);
    }
  };

  return (
    <div className={styles.container}>
      <section className={styles.card}>
                <div className={styles.cardBody}>
                  <div className={styles.headerGrid}>
                    <div className={styles.searchBlock}>
                      <div className={styles.fieldLabel}>Search</div>

                      <div className={styles.searchRow} style={{ position: "relative" }} ref={suggestWrapRef}>
                        <input
                          className={styles.input}
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onFocus={() => suggestions.length && setOpenSuggest(true)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") resolveSearch();
                            if (e.key === "Escape") setOpenSuggest(false);
                          }}
                          placeholder="Search by licence plate, telephone no., or customer name"
                        />
                        <div className={styles.search}>
                          <BsSearch onClick={resolveSearch} />
                        </div>

                        {openSuggest && (
                          <div className={styles.dropdown}>
                            {suggestLoading && <div className={styles.dropdownItem}>Loading...</div>}
                            {suggestError && <div className={styles.dropdownItem}>{suggestError}</div>}

                            {!suggestLoading && !suggestError && suggestions.length === 0 && (
                              <div className={styles.dropdownItem}>No matches</div>
                            )}

                            {!suggestLoading &&
                              !suggestError &&
                              suggestions.map((s, idx) => (
                                <button
                                  key={`${s.kind}-${s.customerId}-${idx}`}
                                  type="button"
                                  className={styles.dropdownButton}
                                  onClick={() => onPickSuggestion(s)}
                                >
                                  <div className={styles.dropdownLabel}>
                                    {s.kind === "vehicle" ? `Reg: ${s.label}` : s.label}
                                  </div>
                                  <div className={styles.dropdownSubLabel}>{s.sublabel}</div>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>

                      {loadError && <div className={styles.errorBanner}>{loadError}</div>}
                    </div>

                    <div className={styles.headerFields}>
                      <Field
                        label="Customer ID"
                        value={customer.customerId}
                        onChange={(v) => setCustomer((c) => ({ ...c, customerId: v }))}
                        placeholder="Customer ID"
                        disabled
                      />
                      <Field
                        label="Name"
                        value={customer.name}
                        onChange={(v) => setCustomer((c) => ({ ...c, name: v }))}
                        placeholder="Customer name"
                        disabled
                      />
                    </div>
                  </div>
                </div>
      </section>

      <div className={styles.grid}>
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2 className={styles.cardTitle}>Customer Vehicles</h2>
                      <p className={styles.cardSubtitle}>Click a row to view vehicle-related information.</p>
                    </div>
                    <div className={styles.actions}>
                      <Button onClick={() => setIsVehicleModalOpen(true)}>Add Vehicle</Button>
                      <Button variant="danger" onClick={handleRemoveVehicle} disabled={!selectedVehicle || removingVehicle}>
                        {removingVehicle ? "Removing..." : "Remove"}
                      </Button>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.tableWrap}>
                      <div className={styles.tableScroll}>
                        <table className={styles.table}>
                          <thead className={styles.thead}>
                            <tr>
                              {["Make", "Model", "Year", "Reg Plate", "Mileage", "Engine #", "Chassis #", "Last Service"].map(
                                (h) => (
                                  <th key={h}>{h}</th>
                                )
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredVehicles.map((v) => {
                              const active = v.id === selectedVehicleId;

                              return (
                                <tr
                                  key={v.id}
                                  onClick={() => setSelectedVehicleId(v.id)}
                                  className={cx(styles.tr, active && styles.trActive)}
                                >
                                  <td className={styles.tdStrong}>{v.make}</td>
                                  <td>{v.model}</td>
                                  <td>{v.year}</td>
                                  <td>{v.regPlate}</td>
                                  <td>{Number(v.mileage || 0).toLocaleString()}</td>
                                  <td>{v.engineNum}</td>
                                  <td>{v.chassisNum}</td>
                                  <td>{v.lastServiceDate}</td>
                                </tr>
                              );
                            })}
                            {filteredVehicles.length === 0 && (
                              <tr>
                                <td colSpan={8} className={styles.emptyCell}>
                                  No vehicles found for this customer.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </section>

                <div className={styles.subCard}>
                  <div className={styles.subCardHeader}>
                    <div>
                      <h3 className={styles.subCardTitle}>Vehicle Information</h3>
                      <p className={styles.subCardSubtitle}>Update specific vehicle information.</p>
                    </div>
                    <Button onClick={handleVehicleUpdate} disabled={!selectedVehicle || updatingVehicle}>
                      {updatingVehicle ? "Updating..." : "Update"}
                    </Button>
                  </div>

                  <div className={styles.customGrid}>
                    {customizableFields.map((f) => (
                      <div key={f.key} className={cx(f.colSpan === 2 && styles.customSpan2)}>
                        {f.key === "serviceDate" ? (
                          (() => {
                            const badge = getServiceBadge(customFields.serviceDate);

                            return (
                              <Field
                                label={f.label}
                                value={customFields[f.key] ?? ""}
                                onChange={(v) => setCustomFields((s) => ({ ...s, [f.key]: v }))}
                                type="date"
                                labelRight={badge ? <span className={badge.className}>{badge.label}</span> : null}
                              />
                            );
                          })()
                        ) : f.key === "oilType" ? (
                          <Field
                            label={f.label}
                            value={customFields[f.key] ?? ""}
                            onChange={(v) => setCustomFields((s) => ({ ...s, [f.key]: v }))}
                          >
                            <select
                              className={styles.input}
                              value={customFields.oilType ?? "regular"}
                              onChange={(e) => setCustomFields((s) => ({ ...s, oilType: e.target.value }))}
                            >
                              <option value="regular">Regular Oil</option>
                              <option value="liqui moly">Liqui Moly</option>
                              <option value="amsoil">Amsoil</option>
                            </select>
                          </Field>
                        ) : (
                          <Field
                            label={f.label}
                            value={customFields[f.key] ?? ""}
                            onChange={(v) => setCustomFields((s) => ({ ...s, [f.key]: v }))}
                            placeholder={f.placeholder}
                            type={f.type}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2 className={styles.cardTitle}>Customer Information</h2>
                      <p className={styles.cardSubtitle}>Edit fields and save changes.</p>
                    </div>
                    <div className={styles.actions}>
                      <Button onClick={() => setIsCustomerModalOpen(true)}>Add Customer</Button>
                      <Button variant="primary" onClick={handleCustomerSave} disabled={!customer.customerId || savingCustomer}>
                        {savingCustomer ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.formGrid}>
                      <Field
                        label="Customer type"
                        value={customer.customerType}
                        onChange={(v) => setCustomer((c) => ({ ...c, customerType: v }))}
                      >
                        <select
                          className={styles.input}
                          value={customer.customerType}
                          onChange={(e) => setCustomer((c) => ({ ...c, customerType: e.target.value }))}
                        >
                          <option value="">Select customer type</option>
                          {custTypes.map((t, index) => (
                            <option key={`${t.custType}-${t.description}-${index}`} value={t.custType}>
                              {t.description}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="First Name" value={customer.firstName} onChange={(v) => setCustomer((c) => ({ ...c, firstName: v }))} />
                      <Field label="Last Name" value={customer.lastName} onChange={(v) => setCustomer((c) => ({ ...c, lastName: v }))} />
                      <Field label="Telephone 1" value={customer.telephone1} onChange={(v) => setCustomer((c) => ({ ...c, telephone1: v }))} />
                      <Field label="Telephone 2" value={customer.telephone2} onChange={(v) => setCustomer((c) => ({ ...c, telephone2: v }))} />
                      <Field label="Fax" value={customer.fax} onChange={(v) => setCustomer((c) => ({ ...c, fax: v }))} />
                      <Field label="E-mail" value={customer.email} onChange={(v) => setCustomer((c) => ({ ...c, email: v }))} />
                      <Field label="Address 1" value={customer.billingAddress1} onChange={(v) => setCustomer((c) => ({ ...c, billingAddress1: v }))} />
                      <Field label="Address 2" value={customer.billingAddress2} onChange={(v) => setCustomer((c) => ({ ...c, billingAddress2: v }))} />
                      <Field label="Parish" value={customer.city} onChange={(v) => setCustomer((c) => ({ ...c, city: v }))} />
                      <Field label="Country" value={customer.country} onChange={(v) => setCustomer((c) => ({ ...c, country: v }))} />
                      <Field label="Zip" value={customer.zip} onChange={(v) => setCustomer((c) => ({ ...c, zip: v }))} />
                    </div>
                  </div>
                </section>
      </div>

      <VehicleModal
        open={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onSave={handleAddVehicle}
      />

      <CustomerModal
        open={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={handleAddCustomer}
        custType={custTypes}
      />
    </div>
  );
}
