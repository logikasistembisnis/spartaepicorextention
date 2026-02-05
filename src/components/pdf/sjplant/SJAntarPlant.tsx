import { Document, Page, StyleSheet, View } from "@react-pdf/renderer";
import PdfHeader from "./PDFHeader";
import PdfTable from "./PDFTable";
import { PdfCompanyFooter } from "../PDFFooter";
import { PdfSign } from "./PDFSign";
import { SjPlantHeader, SjPlantLine } from "@/types/sjPlant";

type Props = {
    header: SjPlantHeader;
    lines: SjPlantLine[];
    address: string;
     qrBase64: string;
};

export default function SuratJalanPDF({ header, lines, address, qrBase64 }: Props) {
    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                <View style={styles.contentWrapper}>
                    <PdfHeader header={header} address={address} />
                    <PdfTable lines={lines} note={header.comment} header={header} qrBase64={qrBase64}/>
                    <View style={{ flex: 1 }} />
                    <PdfSign header={header} />
                </View>
                <View style={styles.footerContainer} fixed>
                    <PdfCompanyFooter />
                </View>

            </Page>
        </Document>
    );
}

const styles = StyleSheet.create({
    page: {
        paddingTop: 24,
        paddingHorizontal: 24,
        paddingBottom: 60,
        fontSize: 9,
        fontFamily: "Helvetica",
        flexDirection: "column",
    },
    contentWrapper: {
        flex: 1,
        flexDirection: "column",
    },
    footerContainer: {
        position: "absolute",
        bottom: 24,
        left: 24,
        right: 24,
    }
});