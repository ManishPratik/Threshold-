import { Icon, type IconProps } from './Icon';

/**
 * Centralised glyph set — every icon in the app is defined here so stroke
 * weight, corner radius, and viewBox stay consistent. All glyphs are 24×24
 * with stroke-width supplied by the Icon wrapper (1.75). Add new glyphs by
 * appending to this file — never inline SVG elsewhere.
 */

type GlyphProps = Omit<IconProps, 'children'>;

export function TodayGlyph(props: GlyphProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  );
}

export function KnowledgeGlyph(props: GlyphProps) {
  return (
    <Icon {...props}>
      <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2z" />
    </Icon>
  );
}

export function AnalyticsGlyph(props: GlyphProps) {
  return (
    <Icon {...props}>
      <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
    </Icon>
  );
}

export function SettingsGlyph(props: GlyphProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </Icon>
  );
}

export function SearchGlyph(props: GlyphProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4-4" />
    </Icon>
  );
}

export function PlayGlyph(props: GlyphProps) {
  return (
    <Icon {...props}>
      <path d="M8 5l12 7-12 7z" />
    </Icon>
  );
}

export function PauseGlyph(props: GlyphProps) {
  return (
    <Icon {...props}>
      <path d="M9 5h2v14H9zM13 5h2v14h-2z" />
    </Icon>
  );
}

export function CheckGlyph(props: GlyphProps) {
  return (
    <Icon {...props}>
      <path d="M5 12l4 4 10-10" />
    </Icon>
  );
}

export function ArrowRightGlyph(props: GlyphProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}

export function BreakGlyph(props: GlyphProps) {
  return (
    <Icon {...props}>
      <path d="M4 12h6l2-4 2 8 2-4h4" />
    </Icon>
  );
}

export function ReflectGlyph(props: GlyphProps) {
  return (
    <Icon {...props}>
      <path d="M4 4h16v12H5l-1 4z" />
    </Icon>
  );
}

export function SparkGlyph(props: GlyphProps) {
  return (
    <Icon {...props}>
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
    </Icon>
  );
}
