import React from "react";
import styles from "../styles/Receipt.module.css";

type ReceiptLine = {
  line: string;
  opcode: string;
  technician: string;
  type: string;
  hours: string;
  description: string;
  net: string;
  total: string;
};

type Totals = {
  laborAmount: string;
  partsAmount: string;
  gasOilLube: string;
  subletAmount: string;
  miscCharges: string;
  totalCharges: string;
  lessInsurance: string;
  gct: string;
  amountDue: string;
};

type ReceiptProps = {
  customerNumber?: string;
  invoiceNumber?: string;
  pageNumber?: string;
  customerName?: string;
  addressLines?: string[];
  homePhone?: string;
  contactPhone?: string;
  businessPhone?: string;
  cellPhone?: string;
  serviceAdvisor?: string;
  color?: string;
  year?: string;
  makeModel?: string;
  vin?: string;
  license?: string;
  mileageIn?: string;
  mileageOut?: string;
  tag?: string;
  deliveryDate?: string;
  productionDate?: string;
  warrantyExpiry?: string;
  promisedDate?: string;
  poNumber?: string;
  rate?: string;
  paymentType?: string;
  invoiceDate?: string;
  roOpened?: string;
  readyDate?: string;
  optionsText?: string;
  complaintSections?: string[];
  receiptLines?: ReceiptLine[];
  totals?: Totals;
};

const defaultReceiptLines: ReceiptLine[] = [
  {
    line: "A",
    opcode: "VINSP-31",
    technician: "178",
    type: "CPN",
    hours: "0.00",
    description: "Inspect Front Brakes - Checked",
    net: "0.00",
    total: "0.00",
  },
  {
    line: "A",
    opcode: "VINSP-32",
    technician: "178",
    type: "CPN",
    hours: "0.00",
    description: "Inspect Rear Brakes - Checked",
    net: "0.00",
    total: "0.00",
  },
  {
    line: "A",
    opcode: "VINSP-33",
    technician: "178",
    type: "CPN",
    hours: "0.00",
    description: "Inspect Brake Lines and Hydraulic System - Checked",
    net: "0.00",
    total: "0.00",
  },
  {
    line: "B",
    opcode: "96505",
    technician: "178",
    type: "CPN",
    hours: "1.50",
    description: "Performed diagnostic scan fault codes for turbo charge system current",
    net: "6600.00",
    total: "6600.00",
  },
  {
    line: "C",
    opcode: "9996",
    technician: "178",
    type: "CPN",
    hours: "8.00",
    description: "Turbo charger was replaced and fault codes erased, intake hoses will need replacing",
    net: "46400.00",
    total: "46400.00",
  },
  {
    line: "D",
    opcode: "96505",
    technician: "178",
    type: "CPN",
    hours: "0.00",
    description: "No faults found at this time",
    net: "0.00",
    total: "0.00",
  },
];

const defaultComplaintSections = [
  "A POINT CHECK COMPLETED, TYRES WILL NEED REPLACING, STABILIZER BAR LINKS AND RUBBERS AND WIPER BLADES, COOLANT RESERVOIR CAP MISSING",
  "B PERFORM DIAGNOSTIC CHECK OF ALL COMPUTER RELATED SENSORS, AND ADVISE CUSTOMERS OF ADDITIONAL REPAIRS",
  "C CHECK VEHICLE EXPERIENCE LACK POWER ESPECIALLY GOING UP HILL",
  "D CHECK ROUGH VIBRATION FROM ENGINE",
  "E PERFORM FOLLOW UP, ROAD TEST, ENSURE ALL PROBLEMS ARE SOLVED BEFORE DELIVERY",
];

const defaultTotals: Totals = {
  laborAmount: "53000.00",
  partsAmount: "0.00",
  gasOilLube: "0.00",
  subletAmount: "0.00",
  miscCharges: "0.00",
  totalCharges: "53000.00",
  lessInsurance: "0.00",
  gct: "0.00",
  amountDue: "53000.00",
};

