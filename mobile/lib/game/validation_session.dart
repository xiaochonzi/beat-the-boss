import 'game_action.dart';

class ValidationSession {
  bool isPaused = false;
  GameAction? lastAction;

  void pause() => isPaused = true;
  void resume() => isPaused = false;

  bool accept(GameAction action) {
    if (isPaused) return false;
    lastAction = action;
    return true;
  }
}
