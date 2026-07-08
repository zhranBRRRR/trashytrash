export type HistoryEntry = {
    id?: number
    type: string
    emissionReduction: string
    sellingPrice: string
    imageUrl: string
    timestamp: string
    sourceAssistantChatId?: number
}

export type Histories = HistoryEntry[]