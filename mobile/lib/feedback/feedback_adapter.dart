import 'audio_feedback.dart';
import 'haptic_feedback.dart';
import 'visual_feedback.dart';

enum FeedbackEvent { hit, heavyHit, bossDown, combo, rage }

enum FeedbackProfile { light, strong }

class FeedbackAdapter {
  FeedbackAdapter({
    AudioFeedback? audio,
    HapticFeedbackAdapter? haptic,
    VisualFeedback? visual,
  }) : audio = audio ?? AudioFeedback(),
       haptic = haptic ?? HapticFeedbackAdapter(),
       visual = visual ?? VisualFeedback();

  final AudioFeedback audio;
  final HapticFeedbackAdapter haptic;
  final VisualFeedback visual;

  FeedbackProfile profileFor(FeedbackEvent event) {
    return switch (event) {
      FeedbackEvent.hit || FeedbackEvent.combo => FeedbackProfile.light,
      FeedbackEvent.heavyHit ||
      FeedbackEvent.bossDown ||
      FeedbackEvent.rage => FeedbackProfile.strong,
    };
  }

  Future<void> emit(FeedbackEvent event) async {
    final profile = profileFor(event);
    await audio.play(event);
    await haptic.emit(profile);
    visual.emit(event);
  }
}
