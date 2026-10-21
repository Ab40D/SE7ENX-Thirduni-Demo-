import { describe, expect, it } from 'vitest';
import { normalize, parseCommand } from '../../src/core/parser';
import type { Command } from '../../src/core/types';

function command(text: string, lang: 'en' | 'fr' | 'ar' | 'dz' = 'en'): Command | null {
  const outcome = parseCommand(text, lang);
  return outcome.type === 'command' ? outcome.command : null;
}

describe('english', () => {
  it('turns the light on and off', () => {
    expect(command('Turn on the light.')).toEqual({ kind: 'light.on' });
    expect(command('Turn off the light.')).toEqual({ kind: 'light.off' });
    expect(command('switch the lights off')).toEqual({ kind: 'light.off' });
  });

  it('sets the brightness', () => {
    expect(command('Set brightness to 45 percent.')).toEqual({
      kind: 'light.brightness',
      value: 45,
    });
    expect(command('set the light to 30%')).toEqual({ kind: 'light.brightness', value: 30 });
  });

  it('controls the shutter', () => {
    expect(command('Open the shutter.')).toEqual({ kind: 'shutter.open' });
    expect(command('Close the shutter.')).toEqual({ kind: 'shutter.close' });
    expect(command('Stop the shutter.')).toEqual({ kind: 'shutter.stop' });
    expect(command('Set the shutter to 70 percent.')).toEqual({
      kind: 'shutter.position',
      value: 70,
    });
  });

  it('answers status questions instead of acting on them', () => {
    const outcome = parseCommand('What is the current light status?', 'en');
    expect(outcome.type).toBe('question');
    if (outcome.type === 'question') expect(outcome.intent).toBe('lightStatus');
  });

  it('recognises the documented knowledge questions', () => {
    const cases: [string, string][] = [
      ['Who are you?', 'who'],
      ['What is SE7ENX?', 'what'],
      ['What can I control?', 'controls'],
      ['What is the shutter position?', 'shutterStatus'],
      ['How do hand gestures work?', 'gestures'],
      ['Is this connected to a real building?', 'realBuilding'],
      ['How does this relate to smart building automation?', 'automation'],
    ];
    for (const [text, intent] of cases) {
      const outcome = parseCommand(text, 'en');
      expect(outcome.type, text).toBe('question');
      if (outcome.type === 'question') expect(outcome.intent, text).toBe(intent);
    }
  });

  it('rejects unknown commands', () => {
    expect(parseCommand('make me a sandwich', 'en').type).toBe('unknown');
  });

  it('flags out-of-range percentages', () => {
    const outcome = parseCommand('set brightness to 150 percent', 'en');
    expect(outcome.type).toBe('invalid');
  });
});

describe('french', () => {
  it('handles the documented commands', () => {
    expect(command('Allume la lumière.', 'fr')).toEqual({ kind: 'light.on' });
    expect(command('Éteins la lumière.', 'fr')).toEqual({ kind: 'light.off' });
    expect(command('Règle la luminosité à 45 pour cent.', 'fr')).toEqual({
      kind: 'light.brightness',
      value: 45,
    });
    expect(command('Ouvre le volet.', 'fr')).toEqual({ kind: 'shutter.open' });
    expect(command('Ferme le volet.', 'fr')).toEqual({ kind: 'shutter.close' });
    expect(command('Arrête le volet.', 'fr')).toEqual({ kind: 'shutter.stop' });
  });

  it('answers questions in french', () => {
    const outcome = parseCommand("Quel est l'état de la lumière ?", 'fr');
    expect(outcome.type).toBe('question');
    if (outcome.type === 'question') expect(outcome.intent).toBe('lightStatus');
  });
});

describe('arabic (modern standard)', () => {
  it('handles the documented commands', () => {
    expect(command('شعل الضوء.', 'ar')).toEqual({ kind: 'light.on' });
    expect(command('طفي الضوء.', 'ar')).toEqual({ kind: 'light.off' });
    expect(command('خلي الإضاءة 45 بالمئة.', 'ar')).toEqual({
      kind: 'light.brightness',
      value: 45,
    });
    expect(command('افتح الستارة.', 'ar')).toEqual({ kind: 'shutter.open' });
    expect(command('أغلق الستارة.', 'ar')).toEqual({ kind: 'shutter.close' });
  });

  it('understands arabic-indic digits', () => {
    expect(command('خلي الإضاءة ٤٥ بالمئة', 'ar')).toEqual({
      kind: 'light.brightness',
      value: 45,
    });
  });

  it('answers questions in arabic', () => {
    const outcome = parseCommand('ما هو حالة الضوء؟', 'ar');
    expect(outcome.type).toBe('question');
  });
});

describe('algerian darija', () => {
  it('handles the documented commands', () => {
    expect(command('شعل الضو.', 'dz')).toEqual({ kind: 'light.on' });
    expect(command('طفي الضو.', 'dz')).toEqual({ kind: 'light.off' });
    expect(command('نقص الضو لـ 45 بالمية.', 'dz')).toEqual({
      kind: 'light.brightness',
      value: 45,
    });
    expect(command('حلّ الفولي.', 'dz')).toEqual({ kind: 'shutter.open' });
    expect(command('سدّ الفولي.', 'dz')).toEqual({ kind: 'shutter.close' });
    expect(command('حبس الفولي.', 'dz')).toEqual({ kind: 'shutter.stop' });
  });

  it('accepts standard arabic as a fallback', () => {
    expect(command('افتح الستارة.', 'dz')).toEqual({ kind: 'shutter.open' });
  });
});

describe('normalisation', () => {
  it('strips arabic diacritics and unifies letters', () => {
    expect(normalize('أُغْلِق')).toBe('اغلق');
    expect(normalize('الإضاءة')).toBe('الاضاءه');
  });

  it('converts arabic-indic digits', () => {
    expect(normalize('٤٥')).toBe('45');
  });

  it('strips french accents', () => {
    expect(normalize('Éteins la lumière.')).toBe('eteins la lumiere');
  });
});
