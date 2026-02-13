export type CustomerItem = {
    custID: string
    custNum: number
    custName: string
}

export type PartItem = {
    partNumber: string
    description: string
    lotNumber: string
    qtyBox: number
    qtyCetak: number
}

export type SelectionData = {
    qtyBox: string
    qtyCetak: string
    selectedLot: string
}

export type ApiPart = {
    Part_PartNum: string
    Part_PartDescription: string
    Part_standartpack_c: number
}

export type ApiLot = {
    PartLot_LotNum: string
}
