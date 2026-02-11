import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Svg, Ellipse } from '@react-pdf/renderer';
import logoImage from '../../../public/assets/logo.png';

export type QrPdfItem = {
    partNumber: string;
    description: string;
    qtyPack: number;
    sysRowId: string;
    qrImageSrc: string;
    lotNumber?: string;
    custID?: string;
}

// --- KONFIGURASI LAYOUT ---
const ITEMS_PER_PAGE = 9; // 3 Kolom x 3 Baris
const COL_LEFT_WIDTH = '35%';
const COL_RIGHT_WIDTH = '65%';

const styles = StyleSheet.create({
    page: {
        paddingTop: 20,
        paddingBottom: 20,
        paddingLeft: 20,
        paddingRight: 20,
        backgroundColor: '#fff',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
    },
    itemWrapper: {
        width: '33.33%',
        height: 245,
        padding: 4,
    },
    labelContainer: {
        width: '100%',
        height: '100%',
        borderWidth: 1,
        borderColor: '#000',
        display: 'flex',
        flexDirection: 'column',
    },

    // --- Header ---
    headerRow: {
        height: 35,
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    logoBox: {
        width: COL_LEFT_WIDTH,
        borderRightWidth: 1,
        borderRightColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
    },
    logoImg: {
        width: '85%',
        height: '85%',
        objectFit: 'contain',
    },
    companyBox: {
        width: COL_RIGHT_WIDTH,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    companyText: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        textTransform: 'uppercase',
        color: '#444',
    },

    // --- Baris Data ---
    stdRow: {
        height: 16,
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    labelCol: {
        width: COL_LEFT_WIDTH,
        borderRightWidth: 1,
        borderRightColor: '#000',
        paddingLeft: 4,
        justifyContent: 'center',
    },
    valueCol: {
        width: COL_RIGHT_WIDTH,
        paddingLeft: 4,
        justifyContent: 'center',
    },
    labelText: {
        fontSize: 6,
        fontFamily: 'Helvetica',
    },
    valueText: {
        fontSize: 6,
        fontFamily: 'Helvetica-Bold',
        color: '#333',
        textAlign: 'center',
    },

    // --- Footer (QR & Kanan Bawah) ---
    bottomSection: {
        flex: 1,
        flexDirection: 'row',
    },
    qrArea: {
        width: '50%',
        borderRightWidth: 1,
        borderRightColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
    },
    qrImage: {
        width: 65,
        height: 65,
    },

    // Area Kanan Bawah (Info Area)
    infoArea: {
        width: '50%',
        flexDirection: 'column',
        display: 'flex',
    },

    // 1. Kotak KETERANGAN & OK
    topRightBox: {
        flex: 1, // Mengisi sisa ruang di atas tanda tangan
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        flexDirection: 'column',
    },
    // Header "KETERANGAN"
    keteranganHeader: {
        height: 9, // Tinggi baris header kecil
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    keteranganText: {
        fontSize: 6,
        fontFamily: 'Helvetica',
    },
    // Area Oval OK
    okArea: {
        flex: 1, // Sisa ruang untuk Oval
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 2, // Fine tuning posisi
    },

    // 2. Grid Tanda Tangan
    signGrid: {
        height: 40, // Tinggi fix untuk area tanda tangan
        flexDirection: 'row',
    },
    signBox: {
        width: '50%',
        borderRightWidth: 1,
        borderRightColor: '#000',
        flexDirection: 'column',
    },
    signBoxLast: {
        width: '50%',
        flexDirection: 'column',
    },
    signHeader: {
        height: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        fontSize: 6,
        textAlign: 'center',
        justifyContent: 'center',
        fontFamily: 'Helvetica',
    },
    signSpace: {
        flex: 1,
    }
});

// Helper function chunks
const chunkArray = (array: QrPdfItem[], size: number) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
};

export const QrPdfDocument = ({ items }: { items: QrPdfItem[] }) => {
    const pagesData = chunkArray(items, ITEMS_PER_PAGE);

    return (
        <Document>
            {pagesData.map((pageItems, pageIndex) => (
                <Page key={pageIndex} size="LETTER" style={styles.page}>
                    {pageItems.map((item, index) => (
                        <View key={index} style={styles.itemWrapper}>
                            <View style={styles.labelContainer}>

                                {/* Header */}
                                <View style={styles.headerRow}>
                                    <View style={styles.logoBox}>
                                        <Image src={logoImage.src} style={styles.logoImg} />
                                    </View>
                                    <View style={styles.companyBox}>
                                        <Text style={styles.companyText}>SPARTA GUNA</Text>
                                        <Text style={styles.companyText}>SENTOSA</Text>
                                    </View>
                                </View>

                                {/* Baris Data */}
                                <View style={styles.stdRow}>
                                    <View style={styles.labelCol}><Text style={styles.labelText}>NAMA PART</Text></View>
                                    <View style={styles.valueCol}><Text style={styles.valueText}>{item.description}</Text></View>
                                </View>
                                <View style={styles.stdRow}>
                                    <View style={styles.labelCol}><Text style={styles.labelText}>No. PART</Text></View>
                                    <View style={styles.valueCol}><Text style={styles.valueText}>{item.partNumber}</Text></View>
                                </View>
                                <View style={styles.stdRow}>
                                    <View style={styles.labelCol}><Text style={styles.labelText}>CUSTOMER ID</Text></View>
                                    <View style={styles.valueCol}><Text style={styles.valueText}>{item.custID || ''}</Text></View>
                                </View>
                                <View style={styles.stdRow}>
                                    <View style={styles.labelCol}><Text style={styles.labelText}>JUMLAH</Text></View>
                                    <View style={styles.valueCol}><Text style={styles.valueText}>{item.qtyPack} PCS</Text></View>
                                </View>
                                <View style={styles.stdRow}>
                                    <View style={styles.labelCol}><Text style={styles.labelText}>TGL / SHIFT</Text></View>
                                    <View style={styles.valueCol}><Text style={styles.valueText}></Text></View>
                                </View>
                                <View style={styles.stdRow}>
                                    <View style={styles.labelCol}><Text style={styles.labelText}>SEKSI</Text></View>
                                    <View style={styles.valueCol}><Text style={styles.valueText}>WAREHOUSE</Text></View>
                                </View>
                                <View style={styles.stdRow}>
                                    <View style={styles.labelCol}><Text style={styles.labelText}>LOT No.</Text></View>
                                    <View style={styles.valueCol}><Text style={styles.valueText}>{item.lotNumber || ''}</Text></View>
                                </View>

                                {/* Footer Section */}
                                <View style={styles.bottomSection}>

                                    {/* Kiri: QR */}
                                    <View style={styles.qrArea}>
                                        <Image src={item.qrImageSrc} style={styles.qrImage} />
                                    </View>

                                    {/* Kanan: Info & TTD */}
                                    <View style={styles.infoArea}>

                                        {/* Bagian Atas Kanan: Keterangan & OK */}
                                        <View style={styles.topRightBox}>
                                            {/* Header KETERANGAN (Sekarang punya border sendiri) */}
                                            <View style={styles.keteranganHeader}>
                                                <Text style={styles.keteranganText}>KETERANGAN</Text>
                                            </View>

                                            {/* Area Oval OK */}
                                            <View style={styles.okArea}>
                                                <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                                                    {/* SVG Oval */}
                                                    <Svg height="24" width="50">
                                                        <Ellipse
                                                            cx="25"
                                                            cy="12"
                                                            rx="24"  // Radius lebar (Bikin lonjong)
                                                            ry="11"  // Radius tinggi
                                                            fill="#d6d6d6" // Abu sedikit lebih terang dr sebelumnya
                                                            stroke="#444"
                                                            strokeWidth="0.5"
                                                        />
                                                    </Svg>
                                                    {/* Text OK Absolute */}
                                                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                                                        <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#000', marginTop: -1 }}>
                                                            OK
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Bagian Bawah Kanan: Tanda Tangan */}
                                        <View style={styles.signGrid}>
                                            <View style={styles.signBox}>
                                                <View style={styles.signHeader}><Text>QC</Text></View>
                                                <View style={styles.signSpace}></View>
                                            </View>
                                            <View style={styles.signBoxLast}>
                                                <View style={styles.signHeader}><Text>SEKSI</Text></View>
                                                <View style={styles.signSpace}></View>
                                            </View>
                                        </View>

                                    </View>
                                </View>

                            </View>
                        </View>
                    ))}
                </Page>
            ))}
        </Document>
    );
};