"use client";

import { ArrowUp, ThumbsDown, ThumbsUp, ThumbsUpIcon, XIcon } from "lucide-react";
import React, { useEffect, useState } from "react"

interface BubbleChatProps {
    index?: number
    type: "user" | "assistant"
    text?: string
    time?: string // expect a parsed time (yes right?)
    image?: string  // user image kalo upload
    isFeedbackNeeded?: boolean  // if dislike button needed
    feedback?: (input: string) => void // optional, for sending feedback
}

export const BubbleChat: React.FC<BubbleChatProps> = ({ type, text, time, image, feedback, isFeedbackNeeded }) => {
    const [ liked, setLiked ] = useState(false)
    const [ disliked, setDisliked ] = useState(false)

    const AIname = "Jarvis"
    const secondStyle = type == "user" ? "bg-secondary rounded-l-xl" : "bg-primary rounded-r-xl"
    const mainStyle = type == "user" ? "self-end" : "self-start"

    const NonFeedbackLayout = (
        <div className="flex flex-col w-full">
            {type === "assistant" && 
                <p className="font-bold text-base text-[#BEC790] pb-1">{AIname}</p>
            }

            <p className="text-[#FFEBF4]">{text}</p>

            {image &&
                <img className="max-w-80 py-2" src={image}/>   // idk about base64 so this is temporary 
            }
            
            <p className="self-end text-[#546014] opacity-90 mt-1">{time}</p>
        </div>
    )

    const FeedbackLayout = (
        <div className="flex flex-col w-full">
            <div className="flex justify-between pb-1">
                <p className="font-bold text-base">Klasifikasi Manual</p>
                <XIcon onClick={() => setDisliked(false)} />
            </div>

            <p className="text-[#FFEBF4]">Jelaskan apa tipe sampah yang anda kirim agar {AIname} dapat menjawab ulang dengan akurat.</p>
            
            <div className="flex gap-2 justify-center items-center pt-5">
                <input className="bg-secondary h-9 w-full rounded-full p-2" type="text" />
                <div className="bg-secondary w-9 h-9 flex items-center justify-center rounded-full shrink-0">
                    <ArrowUp />
                </div>
            </div>
        </div>
    )


    return (
        <div className={`max-w-[80%] flex flex-col gap-2 ${mainStyle}`}>
        <div className={`w-full p-3 rounded-b-xl ${secondStyle}`}>
            {disliked ?
                FeedbackLayout :
                NonFeedbackLayout
            }
        </div>
        
        {isFeedbackNeeded && !disliked &&
            <div className="flex gap-4 text-primary text-2xl self-end">
                <ThumbsDown onClick={() => setDisliked(true)} />
                <ThumbsUp onClick={() => setLiked(!liked)} className={`${liked ? "" : "fill-transparent"}`} fill="currentColor" />
            </div>
        }
        </div>
    )
}