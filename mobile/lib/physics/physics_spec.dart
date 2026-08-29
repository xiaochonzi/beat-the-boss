import 'package:vector_math/vector_math.dart';

/// Shape-only description of one box collider inside a compound body.
///
/// The physics layer is unit-testable without a mounted [Scene], so the
/// scene layer can assert collider layout without booting Impeller.
class PhysicsColliderSpec {
  PhysicsColliderSpec({required this.halfExtents, Vector3? offset})
    : offset = offset ?? Vector3.zero();

  final Vector3 halfExtents;
  final Vector3 offset;
}
