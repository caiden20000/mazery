import {
  MeshPhysicalMaterial,
  TextureLoader,
  RepeatWrapping,
} from "three";

const loader = new TextureLoader();

type TexturePaths = {
  color: string;
  ao?: string;
  height?: string;
  metallic?: string;
  normal?: string;
  roughness?: string;
};

export function TexturedPhysicalMaterial(
  paths: TexturePaths,
  repeat: boolean,
  repeatX: number,
  repeatY: number
) {
  const setRepeat = (texture) => {
    if (!repeat) return;
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.needsUpdate = true;
    // texture.generateMipmaps = false;
    // texture.minFilter = LinearFilter; // Or another non-mipmap filter
  };

  return new MeshPhysicalMaterial({
    map: loader.load(paths.color, setRepeat),
    aoMap: loader.load(paths.ao, setRepeat),
    displacementMap: loader.load(paths.height, setRepeat),
    metalnessMap: loader.load(paths.metallic, setRepeat),
    normalMap: loader.load(paths.normal, setRepeat),
    roughnessMap: loader.load(paths.roughness, setRepeat),
  });
}
