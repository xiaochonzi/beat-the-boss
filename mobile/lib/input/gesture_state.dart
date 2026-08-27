enum GestureMode { idle, tap, charging, draggingBoss, camera }

class GestureState {
  const GestureState({this.mode = GestureMode.idle, this.pointerCount = 0});

  final GestureMode mode;
  final int pointerCount;

  GestureState copyWith({GestureMode? mode, int? pointerCount}) => GestureState(
    mode: mode ?? this.mode,
    pointerCount: pointerCount ?? this.pointerCount,
  );
}
