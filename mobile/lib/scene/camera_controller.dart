import 'package:flutter_scene/scene.dart';
import 'package:vector_math/vector_math.dart' as vm;

class ValidationCameraController {
  const ValidationCameraController();

  PerspectiveCamera create() => PerspectiveCamera(
    position: vm.Vector3(0, 1.85, 6.4),
    target: vm.Vector3(0, 1.35, 0),
    fovRadiansY: 0.72,
  );
}
