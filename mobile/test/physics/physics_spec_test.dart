import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/physics/physics_spec.dart';
import 'package:vector_math/vector_math.dart';

void main() {
  test('compound boss colliders cover legs, torso, and head', () {
    final specs = [
      PhysicsColliderSpec(
        halfExtents: Vector3(0.38, 0.5, 0.28),
        offset: Vector3(0, 0.55, 0),
      ),
      PhysicsColliderSpec(
        halfExtents: Vector3(0.52, 0.42, 0.34),
        offset: Vector3(0, 1.42, 0),
      ),
      PhysicsColliderSpec(
        halfExtents: Vector3(0.48, 0.48, 0.48),
        offset: Vector3(0, 2.08, 0),
      ),
    ];

    final bottoms = specs.map((s) => s.offset.y - s.halfExtents.y).toList();
    final tops = specs.map((s) => s.offset.y + s.halfExtents.y).toList();

    expect(bottoms.reduce((a, b) => a < b ? a : b), lessThan(0.2));
    expect(tops.reduce((a, b) => a > b ? a : b), greaterThan(2.4));
    expect(bottoms[1], lessThan(tops[0]));
    expect(bottoms[2], lessThan(tops[1]));
  });
}
