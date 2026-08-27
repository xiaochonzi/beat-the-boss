import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/input/gesture_router.dart';

void main() {
  test('routes a tap to an attack and a boss drag to a release', () {
    final router = GestureRouter();

    router.pointerDown(pointer: 1, x: 10, y: 20, hitsBoss: false);
    expect(router.pointerUp(pointer: 1), isA<TapIntent>());

    router.pointerDown(pointer: 1, x: 1, y: 2, hitsBoss: true);
    router.pointerMove(pointer: 1, x: 4, y: 6);
    final intent = router.pointerUp(pointer: 1);
    expect(intent, isA<BossDragIntent>());
    expect((intent as BossDragIntent).delta, const Offset2D(3, 4));
  });

  test(
    'a second pointer takes camera priority and cancels the first action',
    () {
      final router = GestureRouter();

      router.pointerDown(pointer: 1, x: 0, y: 0, hitsBoss: true);
      final intent = router.pointerDown(
        pointer: 2,
        x: 1,
        y: 1,
        hitsBoss: false,
      );

      expect(intent, isA<CameraIntent>());
      expect(router.pointerUp(pointer: 1), isNull);
    },
  );
}
