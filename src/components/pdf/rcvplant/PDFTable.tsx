import { View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import { SjPlantLine, SjPlantHeader } from "@/types/sjPlant";
import React from "react";

export default function PdfTable({
    lines,
    note,
    header,
}: {
    lines: SjPlantLine[];
    note?: string;
    header: SjPlantHeader;
}) {
    const formatYYMMDD = (dateStr?: string) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        const yy = d.getFullYear().toString().slice(-2);
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yy}${mm}${dd}`;
    };

    const formatQty = (value: number | string) => {
        const num = Number(value || 0);
        return new Intl.NumberFormat('en-US').format(num);
    };

    const formatStd = (value: number | string) => {
        const num = Number(value || 0);
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    };

    // SORT LINE NUM
    const sortedLines = [...lines].sort(
        (a, b) => Number(a.lineNum) - Number(b.lineNum)
    );

    // TOTAL QTY
    const totalQty = sortedLines.reduce(
        (sum, l) => sum + Number(l.qty || 0),
        0
    );

    return (
        <View style={styles.table} wrap>

            {/* ===== HEADER ===== */}
            <View style={styles.rowHeader} fixed>
                <Text style={[styles.colNo, styles.bold, styles.left]}>No.</Text>
                <Text style={[styles.colPart, styles.bold, styles.left]}>Kode Barang</Text>
                <Text style={[styles.colItem, styles.bold, styles.center]}>Nama Barang</Text>
                <Text style={[styles.colQty, styles.bold, styles.center]}>Qty</Text>
                <Text style={[styles.colUom, styles.bold, styles.right]}>Satuan</Text>
            </View>

            {/* ===== ROWS ===== */}
            {sortedLines.map((l, i) => (
                <View key={i} style={styles.row}>
                    <Text style={[styles.colNo, styles.left]}>{l.lineNum}</Text>
                    <Text style={[styles.colPart, styles.left]}>{l.partNum}</Text>
                    <Text style={[styles.colItem, styles.center]}>{l.partDesc}</Text>
                    <Text style={[styles.colQty, styles.center]}>{formatQty(l.qty)}</Text>
                    <Text style={[styles.colUom, styles.right]}>{l.uom}</Text>
                </View>
            ))}

            {/* ===== TOTAL ===== */}
            <View style={styles.totalRow}>
                <Text style={styles.colNo}></Text>
                <Text style={styles.colItem}></Text>
                <Text style={[styles.colPart, styles.right]}>Total</Text>
                <Text style={[styles.colQty, styles.center]}>{formatQty(totalQty)}</Text>
                <Text style={styles.colUom}></Text>
            </View>

            {/* ===== NOTE + QR ===== */}
            <View style={styles.noteWrapper} wrap>
                {/* NOTE */}
                <View style={styles.noteLeft}>
                    <Text style={styles.noteLabel}>Note:</Text>
                    <Text style={styles.noteText}>
                        {note && note.trim() !== "" ? note : " "}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    table: { marginTop: 6 },

    rowHeader: {
        flexDirection: "row",
        borderTop: 1,
        borderBottom: 1,
        paddingVertical: 4,
        alignItems: "center", // Membantu alignment vertikal header
        marginBottom: 8,
    },

    row: {
        flexDirection: "row",
        marginBottom: 4,
        // alignItems: 'flex-start' adalah default, ini yang bikin text panjang wrap ke bawah
    },

    totalRow: {
        flexDirection: "row",
        borderTop: 1, // Garis total di atas
        paddingVertical: 4,
        marginTop: 4,
    },

    colNo: {
        width: "6%",
        fontSize: 9,
        paddingRight: 2,
    },
    colPart: {
        width: "24%",
        fontSize: 9,
        paddingRight: 6,
    },
    colItem: {
        width: "40%",
        fontSize: 9,
        paddingRight: 6,
    },
    colQty: {
        width: "15%",
        fontSize: 9,
        paddingLeft: 2,
    },
    colUom: {
        width: "15%",
        fontSize: 9,
        paddingHorizontal: 2,
    },

    /* ===== ALIGN ===== */
    left: { textAlign: "left" },
    center: { textAlign: "center" },
    right: { textAlign: "right" },
    bold: { fontWeight: "bold", fontFamily: "Helvetica-Bold" },

    /* ===== NOTE ===== */
    note: {
        marginTop: 8,
    },
    noteLabel: {
        marginBottom: 2,
        fontSize: 9,
    },
    noteText: {
        fontSize: 9,
    },
    noteWrapper: {
        marginTop: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: 6,
    },

    noteLeft: {
        width: "65%",
    },

    noteRight: {
        width: "20%",
        alignItems: "center",
    },

    qrLabel: {
        fontSize: 8,
        marginBottom: 4,
    },

    qrImage: {
        width: 80,
        height: 80,
    },

    qrText: {
        fontSize: 7,
        marginTop: 4,
        textAlign: "center",
    },
});