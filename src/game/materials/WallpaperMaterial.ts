import { TexturedPhysicalMaterial } from "./TextureUtil";

const texturePaths = {
  color: "/textures/paper_0018_color_1k.jpg",
  ao: "/textures/paper_0018_ao_1k.jpg",
  //   height: "/textures/paper_0018_height_1k.png",
  normal: "/textures/paper_0018_normal_opengl_1k.png",
  roughness: "/textures/paper_0018_roughness_1k.jpg",
};

var mat;

export function WallpaperMaterial() {
  if (!mat) mat = TexturedPhysicalMaterial(texturePaths, true, 3, 3);
  return mat;
}
