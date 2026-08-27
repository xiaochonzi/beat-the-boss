import 'package:flutter/services.dart';

import 'feedback_adapter.dart';

class HapticFeedbackAdapter {
  Future<void> emit(FeedbackProfile profile) {
    return switch (profile) {
      FeedbackProfile.light => HapticFeedback.lightImpact(),
      FeedbackProfile.strong => HapticFeedback.mediumImpact(),
    };
  }
}
