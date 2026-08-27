import 'package:flutter_scene/scene.dart';
import 'package:vector_math/vector_math.dart' as vm;

class ValidationCameraController {
  const ValidationCameraController();

  PerspectiveCamera create() => PerspectiveCamera(
    position: vm.Vector3(0, 3.8, 10.5),
    target: vm.Vector3(0, 2.1, 0),
  );
}
