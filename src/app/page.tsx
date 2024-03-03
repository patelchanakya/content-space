'use client';
import React from "react";
import { WavyBackground } from "../components/ui/wavy-background";
import { ThreeDCardDemo } from "../components/home-card";

export default function HomePage() {
  return (
    <WavyBackground className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-center space-y-2">

        <ThreeDCardDemo />
      </div>
    </WavyBackground>
  );
}
