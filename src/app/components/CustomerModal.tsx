"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "../styles/MaintainCustomers.module.css";

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

export type CustTypeOption = {
  custType: string;
  description: string;
};

export type CustomerCreateInput = {
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
};

type CustomerModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (customer: CustomerCreateInput) => Promise<boolean> | boolean;
  custType?: CustTypeOption[];
};

type FormState = CustomerCreateInput;

const initialForm: FormState = {
  custType: "",
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  parish: "",
  country: "",
  telephone1: "",
  telephone2: "",
  email: "",
  fax: "",
  zip: "",
  primaryContact: "",
};

export default function CustomerModal({
  open,
  onClose,
  onSave,
  custType = [],
}: CustomerModalProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initialForm);
  }, [open]);

  useEffect(() => {
    if (!open || form.custType || custType.length === 0) return;
    setForm((prev) => ({ ...prev, custType: custType[0].custType }));
  }, [open, form.custType, custType]);

  const setValue = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

 const cleaned = useMemo(() => {
  const trim = (v?: string) => (v ?? "").trim();
  return {
    ...form,
    custType: trim(form.custType),
    firstName: trim(form.firstName),
    lastName: trim(form.lastName),
    address1: trim(form.address1),
    address2: trim(form.address2),
    parish: trim(form.parish),
    country: trim(form.country),
    telephone1: trim(form.telephone1),
    telephone2: trim(form.telephone2),
    email: trim(form.email),
    fax: trim(form.fax),
    zip: trim(form.zip),
    primaryContact: trim(form.primaryContact),
  };
}, [form]);

  const emailOk =
    cleaned.email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email);

  const canSave =
    cleaned.custType.length > 0 &&
    cleaned.firstName.length > 0 &&
    cleaned.lastName.length > 0 &&
    emailOk &&
    !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    setSaving(true);
    try {
      const ok = await onSave(cleaned);
      if (ok !== false) {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Add customer modal"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Add Customer</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.modalGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Customer Type</span>
                <select
                  className={styles.input}
                  value={form.custType}
                  onChange={(e) => setValue("custType", e.target.value)}
                >
                  <option value="">Select customer type</option>
                  {custType.map((type, index) => (
                    <option
                      key={`${type.custType}-${type.description}-${index}`}
                      value={type.custType}
                    >
                      {type.description}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>First Name</span>
                <input
                  className={styles.input}
                  value={form.firstName}
                  onChange={(e) => setValue("firstName", e.target.value)}
                  required
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Last Name</span>
                <input
                  className={styles.input}
                  value={form.lastName}
                  onChange={(e) => setValue("lastName", e.target.value)}
                  required
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Telephone 1</span>
                <input
                  className={styles.input}
                  type="tel"
                  value={form.telephone1}
                  onChange={(e) => setValue("telephone1", e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Telephone 2</span>
                <input
                  className={styles.input}
                  type="tel"
                  value={form.telephone2}
                  onChange={(e) => setValue("telephone2", e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Fax</span>
                <input
                  className={styles.input}
                  value={form.fax}
                  onChange={(e) => setValue("fax", e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Email</span>
                <input
                  className={styles.input}
                  type="email"
                  value={form.email}
                  onChange={(e) => setValue("email", e.target.value)}
                  placeholder="name@example.com"
                />
                {cleaned.email.length > 0 && !emailOk && (
                  <span className={styles.fieldHint} role="alert">
                    Please enter a valid email address.
                  </span>
                )}
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Address 1</span>
                <input
                  className={styles.input}
                  value={form.address1}
                  onChange={(e) => setValue("address1", e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Address 2</span>
                <input
                  className={styles.input}
                  value={form.address2}
                  onChange={(e) => setValue("address2", e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Parish</span>
                <input
                  className={styles.input}
                  value={form.parish}
                  onChange={(e) => setValue("parish", e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Country</span>
                <input
                  className={styles.input}
                  value={form.country}
                  onChange={(e) => setValue("country", e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Zip</span>
                <input
                  className={styles.input}
                  value={form.zip}
                  onChange={(e) => setValue("zip", e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Primary Contact</span>
                <input
                  className={styles.input}
                  value={form.primaryContact}
                  onChange={(e) => setValue("primaryContact", e.target.value)}
                  placeholder="Contact person name"
                />
              </label>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={cx(styles.btn, styles.btnDefault)}
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cx(styles.btn, styles.btnPrimary)}
              disabled={!canSave}
            >
              {saving ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}