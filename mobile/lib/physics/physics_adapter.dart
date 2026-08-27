import 'package:flutter_scene/scene.dart' as scene;
import 'package:flutter_scene_rapier/flutter_scene_rapier.dart';
import 'package:vector_math/vector_math.dart';

class PhysicsAdapter {
  PhysicsAdapter({this.maxDynamicBodies = 60});

  final int maxDynamicBodies;
  int _dynamicBodies = 0;
  RapierWorld? _world;
  bool _attached = false;
  final Map<scene.Node, RapierRigidBody> _bodies = {};

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
    return _addBody(node, scene.BodyType.fixed, halfExtents: halfExtents);
  }

  bool addKinematicBody(scene.Node node, {required Vector3 halfExtents}) {
    return _addBody(node, scene.BodyType.kinematic, halfExtents: halfExtents);
  }

  bool _addBody(
    scene.Node node,
    scene.BodyType type, {
    required Vector3 halfExtents,
    double mass = 1,
  }) {
    if (_world == null) return false;
    final body = RapierRigidBody(type: type, mass: mass);
    node.addComponent(body);
    node.addComponent(
      RapierCollider(shape: scene.BoxShape(halfExtents: halfExtents)),
    );
    _bodies[node] = body;
    return true;
  }

  bool addDynamicBody(
    scene.Node node, {
    required Vector3 halfExtents,
    double mass = 1,
  }) {
    if (!canAddDynamicBody) return false;
    if (!_addBody(
      node,
      scene.BodyType.dynamic_,
      halfExtents: halfExtents,
      mass: mass,
    )) {
      return false;
    }
    _dynamicBodies++;
    return true;
  }

  void moveKinematic(scene.Node node, Vector3 position) {
    if (_bodies[node]?.type != scene.BodyType.kinematic) return;
    node.localTransform = Matrix4.translationValues(
      position.x,
      position.y,
      position.z,
    );
  }

  void releaseKinematic(scene.Node node, Vector3 velocity) {
    final body = _bodies[node];
    if (body?.type != scene.BodyType.kinematic) return;
    body!.linearVelocity = velocity;
  }

  void removeDynamicBody() {
    if (_dynamicBodies > 0) _dynamicBodies--;
  }
}
