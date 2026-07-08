import { Histories, HistoryEntry } from "../_types/histories"
import { initDB } from "./init.db"

export const addHistoryDB = async ({ type, emissionReduction, sellingPrice, imageUrl, timestamp }: HistoryEntry): Promise<void> => {
    const db = await initDB()

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("histories", "readwrite")
        const store = transaction.objectStore("histories")
        const request = store.add({ type, emissionReduction, sellingPrice, imageUrl, timestamp })

        request.onsuccess = () => resolve()
        request.onerror = () => reject("Failed to add history to DB")

        transaction.oncomplete = () => {
            db.close()
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