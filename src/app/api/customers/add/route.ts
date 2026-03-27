import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import sql from "@/config/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const firstName = body.firstName;
    const lastName = body.lastName;
    const address1 = body.address1;
    const address2 = body.address2;
    const parish = body.parish;
    const country = body.country;
    const telephone1 = body.telephone1;
    const telephone2 = body.telephone2;
    const fax = body.fax;
    const email = body.email;
    const zip = body.zip;
    const primaryContact = body.primaryContact;
    const custType = body.zip;
    const lastUpdatedBy = body.zip;

    const pool = await connectDB();

    const result = await pool
      .request()
    //   .input("LocationID", sql.Int, locationId)
      .input("CustomerType", sql.Int, custType)
      .input("First_Name", sql.VarChar(30), firstName)
      .input("Last_Name", sql.VarChar(60), lastName)
      .input("Middle_Initial", sql.VarChar(6), null)
      .input("Address1", sql.VarChar(60), address1)
      .input("Address2", sql.VarChar(60), address2)
      .input("Parish", sql.VarChar(20), parish)
      .input("Country", sql.VarChar(40), country)
      .input("Telephone_1", sql.VarChar(30), telephone1)
      .input("Telephone_2", sql.VarChar(30), telephone2)
      .input("Fax_no", sql.VarChar(30), fax)
      .input("Email", sql.VarChar(100), email)
      .input("PrimaryContact", sql.VarChar(60), primaryContact)
      .input("Zipcode", sql.VarChar(9), zip)
      .input("Last_Updated_By", sql.VarChar(25), lastUpdatedBy)
      .execute("spSuiteAddCustomer");

    return NextResponse.json(
      {
        ok: true,
        customer: result.recordset?.[0] ?? null,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/customers failed:", error);

    const sqlError = error as { message?: string; number?: number };

    if (
      typeof sqlError.number === "number" &&
      sqlError.number >= 50000 &&
      sqlError.number < 51000
    ) {
      return NextResponse.json(
        { ok: false, message: sqlError.message ?? "Database validation error." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, message: "Failed to save customer." },
      { status: 500 }
    );
  }
}