export default function Receipt({
  customerNumber = "603414",
  invoiceNumber = "205216",
  pageNumber = "3",
  customerName = "A-CREW LTD",
  addressLines = ["18 DOMINICA DRIVE", "KINGSTON 5"],
  homePhone = "",
  contactPhone = "N/A",
  businessPhone = "",
  cellPhone = "",
  serviceAdvisor = "131 KEISHA WALKER",
  color = "WHITE",
  year = "18",
  makeModel = "NISSAN CARAVAN",
  vin = "VW2E26103352",
  license = "CT4752",
  mileageIn = "96505",
  mileageOut = "96505",
  tag = "T16",
  deliveryDate = "01JAN25",
  productionDate = "",
  warrantyExpiry = "01JAN2025 17:00",
  promisedDate = "07MAY25",
  poNumber = "",
  rate = "750.00",
  paymentType = "VISA",
  invoiceDate = "16MAY25",
  roOpened = "08:43 07MAY25",
  readyDate = "11:29 16MAY25",
  optionsText = "DLR:419 ENG:YD25015198B",
  complaintSections = defaultComplaintSections,
  receiptLines = defaultReceiptLines,
  totals = defaultTotals,
}: ReceiptProps) {
  return (
    <div className={styles.receiptPage}>
      {/* <div className={styles.printActions}>
        <button className={styles.printButton} onClick={() => window.print()}>
          Print Receipt
        </button>
      </div> */}

      <div className={styles.paper}>
        <header className={styles.topHeader}>
          <div className={styles.leftHeader}>
            <div className={styles.headerRow}>
              <span className={styles.label}>CUSTOMER #:</span>
              <span>{customerNumber}</span>
            </div>

            <div className={styles.customerBlock}>
              <div>{customerName}</div>
              {addressLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>

            {/* <div className={styles.contactRow}>
              <span>HOME:</span>
              <span>{homePhone}</span>
              <span className={styles.contactGap}>CONT:</span>
              <span>{contactPhone}</span>
            </div>

            <div className={styles.contactRow}>
              <span>BUS:</span>
              <span>{businessPhone}</span>
              <span className={styles.contactGap}>CELL:</span>
              <span>{cellPhone}</span>
            </div> */}
          </div>

          <div className={styles.centerHeader}>
            <div className={styles.invoiceNumber}>{invoiceNumber}</div>
            <div className={styles.invoiceWord}>INVOICE</div>
            <div className={styles.pageWord}>PAGE {pageNumber}</div>
          </div>

          <div className={styles.rightHeader}>
            {/* <div className={styles.logoCircle}>BAP</div> */}
            <div className={styles.companyName}>Bert's Auto Parts</div>
            <div className={styles.companyText}>6-10 Camp Road</div>
            <div className={styles.companyText}>Kingston, Jamaica W.I.</div>
            <div className={styles.companyText}>TEL: (876) 618-2378</div>
            <div className={styles.companyText}>https://www.bertsautoparts.com/</div>
          </div>
        </header>

        <section className={styles.metaSection}>
          <div className={styles.serviceAdvisorRow}>
            <div className={styles.serviceAdvisorLabel}>SERVICE ADVISOR:</div>
            <div className={styles.serviceAdvisorValue}>{serviceAdvisor}</div>
          </div>

          <table className={styles.metaTable}>
            <thead>
              <tr>
                <th>COLOR</th>
                <th>YEAR</th>
                <th>MAKE/MODEL</th>
                <th>VIN</th>
                <th>LICENSE</th>
                <th>MILEAGE IN / OUT</th>
                <th>TAG</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{color}</td>
                <td>{year}</td>
                <td>{makeModel}</td>
                <td>{vin}</td>
                <td>{license}</td>
                <td>
                  {mileageIn}/{mileageOut}
                </td>
                <td>{tag}</td>
              </tr>
            </tbody>
          </table>

          <table className={styles.metaTable}>
            <thead>
              <tr>
                <th>DEL. DATE</th>
                <th>PROD. DATE</th>
                <th>WAR. EXP.</th>
                <th>PROMISED</th>
                <th>PO NO.</th>
                <th>RATE</th>
                <th>PAYMENT</th>
                <th>INV. DATE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{deliveryDate}</td>
                <td>{productionDate}</td>
                <td>{warrantyExpiry}</td>
                <td>{promisedDate}</td>
                <td>{poNumber}</td>
                <td>{rate}</td>
                <td>{paymentType}</td>
                <td>{invoiceDate}</td>
              </tr>
            </tbody>
          </table>

          <div className={styles.roRow}>
            <div className={styles.roBox}>
              <span className={styles.label}>R.O. OPENED</span>
              <span>{roOpened}</span>
            </div>
            <div className={styles.roBox}>
              <span className={styles.label}>READY</span>
              <span>{readyDate}</span>
            </div>
            <div className={styles.roBoxWide}>
              <span className={styles.label}>OPTIONS:</span>
              <span>{optionsText}</span>
            </div>
          </div>
        </section>

        <section className={styles.linesSection}>
          <table className={styles.linesTable}>
            <thead>
              <tr>
                <th>CODE</th>
                <th>QUANTITY</th>
                <th>DESCRIPTION</th>
                <th>UNIT PRICE</th>
                <th>TAX</th>
                <th>AMOUNT</th>
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {receiptLines.map((item, index) => (
                <tr key={`${item.opcode}-${index}`}>
                  <td>{item.line}</td>
                  <td>{item.line}</td>
                  <td>{item.type}</td>
                  <td>{item.hours}</td>
                  <td className={styles.descriptionCell}>{item.description}</td>
                  <td className={styles.amountCell}>{item.net}</td>
                  <td className={styles.amountCell}>{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className={styles.commentsSection}>
          {complaintSections.map((section) => (
            <div key={section} className={styles.commentLine}>
              {section}
            </div>
          ))}
        </section>

        <footer className={styles.bottomSection}>
          <div className={styles.conditionsBox}>
            <div className={styles.conditionsTitle}>CONDITIONS OF REPAIRS</div>
            <p>
              I hereby authorize the repair work herein set forth to be done along with the
              necessary material and agree that you are not responsible for loss or damage to
              vehicle or articles left in vehicle in case of fire, theft or any other cause
              beyond your control or for any delays caused by unavailability of parts or delays
              in parts shipments by the supplier or transporter. I hereby grant you and/or your
              employees permission to operate the vehicle herein described on streets, highways
              or elsewhere for the purpose of testing and/or inspection. An express mechanic's
              lien is hereby acknowledged on above vehicle to secure the amount of repairs
              thereto.
            </p>

            <div className={styles.signatureLine}>Customer's Signature</div>
            {/* <div className={styles.overleafText}>
              SEE OVERLEAF FOR CONDITIONS OF SERVICE/REPAIR
            </div> */}
          </div>

          <div className={styles.totalsBox}>
            <table className={styles.totalsTable}>
              <tbody>
                <tr>
                  <td>LABOR AMOUNT</td>
                  <td>{totals.laborAmount}</td>
                </tr>
                <tr>
                  <td>PARTS AMOUNT</td>
                  <td>{totals.partsAmount}</td>
                </tr>
                <tr>
                  <td>GAS, OIL, LUBE</td>
                  <td>{totals.gasOilLube}</td>
                </tr>
                <tr>
                  <td>SUBLET AMOUNT</td>
                  <td>{totals.subletAmount}</td>
                </tr>
                <tr>
                  <td>MISC. CHARGES</td>
                  <td>{totals.miscCharges}</td>
                </tr>
                <tr>
                  <td>TOTAL CHARGES</td>
                  <td>{totals.totalCharges}</td>
                </tr>
                <tr>
                  <td>LESS INSURANCE</td>
                  <td>{totals.lessInsurance}</td>
                </tr>
                <tr>
                  <td>G.C.T.</td>
                  <td>{totals.gct}</td>
                </tr>
                <tr className={styles.amountDueRow}>
                  <td>PLEASE PAY THIS AMOUNT</td>
                  <td>{totals.amountDue}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </footer>
      </div>
    </div>
  );
}