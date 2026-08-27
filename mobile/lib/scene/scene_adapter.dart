import 'package:flutter_scene/scene.dart';
import 'package:vector_math/vector_math.dart' as vm;

import 'camera_controller.dart';
import 'material_palette.dart';

class SceneAdapter {
  SceneAdapter({
    this._palette = const MaterialPalette(),
    this._cameraController = const ValidationCameraController(),
  });

  final MaterialPalette _palette;
  final ValidationCameraController _cameraController;
  final Scene scene = Scene();
  late final PerspectiveCamera camera = _cameraController.create();

  Future<void> initialize() async {
    await Scene.initializeStaticResources();
    scene.removeAll();
    _buildOffice();
    _buildBoss();
  }

  Node _box(String name, vm.Vector3 position, vm.Vector3 size, int color) {
    final mesh = Mesh(CuboidGeometry(size), _palette.solid(color));
    return Node(
      name: name,
      mesh: mesh,
      localTransform: vm.Matrix4.translationValues(
        position.x,
        position.y,
        position.z,
      ),
    );
  }

  void _buildOffice() {
    scene.add(
      _box('floor', vm.Vector3(0, -0.25, 0), vm.Vector3(8, 0.25, 6), 0xd9c7a3),
    );
    scene.add(
      _box(
        'back-wall',
        vm.Vector3(0, 3, -5.5),
        vm.Vector3(8, 3, 0.15),
        0xf7f2e7,
      ),
    );
    scene.add(
      _box(
        'desk',
        vm.Vector3(0, 1.05, -1.55),
        vm.Vector3(2.4, 0.16, 1),
        0x8b5737,
      ),
    );
    scene.add(
      _box(
        'monitor',
        vm.Vector3(0.75, 2.05, -1.8),
        vm.Vector3(0.75, 0.52, 0.1),
        0x27313b,
      ),
    );
    scene.add(
      _box(
        'chair',
        vm.Vector3(-2.7, 0.9, 0.4),
        vm.Vector3(0.65, 0.9, 0.65),
        0x293a50,
      ),
    );
    scene.add(
      _box(
        'plant',
        vm.Vector3(-4.6, 0.45, 4.2),
        vm.Vector3(0.4, 0.45, 0.4),
        0x57a65d,
      ),
    );
  }

  void _buildBoss() {
    scene.add(
      _box(
        'boss-hip',
        vm.Vector3(0, 2.25, 0),
        vm.Vector3(0.38, 0.4, 0.3),
        0x203f72,
      ),
    );
    scene.add(
      _box(
        'boss-chest',
        vm.Vector3(0, 3.05, 0),
        vm.Vector3(0.7, 0.8, 0.4),
        0x203f72,
      ),
    );
    scene.add(
      Node(
        name: 'boss-head',
        mesh: Mesh(
          SphereGeometry(radius: 0.72, segments: 20, rings: 12),
          _palette.solid(0xf1b78d),
        ),
        localTransform: vm.Matrix4.translationValues(0, 4.25, 0),
      ),
    );
  }
}
