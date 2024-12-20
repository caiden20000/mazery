import { TexturedPhysicalMaterial } from "./TextureUtil";

const texturePaths = {
  color: "/textures/office_tile.jpg",
  ao: "/textures/office_tile_ao.jpg",
  height: "/textures/office_tile_height.png",
  metallic: "/textures/office_tile_metallic.jpg",
  normal: "/textures/office_tile_normal.png",
  roughness: "/textures/office_tile_roughness.jpg",
};

export function OfficeTileMaterial() {
  return TexturedPhysicalMaterial(texturePaths, true, 12 * 5, 12 * 5);
}
