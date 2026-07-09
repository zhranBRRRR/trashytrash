import { trashData } from "./ragTrashData"

export const getClassificationClasses = () => {
    let string = ""
    
    trashData.forEach((trash) => {
        string += trash.nama_sampah + ", "
    })

    return string
}