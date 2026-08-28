import hero from "@/assets/hero-living.jpg.asset.json";
import p1 from "@/assets/p1.jpg.asset.json";
import p2 from "@/assets/p2.jpg.asset.json";
import p3 from "@/assets/p3.jpg.asset.json";
import p4 from "@/assets/p4.jpg.asset.json";
import p5 from "@/assets/p5.jpg.asset.json";
import p6 from "@/assets/p6.jpg.asset.json";
import p7 from "@/assets/p7.jpg.asset.json";
import p8 from "@/assets/p8.jpg.asset.json";
import p9 from "@/assets/p9.jpg.asset.json";
import p10 from "@/assets/p10.jpg.asset.json";

export const heroImage = hero.url;

export type Product = {
  slug: string;
  name: string;
  category: string;
  style: string;
  price: number;
  image: string;
  polys: string;
  formats: string;
  textures: string;
  renderers: string;
  description: string;
  specs: string[];
  isNew?: boolean;
  subcategory?: string;
};

export type PolyTier = "high" | "mid";

export type Variant = {
  polys: string;
  price: number;
  textures: string;
  formats: string;
  label: string;
  note: string;
};

const polyCount = (polys: string) => Number(polys.replace(/[^0-9]/g, "")) || 0;

export function getVariant(product: Product, tier: PolyTier): Variant {
  if (tier === "high") {
    return {
      polys: product.polys,
      price: product.price,
      textures: product.textures,
      formats: product.formats,
      label: "High-poly",
      note: "Archviz render ready (Corona / V-Ray / FStorm)",
    };
  }
  const count = Math.round(polyCount(product.polys) * 0.12);
  return {
    polys: `${count.toLocaleString()} tris`,
    price: product.price === 0 ? 0 : Math.max(4, Math.round(product.price * 0.6)),
    textures: "2K PBR, baked & atlased",
    formats: "FBX, GLB, OBJ (Unreal / Unity)",
    label: "Mid-poly",
    note: "Game-ready, LODs + baked normals",
  };
}

