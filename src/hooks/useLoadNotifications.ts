// src/hooks/useLoadNotifications.ts
"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";


export function useLoadNotifications() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const deliveryaudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/notify.mp3");
    deliveryaudioRef.current = new Audio("/notify_delivered.mp3")

    const channel = supabase
      .channel("realtime:loads")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "loads" },
        (payload) => {
          console.log("Realtime changes:", payload);
          

          // Decide message
          let title = "";
          let message = "";
          if (payload.eventType === "INSERT") {
            title = `📦 New Load Created`
            message = `Load: ${payload.new.load_number} has been successfully added to the system`;
          } 
          else if (payload.eventType === "UPDATE") {

            if (payload.new.status !== payload.old.status){
              //Load is set to Pending
            if(payload.new.status === "Pending"){
              title = `   👨🏻‍✈️ Driver Unassigned`
              message = `Load ${payload.new.load_number} is now pending. No driver is assigned or the Assigned driver rejected the load.`

            }else if(payload.new.status === "Assigned"){
              title = `   👳🏻‍♂️ Driver Assinged`
              message = `Driver has accepted load ${payload.new.load_number}.It's ready to move.`

            } else if(payload.new.status === "In Transit"){
              title = `   🚚 Load In Transit`
              message = `Load: ${payload.new.load_number} is currently on the move. Keep tracking for updates.`

            }else if(payload.new.status === "Delivered"){
              toast.success(`   📦 Load Delivered`,{
            description: `Load: ${payload.new.load_number} has been successfully delivered to its destination.`,
            classNames:{
                toast: "round-xl shadow-lg border border-gray-200",
                title: "font-bold text-base",
                description: "text-sm text-gray-600"
            },})
                deliveryaudioRef.current?.play().catch((err) => console.warn("Delivery sound play blocked",err))
            }else if(payload.new.status === "Cancelled"){
              title = `   ❌ Load Cancelled`
              message = `Load: ${payload.new.load_number} has been cancelled.`
            }}
          }
           else if (payload.eventType === "DELETE") {
            title = `   🗑️ Load Deleted`
            message = `Load: ${payload.old.load_number} has been removed from the system.`;
          }

          // Show toast
          if (message.length>0){
          toast.info(title,{
            description: message,
            classNames:{
                toast: "round-xl shadow-lg border border-gray-200",
                title: "font-bold text-base",
                description: "text-sm text-gray-600"
            },
          });

          // Play sound
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((err) => console.warn("Sound play blocked:", err));
          }}
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
