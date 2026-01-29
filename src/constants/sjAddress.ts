export function getShipToAddress(shipTo: string) {
    switch (shipTo) {
        case "Karawang":
            return "Kawasan Industri Surya Cipta Jl. Surya Madya Kav. 1-28 GH Karawang Timur 41361 Indonesia";
        case "Dayeuhkolot":
            return "Jl. Raya Dayeuh Kolot No. 170 Bandung 40258 Indonesia";
        case "Soreang":
            return "Jl. Raya Soreang Cipatik km 5 no 33-39 Gajah Mekar, Kutawaringin, Kab Bandung, West Java, Indonesia 40911";
        default:
            return "";
    }
}