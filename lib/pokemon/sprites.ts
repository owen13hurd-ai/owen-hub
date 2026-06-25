const showdownSpriteBaseUrl = "https://play.pokemonshowdown.com/sprites/gen5";

const spriteNameOverrides: Record<string, string> = {
  "maushold-four": "maushold",
  "ninetales-alola": "ninetales-alola",
};

function toShowdownSpriteName(name: string) {
  return name
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/♀/g, "f")
    .replace(/♂/g, "m")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getFallbackSpriteNames(spriteName: string) {
  const fallbackNames = [spriteName];

  if (spriteName.endsWith("-mega-x") || spriteName.endsWith("-mega-y")) {
    fallbackNames.push(spriteName.replace(/-mega-[xy]$/, ""));
  }

  if (spriteName.endsWith("-mega")) {
    fallbackNames.push(spriteName.replace(/-mega$/, ""));
  }

  const withoutForm = spriteName.split("-")[0];

  if (withoutForm && withoutForm !== spriteName) {
    fallbackNames.push(withoutForm);
  }

  return Array.from(new Set(fallbackNames));
}

export function getPokemonSpriteUrls(name: string) {
  const spriteName = toShowdownSpriteName(name);
  const overriddenSpriteName = spriteNameOverrides[spriteName] ?? spriteName;

  return getFallbackSpriteNames(overriddenSpriteName).map((candidate) => {
    return `${showdownSpriteBaseUrl}/${candidate}.png`;
  });
}
