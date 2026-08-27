import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/feedback/feedback_adapter.dart';

void main() {
  test('maps major game events to distinct feedback profiles', () {
    final feedback = FeedbackAdapter();

    expect(feedback.profileFor(FeedbackEvent.hit), FeedbackProfile.light);
    expect(feedback.profileFor(FeedbackEvent.heavyHit), FeedbackProfile.strong);
    expect(feedback.profileFor(FeedbackEvent.bossDown), FeedbackProfile.strong);
    expect(feedback.profileFor(FeedbackEvent.rage), FeedbackProfile.strong);
  });
}
