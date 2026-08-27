import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/app/validation_app.dart';

void main() {
  testWidgets('shows the validation shell and can pause and resume', (
    tester,
  ) async {
    await tester.pumpWidget(const ValidationApp());

    expect(find.text('Flutter 3D 技术验证'), findsOneWidget);
    expect(find.text('开始验证'), findsOneWidget);

    await tester.tap(find.text('开始验证'));
    await tester.pump();
    expect(find.text('验证场景'), findsOneWidget);

    final controller = tester.state<ValidationAppState>(
      find.byType(ValidationApp),
    );
    controller.didChangeAppLifecycleState(AppLifecycleState.paused);
    await tester.pump();
    expect(find.text('已暂停'), findsOneWidget);

    controller.didChangeAppLifecycleState(AppLifecycleState.resumed);
    await tester.pump();
    expect(find.text('已暂停'), findsOneWidget);
    expect(find.text('继续'), findsOneWidget);
  });
}
