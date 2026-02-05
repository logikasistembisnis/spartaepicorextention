import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { SjPlantHeader } from "@/types/sjPlant";

export function PdfSign({ header }: { header: SjPlantHeader }) {
    
    // Helper untuk format tanggal: "16 December 2025"
    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        // en-GB biasanya format hari dulu baru bulan (dd MMMM yyyy)
        return new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(date);
    };

    const formattedDate = formatDate(header.shipDate);

    // List kolom
    const signers = [
        "Dibuat,", 
        "Diserahkan,", 
        "Security,", 
        "Dikirim,", 
        "Tanda Tangan Penerima,"
    ];

    return (
        <View style={styles.container} wrap={false}>
            {signers.map((title, index) => (
                <View key={index} style={styles.column}>
                    {/* Label Atas */}
                    <Text style={styles.label}>{title}</Text>
                    {/* Spasi kosong buat tanda tangan */}
                    <View style={styles.signatureSpace} />
                    <Text style={styles.name}>
                        {`Nama ${index + 1}`} 
                    </Text>
                    {/* Tanggal */}
                    <Text style={styles.date}>Tgl : {formattedDate}</Text>
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
        justifyContent: "space-between",
        width: "100%",
    },
    column: {
        width: "18%",
        flexDirection: "column",
    },
    label: {
        fontSize: 9,
        marginBottom: 4,
    },
    signatureSpace: {
        height: 40,
    },
    name: {
        fontSize: 9,
        fontWeight: "bold",
        borderBottomWidth: 1,
        borderBottomColor: "black",
        paddingBottom: 2,
        marginBottom: 2,
    },
    date: {
        fontSize: 8,
    },
});