import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { SjPlantHeader } from "@/types/sjPlant";

function formatTanggal(dateStr?: string) {
    if (!dateStr) return "";

    const date = new Date(dateStr);

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
}

export default function PdfHeader({
    header,
    address,
}: {
    header: SjPlantHeader;
    address: string;
}) {
    return (
        <View style={styles.container}>
            {/* ===== TOP ROW ===== */}
            <View style={styles.topRow}>
                <View style={styles.leftHeader}>
                    <Image src="/assets/logo.png" style={styles.logo} />
                    <Text style={styles.company}>PT. SPARTA GUNA SENTOSA</Text>
                </View>
                <Text style={styles.title}>SURAT JALAN</Text>
            </View>

            {/* ===== INFO ===== */}
            <View style={styles.info}>

                {/* ROW 1 */}
                <View style={styles.infoRow}>
                    <View style={styles.leftCol}>
                        <View style={styles.line}>
                            <Text style={styles.label}>Dikirim ke</Text>
                            <Text style={styles.colon}>:</Text>
                            <Text style={styles.value}></Text>
                        </View>
                    </View>
                </View>

                {/* ROW 2 */}
                <View style={styles.infoRow}>
                    <View style={styles.leftCol}>
                        <View style={styles.line}>
                            <Text style={styles.label}>Gudang</Text>
                            <Text style={styles.colon}>:</Text>
                            <Text style={styles.value}>{header.shipTo}</Text>
                        </View>
                    </View>

                    <View style={styles.rightCol}>
                        <View style={styles.line}>
                            <Text style={styles.label}>Tanggal</Text>
                            <Text style={styles.colon}>:</Text>
                            <Text style={styles.value}>{formatTanggal(header.shipDate)}</Text>
                        </View>
                    </View>
                </View>

                {/* ROW 3 */}
                <View style={styles.infoRow}>
                    <View style={styles.leftCol}>
                        <View style={styles.line}>
                            <Text style={styles.label}>Alamat</Text>
                            <Text style={styles.colon}>:</Text>
                            <Text style={styles.value}>{address}</Text>
                        </View>
                    </View>

                    <View style={styles.rightCol}>
                        <View style={styles.line}>
                            <Text style={styles.label}>Nomor SJ</Text>
                            <Text style={styles.colon}>:</Text>
                            <Text style={styles.value}>{header.packNum}</Text>
                        </View>
                    </View>
                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 5,
    },

    /* ===== TOP ===== */
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    leftHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },

    logo: {
        width: 35,
        height: 35,
    },

    company: {
        fontSize: 22,
        fontWeight: "bold",
    },

    title: {
        fontSize: 22,
        fontWeight: "bold",
    },

    /* ===== INFO ===== */
    info: {
        marginTop: 20,
        fontSize: 10,
    },

    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },

    leftCol: {
        width: "60%",
    },

    rightCol: {
        width: "35%",
        paddingLeft: 16,
    },

    line: {
        flexDirection: "row",
    },

    label: {
        width: 65,
        fontWeight: "bold",
        fontSize: 10,
    },

    colon: {
        width: 6,
        textAlign: "center",
        fontSize: 10,
        marginRight: 6,
    },

    value: {
        flex: 1,
        flexWrap: "wrap",
        fontSize: 10,
    },
});