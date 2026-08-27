class DeviceResult {
  const DeviceResult({
    required this.device,
    required this.iosVersion,
    required this.fps,
    required this.coreCapabilitiesPass,
    required this.lifecyclePass,
    required this.stable,
    this.minimumFps = 30,
  });

  final String device;
  final String iosVersion;
  final double fps;
  final bool coreCapabilitiesPass;
  final bool lifecyclePass;
  final bool stable;
  final double minimumFps;

  bool get performancePass => fps >= minimumFps;
  bool get pass =>
      coreCapabilitiesPass && lifecyclePass && stable && performancePass;
}
