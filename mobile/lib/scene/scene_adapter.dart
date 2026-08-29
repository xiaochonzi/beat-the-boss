import 'package:flutter_scene/scene.dart';
import 'package:vector_math/vector_math.dart' as vm;

import 'camera_controller.dart';
import 'material_palette.dart';
import '../physics/physics_adapter.dart';
import '../physics/physics_spec.dart';

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
  Node? _bossRoot;

  Future<void> initialize() async {
    await Scene.initializeStaticResources();
    scene.environmentSettings = EnvironmentSettings(
      toneMapping: ToneMappingMode.aces,
      exposure: 1.15,
      environmentIntensity: 1.2,
      colorGradingEnabled: true,
      saturation: 1.25,
      contrast: 1.1,
      brightness: 1.08,
      temperature: 0.12,
      bloomEnabled: true,
      bloomThreshold: 0.9,
      bloomIntensity: 0.24,
      bloomScatter: 0.8,
      ambientOcclusionEnabled: true,
      ambientOcclusionIntensity: 0.85,
      vignetteEnabled: true,
      vignetteIntensity: 0.22,
    );
    scene.directionalLight = DirectionalLight(
      direction: vm.Vector3(-0.35, -1.0, -0.55)..normalize(),
      intensity: 4.2,
      castsShadow: true,
      shadowMapResolution: 1024,
    );
    await physics.initialize(scene);
    scene.removeAll();
    _buildOffice();
    _buildBoss();
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

  Node _box(
    String name,
    vm.Vector3 position,
    vm.Vector3 size,
    int color, {
    double roughness = 0.72,
  }) {
    return _node(
      name,
      Mesh(CuboidGeometry(size), _palette.solid(color, roughness: roughness)),
      position,
    );
  }

  Node _sphere(
    String name,
    vm.Vector3 position,
    double radius,
    int color, {
    double roughness = 0.55,
    int segments = 28,
  }) {
    return _node(
      name,
      Mesh(
        SphereGeometry(
          radius: radius,
          segments: segments,
          rings: segments ~/ 2,
        ),
        _palette.solid(color, roughness: roughness),
      ),
      position,
    );
  }

  Node _capsule(
    String name,
    vm.Vector3 position,
    double radius,
    double height,
    int color, {
    double roughness = 0.62,
  }) {
    return _node(
      name,
      Mesh(
        CapsuleGeometry(
          radius: radius,
          height: height,
          radialSegments: 18,
          capRings: 8,
        ),
        _palette.solid(color, roughness: roughness),
      ),
      position,
    );
  }

  void dragBoss(double x, double y, double width, double height) {
    final root = _bossRoot;
    if (root == null) return;
    physics.moveKinematic(
      root,
      vm.Vector3((x / width - 0.5) * 2.2, -(y / height - 0.45) * 1.4, 0.12),
    );
  }

  void releaseBoss(double dx, double dy) {
    final root = _bossRoot;
    if (root == null) return;
    physics.releaseKinematic(root, vm.Vector3(dx * 0.06, -dy * 0.06, 0));
    root.localTransform = vm.Matrix4.identity();
  }

  void _addLamp(String name, vm.Vector3 position, PointLight light) {
    final lamp = Node(name: name)
      ..localTransform = vm.Matrix4.translationValues(
        position.x,
        position.y,
        position.z,
      )
      ..addComponent(PointLightComponent(light));
    scene.add(lamp);
  }

  void _buildOffice() {
    final floor = _box(
      'floor',
      vm.Vector3(0, -0.2, 1.2),
      vm.Vector3(7.5, 0.2, 7.2),
      0xcbb48a,
      roughness: 0.82,
    );
    scene.add(floor);
    physics.addFixedBody(floor, halfExtents: vm.Vector3(7.5, 0.2, 7.2));

    final wall = _box(
      'back-wall',
      vm.Vector3(0, 3.4, -4.6),
      vm.Vector3(7.5, 3.4, 0.12),
      0x6f86a8,
      roughness: 0.78,
    );
    scene.add(wall);
    physics.addFixedBody(wall, halfExtents: vm.Vector3(7.5, 3.4, 0.12));

    scene.add(
      _box(
        'ceiling',
        vm.Vector3(0, 6.85, 1.0),
        vm.Vector3(7.5, 0.12, 7.4),
        0xe8dfd0,
        roughness: 0.9,
      ),
    );
    scene.add(
      _box(
        'left-wall',
        vm.Vector3(-7.5, 3.4, 1.0),
        vm.Vector3(0.12, 3.4, 7.4),
        0x7a90b0,
        roughness: 0.8,
      ),
    );
    scene.add(
      _box(
        'right-wall',
        vm.Vector3(7.5, 3.4, 1.0),
        vm.Vector3(0.12, 3.4, 7.4),
        0x7a90b0,
        roughness: 0.8,
      ),
    );

    for (final x in [-3.2, 0.0, 3.2]) {
      scene.add(
        _box(
          'window',
          vm.Vector3(x, 3.7, -4.42),
          vm.Vector3(1.35, 1.15, 0.05),
          0xb7e7f4,
          roughness: 0.12,
        ),
      );
      scene.add(
        _box(
          'window-sill',
          vm.Vector3(x, 2.48, -4.28),
          vm.Vector3(1.45, 0.08, 0.18),
          0xf4eee3,
          roughness: 0.55,
        ),
      );
    }

    scene.add(
      _box(
        'desk',
        vm.Vector3(0, 0.92, -1.35),
        vm.Vector3(2.2, 0.08, 0.95),
        0x8d5a36,
        roughness: 0.48,
      ),
    );
    for (final x in [-1.7, 1.7]) {
      final leg = _box(
        'desk-leg',
        vm.Vector3(x, 0.46, -1.35),
        vm.Vector3(0.1, 0.46, 0.1),
        0x5c3a24,
      );
      scene.add(leg);
      physics.addFixedBody(leg, halfExtents: vm.Vector3(0.1, 0.46, 0.1));
    }

    final monitor = _box(
      'monitor',
      vm.Vector3(0.7, 1.55, -1.55),
      vm.Vector3(0.62, 0.38, 0.06),
      0x1f2a33,
      roughness: 0.28,
    );
    scene.add(monitor);
    physics.addDynamicBody(monitor, halfExtents: vm.Vector3(0.62, 0.38, 0.06));
    scene.add(
      _box(
        'monitor-stand',
        vm.Vector3(0.7, 1.08, -1.5),
        vm.Vector3(0.16, 0.12, 0.12),
        0x2c3842,
      ),
    );

    final chair = _box(
      'chair',
      vm.Vector3(-2.15, 0.72, 0.55),
      vm.Vector3(0.48, 0.72, 0.48),
      0x31465c,
      roughness: 0.58,
    );
    scene.add(chair);
    physics.addDynamicBody(chair, halfExtents: vm.Vector3(0.48, 0.72, 0.48));

    scene.add(
      _sphere(
        'plant-pot',
        vm.Vector3(-3.4, 0.28, 2.4),
        0.22,
        0xb15b3a,
        roughness: 0.7,
      ),
    );
    scene.add(
      _sphere(
        'plant',
        vm.Vector3(-3.4, 0.72, 2.4),
        0.32,
        0x4fa35a,
        roughness: 0.85,
      ),
    );

    _addLamp(
      'ceiling-lamp',
      vm.Vector3(0.4, 5.4, 1.6),
      PointLight(
        color: vm.Vector3(1.0, 0.93, 0.78),
        intensity: 55,
        range: 16,
        falloffExponent: 1.35,
      ),
    );
    _addLamp(
      'window-fill',
      vm.Vector3(0, 3.8, -3.6),
      PointLight(
        color: vm.Vector3(0.62, 0.86, 1.0),
        intensity: 32,
        range: 12,
        falloffExponent: 1.5,
      ),
    );
  }

  void _buildBoss() {
    const skin = 0xf3c09a;
    const hair = 0x2a1f1c;
    const suit = 0x2b4d8a;
    const pants = 0x1e355f;
    const shirt = 0xf6f1e6;
    const tie = 0xe23d3d;
    const shoe = 0x2b211f;

    final root = Node(name: 'boss-root');
    void attach(Node child) => root.add(child);

    attach(_capsule('boss-hip', vm.Vector3(0, 1.12, 0), 0.34, 0.16, pants));
    attach(_capsule('boss-chest', vm.Vector3(0, 1.48, 0), 0.42, 0.28, suit));
    attach(
      _box(
        'boss-shirt',
        vm.Vector3(0, 1.46, 0.28),
        vm.Vector3(0.22, 0.28, 0.08),
        shirt,
        roughness: 0.7,
      ),
    );
    attach(
      _box(
        'boss-tie',
        vm.Vector3(0, 1.4, 0.36),
        vm.Vector3(0.07, 0.28, 0.04),
        tie,
        roughness: 0.45,
      ),
    );

    attach(_sphere('boss-head', vm.Vector3(0, 2.08, 0), 0.48, skin));
    attach(
      _sphere(
        'boss-hair',
        vm.Vector3(0, 2.32, -0.06),
        0.42,
        hair,
        roughness: 0.88,
      ),
    );
    attach(
      _capsule('boss-left-ear', vm.Vector3(-0.48, 2.08, 0), 0.1, 0.08, skin),
    );
    attach(
      _capsule('boss-right-ear', vm.Vector3(0.48, 2.08, 0), 0.1, 0.08, skin),
    );

    for (final x in [-0.16, 0.16]) {
      attach(
        _sphere(
          'boss-eye-white',
          vm.Vector3(x, 2.12, 0.4),
          0.09,
          0xf7f2e7,
          roughness: 0.35,
          segments: 16,
        ),
      );
      attach(
        _sphere(
          'boss-pupil',
          vm.Vector3(x, 2.11, 0.47),
          0.04,
          0x182138,
          roughness: 0.25,
          segments: 12,
        ),
      );
    }
    attach(
      _box(
        'boss-left-brow',
        vm.Vector3(-0.16, 2.26, 0.42),
        vm.Vector3(0.12, 0.025, 0.03),
        hair,
      ),
    );
    attach(
      _box(
        'boss-right-brow',
        vm.Vector3(0.16, 2.26, 0.42),
        vm.Vector3(0.12, 0.025, 0.03),
        hair,
      ),
    );
    attach(
      _sphere(
        'boss-nose',
        vm.Vector3(0, 2.02, 0.44),
        0.07,
        0xd7956c,
        roughness: 0.5,
        segments: 12,
      ),
    );
    attach(
      _box(
        'boss-mouth',
        vm.Vector3(0, 1.9, 0.43),
        vm.Vector3(0.14, 0.03, 0.03),
        0x8c3f46,
      ),
    );

    attach(
      _capsule(
        'boss-left-arm',
        vm.Vector3(-0.58, 1.38, 0.04),
        0.11,
        0.28,
        suit,
      ),
    );
    attach(
      _capsule(
        'boss-right-arm',
        vm.Vector3(0.58, 1.38, 0.04),
        0.11,
        0.28,
        suit,
      ),
    );
    attach(
      _capsule(
        'boss-left-hand',
        vm.Vector3(-0.68, 1.08, 0.08),
        0.12,
        0.08,
        skin,
      ),
    );
    attach(
      _capsule(
        'boss-right-hand',
        vm.Vector3(0.68, 1.08, 0.08),
        0.12,
        0.08,
        skin,
      ),
    );
    attach(
      _capsule('boss-left-leg', vm.Vector3(-0.18, 0.7, 0), 0.16, 0.32, pants),
    );
    attach(
      _capsule('boss-right-leg', vm.Vector3(0.18, 0.7, 0), 0.16, 0.32, pants),
    );
    attach(
      _capsule(
        'boss-left-shoe',
        vm.Vector3(-0.18, 0.26, 0.08),
        0.15,
        0.14,
        shoe,
      ),
    );
    attach(
      _capsule(
        'boss-right-shoe',
        vm.Vector3(0.18, 0.26, 0.08),
        0.15,
        0.14,
        shoe,
      ),
    );

    scene.add(root);
    physics.addCompoundKinematicBody(
      root,
      colliders: [
        PhysicsColliderSpec(
          halfExtents: vm.Vector3(0.38, 0.5, 0.28),
          offset: vm.Vector3(0, 0.55, 0),
        ),
        PhysicsColliderSpec(
          halfExtents: vm.Vector3(0.52, 0.42, 0.34),
          offset: vm.Vector3(0, 1.42, 0),
        ),
        PhysicsColliderSpec(
          halfExtents: vm.Vector3(0.48, 0.48, 0.48),
          offset: vm.Vector3(0, 2.08, 0),
        ),
      ],
    );
    _bossRoot = root;
  }
}
