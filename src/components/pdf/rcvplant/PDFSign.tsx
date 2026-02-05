import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { SjPlantHeader } from "@/types/sjPlant";

export function PdfSign({ header }: { header: SjPlantHeader }) {

    const signers = [
        {
            title: "Diterima,",
            name: "Nama 1",
            footer: "Bagian Gudang",
        },
        {
            title: "Check,",
            name: "Nama 2",
            footer: "Bagian Gudang",
        },
        {
            title: "Mengetahui,",
            name: "", // kosong tapi garis tetap ada
            footer: "Purchasing",
        },
    ];

    return (
        <View style={styles.container} wrap={false}>
            {signers.map((s, index) => (
                <View key={index} style={styles.column}>
                    {/* Label atas */}
                    <Text style={styles.label}>{s.title}</Text>

                    {/* Spasi tanda tangan */}
                    <View style={styles.signatureSpace} />

                    {/* Garis tanda tangan */}
                    <View style={styles.signatureLine}>
                        {s.name ? (
                            <Text style={styles.name}>{s.name}</Text>
                        ) : (
                            <Text style={styles.emptyName}> </Text>
                        )}
                    </View>

                    {/* Footer role */}
                    <Text style={styles.footerText}>{s.footer}</Text>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        marginBottom: 10,
        flexDirection: "row",
        justifyContent: "flex-start",
        gap: 40,
        width: "100%",
    },
    column: {
        width: "120",
        flexDirection: "column",
    },
    label: {
        fontSize: 9,
        marginBottom: 4,
    },
    signatureSpace: {
        height: 40,
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: "black",
        minHeight: 14,
        justifyContent: "flex-end",
        marginBottom: 4,
    },
    name: {
        fontSize: 9,
        fontWeight: "bold",
        textAlign: "left",
    },
    emptyName: {
        fontSize: 9,
    },
    footerText: {
        fontSize: 9,
        textAlign: "left",
    },
});
