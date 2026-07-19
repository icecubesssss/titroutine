"use client";

import React from "react";
import Image from "next/image";
import type { RoomId } from "@/lib/rooms";
import type { TimeOfDay } from "@/components/home/hooks/useTimeOfDay";

interface RoomBackdropProps {
  roomId: RoomId;
  timeOfDay: TimeOfDay;
  weather: "rain" | "snow" | null;
  showWallpaper: boolean;
  customWallpaper?: { imageUrl: string } | null;
}

export function RoomBackdrop({ roomId }: RoomBackdropProps) {
  const getRoomAssetUrl = () => {
    switch (roomId) {
      case "bedroom":
        return "/assets/empty_study_bunny_room.png";
      case "kitchen":
        return "/assets/empty_study_bunny_kitchen.png";
      case "living":
        return "/assets/empty_study_bunny_living.png";
      case "garden":
        return "/assets/empty_study_bunny_garden.png";
      case "bathroom":
        return "/assets/empty_study_bunny_bathroom.png";
      default:
        return "/assets/empty_study_bunny_room.png";
    }
  };

  return (
    <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl border border-stone-200/50 shadow-lg animate-fade-in">
      <Image
        src={getRoomAssetUrl()}
        alt={`${roomId} backdrop`}
        fill
        priority
        className="object-cover"
      />
    </div>
  );
}
