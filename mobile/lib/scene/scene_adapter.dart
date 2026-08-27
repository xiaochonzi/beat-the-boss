import 'package:flutter_scene/scene.dart';
import 'package:vector_math/vector_math.dart' as vm;

import 'camera_controller.dart';
import 'material_palette.dart';
import '../physics/physics_adapter.dart';

class SceneAdapter {
  SceneAdapter({
    this._palette = const MaterialPalette(),
    this._cameraController = const ValidationCameraController(),
  });

  final MaterialPalette _palette;
  final ValidationCameraController _cameraController;
  final PhysicsAdapter physics = PhysicsAdapter();
  final Scene scene = Scene();
  late final PerspectiveCamera camera = _cameraController.create();

  Future<void> initialize() async {
    await Scene.initializeStaticResources();
    await physics.initialize(scene);
    scene.removeAll();
    _buildOffice();
    _buildBoss();
  }

  Node _box(String name, vm.Vector3 position, vm.Vector3 size, int color) {
    return _node(
      name,
      Mesh(CuboidGeometry(size), _palette.solid(color)),
      position,
    );
  }

  Node _node(String name, Mesh mesh, vm.Vector3 position) {
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

  Node _capsule(
    String name,
    vm.Vector3 position,
    double radius,
    double height,
    int color,
  ) {
    return _node(
      name,
      Mesh(
        CapsuleGeometry(
          radius: radius,
          height: height,
          radialSegments: 16,
          capRings: 6,
        ),
        _palette.solid(color),
      ),
      position,
    );
  }

  void _buildOffice() {
    final floor = _box(
      'floor',
      vm.Vector3(0, -0.25, 0),
      vm.Vector3(8, 0.25, 6),
      0xd9c7a3,
    );
    scene.add(floor);
    physics.addFixedBody(floor, halfExtents: vm.Vector3(8, 0.25, 6));
    final wall = _box(
      'back-wall',
      vm.Vector3(0, 3, -5.5),
      vm.Vector3(8, 3, 0.15),
      0x31415f,
    );
    scene.add(wall);
    physics.addFixedBody(wall, halfExtents: vm.Vector3(8, 3, 0.15));
    scene.add(
      _box(
        'window',
        vm.Vector3(-2.8, 4.3, -5.25),
        vm.Vector3(1.5, 0.9, 0.06),
        0x79c8d8,
      ),
    );
    scene.add(
      _box(
        'window-cross-horizontal',
        vm.Vector3(-2.8, 4.3, -5.12),
        vm.Vector3(1.5, 0.05, 0.08),
        0xf7f2e7,
      ),
    );
    scene.add(
      _box(
        'window-cross-vertical',
        vm.Vector3(-2.8, 4.3, -5.12),
        vm.Vector3(0.05, 0.9, 0.08),
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
    for (final x in [-1.9, 1.9]) {
      final leg = _box(
        'desk-leg',
        vm.Vector3(x, 0.5, -1.55),
        vm.Vector3(0.16, 0.5, 0.16),
        0x60402c,
      );
      scene.add(leg);
      physics.addFixedBody(leg, halfExtents: vm.Vector3(0.16, 0.5, 0.16));
    }
    final monitor = _box(
      'monitor',
      vm.Vector3(0.75, 2.05, -1.8),
      vm.Vector3(0.75, 0.52, 0.1),
      0x27313b,
    );
    scene.add(monitor);
    physics.addDynamicBody(monitor, halfExtents: vm.Vector3(0.75, 0.52, 0.1));
    final chair = _box(
      'chair',
      vm.Vector3(-2.7, 0.9, 0.4),
      vm.Vector3(0.65, 0.9, 0.65),
      0x293a50,
    );
    scene.add(chair);
    physics.addDynamicBody(chair, halfExtents: vm.Vector3(0.65, 0.9, 0.65));
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
    final hip = _capsule(
      'boss-hip',
      vm.Vector3(0, 2.25, 0),
      0.36,
      0.22,
      0x203f72,
    );
    scene.add(hip);
    physics.addFixedBody(hip, halfExtents: vm.Vector3(0.36, 0.4, 0.3));
    final chest = _capsule(
      'boss-chest',
      vm.Vector3(0, 3.05, 0),
      0.55,
      0.42,
      0x203f72,
    );
    scene.add(chest);
    physics.addFixedBody(chest, halfExtents: vm.Vector3(0.7, 0.8, 0.4));
    final head = Node(
      name: 'boss-head',
      mesh: Mesh(
        SphereGeometry(radius: 0.62, segments: 24, rings: 16),
        _palette.solid(0xf1b78d),
      ),
      localTransform: vm.Matrix4.translationValues(0, 4.18, 0),
    );
    scene.add(head);
    physics.addFixedBody(head, halfExtents: vm.Vector3(0.62, 0.62, 0.62));
    scene.add(
      _box(
        'boss-left-arm',
        vm.Vector3(-0.82, 3.05, 0),
        vm.Vector3(0.15, 0.5, 0.15),
        0x203f72,
      ),
    );
    scene.add(
      _box(
        'boss-right-arm',
        vm.Vector3(0.82, 3.05, 0),
        vm.Vector3(0.15, 0.5, 0.15),
        0x203f72,
      ),
    );
    scene.add(
      _box(
        'boss-tie',
        vm.Vector3(0, 3.05, 0.48),
        vm.Vector3(0.1, 0.42, 0.05),
        0xe94444,
      ),
    );
    scene.add(
      Node(
        name: 'boss-hair',
        mesh: Mesh(
          SphereGeometry(radius: 0.5, segments: 20, rings: 10),
          _palette.solid(0x241c1b),
        ),
        localTransform: vm.Matrix4.translationValues(0, 4.68, 0),
      ),
    );
    for (final x in [-0.22, 0.22]) {
      scene.add(
        Node(
          name: 'boss-eye',
          mesh: Mesh(
            SphereGeometry(radius: 0.07, segments: 10, rings: 6),
            _palette.solid(0x182138),
          ),
          localTransform: vm.Matrix4.translationValues(x, 4.35, 0.68),
        ),
      );
    }
    scene.add(
      Node(
        name: 'boss-nose',
        mesh: Mesh(
          SphereGeometry(radius: 0.1, segments: 10, rings: 6),
          _palette.solid(0xd7956c),
        ),
        localTransform: vm.Matrix4.translationValues(0, 4.1, 0.62),
      ),
    );
    scene.add(
      _box(
        'boss-mouth',
        vm.Vector3(0, 3.91, 0.63),
        vm.Vector3(0.18, 0.035, 0.025),
        0x8c3f46,
      ),
    );
    scene.add(
      _capsule(
        'boss-left-ear',
        vm.Vector3(-0.62, 4.18, 0),
        0.13,
        0.12,
        0xf1b78d,
      ),
    );
    scene.add(
      _capsule(
        'boss-right-ear',
        vm.Vector3(0.62, 4.18, 0),
        0.13,
        0.12,
        0xf1b78d,
      ),
    );
  }
}
