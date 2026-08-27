import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/game/game_action.dart';
import 'package:mobile/game/boss_interaction.dart';

void main() {
  test('a boss drag becomes a single release action', () {
    final interaction = BossInteraction();
    interaction.beginDrag('boss-head');
    interaction.updateDrag(1, 2, 3);

    final action = interaction.releaseDrag(4, 5, 6);

    expect(action, isA<BossReleaseAction>());
    expect((action as BossReleaseAction).part, 'boss-head');
    expect(interaction.releaseDrag(0, 0, 0), isNull);
  });
}
