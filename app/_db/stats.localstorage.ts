type Stats = {
    totalEmissionReduction: number,
    totalPrice: number
}

export const getStats = (): Stats => {
    let totalEmissionReduction: string | null = localStorage.getItem("totalEmissionReduction")
    if (!totalEmissionReduction) localStorage.setItem("totalEmissionReduction", "0")

    let totalPrice: string | null = localStorage.getItem("totalPrice")
    if (!totalPrice) localStorage.setItem("totalPrice", "0")

    totalEmissionReduction = totalEmissionReduction ?? "0"
    totalPrice = totalPrice ?? "0"

    const numberTotalEmissionReduction = parseFloat(totalEmissionReduction)
    const numberTotalPrice = parseInt(totalPrice)

    return { totalEmissionReduction: numberTotalEmissionReduction, totalPrice: numberTotalPrice }
}

export const saveStats = ({ totalEmissionReduction, totalPrice }: Stats) => {
    localStorage.setItem("totalEmissionReduction", totalEmissionReduction.toString())
    localStorage.setItem("totalPrice", totalPrice.toString())
}