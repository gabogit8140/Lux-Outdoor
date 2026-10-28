import { describe, expect, it } from 'vitest';
import { sanitizeHtml, sanitizePlainText, sanitizeTrackMetadata } from './sanitize';

describe('sanitize (Sécurité & Neutralisation XSS des fichiers GPX)', () => {
  it('neutralise les balises <script> et code JavaScript malveillant', () => {
    const dirty = 'Sentier de la Moselle <script>alert("hacked")</script>';
    const safe = sanitizeHtml(dirty);
    expect(safe).not.toContain('<script>');
    expect(safe).not.toContain('alert');
    expect(safe).toContain('Sentier de la Moselle');
  });

  it('neutralise les attributs d injection d événement (onerror, onload)', () => {
    const dirty = '<img src="x" onerror="alert(1)" /> Belle vue sur la vallée';
    const safe = sanitizeHtml(dirty);
    expect(safe).not.toContain('onerror');
    expect(safe).not.toContain('alert(1)');
    expect(safe).toContain('Belle vue sur la vallée');
  });

  it('sanitizePlainText élimine tout tag HTML pour les noms de traces', () => {
    const dirty = '<b>Circuit</b> <a href="evil.com">Éperon</a>';
    const plain = sanitizePlainText(dirty);
    expect(plain).toBe('Circuit Éperon');
  });

  it('sanitizeTrackMetadata assainit l ensemble des champs d un GPX', () => {
    const meta = {
      title: '<script>evil()</script>Circuit Mullerthal',
      description: 'Superbe randonnée <b>ombragée</b> <iframe src="evil.com"></iframe>',
      creator: '<svg onload="alert(1)"></svg>Garmin Edge',
    };
    const sanitized = sanitizeTrackMetadata(meta);

    expect(sanitized.title).toBe('Circuit Mullerthal');
    expect(sanitized.description).toContain('<b>ombragée</b>');
    expect(sanitized.description).not.toContain('<iframe');
    expect(sanitized.creator).toBe('Garmin Edge');
  });
});
