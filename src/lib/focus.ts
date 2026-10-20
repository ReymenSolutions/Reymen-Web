// Acercamiento a una zona de una captura: [x, y, zoom] con x e y en % del centro de la zona. Devuelve las variables CSS que usan los recortes.
export const origin = (c: number, z: number) => {
  const w = 1 / z;
  const a = Math.min(Math.max(c / 100 - w / 2, 0), 1 - w);
  return z === 1 ? 0 : (a / (1 - w)) * 100;
};
export const focusVars = (f: readonly number[] = [50, 50, 1]) => {
  const [x = 50, y = 50, z = 1] = f;
  return `--z:${z};--ox:${origin(x, z).toFixed(1)}%;--oy:${origin(y, z).toFixed(1)}%;`;
};
