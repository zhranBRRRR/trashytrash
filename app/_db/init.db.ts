const DB_VERSION = 1

export async function initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open("localDB", DB_VERSION)
    
        request.onupgradeneeded = (e) => {
            const req = e.target as IDBOpenDBRequest
            const db = req.result
    
            if (!db.objectStoreNames.contains("chats")) {
                db.createObjectStore("chats", { keyPath: "id", autoIncrement: true })
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

