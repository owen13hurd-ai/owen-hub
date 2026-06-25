"use client";

import Image from "next/image";
import { useState } from "react";

import { getPokemonSpriteUrls } from "@/lib/pokemon/sprites";

export function PokemonSprite({
  className = "",
  name,
}: {
  className?: string;
  name: string;
}) {
  const [spriteIndex, setSpriteIndex] = useState(0);
  const [isMissing, setIsMissing] = useState(false);
  const spriteUrls = getPokemonSpriteUrls(name);

  if (isMissing) {
    return (
      <div
        className={`flex items-center justify-center rounded-md bg-mist text-xs font-bold text-ink/45 ${className}`}
        aria-hidden="true"
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={spriteUrls[spriteIndex]}
      alt=""
      aria-hidden="true"
      className={`object-contain [image-rendering:pixelated] ${className}`}
      height={64}
      loading="lazy"
      unoptimized
      width={64}
      onError={() => {
        const nextIndex = spriteIndex + 1;

        if (nextIndex < spriteUrls.length) {
          setSpriteIndex(nextIndex);
          return;
        }

        setIsMissing(true);
      }}
    />
  );
}
