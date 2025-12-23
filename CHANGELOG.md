# Changelog

All notable changes to CodeVoyage will be documented in this file.

## [Future]

### Planned
- English language support

## [1.0.4] - 2024-12-23

### Added
- "Jump to current period" button (今週/今月/今年) in navigation
- Noise texture overlay on downloaded summary card images
- "No data" screen with navigation when period has insufficient data

### Changed
- Navigation buttons now show specific dates (e.g., "12/16週", "2025年1月", "2024年")
- Navigation style unified between slides and no-data screen
- Mock data now only appears in demo mode, not when regular data is missing

### Fixed
- Idle timeout setting now accepts 0 to disable idle detection

## [1.0.3] - 2024-12-23

### Fixed
- Responsive scaling for narrow panel widths - UI now scales down automatically when the webview panel is smaller than 944px

## [1.0.2] - 2024-12-22

### Changed
- Updated overview documentation

## [1.0.1] - 2024-12-22

### Changed
- Updated overview documentation

## [1.0.0] - 2024-12-22

### Added
- Initial release of CodeVoyage
- Automatic coding time tracking
- Weekly, Monthly, and Yearly review presentations
- Spotify Wrapped-style animated slides
- Summary card generation with export to PNG
- Copy to clipboard functionality
- Status bar integration showing today's coding time
- Language and project statistics
- Coding pattern analysis (peak hours, streak days)
- Configurable idle timeout and data retention
- Demo mode with sample data

### Features
- Beautiful dark theme with period-specific color schemes:
  - Weekly: Cyan (#06b6d4)
  - Monthly: Purple (#a855f7)
  - Yearly: Gold (#fbbf24)
- Shareable summary cards optimized for Twitter/X
- Smooth slide transitions and animations
- Calendar heatmap visualization
- Top languages and projects breakdown
