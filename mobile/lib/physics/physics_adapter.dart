import 'package:flutter_scene/physics.dart';
import 'package:flutter_scene/scene.dart' as scene;
import 'package:flutter_scene_rapier/flutter_scene_rapier.dart';
import 'package:vector_math/vector_math.dart';

import 'physics_spec.dart';

/// Thin wrapper around the flutter_scene 0.23 physics contract.
///
/// `RapierWorld` is a headless [PhysicsSimulation]; it must be wrapped in a
/// [PhysicsWorld] component (which owns pose writeback and event mapping)
/// and attached to the scene root.
class PhysicsAdapter {
  PhysicsAdapter({this.maxDynamicBodies = 60});

  final int maxDynamicBodies;
  int _dynamicBodies = 0;
  RapierWorld? _simulation;
  bool _attached = false;
  final Map<scene.Node, RigidBody> _bodies = {};

  int get dynamicBodies => _dynamicBodies;
  bool get canAddDynamicBody => _dynamicBodies < maxDynamicBodies;

  Future<void> initialize(scene.Scene targetScene) async {
    await RapierWorld.ensureInitialized();
    _simulation ??= RapierWorld(gravity: Vector3(0, -9.81, 0));
    if (!_attached) {
      targetScene.root.addComponent(PhysicsWorld(_simulation!));
      _attached = true;
    }
  }

  bool addFixedBody(scene.Node node, {required Vector3 halfExtents}) {
    return _addBody(node, BodyType.fixed, halfExtents: halfExtents);
  }

  bool addKinematicBody(scene.Node node, {required Vector3 halfExtents}) {
    return _addBody(node, BodyType.kinematic, halfExtents: halfExtents);
  }

  /// Adds one kinematic body on [node] with several offset box colliders,
  /// forming a compound shape (legs + torso + head for the boss).
  bool addCompoundKinematicBody(
    scene.Node node, {
    required List<PhysicsColliderSpec> colliders,
  }) {
    final body = RigidBody(type: BodyType.kinematic);
    node.addComponent(body);
    for (final spec in colliders) {
      node.addComponent(
        Collider(
          shape: BoxShape(halfExtents: spec.halfExtents),
          localPose: Matrix4.translationValues(
            spec.offset.x,
            spec.offset.y,
            spec.offset.z,
          ),
        ),
      );
    }
    _bodies[node] = body;
    return true;
  }

  bool _addBody(
    scene.Node node,
    BodyType type, {
    required Vector3 halfExtents,
    double mass = 1,
  }) {
    final body = RigidBody(type: type, mass: mass);
    node.addComponent(body);
    node.addComponent(Collider(shape: BoxShape(halfExtents: halfExtents)));
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
      BodyType.dynamic_,
      halfExtents: halfExtents,
      mass: mass,
    )) {
      return false;
    }
    _dynamicBodies++;
    return true;
  }

  void moveKinematic(scene.Node node, Vector3 position) {
    if (_bodies[node]?.type != BodyType.kinematic) return;
    node.localTransform = Matrix4.translationValues(
      position.x,
      position.y,
      position.z,
    );
  }

  void releaseKinematic(scene.Node node, Vector3 velocity) {
    final body = _bodies[node];
    if (body?.type != BodyType.kinematic) return;
    body!.linearVelocity = velocity;
  }

  void removeDynamicBody() {
    if (_dynamicBodies > 0) _dynamicBodies--;
  }
}
