import 'package:flutter/services.dart';

import 'feedback_adapter.dart';

class AudioFeedback {
  Future<void> play(FeedbackEvent event) async {
    final sound = switch (event) {
      FeedbackEvent.hit => SystemSoundType.click,
      FeedbackEvent.heavyHit || FeedbackEvent.bossDown => SystemSoundType.alert,
      FeedbackEvent.combo || FeedbackEvent.rage => SystemSoundType.click,
    };
    await SystemSound.play(sound);
  }
}
