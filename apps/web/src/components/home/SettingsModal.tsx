"use client";

import React, { useState, useEffect } from "react";
import { X, Globe, Music, Volume2, VolumeX } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { Howl } from "howler";
import { DuoButton } from "../ui/DuoButton";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Lofi music (Placeholder URL - replace with actual in production)
const lofiMusic = new Howl({
  src: ["/assets/sounds/lofi.mp3"],
  loop: true,
  volume: 0.3,
});

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  useEffect(() => {
    if (isMusicPlaying) {
      if (!lofiMusic.playing()) lofiMusic.play();
    } else {
      lofiMusic.pause();
    }
  }, [isMusicPlaying]);

  if (!isOpen) return null;

  const changeLanguage = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-100">
        
        {/* Header */}
        <div className="pt-6 pb-4 px-6 flex items-center justify-between border-b-2 border-gray-100">
          <h2 className="text-2xl font-black text-earth-text flex items-center gap-2">
            ⚙️ Settings
          </h2>
          <button 
            aria-label="Close"
            title="Close"
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8">
          
          {/* Language Selection */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider text-sm">
              <Globe size={16} /> Language
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: "en", label: "English", flag: "🇺🇸" },
                { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
                { code: "zh", label: "中文", flag: "🇨🇳" },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 font-bold transition-all ${
                    locale === lang.code 
                    ? "border-blue-500 bg-blue-50 text-blue-600" 
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="text-xs">{lang.code.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Audio Settings */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider text-sm">
              <Music size={16} /> Audio
            </h3>
            <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isMusicPlaying ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-400"}`}>
                  {isMusicPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
                </div>
                <div>
                  <div className="font-bold text-earth-text">Lofi Music</div>
                  <div className="text-xs text-gray-400">Background chill vibes</div>
                </div>
              </div>
              
              {/* iOS style toggle */}
              <button 
                aria-label="Toggle Background Music"
                title="Toggle Background Music"
                onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${isMusicPlaying ? "bg-green-500" : "bg-gray-300"}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${isMusicPlaying ? "left-7" : "left-1"}`} />
              </button>
            </div>
          </div>

          {/* Email Report (Test) */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider text-sm">
              ✉️ Reports
            </h3>
            <div className="flex flex-col gap-3 p-4 border-2 border-gray-200 rounded-2xl">
              <input 
                id="report-email"
                type="email"
                placeholder="Your email (Resend verified)"
                aria-label="Email address for report"
                className="w-full p-2 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-fire-orange focus:outline-none"
              />
              <DuoButton 
                variant="primary" 
                size="sm" 
                onClick={async () => {
                  const emailInput = document.getElementById("report-email") as HTMLInputElement;
                  if (!emailInput.value) return alert("Please enter an email");
                  
                  try {
                    const res = await fetch("/api/send-report", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: emailInput.value,
                        streak: 12, // Dummy data or get from store
                        coins: 150,
                        habitsCompleted: 3,
                        totalHabits: 3,
                        petStage: "rabbit"
                      })
                    });
                    const data = await res.json();
                    if (data.success) {
                      alert("Email sent successfully! Check your inbox.");
                    } else {
                      alert("Failed: " + data.error);
                    }
                  } catch {
                    alert("Error sending email");
                  }
                }}
              >
                Send Test Report
              </DuoButton>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
