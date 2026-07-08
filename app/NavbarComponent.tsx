"use client";
import { MessageCircle, NotepadText } from "lucide-react";

import { useRouter } from "next/navigation";

export default function Navbar() {
    const router = useRouter();
    return <div className="fixed bottom-0 h-20 bg-tertiary w-screen flex justify-around">
        <button
            className="flex flex-col gap-y-1 items-center justify-center"
            onClick={() => router.push("/")}
        >
            <MessageCircle size={28} />
            <p className="font-semibold text-base">Chat</p>
        </button>

        <button
            className="flex flex-col gap-y-1 items-center justify-center"
            onClick={() => router.push("/history")}
        >
            <NotepadText size={28} />
            <p className="font-semibold text-base">History</p>
        </button>
    </div>;
}