export const products: Product[] = [
  {
    slug: "eames-lounge-chair",
    style: "Mid-century",
    name: "Eames Lounge Chair",
    category: "Armchair",
    price: 19,
    image: p1.url,
    polys: "86,000 polys",
    formats: "MAX (2020+), FBX, OBJ",
    textures: "4K PBR",
    renderers: "Corona, V-Ray, FStorm",
    description:
      "A mid-century classic lounge chair with matching ottoman. Moulded walnut shell, tufted leather cushions and a polished aluminium base — modelled clean and quad-dominant for close-up interior renders.",
    specs: [
      "Chair: W85cm x D85cm x H82cm",
      "Ottoman: W65cm x D55cm x H42cm",
      "Geometry: Quad-dominant, 86,000 polys",
      "Textures: 4K PBR (albedo, normal, rough)",
      "Render Engines: Corona, V-Ray, FStorm",
      "Support: Lifetime updates",
    ],
    isNew: true,
  },
  {
    slug: "sloan-3-seater-sofa",
    style: "Modern",
    name: "Sloan 3-Seater Sofa",
    category: "Sofa",
    price: 24,
    image: p2.url,
    polys: "112,000 polys",
    formats: "MAX (2020+), FBX, OBJ",
    textures: "4K PBR",
    renderers: "Corona, V-Ray, FStorm",
    description:
      "Soft cream upholstery with tapered walnut legs. Cushions are sculpted with subtle fabric wrinkle detail so the sofa reads naturally in both wide shots and close crops.",
    specs: [
      "Sofa: W210cm x D92cm x H78cm",
      "Seat height: 44cm",
      "Geometry: Quad-dominant, 112,000 polys",
      "Textures: 4K PBR fabric",
      "Render Engines: Corona, V-Ray, FStorm",
      "Support: Lifetime updates",
    ],
    isNew: true,
  },
  {
    slug: "noguchi-table",
    style: "Mid-century",
    name: "Noguchi Table",
    category: "Coffee Table",
    price: 12,
    image: p3.url,
    polys: "24,000 polys",
    formats: "MAX (2020+), FBX, OBJ",
    textures: "2K PBR",
    renderers: "Corona, V-Ray, FStorm",
    description:
      "Sculptural glass-top coffee table on an interlocking solid wood base. Includes a correctly set up glass material with thin-walled refraction for each supported renderer.",
    specs: [
      "Table: W120cm x D90cm x H38cm",
      "Glass thickness: 19mm",
      "Geometry: Quad-dominant, 24,000 polys",
      "Textures: 2K PBR wood",
      "Render Engines: Corona, V-Ray, FStorm",
      "Support: Lifetime updates",
    ],
    isNew: true,
  },
  {
    slug: "oak-media-console",
    style: "Scandinavian",
    name: "Oak Media Console",
    category: "Cabinet",
    price: 16,
    image: p4.url,
    polys: "41,000 polys",
    formats: "MAX (2020+), FBX, OBJ",
    textures: "4K PBR",
    renderers: "Corona, V-Ray, FStorm",
    description:
      "Low oak console with open shelving and three drawers. Drawer fronts are separate objects so you can open them for staged shots.",
    specs: [
      "Console: W180cm x D42cm x H52cm",
      "Openable drawers as separate objects",
      "Geometry: Quad-dominant, 41,000 polys",
      "Textures: 4K PBR oak",
      "Render Engines: Corona, V-Ray, FStorm",
      "Support: Lifetime updates",
    ],
    isNew: true,
  },
  {
    slug: "olive-velvet-armchair",
    style: "Modern",
    name: "Olive Velvet Armchair",
    category: "Armchair",
    price: 14,
    image: p5.url,
    polys: "58,000 polys",
    formats: "MAX (2020+), FBX, OBJ",
    textures: "4K PBR",
    renderers: "Corona, V-Ray, FStorm",
    description:
      "Curved velvet shell chair on slim black steel legs. Velvet shader ships with a fall-off setup tuned for soft interior lighting.",
    specs: [
      "Chair: W72cm x D70cm x H78cm",
      "Seat height: 43cm",
      "Geometry: Quad-dominant, 58,000 polys",
      "Textures: 4K PBR velvet",
      "Render Engines: Corona, V-Ray, FStorm",
      "Support: Lifetime updates",
    ],
  },
  {
    slug: "cube-ottoman",
    style: "Minimal",
    name: "Cube Ottoman",
    category: "Ottoman",
    price: 8,
    image: p6.url,
    polys: "18,000 polys",
    formats: "MAX (2020+), FBX, OBJ",
    textures: "2K PBR",
    renderers: "Corona, V-Ray, FStorm",
    description:
      "Simple upholstered cube ottoman with piped seams. Lightweight enough to scatter through a scene without slowing your viewport.",
    specs: [
      "Ottoman: W70cm x D70cm x H42cm",
      "Geometry: Quad-dominant, 18,000 polys",
      "Textures: 2K PBR fabric",
      "Render Engines: Corona, V-Ray, FStorm",
      "Support: Lifetime updates",
    ],
  },
  {
    slug: "yves-complete-living-room-set",
    style: "Modern",
    name: "Yves Complete Living Room Set",
    category: "Set",
    subcategory: "Living Set",
    price: 49,
    image: p7.url,
    polys: "345,000 polys (set total)",
    formats: "MAX (2020+), FBX, OBJ",
    textures: "4K PBR",
    renderers: "Corona, V-Ray, FStorm",
    description:
      "A luxurious, contemporary living room ensemble including the modular Yves sofa, armchair, ottoman, coffee table and console. Perfect for photorealistic interior visualisation.",
    specs: [
      "Sofa: W240cm x D160cm x H78cm",
      "Armchair: W110cm x H78cm",
      "Coffee Table: D90cm x H38cm",
      "Ottoman: W100cm x D80cm x H40cm",
      "Geometry: Quad-dominant, 345,000 polys",
      "Render Engines: Corona, V-Ray, FStorm",
    ],
  },
  {
    slug: "marble-tripod-side-table",
    style: "Minimal",
    name: "Marble Tripod Side Table",
    category: "Side Table",
    price: 0,
    image: p8.url,
    polys: "9,000 polys",
    formats: "MAX (2020+), FBX, OBJ",
    textures: "2K PBR",
    renderers: "Corona, V-Ray, FStorm",
    description:
      "Free download. Slim tripod side table with a Carrara marble top — a handy filler prop for living room and bedroom scenes.",
    specs: [
      "Table: D40cm x H55cm",
      "Geometry: Quad-dominant, 9,000 polys",
      "Textures: 2K PBR marble",
      "Render Engines: Corona, V-Ray, FStorm",
      "Licence: Free for commercial use",
    ],
  },
  {
    slug: "harlow-dining-set",
    style: "Mid-century",
    name: "Harlow Dining Set",
    category: "Set",
    subcategory: "Dining Set",
    price: 39,
    image: p9.url,
    polys: "180,000 polys (set total)",
    formats: "MAX (2020+), FBX, OBJ",
    textures: "4K PBR",
    renderers: "Corona, V-Ray, FStorm",
    description:
      "Walnut dining table with six upholstered chairs and a small table-top styling kit. Chairs are separate objects with adjustable rotation pivots for natural scene staging.",
    specs: [
      "Table: W200cm x D95cm x H75cm",
      "Chair: W55cm x D58cm x H82cm",
      "Geometry: Quad-dominant, 180,000 polys",
      "Textures: 4K PBR walnut & wool",
      "Render Engines: Corona, V-Ray, FStorm",
      "Support: Lifetime updates",
    ],
    isNew: true,
  },
  {
    slug: "azure-patio-set",
    style: "Outdoor",
    name: "Azure Patio Set",
    category: "Set",
    subcategory: "Patio Set",
    price: 34,
    image: p10.url,
    polys: "210,000 polys (set total)",
    formats: "MAX (2020+), FBX, OBJ",
    textures: "4K PBR",
    renderers: "Corona, V-Ray, FStorm",
    description:
      "Outdoor teak and rattan lounge collection with parasol, low table and weather-worn cushion materials — built for exterior and terrace visualisation.",
    specs: [
      "Sofa: W180cm x D80cm x H72cm",
      "Parasol: D250cm x H240cm",
      "Geometry: Quad-dominant, 210,000 polys",
      "Textures: 4K PBR teak, rattan, outdoor fabric",
      "Render Engines: Corona, V-Ray, FStorm",
      "Support: Lifetime updates",
    ],
  },
];

