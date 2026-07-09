"use client";

import { motion } from "framer-motion";
import { ArrowUp, ThumbsDown, ThumbsUp, ThumbsUpIcon, XIcon } from "lucide-react";
import React, { useEffect, useState } from "react"
import { defaultSpring } from "./_lib/spring";
import { AnimateChangeInHeight } from "./AnimateHeight";
import Markdown from "react-markdown";
import { Chat } from "./_types/chats";
import { getChatByIndexDB } from "./_db/chats.db";

interface BubbleChatProps {
    chatId?: number
    index?: number          // this index, i believe is the answerTo number in the chats, that mean this index refer to the index of the chat before
    type: "user" | "assistant" | "assistant_error"
    text?: string
    time?: string // expect a parsed time (yes right?)
    image?: string  // user image kalo upload
    isFeedbackNeeded?: boolean  // if dislike button needed
    feedback?: (input: string, referenceIndex: number) => Promise<void> // optional, used to send feedback. [not implemented] (example: clicking send after writing the actual waste type, this will execute the parent function for sending back the image, undo any changes made, and replace this bubble chat with a new one)
    setAboutToFeedback?: (input: boolean) => void // to hide the input
}


export const BubbleChat: React.FC<BubbleChatProps> = ({ chatId, index, type, text, time, image, feedback, isFeedbackNeeded, setAboutToFeedback }) => {
    const [liked, setLiked] = useState(false)
    const [disliked, setDisliked] = useState(false)

    const [localFeedback, setLocalFeedback] = useState<string | null>(null)
    const [ chatBefore, setChatBefore ] = useState<Chat | null>(null)

    useEffect(() => {
        getChatByIndexDB(index ?? 0).then((chat) => {
            setChatBefore(chat)
        })
    }, [index])

    const AIname = "Jarvis"
    const secondStyle = 
        type == "user" ? "bg-secondary rounded-l-xl" 
        : type == "assistant" ? "bg-primary rounded-r-xl"
        : "bg-red-500 rounded-r-xl"
    const mainStyle = type == "user" ? "self-end" : "self-start"



    const NonFeedbackLayout = (
        <div className="flex flex-col w-full">
            {type === "assistant" &&
                <p className="font-bold text-base text-[#BEC790] pb-1">{AIname}</p>
            }

            {type === "assistant_error" && text == "" &&
                <p className="font-bold text-base text-red-200 pb-1">Error</p>
            }

            {type === "assistant_error" && text == "" &&
                <p>I ran into some error while generating a response for you. <br></br> Wait for a minute and try again! <br></br> <br></br> <span className="text-red-300 text-sm">Look in the console tab to see the detail of the problem.</span></p>
            }

            <div className="text-[#FFEBF4] whitespace-pre-wrap">
                <Markdown>
                    {text}
                </Markdown>
            </div>

            {image &&
                <img className="max-w-80 py-2" src={image} />   // idk about base64 so this is temporary 
            }

            <p className={`self-end opacity-90 mt-1 ${type === "assistant_error" ? "text-red-100" : "text-[#546014]"}`}>{time}</p>
        </div>
    )

    const FeedbackLayout = (
        <motion.div
            initial={{ opacity: 0, x: -100, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={defaultSpring}
            className="flex flex-col w-full">
            <div className="flex justify-between pb-1">
                <p className="font-bold text-base">Klasifikasi Manual</p>
                <XIcon onClick={() => {
                    setDisliked(false);
                    setAboutToFeedback && setAboutToFeedback(false);
                }} />
            </div>

            <p className="text-[#FFEBF4]">Jelaskan apa tipe sampah yang anda kirim agar {AIname} dapat menjawab ulang dengan akurat.</p>

            <div className="flex gap-2 justify-center items-center pt-5">
                <input 
                value={localFeedback || ""}
                onChange={(e) => setLocalFeedback(e.target.value)}
                className="bg-secondary h-9 w-full rounded-full p-2" type="text" />
                <button 
                onClick={() => {
                    feedback && feedback(
                        `SYSTEM FEEDBACK [The user has provided a correction to your analysis before, you have made a mistake by wrongly classificate the image. Re analyze the waste according to the image or the user text if image not available. ALWAYS output human readable text for the human and call the function unconditionally!.] ${chatBefore?.image ? `[image: ${chatBefore.image}]` : ""}: ` + (localFeedback || ""),
                        chatId ?? ((index ?? 0) + 1)
                    );
                    setDisliked(false);
                    setAboutToFeedback && setAboutToFeedback(false);
                }}
                className="bg-secondary w-9 h-9 flex items-center justify-center rounded-full shrink-0">
                    <ArrowUp />
                </button>
            </div>
        </motion.div>
    )

    return (
        <motion.div 
        initial={{ opacity: 0, x: type === "user" ? 50 : -50, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{
            ...defaultSpring,
            scale: {
                ...defaultSpring,
                damping: 35
            }
        }}
        className={`max-w-[80%] flex flex-col gap-2 ${mainStyle}`}>
            <AnimateChangeInHeight className="">
                <div className={`w-full p-3 rounded-b-xl ${secondStyle}`}>
                    {disliked ?
                        FeedbackLayout :
                        NonFeedbackLayout
                    }
                </div>
            </AnimateChangeInHeight>

            {isFeedbackNeeded && !disliked &&
                <div className="flex gap-4 text-primary text-2xl self-end">
                    <ThumbsDown onClick={() => {
                        setDisliked(true);
                        setAboutToFeedback && setAboutToFeedback(true);
                    }} />
                    <ThumbsUp onClick={() => setLiked(!liked)} className={`${liked ? "" : "fill-transparent"}`} fill="currentColor" />
                </div>
            }
        </motion.div>
    )
}
