/** Classic 2:1 isometric projection helpers. */

export const ISO_W = 64
export const ISO_H = 32

export function tileToScreen(tx: number, ty: number): { x: number; y: number } {
  return {
    x: (tx - ty) * (ISO_W / 2),
    y: (tx + ty) * (ISO_H / 2),
  }
}

export function screenToTile(sx: number, sy: number): { x: number; y: number } {
  const tx = (sx / (ISO_W / 2) + sy / (ISO_H / 2)) / 2
  const ty = (sy / (ISO_H / 2) - sx / (ISO_W / 2)) / 2
  return { x: Math.floor(tx), y: Math.floor(ty) }
}

export function depthForTile(tx: number, ty: number, bias = 0): number {
  return tx + ty + bias
}
