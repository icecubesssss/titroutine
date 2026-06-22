import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface DuoButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const DuoButton = React.forwardRef<HTMLButtonElement, DuoButtonProps>(
  (
    { className, variant = "primary", size = "md", fullWidth, children, ...props },
    ref
  ) => {
    // Duolingo-style 3D button classes
    const baseClasses =
      "relative inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-2xl transition-all active:translate-y-1 active:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-fire-red text-white border-b-4 border-earth-brown hover:brightness-110",
      secondary: "bg-earth-bg text-earth-text border-2 border-b-4 border-gray-300 hover:bg-gray-50",
      danger: "bg-fire-orange text-white border-b-4 border-orange-700 hover:brightness-110",
      ghost: "bg-transparent text-earth-text hover:bg-gray-100 active:border-b-0",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

DuoButton.displayName = "DuoButton";
