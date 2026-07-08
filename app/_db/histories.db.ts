import { Histories, HistoryEntry } from "../_types/histories"
import { initDB } from "./init.db"

export const addHistoryDB = async ({ type, emissionReduction, sellingPrice, imageUrl, timestamp, sourceAssistantChatId }: HistoryEntry): Promise<void> => {
    const db = await initDB()

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("histories", "readwrite")
        const store = transaction.objectStore("histories")
        const request = store.add({ type, emissionReduction, sellingPrice, imageUrl, timestamp, sourceAssistantChatId })

        request.onsuccess = () => resolve()
        request.onerror = () => reject("Failed to add history to DB")

        transaction.oncomplete = () => {
            db.close()
        }
    })
}

export const deleteHistoryByAssistantChatIdDB = async (assistantChatId: number): Promise<number> => {
    const db = await initDB()

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("histories", "readwrite")
        const store = transaction.objectStore("histories")
        let deletedCount = 0

        if (store.indexNames.contains("sourceAssistantChatId")) {
            const index = store.index("sourceAssistantChatId")
            const request = index.getAllKeys(assistantChatId)

            request.onsuccess = () => {
                for (const key of request.result) {
                    store.delete(key)
                    deletedCount += 1
                }
            }

            request.onerror = () => reject("Failed to delete history by assistant chat ID")
        } else {
            const request = store.getAll()

            request.onsuccess = () => {
                for (const history of request.result as Histories) {
                    if (history.sourceAssistantChatId === assistantChatId && history.id !== undefined) {
                        store.delete(history.id)
                        deletedCount += 1
                    }
                }
            }

            request.onerror = () => reject("Failed to delete history by assistant chat ID")
        }

        transaction.oncomplete = () => {
            db.close()
            resolve(deletedCount)
        }

        transaction.onerror = () => {
            db.close()
            reject("Failed to delete history by assistant chat ID")
        }
    })
}

export const getAllHistoriesDB = async (): Promise<Histories> => {
    const db = await initDB()

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("histories", "readonly")
        const store = transaction.objectStore("histories")
        const request = store.getAll()

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject("Failed to get histories from DB")

        transaction.oncomplete = () => {
            db.close()
        }
    })
}