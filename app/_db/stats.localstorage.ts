type Stats = {
    totalEmissionReduction: number,
    totalPrice: number
}

export const getStats = (): Stats => {
    let totalEmissionReduction: string | number | null = localStorage.getItem("totalEmissionReduction")

    if (totalEmissionReduction) totalEmissionReduction = parseFloat(totalEmissionReduction as string).toFixed(2)
    if (!totalEmissionReduction) localStorage.setItem("totalEmissionReduction", "0")

    let totalPrice: string | number | null = localStorage.getItem("totalPrice")

    if (totalPrice) totalPrice = parseInt(totalPrice)
    if (!totalPrice) localStorage.setItem("totalPrice", "0")

        totalEmissionReduction = totalEmissionReduction ?? 0
        totalPrice = totalPrice ?? 0

    return { totalEmissionReduction: totalEmissionReduction as number, totalPrice: totalPrice as number }
}

export const saveStats = ({ totalEmissionReduction, totalPrice }: Stats) => {
    localStorage.setItem("totalEmissionReduction", totalEmissionReduction.toString())
    localStorage.setItem("totalPrice", totalPrice.toString())
}