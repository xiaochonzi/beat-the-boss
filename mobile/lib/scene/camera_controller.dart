import 'package:flutter_scene/scene.dart';
import 'package:vector_math/vector_math.dart' as vm;

class ValidationCameraController {
  const ValidationCameraController();

  PerspectiveCamera create() => PerspectiveCamera(
    position: vm.Vector3(0, 4.4, 13.5),
    target: vm.Vector3(0, 2.4, 0),
  );
}
