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

