// import { NextResponse } from "next/server";
// import { connectDB } from "@/config/db";

// type Action = "suggest" | "load" | "resolve";

// function normalizePhone(q: string) {
//   return q.replace(/[^\d]/g, "");
// }

// function detectMode(q: string): "regno" | "phone" | "name" {
//   const hasLetters = /[A-Za-z]/.test(q);
//   const digitsOnly = normalizePhone(q);

//   if (digitsOnly.length >= 7 && !hasLetters) return "phone";
//   if (hasLetters && /\d/.test(q)) return "regno";
//   return "name";
// }

// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url);
//   const action = (searchParams.get("action") ?? "suggest") as Action;

//   try {
//     const pool = await connectDB();

//     // --------- LOAD: customer + all vehicles by CustomerID ----------
//     if (action === "load") {
//       const customerId = (searchParams.get("customerId") ?? "").trim();
//       if (!customerId) {
//         return NextResponse.json({ error: "Missing customerId" }, { status: 400 });
//       }

//       const customerRes = await pool
//         .request()
//         .input("customerId", sql.VarChar(50), customerId)
//         .query(`SELECT TOP 1 * FROM Customer WHERE CustomerID = @customerId`);

//       const fleetRes = await pool
//         .request()
//         .input("customerId", sql.VarChar(50), customerId)
//         .query(`SELECT * FROM CustomerFleet WHERE CustomerID = @customerId ORDER BY RegNo ASC`);

//       return NextResponse.json({
//         customer: customerRes.recordset?.[0] ?? null,
//         vehicles: fleetRes.recordset ?? [],
//       });
//     }

//     // Both suggest/resolve need q
//     const qRaw = (searchParams.get("q") ?? "").trim();
//     if (!qRaw) {
//       return NextResponse.json(
//         action === "suggest" ? { suggestions: [] } : { customer: null, vehicles: [] }
//       );
//     }

//     // --------- SUGGEST: lightweight dropdown ----------
//     if (action === "suggest") {
//       if (qRaw.length < 2) return NextResponse.json({ suggestions: [] });

//       const qPhone = normalizePhone(qRaw);

//       // return small results from BOTH customers + vehicles
//       const result = await pool
//         .request()
//         .input("q", sql.VarChar(80), qRaw)
//         .input("qPhone", sql.VarChar(40), qPhone)
//         .query(`
//           -- customer name / phone suggestions
//           SELECT TOP 8
//             'customer' AS kind,
//             c.CustomerID AS customerId,
//             LTRIM(RTRIM(ISNULL(c.First_Name,''))) AS firstName,
//             LTRIM(RTRIM(ISNULL(c.Last_Name,''))) AS lastName,
//             ISNULL(c.Telephone_1,'') AS tel1,
//             ISNULL(c.Cell,'') AS cell
//           FROM Customer c
//           WHERE
//             c.First_Name LIKE '%' + @q + '%'
//             OR c.Last_Name LIKE '%' + @q + '%'
//             OR (c.First_Name + ' ' + c.Last_Name) LIKE '%' + @q + '%'
//             OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(ISNULL(c.Telephone_1,''), ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') LIKE '%' + @qPhone + '%'
//             OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(ISNULL(c.Telephone_2,''), ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') LIKE '%' + @qPhone + '%'
//             OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(ISNULL(c.Cell,''),        ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') LIKE '%' + @qPhone + '%'
//           ORDER BY c.Last_Updated DESC;

//           -- vehicle reg suggestions
//           SELECT TOP 8
//             'vehicle' AS kind,
//             f.CustomerID AS customerId,
//             f.RegNo AS regNo,
//             ISNULL(f.Make,'') AS make,
//             ISNULL(f.Model,'') AS model,
//             ISNULL(f.ModelYear, 0) AS modelYear
//           FROM CustomerFleet f
//           WHERE f.RegNo LIKE '%' + @q + '%'
//           ORDER BY f.RegNo ASC;
//         `);

//       const customers = result.recordsets?.[0] ?? [];
//       const vehicles = result.recordsets?.[1] ?? [];

//       const suggestions = [
//         ...customers.map((c: { customerId?: string; firstName?: string; lastName?: string; tel1?: string; cell?: string }) => {
//           const label = `${c.firstName} ${c.lastName}`.trim() || `Customer ${c.customerId}`;
//           const sub = [c.tel1, c.cell].filter(Boolean).join(" • ");
//           return { kind: "customer", customerId: c.customerId, label, sublabel: sub };
//         }),
//         ...vehicles.map((v: { customerId?: string; regNo?: string; make?: string; model?: string; modelYear?: number }) => {
//           const label = v.regNo;
//           const sub = `${v.make} ${v.model} ${v.modelYear || ""}`.trim();
//           return { kind: "vehicle", customerId: v.customerId, label, sublabel: sub };
//         }),
//       ];

