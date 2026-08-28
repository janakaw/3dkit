import hero from "@/assets/hero-suite.jpg.asset.json";
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

const baseProducts: Product[] = [
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

// --- Catalog expansion -------------------------------------------------
const catalogImages = [p1.url, p2.url, p3.url, p4.url, p5.url, p6.url, p7.url, p8.url, p9.url, p10.url];

type Blueprint = {
  name: string;
  category: string;
  style: string;
  price: number;
  polys: number;
  subcategory?: string;
};

const blueprints: Blueprint[] = [
  { name: "Marlow Wingback Armchair", category: "Armchair", style: "Modern", price: 15, polys: 62000 },
  { name: "Nord Bouclé Armchair", category: "Armchair", style: "Scandinavian", price: 13, polys: 54000 },
  { name: "Rivo Leather Club Chair", category: "Armchair", style: "Mid-century", price: 17, polys: 71000 },
  { name: "Halden Accent Chair", category: "Armchair", style: "Minimal", price: 11, polys: 46000 },
  { name: "Terrace Rattan Armchair", category: "Armchair", style: "Outdoor", price: 12, polys: 49000 },
  { name: "Corso Swivel Armchair", category: "Armchair", style: "Modern", price: 16, polys: 66000 },
  { name: "Aveline Bouclé Lounge Chair", category: "Armchair", style: "Scandinavian", price: 14, polys: 58000 },
  { name: "Otto Shell Armchair", category: "Armchair", style: "Mid-century", price: 15, polys: 61000 },
  { name: "Piano Low Armchair", category: "Armchair", style: "Minimal", price: 12, polys: 44000 },
  { name: "Sable Leather Armchair", category: "Armchair", style: "Mid-century", price: 18, polys: 74000 },
  { name: "Lume Reading Chair", category: "Armchair", style: "Scandinavian", price: 13, polys: 51000 },
  { name: "Vero Cocoon Armchair", category: "Armchair", style: "Modern", price: 17, polys: 69000 },
  { name: "Bay Teak Lounge Chair", category: "Armchair", style: "Outdoor", price: 13, polys: 52000 },
  { name: "Nova Tub Chair", category: "Armchair", style: "Minimal", price: 11, polys: 42000 },
  { name: "Ellis Slipper Chair", category: "Armchair", style: "Mid-century", price: 12, polys: 47000 },
  { name: "Arlo Steel Frame Armchair", category: "Armchair", style: "Modern", price: 14, polys: 56000 },
  { name: "Fjord Wool Armchair", category: "Armchair", style: "Scandinavian", price: 0, polys: 39000 },
  { name: "Solis Cane Armchair", category: "Armchair", style: "Outdoor", price: 12, polys: 48000 },
  { name: "Mira Sculpted Armchair", category: "Armchair", style: "Minimal", price: 15, polys: 60000 },
  { name: "Roux Velvet Wing Chair", category: "Armchair", style: "Modern", price: 16, polys: 64000 },
  { name: "Kioto Oak Armchair", category: "Armchair", style: "Minimal", price: 13, polys: 50000 },
  { name: "Adell Curved Armchair", category: "Armchair", style: "Modern", price: 17, polys: 68000 },
  { name: "Brant Lounge Chair", category: "Armchair", style: "Mid-century", price: 16, polys: 63000 },
  { name: "Hana Rope Armchair", category: "Armchair", style: "Outdoor", price: 13, polys: 53000 },
  { name: "Bexley L-Shape Sofa", category: "Sofa", style: "Modern", price: 29, polys: 138000 },
  { name: "Aster 2-Seater Sofa", category: "Sofa", style: "Scandinavian", price: 21, polys: 96000 },
  { name: "Vella Curved Sofa", category: "Sofa", style: "Modern", price: 32, polys: 152000 },
  { name: "Kessler Tufted Sofa", category: "Sofa", style: "Mid-century", price: 26, polys: 118000 },
  { name: "Dune Modular Sofa", category: "Sofa", style: "Minimal", price: 31, polys: 146000 },
  { name: "Lisbon Outdoor Sofa", category: "Sofa", style: "Outdoor", price: 23, polys: 104000 },
  { name: "Slate Round Coffee Table", category: "Coffee Table", style: "Minimal", price: 10, polys: 21000 },
  { name: "Bram Oak Coffee Table", category: "Coffee Table", style: "Scandinavian", price: 11, polys: 26000 },
  { name: "Onyx Nesting Tables", category: "Coffee Table", style: "Modern", price: 13, polys: 32000 },
  { name: "Teak Terrace Table", category: "Coffee Table", style: "Outdoor", price: 9, polys: 19000 },
  { name: "Fenn Sideboard", category: "Cabinet", style: "Mid-century", price: 18, polys: 47000 },
  { name: "Kilda Tall Cabinet", category: "Cabinet", style: "Scandinavian", price: 17, polys: 44000 },
  { name: "Noir Display Cabinet", category: "Cabinet", style: "Modern", price: 19, polys: 52000 },
  { name: "Linden Drawer Chest", category: "Cabinet", style: "Minimal", price: 15, polys: 38000 },
  { name: "Pico Marble Side Table", category: "Side Table", style: "Minimal", price: 7, polys: 11000 },
  { name: "Ferro Steel Side Table", category: "Side Table", style: "Modern", price: 8, polys: 13000 },
  { name: "Birch Stool Table", category: "Side Table", style: "Scandinavian", price: 0, polys: 9000 },
  { name: "Grove Outdoor Side Table", category: "Side Table", style: "Outdoor", price: 7, polys: 12000 },
  { name: "Round Bouclé Ottoman", category: "Ottoman", style: "Scandinavian", price: 9, polys: 22000 },
  { name: "Leather Bench Ottoman", category: "Ottoman", style: "Mid-century", price: 10, polys: 25000 },
  { name: "Pouf Ottoman Duo", category: "Ottoman", style: "Minimal", price: 0, polys: 16000 },
  { name: "Aurelia Living Set", category: "Set", subcategory: "Living Set", style: "Modern", price: 52, polys: 360000 },
  { name: "Nordic Loft Living Set", category: "Set", subcategory: "Living Set", style: "Scandinavian", price: 46, polys: 320000 },
  { name: "Sable Dining Set", category: "Set", subcategory: "Dining Set", style: "Minimal", price: 41, polys: 195000 },
  { name: "Provence Dining Set", category: "Set", subcategory: "Dining Set", style: "Modern", price: 44, polys: 205000 },
  { name: "Coastal Patio Set", category: "Set", subcategory: "Patio Set", style: "Outdoor", price: 36, polys: 215000 },
  { name: "Sienna Terrace Set", category: "Set", subcategory: "Patio Set", style: "Outdoor", price: 38, polys: 228000 },
];

const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const generatedProducts: Product[] = blueprints.map((b, i) => ({
  slug: slugify(b.name),
  name: b.name,
  category: b.category,
  ...(b.subcategory ? { subcategory: b.subcategory } : {}),
  style: b.style,
  price: b.price,
  image: catalogImages[i % catalogImages.length] as string,
  polys: `${b.polys.toLocaleString()} polys`,
  formats: "MAX (2020+), FBX, OBJ",
  textures: b.polys > 40000 ? "4K PBR" : "2K PBR",
  renderers: "Corona, V-Ray, FStorm",
  description: `${b.name} — an original ${b.style.toLowerCase()} ${b.category.toLowerCase()} modelled in-house for archviz and interior visualisation. Clean quad-dominant topology, real-world scale and calibrated PBR materials, ready to drop straight into your scene.`,
  specs: [
    "Real-world scale (cm), centred pivots",
    `Geometry: Quad-dominant, ${b.polys.toLocaleString()} polys`,
    `Textures: ${b.polys > 40000 ? "4K" : "2K"} PBR (albedo, normal, rough)`,
    "Render Engines: Corona, V-Ray, FStorm",
    "Mid-poly game variant included",
    "Support: Lifetime updates",
  ],
}));

export const products: Product[] = [...baseProducts, ...generatedProducts];

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

export const types = ["2-Seater", "3-Seater", "L-Shape"] as const;

/** Type filters are only defined for Sofa for now; more categories come later. */
export const typesByCategory: Record<string, readonly string[]> = {
  Sofa: ["2-Seater", "3-Seater", "L-Shape"],
};

const sofaTypeOverrides: Record<string, string> = {
  "vella-curved-sofa": "3-Seater",
  "kessler-tufted-sofa": "3-Seater",
  "dune-modular-sofa": "L-Shape",
  "lisbon-outdoor-sofa": "2-Seater",
};

/** Returns the sofa seating type, or undefined for categories without types yet. */
export const getType = (slug: string): string | undefined => {
  const product = products.find((p) => p.slug === slug);
  if (!product || product.category !== "Sofa") return undefined;
  const name = product.name.toLowerCase();
  if (name.includes("l-shape") || name.includes("sectional")) return "L-Shape";
  if (name.includes("3-seater")) return "3-Seater";
  if (name.includes("2-seater")) return "2-Seater";
  return sofaTypeOverrides[slug] ?? "3-Seater";
};

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const newReleases = products.filter((p) => p.isNew);
export const formatPrice = (n: number) => (n === 0 ? "FREE" : `$${n.toFixed(2)} USD`);

export const categorySlug = (c: string) => c.toLowerCase().replace(/\s+/g, "-");
export const categoryFromSlug = (slug: string) =>
  categories.find((c) => categorySlug(c) === slug.toLowerCase());
export const PAGE_SIZE = 12;