export const categories = [
  "Armchair",
  "Sofa",
  "Coffee Table",
  "Cabinet",
  "Side Table",
  "Ottoman",
  "Set",
] as const;

export const setSubcategories = ["Living Set", "Dining Set", "Patio Set"] as const;

export const styles = ["Mid-century", "Modern", "Scandinavian", "Minimal", "Outdoor"] as const;

export const types = [
  "Lounge Chair",
  "3-Seater",
  "L-Shape",
  "Round",
  "Rectangular",
  "Console",
  "Cube",
  "Full Set",
] as const;

const typeBySlug: Record<string, string> = {
  "eames-lounge-chair": "Lounge Chair",
  "sloan-3-seater-sofa": "3-Seater",
  "noguchi-table": "Round",
  "oak-media-console": "Console",
  "olive-velvet-armchair": "Lounge Chair",
  "cube-ottoman": "Cube",
  "yves-complete-living-room-set": "L-Shape",
  "marble-tripod-side-table": "Round",
  "harlow-dining-set": "Rectangular",
  "azure-patio-set": "Full Set",
};

export const getType = (slug: string) => typeBySlug[slug] ?? "Full Set";

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const newReleases = products.filter((p) => p.isNew);
export const formatPrice = (n: number) => (n === 0 ? "FREE" : `$${n.toFixed(2)} USD`);
