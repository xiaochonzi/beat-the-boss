import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/game/game_action.dart';
import 'package:mobile/game/validation_session.dart';

void main() {
  test('paused sessions ignore actions until continued', () {
    final session = ValidationSession();
    session.pause();

    expect(session.accept(const TapAction(x: 1, y: 2)), isFalse);

    session.resume();
    expect(session.accept(const TapAction(x: 1, y: 2)), isTrue);
    expect(session.lastAction, isA<TapAction>());
  });
}
