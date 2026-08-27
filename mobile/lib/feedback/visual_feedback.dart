import 'feedback_adapter.dart';

class VisualFeedback {
  FeedbackEvent? lastEvent;

  void emit(FeedbackEvent event) {
    lastEvent = event;
  }
}