//       return NextResponse.json({ suggestions });
//     }

//     // --------- RESOLVE: if user hits Search button without picking from dropdown ----------
//     // Find the "best" customer based on q (regno/phone/name), then return customer+fleet
//     const mode = detectMode(qRaw);
//     const qPhone = normalizePhone(qRaw);

//     const found = await pool
//       .request()
//       .input("q", sql.VarChar(80), qRaw)
//       .input("qPhone", sql.VarChar(40), qPhone)
//       .query(`
//         SELECT TOP 1 c.CustomerID
//         FROM Customer c
//         WHERE
//           ${
//             mode === "regno"
//               ? `EXISTS (
//                    SELECT 1
//                    FROM CustomerFleet f
//                    WHERE f.CustomerID = c.CustomerID
//                      AND REPLACE(UPPER(f.RegNo), ' ', '') = REPLACE(UPPER(@q), ' ', '')
//                  )`
//               : "1=0"
//           }
//           OR ${
//             mode === "phone"
//               ? `(
//                    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(ISNULL(c.Telephone_1,''), ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') LIKE '%' + @qPhone + '%'
//                 OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(ISNULL(c.Telephone_2,''), ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') LIKE '%' + @qPhone + '%'
//                 OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(ISNULL(c.Cell,''),        ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') LIKE '%' + @qPhone + '%'
//                  )`
//               : "1=0"
//           }
//           OR ${
//             mode === "name"
//               ? `(
//                    c.First_Name LIKE '%' + @q + '%'
//                 OR c.Last_Name  LIKE '%' + @q + '%'
//                 OR (c.First_Name + ' ' + c.Last_Name) LIKE '%' + @q + '%'
//                  )`
//               : "1=0"
//           }
//         ORDER BY c.Last_Updated DESC
//       `);

//     const customerId = found.recordset?.[0]?.CustomerID as string | undefined;
//     if (!customerId) return NextResponse.json({ customer: null, vehicles: [] });

//     const customerRes = await pool
//       .request()
//       .input("customerId", sql.VarChar(50), customerId)
//       .query(`SELECT TOP 1 * FROM Customer WHERE CustomerID = @customerId`);

//     const fleetRes = await pool
//       .request()
//       .input("customerId", sql.VarChar(50), customerId)
//       .query(`SELECT * FROM CustomerFleet WHERE CustomerID = @customerId ORDER BY RegNo ASC`);

//     return NextResponse.json({
//       customer: customerRes.recordset?.[0] ?? null,
//       vehicles: fleetRes.recordset ?? [],
//     });
//   } catch (err: unknown) {
//     const message = err instanceof Error ? err.message : "Unknown error";
//     return NextResponse.json({ error: message }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";

type Action = "suggest" | "load" | "resolve";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = (searchParams.get("action") ?? "suggest") as Action;

  try {
    const pool = await connectDB();

    if (action === "load") {
      const customerId = (searchParams.get("customerId") ?? "").trim();

      if (!customerId) {
        return NextResponse.json({ error: "Missing customerId" }, { status: 400 });
      }

      const result = await pool
        .request()
        .input("CustomerID", customerId)
        .execute("spSuiteCustomerLoad");

      return NextResponse.json({
        customer: result.recordsets?.[0]?.[0] ?? null,
        vehicles: result.recordsets?.[1] ?? [],
      });
    }

    const qRaw = (searchParams.get("q") ?? "").trim();

    if (!qRaw) {
      return NextResponse.json(
        action === "suggest"
          ? { suggestions: [] }
          : { customer: null, vehicles: [] }
      );
    }

    if (action === "suggest") {
      const result = await pool
        .request()
        .input("Query", qRaw)
        .execute("spSuiteCustomerSuggest");

      const suggestions = (result.recordset ?? []).map((row: Record<string, unknown>) => ({
        kind: String(row.kind ?? ""),
        customerId: String(row.customerId ?? ""),
        label: String(row.label ?? ""),
        sublabel: String(row.sublabel ?? ""),
      }));

      return NextResponse.json({ suggestions });
    }

    const result = await pool
      .request()
      .input("Query", qRaw)
      .execute("spSuiteCustomerResolve");

    return NextResponse.json({
      customer: result.recordsets?.[0]?.[0] ?? null,
      vehicles: result.recordsets?.[1] ?? [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
