import { Chat, Chats } from "../_types/chats";
import { initDB } from "./init.db";

export const addChatDB = async ({ type, text, image, feedback, isTrashRes, time, answerTo, analysis }: Chat): Promise<number> => {
    const db = await initDB()

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("chats", "readwrite")
        const store = transaction.objectStore("chats")
        const request = store.add({ type, text, image, feedback, isTrashRes, time, answerTo, analysis })

        request.onsuccess = () => resolve(request.result as number)
        request.onerror = () => reject("Failed to add chat to DB")

        transaction.oncomplete = () => {
            db.close()
        }
    })
}

export const getLastChatIndexDB = async (): Promise<number | null> => {
    const db = await initDB()

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("chats", "readonly")
        const store = transaction.objectStore("chats")
        const request = store.openCursor(null, "prev")

        request.onsuccess = () => {
            const cursor = request.result
            resolve(cursor ? cursor.key as number : null)
        }
        request.onerror = () => reject("Failed to get last chat index from DB")

        transaction.oncomplete = () => {
            db.close()
        }
    })
}

export const getChatByIndexDB = async (id: number): Promise<Chat | null> => {
    const db = await initDB()

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("chats", "readonly")
        const store = transaction.objectStore("chats")
        const request = store.get(id)

        request.onsuccess = () => resolve(request.result ?? null)
        request.onerror = () => reject("Failed to get chat from DB")

        transaction.oncomplete = () => {
            db.close()
        }
    })
}

export const putChatDB = async (chat: Chat, id: number): Promise<void> => {
    const db = await initDB()

    return new Promise((resolve, reject) => {
        const transaction = db.transaction("chats", "readwrite")
        const store = transaction.objectStore("chats")
        const request = store.put({ id ,...chat })

        request.onsuccess = () => resolve()
        request.onerror = () => reject("Failed to put chat in DB")

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
