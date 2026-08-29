import 'package:flutter_scene/scene.dart';
import 'package:vector_math/vector_math.dart' as vm;

class MaterialPalette {
  const MaterialPalette();

  PhysicallyBasedMaterial solid(
    int rgb, {
    double roughness = 0.62,
    double metallic = 0,
  }) {
    return PhysicallyBasedMaterial()
      ..baseColorFactor = vm.Vector4(
        ((rgb >> 16) & 0xff) / 255,
        ((rgb >> 8) & 0xff) / 255,
        (rgb & 0xff) / 255,
        1,
      )
      ..roughnessFactor = roughness
      ..metallicFactor = metallic;
  }
}
