import { Chat, Chats } from "../_types/chats";
import { initDB } from "./init.db";

export const addChatDB = async ({ type, text, image, isTrashRes, time }: Chat): Promise<void> => {
    const db = await initDB()

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("chats", "readwrite")
        const store = transaction.objectStore("chats")
        const request = store.add({ type, text, image, isTrashRes, time })

        request.onsuccess = () => resolve()
        request.onerror = () => reject("Failed to add chat to DB")

        transaction.oncomplete = () => {
            db.close()
        }
    })
}

export const getAllChatsDB = async (): Promise<Chats> => {
    const db = await initDB()

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("chats", "readonly")
        const store = transaction.objectStore("chats")
        const request = store.getAll()

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject("Failed to get chats from DB")

        transaction.oncomplete = () => {
            db.close()
        }
    })
}