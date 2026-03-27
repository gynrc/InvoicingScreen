// "use client";

// import React, { useState } from "react";
// import styles from "../styles/MaintainCustomers.module.css";

// function cx(...cls: Array<string | false | null | undefined>) {
//   return cls.filter(Boolean).join(" ");
// }

// type VehicleInput = {
//   make: string;
//   model: string;
//   year: number;
//   regPlate: string;
//   mileage: number;
//   engineNum: string;
//   chassisNum: string;
//   // lastServiceDate: string;
//   color: string;
//   description: string;
// };

// type VehicleModalProps = {
//   open: boolean;
//   onClose: () => void;
//   onSave: (vehicle: VehicleInput) => Promise<boolean> | boolean;
// };

// const initialForm = {
//   make: "",
//   model: "",
//   year: "",
//   regPlate: "",
//   mileage: "",
//   engineNum: "",
//   chassisNum: "",
//   // lastServiceDate: "",
//   color: "",
//   description: "",
// };

// export default function VehicleModal(props: VehicleModalProps) {
//   const [form, setForm] = useState(initialForm);

//   if (!props.open) return null;

//   const setValue = (key: keyof typeof initialForm, value: string) => {
//     setForm((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleSave = async () => {
//     if (!form.make.trim() || !form.model.trim()) return;

//     props.onSave({
//       make: form.make.trim(),
//       model: form.model.trim(),
//       year: Number(form.year || 0),
//       regPlate: form.regPlate.trim(),
//       mileage: Number(form.mileage || 0),
//       engineNum: form.engineNum.trim(),
//       chassisNum: form.chassisNum.trim(),
//       // lastServiceDate: form.lastServiceDate.trim(),
//       color: form.color.trim(),
//       description: form.description.trim(),
//     });

//     setForm(initialForm);
//     props.onClose();
//   };

//   return (
//     <div
//       className={styles.modalOverlay}
//       role="dialog"
//       aria-modal="true"
//       aria-label="Add vehicle modal"
//     >
//       <div className={styles.modal}>
//         <div className={styles.modalHeader}>
//           <h3 className={styles.modalTitle}>Add Vehicle</h3>
//           {/* <button
//             type="button"
//             className={styles.modalClose}
//             onClick={props.onClose}
//           >
//             x
//           </button> */}
//         </div>

//         <div className={styles.modalBody}>
//           <div className={styles.modalGrid}>
//             <label className={styles.field}>
//               <span className={styles.fieldLabel}>Make</span>
//               <input
//                 className={styles.input}
//                 value={form.make}
//                 onChange={(e) => setValue("make", e.target.value)}
//               />
//             </label>

//             <label className={styles.field}>
//               <span className={styles.fieldLabel}>Model</span>
//               <input
//                 className={styles.input}
//                 value={form.model}
//                 onChange={(e) => setValue("model", e.target.value)}
//               />
//             </label>

//             <label className={styles.field}>
//               <span className={styles.fieldLabel}>Year</span>
//               <input
//                 className={styles.input}
//                 value={form.year}
//                 onChange={(e) => setValue("year", e.target.value)}
//               />
//             </label>

//             <label className={styles.field}>
//               <span className={styles.fieldLabel}>Reg Plate (Licence) </span>
//               <input
//                 className={styles.input}
//                 value={form.regPlate}
//                 onChange={(e) => setValue("regPlate", e.target.value)}
//               />
//             </label>

//             <label className={styles.field}>
//               <span className={styles.fieldLabel}>Mileage</span>
//               <input
//                 className={styles.input}
//                 value={form.mileage}
//                 onChange={(e) => setValue("mileage", e.target.value)}
//               />
//             </label>

//             <label className={styles.field}>
//               <span className={styles.fieldLabel}>Engine #</span>
//               <input
//                 className={styles.input}
//                 value={form.engineNum}
//                 onChange={(e) => setValue("engineNum", e.target.value)}
//               />
//             </label>

//             <label className={styles.field}>
//               <span className={styles.fieldLabel}>Chassis #</span>
//               <input
//                 className={styles.input}
//                 value={form.chassisNum}
//                 onChange={(e) => setValue("chassisNum", e.target.value)}
//               />
//             </label>

//             {/* <label className={styles.field}>
//               <span className={styles.fieldLabel}>Last Service</span>
//               <input
//                 className={styles.input}
//                 value={form.lastServiceDate}
//                 onChange={(e) => setValue("lastServiceDate", e.target.value)}
//               />
//             </label> */}

//             <label className={styles.field}>
//               <span className={styles.fieldLabel}>Colour</span>
//               <input
//                 className={styles.input}
//                 value={form.color}
//                 onChange={(e) => setValue("color", e.target.value)}
//                 maxLength={20}
//               />
//             </label>

//             <label className={styles.field}>
//               <span className={styles.fieldLabel}>Description</span>
//               <textarea
//                 className={styles.input}
//                 value={form.description}
//                 onChange={(e) => setValue("description", e.target.value)}
//                 maxLength={255}
//                 rows={3}
//               />
//             </label>
//           </div>
//         </div>

//         <div className={styles.modalFooter}>
//           <button
//             type="button"
//             className={cx(styles.btn, styles.btnDefault)}
//             onClick={props.onClose}
//           >
//             Cancel
//           </button>
//           <button
//             type="button"
//             className={cx(styles.btn, styles.btnPrimary)}
//             onClick={handleSave}
//           >
//             Save Vehicle
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "../styles/MaintainCustomers.module.css";

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

