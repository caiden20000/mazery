import { TexturedPhysicalMaterial } from "./TextureUtil";

const texturePaths = {
  color: "/textures/fabric_0009_color_1k.jpg",
  ao: "/textures/fabric_0009_ao_1k.jpg",
  normal: "/textures/fabric_0009_normal_opengl_1k.png",
  roughness: "/textures/fabric_0009_roughness_1k.jpg",
};

var mat;

export function CarpetMaterial() {
  if (!mat) mat = TexturedPhysicalMaterial(texturePaths, true, 12 * 5, 12 * 5);
  return mat;
}
