import React from 'react';
import { Body, Screen, SectionTitle, Title } from '@/src/components/ui';

export default function HowItWorksScreen() {
  return (
    <Screen>
      <Title>How ASTRONO-ME works</Title>

      <SectionTitle>What ASTRONO-ME is</SectionTitle>
      <Body>
        ASTRONO-ME is a companion for reflection, built in Canada. It calculates your birth
        chart and follows the Moon&apos;s actual movement, then pairs those positions with
        readings written in the tradition of working astrologers — specific about planets,
        signs, aspects, and dates, and plain about what a reading can and cannot do.
      </Body>

      <SectionTitle>How your chart is calculated</SectionTitle>
      <Body>
        Planetary positions are calculated on-device with a simplified ephemeris — the same
        kind of low-precision astronomical method published for amateur astronomy — accurate
        to sign and phase for reading purposes. Your Sun sign, Moon sign, and Moon phases are
        reliable at this precision. The Rising sign needs your birth time and your birthplace;
        ASTRONO-ME matches your birthplace against a built-in list of Canadian cities, and if
        your city is not in the list it calculates from Toronto and labels the result
        approximate, rather than presenting a guess as a fact.
      </Body>
      <Body>
        If you told ASTRONO-ME you do not know your birth time, the Rising sign is left out
        entirely. Noon is used for the day&apos;s planetary positions, which is enough for every
        sign except, occasionally, the Moon near a sign boundary — one more reason the
        readings speak in tendencies rather than certainties.
      </Body>

      <SectionTitle>How the readings are written</SectionTitle>
      <Body>
        The daily reading is selected from writing keyed to the day&apos;s real Moon sign and
        phase, and to the element of your Sun sign. The weekly outlook is assembled from the
        week&apos;s actual events — the dates the Moon changes sign and reaches its quarter
        phases, calculated for your week — each paired with a written interpretation, plus
        notes for the days the Moon aspects your natal Sun, Moon, or Saturn.
      </Body>

      <SectionTitle>What astrology can and cannot do</SectionTitle>
      <Body>
        Astrology is a symbolic language with a long history, not a tested science. A reading
        can give you a useful frame for a week, a vocabulary for a mood, and a prompt worth
        journaling about. It cannot predict events, describe another person&apos;s inner life
        reliably, or stand in for medical, financial, legal, or mental-health advice. When a
        decision matters, the chart is one input among many — and never the deciding one.
      </Body>

      <SectionTitle>Your data</SectionTitle>
      <Body>
        In this version, everything stays on your device: your birth details, your
        preferences, saved readings, and any second profile you add for a compatibility
        reading. There is no account, no analytics, and no advertising. You can see exactly
        what is stored, and delete all of it, from Profile and settings.
      </Body>
    </Screen>
  );
}
