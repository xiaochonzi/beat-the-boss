import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/scene/procedural_geometry.dart';

void main() {
  test('describes a compact boss and office scene from primitives', () {
    final scene = ProceduralGeometry();

    expect(scene.bossParts, containsAll(<String>['head', 'chest', 'hip']));
    expect(scene.officeProps.length, greaterThanOrEqualTo(4));
    expect(scene.bossParts.length, greaterThanOrEqualTo(3));
  });
}
