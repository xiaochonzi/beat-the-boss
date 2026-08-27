sealed class GameAction {
  const GameAction();
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
