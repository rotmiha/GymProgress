import { describe, expect, it } from 'vitest';
import { validateCredentials } from './validation';

describe('US-01 podatki za registracijo', () => {
  it.each(['stranka', 'trener'])('sprejme veljaven račun z vlogo %s in 8 znaki', role => {
    expect(validateCredentials('test@example.com', '12345678', role)).toBeNull();
  });
  it.each(['', 'administrator', 'admin'])('zavrne nedovoljeno ali neizbrano vlogo %s', role => {
    expect(validateCredentials('test@example.com', '12345678', role)).toMatch(/vlogo/);
  });
  it('zavrne prekratko geslo', () => {
    expect(validateCredentials('test@example.com', '1234567', 'stranka')).toMatch(/8/);
  });
  it.each(['', 'test', 'a@', 'a b@example.com'])('zavrne neveljaven naslov %s', email => {
    expect(validateCredentials(email, '12345678', 'stranka')).toMatch(/e-naslov/);
  });
});
