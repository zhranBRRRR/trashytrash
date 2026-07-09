"use client";

import { useEffect, useState } from "react";
import { getAllHistoriesDB } from "../_db/histories.db";
import HistoryCard from "./HistoryCard";

type HistoryEntry = {
    type: string;
    emissionReduction: string;
    sellingPrice: string;
    imageUrl: string;
    timestamp: string;
};

function getDateMarker(timestamp: string) {
    const entryDate = new Date(timestamp);
    const today = new Date();

    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfEntry = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
    const dayDifference = Math.floor((startOfToday.getTime() - startOfEntry.getTime()) / (24 * 60 * 60 * 1000));

    if (dayDifference === 0) {
        return "Today";
    }

    if (dayDifference === 1) {
        return "Yesterday";
    }

    return entryDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}

export default function History() {
    const [data, setData] = useState<HistoryEntry[]>([])

    useEffect(() => {
        getAllHistoriesDB().then((entries) => {
            setData(entries)
        })
    }, [])

    const groupedHistory = data.reduce<Array<{ label: string; items: HistoryEntry[] }>>(
        (groups, entry) => {
            const label = getDateMarker(entry.timestamp);
            const lastGroup = groups[groups.length - 1];

            if (lastGroup?.label === label) {
                lastGroup.items.push(entry);
                return groups;
            }

            groups.push({ label, items: [entry] });
            return groups;
        },
        []
    );

    return (
        <div className="p-6 text-[#667032]">
            <div className="flex flex-col gap-8 max-w-lg mx-auto">
                {groupedHistory.map((group) => (
                    <section key={group.label} className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <p className="font-semibold">
                                {group.label}
                            </p>
                            <div className="h-1 flex-1 bg-[#889545]/70"></div>
                        </div>
                        <div className="flex flex-col gap-6">
                            {group.items.map((data) => (
                                <HistoryCard
                                    key={`${data.type}-${data.timestamp}`}
                                    type={data.type}
                                    emissionReduction={data.emissionReduction}
                                    sellingPrice={data.sellingPrice}
                                    imageUrl={data.imageUrl}
                                />
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    )
}
