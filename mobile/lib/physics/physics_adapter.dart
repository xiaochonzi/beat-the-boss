import 'package:flutter_scene/scene.dart' as scene;
import 'package:flutter_scene_rapier/flutter_scene_rapier.dart';
import 'package:vector_math/vector_math.dart';

class PhysicsAdapter {
  PhysicsAdapter({this.maxDynamicBodies = 60});

  final int maxDynamicBodies;
  int _dynamicBodies = 0;
  RapierWorld? _world;
  bool _attached = false;

  int get dynamicBodies => _dynamicBodies;
  bool get canAddDynamicBody => _dynamicBodies < maxDynamicBodies;
  RapierWorld? get world => _world;

  Future<void> initialize(scene.Scene targetScene) async {
    await RapierWorld.ensureInitialized();
    _world ??= RapierWorld(gravity: Vector3(0, -9.81, 0));
    if (!_attached) {
      targetScene.root.addComponent(_world!);
      _attached = true;
    }
  }

  bool addFixedBody(scene.Node node, {required Vector3 halfExtents}) {
    if (_world == null) return false;
    node.addComponent(RapierRigidBody(type: scene.BodyType.fixed));
    node.addComponent(
      RapierCollider(shape: scene.BoxShape(halfExtents: halfExtents)),
    );
    return true;
  }

  bool addDynamicBody(
    scene.Node node, {
    required Vector3 halfExtents,
    double mass = 1,
  }) {
    if (!canAddDynamicBody) return false;
    node.addComponent(
      RapierRigidBody(type: scene.BodyType.dynamic_, mass: mass),
    );
    node.addComponent(
      RapierCollider(shape: scene.BoxShape(halfExtents: halfExtents)),
    );
    _dynamicBodies++;
    return true;
  }

  void removeDynamicBody() {
    if (_dynamicBodies > 0) _dynamicBodies--;
  }
}
