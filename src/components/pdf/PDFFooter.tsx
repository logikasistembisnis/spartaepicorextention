import { View, Text, StyleSheet } from "@react-pdf/renderer";

export function PdfCompanyFooter() {
    return (
        <View style={styles.companyFooter} fixed>
            <Text>
                Jl. Raya Dayeuh Kolot No. 170 Cileteurep, Kab. Bandung, Jawa Barat, Indonesia 40258 Telp. : +62-22-5232888 Email : marketing@sparta.co.id - finance @sparta.co.id
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    companyFooter: {
        position: "absolute",
        bottom: 16,
        left: 24,
        right: 24,
        fontSize: 7,
        textAlign: "center",
    }
});
