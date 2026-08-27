sealed class GameAction {
  const GameAction();
}

class TapAction extends GameAction {
  const TapAction({required this.x, required this.y});

  final double x;
  final double y;
}

class BossReleaseAction extends GameAction {
  const BossReleaseAction({
    required this.part,
    required this.position,
    required this.velocity,
  });

  final String part;
  final ({double x, double y, double z}) position;
  final ({double x, double y, double z}) velocity;
}
