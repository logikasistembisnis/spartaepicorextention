import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// Tipe data yang dibutuhkan untuk PDF
export type QrPdfItem = {
    partNumber: string;
    description: string;
    qtyBox: number;
    sysRowId: string;
    qrImageSrc: string;
}

const styles = StyleSheet.create({
    page: {
        padding: 20,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start' // Agar baris baru dimulai dari atas
    },
    // Container untuk 1 item (muat 3 kesamping)
    itemContainer: {
        width: '33%', // 100% bagi 3
        padding: 5,
        marginBottom: 10,
    },
    card: {
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 20,
        padding: 5,
        alignItems: 'center',
        justifyContent: 'center',
        height: 180, // Tinggi fix agar rapi
    },
    qrImage: {
        width: 120,
        height: 120,
        marginBottom: 5
    },
    textContainer: {
        alignItems: 'center',
        marginTop: 5
    },
    text: {
        fontSize: 8,
        textAlign: 'center',
        fontFamily: 'Helvetica'
    },
    bold: {
        fontFamily: 'Helvetica-Bold',
        fontWeight: 'bold'
    }
});

export const QrPdfDocument = ({ items }: { items: QrPdfItem[] }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {items.map((item, index) => {
                return (
                    <View key={index} style={styles.itemContainer}>
                        <View style={styles.card}>
                            {/* Render Gambar Langsung dari Base64 */}
                            <Image
                                src={item.qrImageSrc}
                                style={styles.qrImage}
                            />

                            <View style={styles.textContainer}>
                                <Text style={[styles.text]}>{item.partNumber}#{item.description}#{item.qtyBox}</Text>
                            </View>
                        </View>
                    </View>
                );
            })}
        </Page>
    </Document>
);