type VehicleInput = {
  make: string;
  model: string;
  year: number;
  regPlate: string;
  mileage: number;
  engineNum: string;
  chassisNum: string;
  color: string;
  description: string;
};

type VehicleModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (vehicle: VehicleInput) => Promise<boolean> | boolean;
};

type Option = {
  id: string;
  name: string;
};

const initialForm = {
  make: "",
  model: "",
  year: "",
  regPlate: "",
  mileage: "",
  engineNum: "",
  chassisNum: "",
  color: "",
  description: "",
};

export default function VehicleModal(props: VehicleModalProps) {
  const [form, setForm] = useState(initialForm);

  const [makes, setMakes] = useState<Option[]>([]);
  const [models, setModels] = useState<Option[]>([]);

  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  const [makeError, setMakeError] = useState("");
  const [modelError, setModelError] = useState("");

  const selectedMakeName = useMemo(() => {
    return makes.find((m) => m.id === form.make)?.name || "";
  }, [makes, form.make]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 40 }, (_, index) => String(currentYear + 1 - index));
  }, []);

  const setValue = (key: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (!props.open) return;

    const loadMakes = async () => {
      try {
        setLoadingMakes(true);
        setMakeError("");

        const res = await fetch("/api/makes", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load makes");
        }

        setMakes(Array.isArray(json?.data) ? json.data : []);
      } catch (error: unknown) {
        setMakeError(error instanceof Error ? error.message : "Unable to load makes");
      } finally {
        setLoadingMakes(false);
      }
    };

    loadMakes();
  }, [props.open]);

  useEffect(() => {
    if (!props.open) return;

    if (!form.make) {
      setModels([]);
      setForm((prev) => {
        if (!prev.model) return prev;
        return { ...prev, model: "" };
      });
      return;
    }

    const loadModels = async () => {
      try {
        setLoadingModels(true);
        setModelError("");
        const makeName = makes.find((item) => item.id === form.make)?.name || "";

        const res = await fetch(
          `/api/makes?make=${encodeURIComponent(form.make)}&makeName=${encodeURIComponent(makeName)}`,
          { cache: "no-store" }
        );
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load models");
        }

        setModels(Array.isArray(json?.data) ? json.data : []);
      } catch (error: unknown) {
        setModelError(error instanceof Error ? error.message : "Unable to load models");
      } finally {
        setLoadingModels(false);
      }
    };

    loadModels();
  }, [props.open, form.make, makes]);

  const handleSave = async () => {
    const makeName = selectedMakeName || form.make;

    if (!makeName.trim() || !form.model.trim()) return;

    const success = await props.onSave({
      make: makeName.trim(),
      model: form.model.trim(),
      year: Number(form.year || 0),
      regPlate: form.regPlate.trim(),
      mileage: Number(form.mileage || 0),
      engineNum: form.engineNum.trim(),
      chassisNum: form.chassisNum.trim(),
      color: form.color.trim(),
      description: form.description.trim(),
    });

    if (success !== false) {
      setForm(initialForm);
      setModels([]);
      setMakeError("");
      setModelError("");
      props.onClose();
    }
  };

  if (!props.open) return null;

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Add vehicle modal"
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Add Vehicle</h3>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Make</span>
              <select
                className={styles.input}
                value={form.make}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    make: e.target.value,
                    model: "",
                  }))
                }
                disabled={loadingMakes}
              >
                <option value="">
                  {loadingMakes ? "Loading makes..." : "Select make"}
                </option>
                {makes.map((make) => (
                  <option key={make.id} value={make.id}>
                    {make.name}
                  </option>
                ))}
              </select>
              {makeError ? <small>{makeError}</small> : null}
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Model</span>
              <select
                className={styles.input}
                value={form.model}
                onChange={(e) => setValue("model", e.target.value)}
                disabled={!form.make || loadingModels}
              >
                <option value="">
                  {!form.make
                    ? "Select make first"
                    : loadingModels
                    ? "Loading models..."
                    : "Select model"}
                </option>
                {models.map((model) => (
                  <option key={model.id} value={model.name}>
                    {model.name}
                  </option>
                ))}
              </select>
              {modelError ? <small>{modelError}</small> : null}
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Year</span>
              <select className={styles.input} value={form.year} onChange={(e) => setValue("year", e.target.value)}>
                <option value="">Select year</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Reg Plate (Licence)</span>
              <input
                className={styles.input}
                value={form.regPlate}
                onChange={(e) => setValue("regPlate", e.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Mileage</span>
              <input
                className={styles.input}
                value={form.mileage}
                onChange={(e) => setValue("mileage", e.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Engine #</span>
              <input
                className={styles.input}
                value={form.engineNum}
                onChange={(e) => setValue("engineNum", e.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Chassis #</span>
              <input
                className={styles.input}
                value={form.chassisNum}
                onChange={(e) => setValue("chassisNum", e.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Colour</span>
              <input
                className={styles.input}
                value={form.color}
                onChange={(e) => setValue("color", e.target.value)}
                maxLength={20}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Description</span>
              <textarea
                className={styles.input}
                value={form.description}
                onChange={(e) => setValue("description", e.target.value)}
                maxLength={255}
                rows={3}
              />
            </label>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={cx(styles.btn, styles.btnDefault)}
            onClick={props.onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={cx(styles.btn, styles.btnPrimary)}
            onClick={handleSave}
          >
            Save Vehicle
          </button>
        </div>
      </div>
    </div>
  );
}
