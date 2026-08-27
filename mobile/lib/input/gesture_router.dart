import 'gesture_state.dart';

class Offset2D {
  const Offset2D(this.dx, this.dy);

  final double dx;
  final double dy;

  @override
  bool operator ==(Object other) =>
      other is Offset2D && other.dx == dx && other.dy == dy;

  @override
  int get hashCode => Object.hash(dx, dy);
}

sealed class GestureIntent {
  const GestureIntent();
}

class TapIntent extends GestureIntent {
  const TapIntent({required this.x, required this.y});

  final double x;
  final double y;
}

class BossDragIntent extends GestureIntent {
  const BossDragIntent(this.delta);

  final Offset2D delta;
}

class CameraIntent extends GestureIntent {
  const CameraIntent();
}

class GestureRouter {
  GestureState state = const GestureState();
  int? _primaryPointer;
  double _startX = 0;
  double _startY = 0;
  double _lastX = 0;
  double _lastY = 0;
  bool _bossDrag = false;

  GestureIntent? pointerDown({
    required int pointer,
    required double x,
    required double y,
    required bool hitsBoss,
  }) {
    if (_primaryPointer != null) {
      state = state.copyWith(mode: GestureMode.camera, pointerCount: 2);
      _primaryPointer = null;
      _bossDrag = false;
      return const CameraIntent();
    }
    _primaryPointer = pointer;
    _startX = x;
    _startY = y;
    _lastX = x;
    _lastY = y;
    _bossDrag = hitsBoss;
    state = state.copyWith(
      mode: hitsBoss ? GestureMode.draggingBoss : GestureMode.tap,
      pointerCount: 1,
    );
    return null;
  }

  void pointerMove({
    required int pointer,
    required double x,
    required double y,
  }) {
    if (pointer != _primaryPointer) return;
    if (_bossDrag) {
      _lastX = x;
      _lastY = y;
      state = state.copyWith(mode: GestureMode.draggingBoss);
    }
  }

  GestureIntent? pointerUp({required int pointer}) {
    if (pointer != _primaryPointer) return null;
    final intent = _bossDrag
        ? BossDragIntent(Offset2D(_lastX - _startX, _lastY - _startY))
        : TapIntent(x: _startX, y: _startY);
    _reset();
    return intent;
  }

  void cancel() => _reset();

  void _reset() {
    _primaryPointer = null;
    _bossDrag = false;
    state = const GestureState();
  }
}
