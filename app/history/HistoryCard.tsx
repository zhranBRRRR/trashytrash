export interface HistoryCardProps {
    type: string;
    emissionReduction: string;
        sellingPrice: string;
        imageUrl: string;
    }

export default function HistoryCard({
    type,
    emissionReduction,
    sellingPrice,
    imageUrl
}: HistoryCardProps) {
    return (
        <div className="flex flex-col w-full rounded-2xl overflow-hidden">
            <img src={imageUrl} className="h-24 object-cover" />
            <div className="flex justify-between p-2 px-4 bg-[#889545] text-white">
                <div className="flex flex-col">
                    <p className="font-bold text-white/50 text-sm">Tipe</p>
                    <p>{type}</p>
                </div>
                <div className="flex flex-col">
                    <p className="font-bold text-white/50 text-sm">Reduksi Emisi</p>
                    <p>{emissionReduction} CO₂-eq</p>
                </div>
                <div className="flex flex-col">
                    <p className="font-bold text-white/50 text-sm">Nilai Jual</p>
                    <p>Rp.{parseInt(sellingPrice).toLocaleString("ID")}</p>
                </div>
            </div>
        </div>
    )
}