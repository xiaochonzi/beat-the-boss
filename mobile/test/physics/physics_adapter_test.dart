import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/physics/physics_adapter.dart';

void main() {
  test('physics adapter exposes the target dynamic body capacity', () {
    final adapter = PhysicsAdapter(maxDynamicBodies: 30);

    expect(adapter.maxDynamicBodies, 30);
    expect(adapter.canAddDynamicBody, isTrue);
  });
}
