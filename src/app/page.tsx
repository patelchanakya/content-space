'use client';
import React from "react";
import { WavyBackground } from "../components/ui/wavy-background";

export default function HomePage() {
  return (
    <WavyBackground className="max-w-4xl mx-auto pb-40">
      <div className="flex flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl md:text-4xl lg:text-7xl text-white font-bold inter-var text-center">
          Unleash Your Creativity
        </h1>
        <p className="text-base md:text-lg text-white font-normal inter-var text-center">
          Explore and create with tools designed to bring your creative projects to life.
        </p>
        <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-bold hover:from-blue-600 hover:to-purple-700 transition duration-200 ease-in-out transform hover:scale-105">
          Get Started
        </button>
      </div>
    </WavyBackground>
  );
}
