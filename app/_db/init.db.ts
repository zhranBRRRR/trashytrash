const DB_VERSION = 3

export async function initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open("localDB", DB_VERSION)
    
        request.onupgradeneeded = (e) => {
            const req = e.target as IDBOpenDBRequest
            const db = req.result
    
            if (!db.objectStoreNames.contains("chats")) {
                db.createObjectStore("chats", { keyPath: "id", autoIncrement: true })
            }

            let historiesStore: IDBObjectStore
            if (!db.objectStoreNames.contains("histories")) {
                historiesStore = db.createObjectStore("histories", { keyPath: "id", autoIncrement: true })
            } else {
                historiesStore = req.transaction!.objectStore("histories")
            }

            if (!historiesStore.indexNames.contains("sourceAssistantChatId")) {
                historiesStore.createIndex("sourceAssistantChatId", "sourceAssistantChatId", { unique: false })
            }
        }
    
        request.onerror = () => reject("Failed to initialize indexedDB")
    
        request.onsuccess = (e) => {
            const req = e.target as IDBOpenDBRequest
            const db = req.result

            resolve(db)
        }
    })
}

export async function wipeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase("localDB")

        request.onsuccess = () => resolve()
        request.onerror = () => reject("Failed to delete IndexedDB")
        request.onblocked = () => reject("IndexedDB deletion blocked — close other tabs using this app")
    })
}

export async function clearAllData(): Promise<void> {
    const db = await initDB()
    const storeNames = [...db.objectStoreNames]

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeNames, "readwrite")
        tx.oncomplete = () => {
            db.close()
            localStorage.removeItem("lastChatIndex")
            localStorage.removeItem("totalEmissionReduction")
            localStorage.removeItem("totalPrice")
            resolve()
        }
        tx.onerror = () => reject("Failed to clear stores")

        for (const name of storeNames) {
            tx.objectStore(name).clear()
        }
    })
}
