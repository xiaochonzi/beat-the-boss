import 'game_action.dart';

class BossInteraction {
  String? _part;
  ({double x, double y, double z}) _position = (x: 0, y: 0, z: 0);
  ({double x, double y, double z}) _velocity = (x: 0, y: 0, z: 0);

  void beginDrag(String part) {
    _part = part;
    _velocity = (x: 0, y: 0, z: 0);
  }

  void updateDrag(double x, double y, double z) {
    if (_part == null) return;
    _position = (x: x, y: y, z: z);
  }

  BossReleaseAction? releaseDrag(double x, double y, double z) {
    final part = _part;
    if (part == null) return null;
    updateDrag(x, y, z);
    final action = BossReleaseAction(
      part: part,
      position: _position,
      velocity: _velocity,
    );
    _part = null;
    return action;
  }
}
