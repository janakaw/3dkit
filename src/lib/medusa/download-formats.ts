/**
 * Mirrors the backend's src/lib/download-formats.ts — same keys, same
 * order. Keep the two in sync (the backend rejects unknown keys).
 */
export const DOWNLOAD_FORMATS = [
  { key: "fbx", label: "FBX" },
  { key: "obj", label: "OBJ" },
  { key: "max", label: "3ds Max (.max)" },
  { key: "corona", label: "3ds Max + Corona" },
  { key: "vray", label: "3ds Max + V-Ray" },
  { key: "blend", label: "Blender (.blend)" },
] as const;

export type DownloadFormat = (typeof DOWNLOAD_FORMATS)[number]["key"];

export type DownloadLink = { url: string; format: DownloadFormat; expires_at: string };
