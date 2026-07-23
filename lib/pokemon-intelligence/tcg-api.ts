export type TcgApiSet = {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  releaseDate: string;
  images?: {
    logo?: string;
    symbol?: string;
  };
};

export type TcgApiCard = {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  supertype: string;
  subtypes?: string[];
  set: {
    id: string;
    name: string;
    series: string;
    releaseDate: string;
  };
  images?: {
    small?: string;
    large?: string;
  };
  tcgplayer?: {
    prices?: Record<string, { high?: number; low?: number; market?: number; mid?: number }>;
    url?: string;
    updatedAt?: string;
  };
};

type ApiResponse<T> = {
  data: T[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
};

const baseUrl = "https://api.pokemontcg.io/v2";

function escapeQuery(value: string) {
  return value.replaceAll('"', '\\"').trim();
}

async function tcgRequest<T>(path: string) {
  const headers: HeadersInit = { Accept: "application/json" };
  const apiKey = process.env.POKEMON_TCG_API_KEY?.trim();
  if (apiKey) headers["X-Api-Key"] = apiKey;

  const response = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Pokemon TCG API returned ${response.status}.`);
  }

  return response.json() as Promise<ApiResponse<T>>;
}

export async function searchTcgSets(query: string) {
  const q = escapeQuery(query);
  const search = q ? `?q=name:"${encodeURIComponent(q)}*"&orderBy=-releaseDate&pageSize=20` : "?orderBy=-releaseDate&pageSize=20";
  return tcgRequest<TcgApiSet>(`/sets${search}`);
}

export async function searchTcgCards(query: string) {
  const q = escapeQuery(query);
  const search = q ? `?q=name:"${encodeURIComponent(q)}*"&orderBy=name&pageSize=20` : "?orderBy=name&pageSize=20";
  return tcgRequest<TcgApiCard>(`/cards${search}`);
}
