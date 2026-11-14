import "server-only";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { InvoiceForView } from "@/components/invoice-view";
import { formatGBP } from "./money";
import { site } from "./site";

// PDFs are printed, so they stay light. Brand colours from the logo (globals.css: --brand / --accent).
const INK = "#17152b";
const BRAND = "#7c3aed";
const MUTED = "#5b5875";
const LINE = "#e4defc";

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10, color: INK, fontFamily: "Helvetica" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  h1: { fontSize: 22, fontFamily: "Helvetica-Bold" },
  brand: { fontSize: 20, fontFamily: "Times-Bold", letterSpacing: 5, color: BRAND },
  muted: { color: MUTED },
  label: { color: MUTED, marginBottom: 2 },
  section: { marginTop: 28 },
  th: { flexDirection: "row", borderBottomWidth: 1, borderColor: LINE, paddingBottom: 6, color: MUTED },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderColor: LINE, paddingVertical: 8 },
  desc: { flex: 1 },
  num: { width: 80, textAlign: "right" },
  totals: { marginTop: 16, marginLeft: "auto", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grand: { fontFamily: "Helvetica-Bold", fontSize: 12, borderTopWidth: 1, borderColor: LINE, paddingTop: 6, marginTop: 4 },
});

const d = (date: Date | null) => (date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");

function InvoicePdf({ invoice }: { invoice: InvoiceForView }) {
  return (
    <Document title={`Invoice ${invoice.number ?? "draft"}`} author={site.name}>
      <Page size="A4" style={s.page}>
        <View style={s.row}>
          <View>
            <Text style={s.brand}>{site.name.toUpperCase()}</Text>
            <Text style={s.muted}>{site.email}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.h1}>INVOICE</Text>
            <Text style={s.muted}>{invoice.number ?? "DRAFT"}</Text>
            {invoice.status === "PAID" && <Text style={{ marginTop: 6, fontFamily: "Helvetica-Bold" }}>PAID {d(invoice.paidAt)}</Text>}
          </View>
        </View>

        <View style={[s.row, s.section]}>
          <View>
            <Text style={s.label}>Billed to</Text>
            <Text>{invoice.client.profile?.company || invoice.client.name}</Text>
            <Text style={s.muted}>{invoice.client.email}</Text>
            {invoice.client.profile?.address ? <Text style={s.muted}>{invoice.client.profile.address}</Text> : null}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text>
              <Text style={s.muted}>Issue date: </Text>
              {d(invoice.issueDate)}
            </Text>
            <Text>
              <Text style={s.muted}>Due date: </Text>
              {d(invoice.dueDate)}
            </Text>
            {invoice.project ? (
              <Text>
                <Text style={s.muted}>Project: </Text>
                {invoice.project.title}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={s.section}>
          <View style={s.th}>
            <Text style={s.desc}>Description</Text>
            <Text style={s.num}>Qty</Text>
            <Text style={s.num}>Unit price</Text>
            <Text style={s.num}>Amount</Text>
          </View>
          {invoice.lines.map((l) => (
            <View key={l.id} style={s.tr}>
              <Text style={s.desc}>{l.description}</Text>
              <Text style={s.num}>{l.quantity}</Text>
              <Text style={s.num}>{formatGBP(l.unitPrice)}</Text>
              <Text style={s.num}>{formatGBP(l.quantity * l.unitPrice)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text style={s.muted}>Subtotal</Text>
            <Text>{formatGBP(invoice.subtotal)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.muted}>VAT ({invoice.vatRate}%)</Text>
            <Text>{formatGBP(invoice.vat)}</Text>
          </View>
          <View style={[s.totalRow, s.grand]}>
            <Text>Total</Text>
            <Text>{formatGBP(invoice.total)}</Text>
          </View>
        </View>

        {invoice.notes ? (
          <View style={s.section}>
            <Text style={s.label}>Notes</Text>
            <Text>{invoice.notes}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

export function renderInvoicePdf(invoice: InvoiceForView) {
  return renderToBuffer(<InvoicePdf invoice={invoice} />);
}
