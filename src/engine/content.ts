/**
 * ASTRONO-ME content engine.
 *
 * All readings are written text, selected and assembled from the real
 * output of the ephemeris: today's Moon sign and phase, the user's natal
 * placements, and the week's actual Moon ingresses and quarter phases.
 * Nothing here is generated at runtime by a language model, and nothing
 * is phrased as a prediction. Readings are written for reflection.
 */

import {
  NatalChart,
  Placement,
  Sign,
  Element,
  elementOf,
  transitsFor,
  TransitSnapshot,
  WeekEvent,
  moonLongitude,
  signOf,
  aspectBetween,
} from './ephemeris';

/* ------------------------------------------------------------ formatting */

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function formatShortDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/* --------------------------------------------------------- daily reading */

interface MoonDayEntry {
  /** One calm sentence naming what the day tends to bring forward. */
  focus: string;
  /** The body of the day's reading for this Moon sign. */
  body: string;
  /** The closing reflection prompt. Every daily reading ends with one. */
  prompt: string;
}

const MOON_DAY: Record<Sign, MoonDayEntry> = {
  Aries: {
    focus: 'The Moon in Aries tends to shorten the distance between feeling something and acting on it.',
    body:
      'Energy arrives in bursts today, and patience runs thinner than usual. It is a good day for starting, for clearing the thing you have been circling, and for honest, brief conversations. It is a harder day for waiting rooms, long meetings, and anything that asks you to sit still with a decision. If irritation shows up, treat it as information about pace rather than a verdict on the people around you.',
    prompt: 'Where in your day would one direct sentence save you an hour of circling?',
  },
  Taurus: {
    focus: 'The Moon in Taurus slows the tempo and turns attention to the body, the table, and the budget.',
    body:
      'Today tends to reward the unglamorous work: eating properly, finishing what is already open, and letting your senses catch up with your schedule. Money and comfort are not shallow topics under this Moon; they are how security gets built. Resistance to being rushed is information, not stubbornness. One practical improvement to your physical space will do more for your mood than a new plan.',
    prompt: 'What is one small, physical thing — a meal, a repair, a cleared surface — that would make tonight easier?',
  },
  Gemini: {
    focus: 'The Moon in Gemini makes the mind busy and the day sociable, curious, and a little scattered.',
    body:
      'Conversations carry more weight than usual today, and a short message can change the shape of the week. It is a good day for errands, drafts, questions, and learning the thing you keep meaning to look up. The risk is diffusion: five open threads, none of them closed. Pick the two conversations that matter and give them your full attention; let the rest wait.',
    prompt: 'Which conversation have you been having in your head that would go better out loud?',
  },
  Cancer: {
    focus: 'The Moon in Cancer, its home sign, brings home, family, and memory closer to the surface.',
    body:
      'Feelings run nearer the skin today, and that is not a problem to solve. It is a good day for cooking, for calling the person you actually miss, and for tending the place you live. Work that requires emotional distance will cost more than usual; work that requires care will come easier. Notice what you are protecting, and whether it still needs protecting in the same way.',
    prompt: 'What would rest look like today if it were a place rather than a pause?',
  },
  Leo: {
    focus: 'The Moon in Leo asks for warmth, play, and to be seen doing something you care about.',
    body:
      'There is more appetite today for making things, showing things, and being appreciated for them. That appetite is healthy; it only turns sour when applause becomes the whole point. Share the work while it is still enjoyable. Generosity also runs high under this Moon — a genuine compliment costs nothing and tends to be remembered longer than you expect.',
    prompt: 'What would you make today if nobody could see it until it was finished?',
  },
  Virgo: {
    focus: 'The Moon in Virgo favours lists, small repairs, and the quiet satisfaction of things in their place.',
    body:
      'Details stand out today: the loose thread, the unanswered form, the drawer that sticks. It is a good day for editing, sorting, and health basics — sleep, water, the walk you keep postponing. The shadow of this Moon is self-criticism dressed up as standards. Aim for useful, not perfect, and notice how much of the day improves when the bar is set at done.',
    prompt: 'What is one small disorder in your day that you could put right in ten minutes?',
  },
  Libra: {
    focus: 'The Moon in Libra turns attention to other people: fairness, tone, and the state of your closest agreements.',
    body:
      'You may find yourself mediating today, or quietly rebalancing something that has felt one-sided. It is a good day for the conversation that needs care rather than speed, and for making a shared space more pleasant. The trap is agreeing to keep the peace and paying for it later. A kind no is still a complete sentence.',
    prompt: 'Where have you been keeping a peace that is not actually peaceful for you?',
  },
  Scorpio: {
    focus: 'The Moon in Scorpio deepens everything it touches; small talk feels thinner and real talk feels possible.',
    body:
      'Today tends to surface what is usually kept underneath: a debt, a desire, a suspicion, a loyalty. It is a good day for honest accounting — financial or emotional — and for private work that needs concentration. Trust your read of a situation, and also check it once before acting on it. Intensity is a tool; aim it at the problem, not at a person.',
    prompt: 'What is one true thing you could say today, plainly and without decoration?',
  },
  Sagittarius: {
    focus: 'The Moon in Sagittarius lifts the eye to the horizon: plans, study, travel, and the bigger picture.',
    body:
      'Restlessness today is usually a sign that the frame has become too small, not that your life has. It is a good day for booking the trip, starting the course, or having the philosophical conversation over a long walk. Watch the tendency to promise more than the calendar allows. One honest adventure, however small, beats a week of browsing.',
    prompt: 'If you gave today a wider horizon, what would you do with the extra room?',
  },
  Capricorn: {
    focus: 'The Moon in Capricorn is practical and a little sober; it asks what is actually being built.',
    body:
      'Long-term questions come forward today: the career, the obligation, the reputation you are slowly making. It is a good day for the task with a deadline attached to your name, and for saying no to work that builds someone else\'s structure at the cost of your own. Feelings may feel inconvenient; schedule around them if you must, but do not bill yourself for having them.',
    prompt: 'What are you building this month that will still matter in a year?',
  },
  Aquarius: {
    focus: 'The Moon in Aquarius looks at the familiar from one step back, and the group matters as much as the individual.',
    body:
      'Today favours the unconventional solution and the honest conversation among friends. You may feel a pull toward your community, a cause, or a project that is bigger than your own household. It is also a good day to examine a habit you keep purely because it is yours. A small experiment — a different route, tool, or arrangement — will teach you more than another week of the routine.',
    prompt: 'Which of your routines is due for a small, deliberate experiment?',
  },
  Pisces: {
    focus: 'The Moon in Pisces softens the edges of the day; imagination, music, and rest do real work now.',
    body:
      'The boundary between your feelings and everyone else\'s gets porous today. That can mean unusual compassion, and it can mean picking up a mood that was never yours. Time near water, music, or unstructured quiet is not an escape under this Moon; it is maintenance. Postpone the decision that needs a hard edge, and let the one that needs intuition move first.',
    prompt: 'Whose mood might you be carrying today that you could gently put down?',
  },
};

/** How the day's Moon lands for each element of natal Sun sign. */
const ELEMENT_MODULATION: Record<Element, { gentle: string; direct: string }> = {
  Fire: {
    gentle:
      'For a Fire-sign Sun, this Moon works best when it is given somewhere to go. A walk, a task with your hands, an honest conversation — movement turns today\'s weather into something useful rather than something that simply happens to you.',
    direct:
      'For a Fire-sign Sun: do not spend today waiting to feel ready. Act at the scale the day allows, and let motivation catch up with you afterwards.',
  },
  Earth: {
    gentle:
      'For an Earth-sign Sun, today asks to be met practically. Small, finished things will steady you more than big intentions. Let the day be ordinary in the ways that work, and change one thing at a time.',
    direct:
      'For an Earth-sign Sun: the plan is not the work. Pick the smallest unfinished piece and close it today; momentum follows completion.',
  },
  Air: {
    gentle:
      'For an Air-sign Sun, today is easier understood out loud or on paper. Talk it through with someone you trust, or give the thought twenty minutes in a notebook before you decide what it means.',
    direct:
      'For an Air-sign Sun: you have thought about this enough to act on the information you already have. Write the decision down and move.',
  },
  Water: {
    gentle:
      'For a Water-sign Sun, today\'s feelings are data, not instructions. Let them tell you what matters, then choose the response at your own pace rather than the feeling\'s pace.',
    direct:
      'For a Water-sign Sun: name the feeling precisely before you act on it. Half of today\'s weight usually lifts once the right word is found.',
  },
};

export interface DailyReading {
  headline: string;
  subline: string;
  paragraphs: string[];
  prompt: string;
}

export function dailyReading(
  sunSign: Sign,
  tone: 'Gentle' | 'Direct',
  date: Date,
  transit?: TransitSnapshot,
): DailyReading {
  const t = transit ?? transitsFor(date);
  const entry = MOON_DAY[t.moonSign];
  const element = elementOf(sunSign);
  const modulation = tone === 'Direct' ? ELEMENT_MODULATION[element].direct : ELEMENT_MODULATION[element].gentle;
  const phaseWord =
    t.moonPhase.name === 'New Moon' || t.moonPhase.name === 'Full Moon'
      ? ` It is also the ${t.moonPhase.name}.`
      : ` The Moon is in its ${t.moonPhase.name.toLowerCase()} phase.`;
  return {
    headline: `The Moon in ${t.moonSign}`,
    subline: `${formatDate(date)} · ${t.moonPhase.name} · Your Sun in ${sunSign}`,
    paragraphs: [entry.focus + phaseWord, entry.body, modulation],
    prompt: entry.prompt,
  };
}

/* ------------------------------------------------- natal interpretations */

export const SUN_IN_SIGN: Record<Sign, string> = {
  Aries:
    'The Sun in Aries describes someone whose basic orientation is toward beginning. You tend to meet life head-on and to trust your first honest impulse more than a long deliberation. Independence is not a preference for you so much as a requirement; you think more clearly when the decision is yours. The work of this placement is pacing — learning that not every day is a charge, and that the people who move more slowly are not necessarily standing in your way.',
  Taurus:
    'The Sun in Taurus describes someone who builds a life the way a garden is built: season by season, with attention to what actually grows. You are oriented toward security, craft, and the pleasures that can be touched, tasted, and kept. Change tends to come slowly for you, and then all at once, once you have decided. The work of this placement is flexibility — knowing which of your fixtures are foundations and which have quietly become fences.',
  Gemini:
    'The Sun in Gemini describes someone whose mind is the main instrument. You orient yourself by learning, asking, and connecting; a day with no new information in it feels oddly flat. You are often the person who knows a little about everything in the room and can talk to anyone in it. The work of this placement is depth — choosing which of your many threads deserves to become a rope.',
  Cancer:
    'The Sun in Cancer describes someone oriented toward home, in every sense of the word: the place, the people, and the feeling of being safely known. Your memory is long and your loyalty is longer. Much of your energy goes into building an inner and outer life that can hold the people you love. The work of this placement is boundaries — caring for others without quietly keeping score of what it costs you.',
  Leo:
    'The Sun in Leo describes someone oriented toward expression. You are here to make things — work, warmth, occasions — and to stand behind them in your own name. Recognition matters to you not as vanity but as evidence that the work landed. The work of this placement is proportion: keeping the wish to be seen in healthy balance with the wish to be useful, and letting other people have the light without feeling dimmed by it.',
  Virgo:
    'The Sun in Virgo describes someone oriented toward usefulness. You notice what is not working and feel a genuine pull to fix it, in systems, in schedules, and in yourself. Your standards are a form of care; you hold them because you believe things can be done well. The work of this placement is mercy — applying to yourself the same fair judgement you would offer a friend, and letting some things be good enough on purpose.',
  Libra:
    'The Sun in Libra describes someone oriented toward relationship and fairness. You think in pairs and in consequences: how a decision lands on the other person, how a room feels when everyone in it is considered. Your diplomacy is a real skill, not a performance. The work of this placement is self-assertion — stating what you want before you have shaped it into what everyone else can accept.',
  Scorpio:
    'The Sun in Scorpio describes someone oriented toward depth and truth. You are interested in what is underneath: the motive under the statement, the feeling under the arrangement. Privacy is not secrecy for you; it is how you protect what is still forming. The work of this placement is trust — deciding, case by case, which risks of openness are worth taking, and letting a few people see the unfinished version.',
  Sagittarius:
    'The Sun in Sagittarius describes someone oriented toward horizon and meaning. You need to feel that life is going somewhere and that the somewhere is worth it. Travel, study, and big questions are not hobbies for you; they are how you stay honest. The work of this placement is follow-through — finishing the journey you started talking about, and learning that commitment can be a form of freedom rather than its opposite.',
  Capricorn:
    'The Sun in Capricorn describes someone oriented toward building and responsibility. You measure life in structures that hold: work that compounds, promises kept over years, a name that means something. You are more ambitious than you usually say out loud. The work of this placement is rest — treating your own limits as part of the structure rather than as a flaw in it, and letting achievement include a life, not just a record.',
  Aquarius:
    'The Sun in Aquarius describes someone oriented toward the future and the group. You think in systems and principles, and you would rather improve the arrangement than win inside a bad one. Originality comes naturally to you; so does a certain distance. The work of this placement is closeness — letting particular people matter more than the principle of the moment, and accepting warmth that is not perfectly rational.',
  Pisces:
    'The Sun in Pisces describes someone oriented toward feeling and imagination. You absorb the weather of the rooms you are in, and your inner life is vivid enough to be a place in itself. Compassion is your default setting, sometimes past the point of usefulness. The work of this placement is edges — learning where you end and other people\'s weather begins, and giving your sensitivity a craft, a schedule, or a shore to work from.',
};

export const MOON_IN_SIGN_NATAL: Record<Sign, string> = {
  Aries:
    'The Moon in Aries describes an emotional life that moves quickly. Feelings arrive at full strength and, if they are allowed expression, they pass at the same speed. You recover by doing something, not by waiting to feel better. In close relationships you need room to react honestly without the reaction becoming the whole story. Rest, for you, usually looks like a finished effort and a clear next thing.',
  Taurus:
    'The Moon in Taurus describes an emotional life that steadies through the senses. Food, touch, familiar places, and unhurried time are not indulgences for you; they are how your system settles. You are slow to trust a feeling and slow to let one go. Change lands heavily at first and then, once accepted, becomes the new normal you defend. Financial calm and emotional calm are closely linked in you.',
  Gemini:
    'The Moon in Gemini describes an emotional life that runs through language. You process by talking, writing, and asking one more question; silence can feel like being left alone with static. Variety is a genuine need, not a lack of depth. In relationships you bond over conversation and shared curiosity. When you are overwhelmed, naming things precisely — out loud, to someone — is usually the fastest way back to steady.',
  Cancer:
    'The Moon in Cancer describes an emotional life with the volume turned up and a long memory attached. You feel your way through situations before you think your way through them, and your instincts about people are usually earned. Home is a real requirement: you need a place, and a few people, where no performance is expected. Your care for others is deep; the lesson is letting yourself be on the receiving end of it.',
  Leo:
    'The Moon in Leo describes an emotional life that needs warmth, play, and appreciation. You come back to yourself by making something, gathering people you like, or being genuinely thanked. Being ignored costs you more than being criticised. In relationships you are generous and proud in roughly equal measure. Creative work is not a luxury in your chart; it is part of how you stay emotionally well.',
  Virgo:
    'The Moon in Virgo describes an emotional life that settles through usefulness and order. You feel better when the list is written, the space is clear, and someone has been helped in a concrete way. Worry is your system\'s default background process, and it often masquerades as preparation. You show love in practical acts. Learning which problems are yours to solve — and which are simply yours to witness — is ongoing work.',
  Libra:
    'The Moon in Libra describes an emotional life oriented toward harmony and company. You settle by talking things through with a trusted person and by being in spaces that feel considered and kind. Conflict unsettles you physically; you will often fix the atmosphere before you address the issue. In relationships you need reciprocity you can feel. Your task is to let a disagreement exist for a day without treating it as an emergency.',
  Scorpio:
    'The Moon in Scorpio describes an emotional life of unusual depth and privacy. You feel things at full intensity and show perhaps a third of it. Trust, for you, is built slowly and tested honestly. You are the person others call in a real crisis, because you do not flinch. The work of this placement is release: letting a feeling finish instead of storing it, and believing that being known will not cost you your strength.',
  Sagittarius:
    'The Moon in Sagittarius describes an emotional life that needs room and meaning. You recover through movement, open air, study, and the sense that life is larger than the current problem. Routine soothes you only in small doses. In relationships you need honesty and a shared direction more than constant contact. When you are low, the cure is rarely rest alone; it is a wider view.',
  Capricorn:
    'The Moon in Capricorn describes an emotional life that steadies through competence. You feel most secure when something in your life is demonstrably handled, and you tend to process feelings by getting on with the work. Asking for help does not come naturally; you would rather be the reliable one. Underneath the reserve is a dry humour and a deep loyalty. Letting people see you mid-process, not only at the result, is the growth edge.',
  Aquarius:
    'The Moon in Aquarius describes an emotional life that processes at one remove: you often understand a feeling before you fully feel it. Friendship is a primary emotional home for you, and your people may be scattered across places and years. You need intellectual honesty in close relationships and room to be unconventional. The work here is letting a feeling be simple and bodily sometimes, without analysing it into a position paper.',
  Pisces:
    'The Moon in Pisces describes an emotional life without much of a border fence. You absorb atmospheres and other people\'s moods, and your own feelings arrive as weather rather than statements. Solitude, sleep, music, and water restore you in a way company cannot. You are compassionate past the point most people reach. Your ongoing work is discernment: telling your own weather from the climate you have walked through.',
};

export const RISING_IN_SIGN: Record<Sign, string> = {
  Aries:
    'Aries Rising describes the way you meet the world: directly, and usually first. People tend to experience you as energetic and straightforward, someone who starts things. Your first instinct in a new situation is to move, and you learn by doing rather than by watching. Over a lifetime, this placement asks for patience as a practiced skill — the art of arriving second on purpose.',
  Taurus:
    'Taurus Rising describes the way you meet the world: steadily, and at your own pace. People tend to experience you as calm, solid, and hard to rush. You take in new situations through your senses first — how a place feels, sounds, and feeds you. Your presence is reassuring in a crisis precisely because you do not accelerate. The lifelong practice here is knowing when steadiness has become standing still.',
  Gemini:
    'Gemini Rising describes the way you meet the world: with questions. People tend to experience you as quick, curious, and easy to talk to, someone who collects people and facts with equal interest. You learn by conversing and you think by speaking. Nervous energy can be part of the package. The lifelong practice is focus — letting one conversation, project, or place have you completely for a while.',
  Cancer:
    'Cancer Rising describes the way you meet the world: carefully, with your feelers out. People tend to experience you as kind and somewhat private, warmer once you have decided they are safe. Your first read of any room is emotional — who is comfortable, who is not. Home and family shape your public life more than you may realise. The lifelong practice is letting people in at a pace that is honest rather than purely defensive.',
  Leo:
    'Leo Rising describes the way you meet the world: openly, with presence. People tend to notice you; you have a natural sense of occasion and of how you come across. You approach new situations as a host as much as a guest, putting others at ease by taking up your own space without apology. The lifelong practice is distinguishing between being seen and being known, and letting a few people past the presentation.',
  Virgo:
    'Virgo Rising describes the way you meet the world: attentively, taking in the details others miss. People tend to experience you as capable, precise, and quietly helpful — the person who has already noticed the problem and started on it. You can be harder on your own presentation than anyone else is. The lifelong practice is allowing yourself to be a work in progress in public, not only in private.',
  Libra:
    'Libra Rising describes the way you meet the world: graciously, with an eye for the other person. People tend to experience you as pleasant, fair-minded, and easy to be around; you instinctively smooth the social surface. Partnership, in work and in love, is a central theme of your life. The lifelong practice is keeping your own position visible inside your diplomacy, so that being agreeable never costs you being known.',
  Scorpio:
    'Scorpio Rising describes the way you meet the world: watchfully, revealing yourself in layers. People tend to experience you as intense and self-contained; strangers often sense there is more going on than you are showing, because there is. You read motives quickly and forget little. The lifelong practice is trust as a discipline — deciding that some rooms are safe enough to enter without your armour fully on.',
  Sagittarius:
    'Sagittarius Rising describes the way you meet the world: enthusiastically, looking for the point of it. People tend to experience you as frank, funny, and restless, someone whose life seems to involve motion. You approach new situations as material for a story or a theory. Bluntness is the known hazard. The lifelong practice is listening at the same volume you speak, and finishing the journeys you announce.',
  Capricorn:
    'Capricorn Rising describes the way you meet the world: seriously, with your standards showing. People tend to experience you as composed and competent, sometimes older than your years. You approach new situations by assessing what is required and quietly becoming the person who can provide it. The lifelong practice is softness in public — letting people meet the person, not only the capability.',
  Aquarius:
    'Aquarius Rising describes the way you meet the world: on your own terms, visibly. People tend to experience you as original, friendly at a slight distance, and difficult to categorise. You approach new situations as an observer first, and your opinions are your own even when they are unpopular. The lifelong practice is letting belonging happen — accepting that a group can have you without flattening you.',
  Pisces:
    'Pisces Rising describes the way you meet the world: gently, and somewhat permeably. People tend to experience you as kind, dreamy, and hard to pin down; you give an impression of listening with more than your ears. You approach new situations by absorbing them before you respond. The lifelong practice is definition — keeping a clear outline of your own intentions inside your natural empathy, so the day belongs to you as well.',
};

/* ------------------------------------------- planet-in-sign, shorter lines */

const PLANET_ROLE: Record<string, string> = {
  Mercury: 'Mercury describes how you take in information, learn, and make yourself understood.',
  Venus: 'Venus describes what you value, how you love, and what you find beautiful or worth paying for.',
  Mars: 'Mars describes how you go after what you want, and how your anger and energy move.',
  Jupiter: 'Jupiter describes where you look for meaning and growth, and how your confidence expands.',
  Saturn: 'Saturn describes where life asks you to be serious: your obligations, your standards, and the structures you build slowly.',
  Uranus: 'Uranus describes where you need things to be different — your streak of independence and your appetite for change.',
  Neptune: 'Neptune describes where your imagination is strongest and your boundaries softest: dreams, music, and longing live here.',
  Pluto: 'Pluto describes where your life goes through deep change over time, and where you hold power you do not always discuss.',
};

const SIGN_TURN: Record<Sign, string> = {
  Aries: 'that runs direct and fast. You act first and refine later, and you would rather begin imperfectly than wait for ideal conditions.',
  Taurus: 'that runs steady and concrete. You trust what you can verify with your senses, and once you have decided, you are not easily moved.',
  Gemini: 'that runs curious and quick. You need variety and exchange to stay engaged, and you process the world by talking and reading widely.',
  Cancer: 'that runs through feeling and memory. You lead with care, protect what is yours, and remember how things felt long after others have moved on.',
  Leo: 'that runs warm and expressive. You want this part of life to be lived visibly and generously, and you do your best work when it is appreciated.',
  Virgo: 'that runs precise and practical. You improve as you go, notice what is out of place, and take quiet pride in doing the thing properly.',
  Libra: 'that runs through relationship and judgement. You weigh how things land on other people, and you are at your best when the arrangement feels fair on both sides.',
  Scorpio: 'that runs deep and private. You are interested in what is underneath the surface version, and you keep your own counsel until trust is established.',
  Sagittarius: 'that runs toward the horizon. You need this part of life to keep expanding — through travel, study, or honest conversation — and you resist being fenced in.',
  Capricorn: 'that runs disciplined and long-term. You treat this part of life as something to build, and you are willing to be patient in ways other people are not.',
  Aquarius: 'that runs original and principled. You follow your own reasoning here, even when it sets you apart, and you care how this part of life serves the wider group.',
  Pisces: 'that runs intuitive and porous. You feel your way through this part of life, and your imagination is both your instrument and your weather.',
};

export function planetInSignLine(placement: Placement): string {
  return `${placement.planet} in ${placement.sign}. ${PLANET_ROLE[placement.planet]} In ${placement.sign}, ${SIGN_TURN[placement.sign]}`;
}

export interface ChartSection {
  title: string;
  body: string;
}

export function natalSections(chart: NatalChart): ChartSection[] {
  const sections: ChartSection[] = [
    { title: `Sun in ${chart.sun.sign}`, body: SUN_IN_SIGN[chart.sun.sign] },
    { title: `Moon in ${chart.moon.sign}`, body: MOON_IN_SIGN_NATAL[chart.moon.sign] },
  ];
  if (chart.rising) {
    sections.push({
      title: `Rising sign: ${chart.rising.sign}`,
      body: RISING_IN_SIGN[chart.rising.sign],
    });
  } else {
    sections.push({
      title: 'Rising sign: not available',
      body:
        'Your Rising sign depends on your exact birth time, which you told us you do not know. Rather than guess, ASTRONO-ME leaves it out. If you find your birth time later — it is often on a long-form birth certificate — you can add it in your profile and this section will appear.',
    });
  }
  for (const p of chart.placements) {
    if (p.planet === 'Sun' || p.planet === 'Moon') continue;
    sections.push({ title: `${p.planet} in ${p.sign}`, body: planetInSignLine(p) });
  }
  return sections;
}

/* ------------------------------------------------------- weekly outlook */

const MOON_INGRESS_WEEK: Record<Sign, string> = {
  Aries: 'Energy and directness rise. Good days for starting, deciding, and brief honest conversations; harder days for waiting.',
  Taurus: 'The pace slows toward the practical. Money, food, rest, and the state of your home come forward.',
  Gemini: 'A busier, more talkative stretch. Messages, errands, and short trips multiply; guard against scattering.',
  Cancer: 'Home and family move to the front. Feelings run closer to the surface and ask for room rather than fixing.',
  Leo: 'A warmer, more expressive stretch. Make something, gather people, and let yourself be appreciated.',
  Virgo: 'Details and maintenance take over. Lists, health basics, and small repairs go well now.',
  Libra: 'Relationships and fairness come forward. A conversation handled with care can rebalance more than you expect.',
  Scorpio: 'A deeper, more private stretch. Honest accounting — emotional or financial — is favoured over small talk.',
  Sagittarius: 'The horizon widens. Plans, study, and movement appeal; watch the urge to over-promise.',
  Capricorn: 'Work and obligation come forward. Steady, unglamorous progress is the theme; protect your rest anyway.',
  Aquarius: 'Friends, groups, and the unconventional solution. A good stretch to test a new arrangement.',
  Pisces: 'A softer, dreamier stretch. Rest, music, and unstructured time do real work; postpone hard-edged decisions.',
};

const PHASE_WEEK: Record<string, string> = {
  'New Moon':
    'A New Moon is the quiet start of the lunar month: the sky is dark and the theme is intention rather than action. Astrologers treat the days around it as a time to decide what the next four weeks are for, privately, before there is anything to show.',
  'First Quarter':
    'The First Quarter Moon is the working point of the lunar month: the plan meets its first real obstacle. Expect a decision, an adjustment, or a small crisis of commitment — the ordinary friction that tells you whether the intention from the New Moon is actually yours.',
  'Full Moon':
    'A Full Moon brings the lunar month to its lit peak. Things started at the New Moon tend to become visible now — results, feelings, and other people\'s positions included. It is a culmination, not a verdict; notice what is illuminated before you decide what it means.',
  'Last Quarter':
    'The Last Quarter Moon is the review point of the lunar month. The theme is sorting: keep what the month taught you, release what it did not, and let the remaining days be quieter on purpose.',
};

export interface WeekSection {
  dateLabel: string;
  title: string;
  body: string;
}

export interface WeeklyOutlook {
  rangeLabel: string;
  intro: string;
  sections: WeekSection[];
  personalNotes: string[];
}

const ASPECT_NOTE: Record<string, string> = {
  conjunction:
    'A conjunction blends the two together; the day tends to feel concentrated, with this part of your chart fully switched on.',
  sextile:
    'A sextile is the cooperative aspect: an opening rather than a push. It tends to reward the small effort made on the day.',
  square:
    'A square is the friction aspect: two needs that both have a point. It tends to feel like a corner that has to be turned deliberately rather than drifted around.',
  trine:
    'A trine is the flowing aspect: things in this part of your life tend to cooperate for the day, and effort goes further than usual.',
  opposition:
    'An opposition puts two parts of your chart face to face, usually through another person. It tends to make a balance visible by disturbing it first.',
};

export function weeklyOutlook(
  chart: NatalChart,
  tone: 'Gentle' | 'Direct',
  date: Date,
): WeeklyOutlook {
  const t = transitsFor(date);
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  const sections: WeekSection[] = t.weekEvents.map((ev: WeekEvent) => {
    if (ev.kind === 'moon-ingress') {
      const sign = ev.label as Sign;
      return {
        dateLabel: formatDate(ev.date),
        title: `The Moon moves into ${sign}`,
        body: MOON_INGRESS_WEEK[sign],
      };
    }
    return {
      dateLabel: formatDate(ev.date),
      title: ev.detail,
      body: PHASE_WEEK[ev.label] ?? '',
    };
  });

  // Personal notes: transiting Moon aspecting the natal Sun, Moon, or Saturn
  // on specific days this week, named with real dates (computed, orb <= 5 deg).
  const personalNotes: string[] = [];
  const targets: { name: string; longitude: number }[] = [
    { name: 'Sun', longitude: chart.sun.longitude },
    { name: 'Moon', longitude: chart.moon.longitude },
    {
      name: 'Saturn',
      longitude: (chart.placements.find((p) => p.planet === 'Saturn') as Placement).longitude,
    },
  ];
  for (let offset = 0; offset < 7 && personalNotes.length < 3; offset++) {
    const day = new Date(date);
    day.setDate(day.getDate() + offset);
    day.setHours(12, 0, 0, 0);
    const mLon = moonLongitude(day);
    const mSign = signOf(mLon);
    for (const target of targets) {
      const asp = aspectBetween(mLon, target.longitude);
      if (asp && asp.orb <= 5) {
        const verb =
          asp.name === 'conjunction'
            ? 'joins'
            : asp.name === 'sextile'
              ? 'sextiles'
              : asp.name === 'square'
                ? 'squares'
                : asp.name === 'trine'
                  ? 'trines'
                  : 'opposes';
        personalNotes.push(
          `On ${formatDate(day)}, the Moon in ${mSign} ${verb} your natal ${target.name}. ${ASPECT_NOTE[asp.name]}`,
        );
        break;
      }
    }
  }

  const intro =
    tone === 'Direct'
      ? 'Here is the week as the Moon actually moves through it: sign changes and quarter phases, with dates. Underneath are the points where the Moon touches your own chart.'
      : 'This is the week as the Moon actually moves through it — each sign change and quarter phase, with its date — followed by the few points where the Moon touches your own chart. Take what is useful and leave the rest.';

  return {
    rangeLabel: `${formatShortDate(date)} – ${formatShortDate(end)}`,
    intro,
    sections,
    personalNotes,
  };
}

/* -------------------------------------------------------- compatibility */

export const COMPATIBILITY_CONSENT =
  'Compatibility readings compare two birth charts. Only add someone else\'s birth date if they are happy to be included — a date of birth is personal information, and the reading works best when both people know it exists. ASTRONO-ME stores the second profile only on this device, and you can delete it at any time from this screen.';

const ELEMENT_PAIR: Record<string, string> = {
  'Fire|Fire':
    'Two Fire signs together tend to generate more energy than either one alone: enthusiasm, honesty, and momentum come easily. The shared risk is combustion — arguments that flare fast, plans that outrun the calendar. This pairing works best when both people learn to take turns being the one who slows down.',
  'Earth|Fire':
    'Fire brings the spark and Earth brings the structure. Fire can find Earth slow; Earth can find Fire careless, and both are sometimes right. At its best, this pairing actually finishes things: one partner supplies the wanting, the other supplies the way. Money and pacing are the topics to discuss early and plainly.',
  'Air|Fire':
    'Air feeds Fire, and this is one of the classic easy combinations: conversation fuels enthusiasm and enthusiasm gives conversation somewhere to go. The shared risk is altitude — a relationship of ideas and plans that forgets the practical and the tender. Deliberate ordinary time together is the corrective.',
  'Fire|Water':
    'Fire and Water is the steam combination: intense, feeling, and capable of putting each other out if handled carelessly. Fire wants the feeling expressed and resolved; Water wants it understood first. At its best this pairing is deeply loyal and fully alive. The work is translation — saying the feeling in the other person\'s language.',
  'Earth|Earth':
    'Two Earth signs together tend to build: slowly, concretely, and with an eye on the long term. Trust accumulates through kept promises and shared work. The shared risk is a rut so comfortable it becomes invisible. This pairing benefits from deliberately scheduled novelty — new places, new food, new projects — treated as maintenance, not indulgence.',
  'Air|Earth':
    'Earth grounds Air and Air ventilates Earth. One partner lives in the concrete present, the other in the pattern and the possibility, and each can find the other\'s native country slightly baffling. At its best, this is a pairing that both dreams and delivers. Affection needs translating: Earth shows it in acts, Air in words, and both count.',
  'Earth|Water':
    'Earth and Water is the garden combination: one provides the container, the other provides the life. This pairing tends to make a home, in every sense, and to take loyalty seriously. The shared risk is silence — two private people assuming the other knows. Regular, unremarkable honesty about small things keeps the big things safe.',
  'Air|Air':
    'Two Air signs together tend to talk their way into a genuine meeting of minds: curious, funny, and allergic to boredom. The shared risk is living in the commentary instead of the experience, and feelings going underground because neither person wants to be the heavy one. This pairing needs a few rituals of plain emotional speech.',
  'Air|Water':
    'Air thinks in words and Water thinks in feelings, and this pairing is the long project of learning each other\'s first language. Water can find Air detached; Air can find Water flooded, and both descriptions miss the point. At its best, this combination is unusually perceptive — each partner can name what the other cannot.',
  'Water|Water':
    'Two Water signs together tend to understand each other without much explanation, which is the gift and the hazard of this pairing. Moods can amplify; a low day for one becomes weather for both. At its best, this is a deeply tender and private bond. The work is edges: keeping friendships, projects, and rooms of one\'s own inside the closeness.',
};

const MOON_PAIR_SAME =
  'Your Moon signs are the same, which usually means your emotional rhythms run on similar settings: you tend to need the same kind of comfort, at roughly the same pace. That recognition is often the quiet foundation of the relationship.';
const MOON_PAIR_ELEMENT =
  'Your Moon signs share an element, so your emotional styles speak dialects of the same language. You may express needs differently, but the underlying rhythm — how you settle, recover, and feel safe — tends to rhyme.';
const MOON_PAIR_DIFFERENT =
  'Your Moon signs sit in different elements, so your emotional styles run on different settings: what soothes one of you may not even register for the other. This is common and workable. It simply means comfort has to be asked for in words, not assumed.';

export interface CompatibilityReading {
  title: string;
  paragraphs: string[];
  prompt: string;
}

export function compatibilityReading(
  nameA: string,
  chartA: NatalChart,
  nameB: string,
  chartB: NatalChart,
): CompatibilityReading {
  const elA = elementOf(chartA.sun.sign);
  const elB = elementOf(chartB.sun.sign);
  const key = [elA, elB].sort().join('|');
  const moonNote =
    chartA.moon.sign === chartB.moon.sign
      ? MOON_PAIR_SAME
      : elementOf(chartA.moon.sign) === elementOf(chartB.moon.sign)
        ? MOON_PAIR_ELEMENT
        : MOON_PAIR_DIFFERENT;
  return {
    title: `${nameA} and ${nameB}`,
    paragraphs: [
      `${nameA}'s Sun is in ${chartA.sun.sign} (${elA}) and ${nameB}'s Sun is in ${chartB.sun.sign} (${elB}). The Sun signs describe each person's basic orientation — what they are here to do and how they most naturally shine. ${ELEMENT_PAIR[key]}`,
      `${nameA}'s Moon is in ${chartA.moon.sign} and ${nameB}'s Moon is in ${chartB.moon.sign}. The Moon signs describe emotional needs: how each person rests, recovers, and feels cared for. ${moonNote}`,
      'A reading like this one describes tendencies, not outcomes. Two charts can look difficult on paper and belong to people who have simply learned each other well, and two easy charts still require the ordinary work of honesty and repair. Treat what fits as a description of the weather between you, not a judgement on the climate.',
    ],
    prompt: `Which of these descriptions would ${nameB} recognise, and which would they argue with? That conversation is the useful part.`,
  };
}

/* ------------------------------------------------------------ Learn library */

export interface ArticleSection {
  heading?: string;
  paragraphs: string[];
}

export interface Article {
  id: string;
  title: string;
  standfirst: string;
  minutes: number;
  premium: boolean;
  sections: ArticleSection[];
}

export const ARTICLES: Article[] = [
  {
    id: 'what-is-a-birth-chart',
    title: 'What a birth chart is',
    standfirst:
      'A birth chart is a map of the sky at the moment you were born. This article explains what is actually on the map, and what astrologers do with it.',
    minutes: 5,
    premium: false,
    sections: [
      {
        paragraphs: [
          'A birth chart — also called a natal chart — is a diagram of where the Sun, Moon, and planets were, seen from your birthplace, at the moment you were born. It is frozen at that moment for your whole life. Astrologers read it the way you might read a map of a coastline: the map does not cause the coast, but it describes its shape.',
          'To draw one, an astrologer needs three things: your birth date, your birth place, and your birth time. The date fixes the positions of the Sun and the slower planets. The Moon moves about 13 degrees a day, so the date alone usually settles its sign. The birth time is what fixes the fastest-moving part of the chart: the Rising sign, which changes roughly every two hours.',
        ],
      },
      {
        heading: 'The three numbers that matter most',
        paragraphs: [
          'Most readings start with three placements. The Sun sign describes your basic orientation — what you are here to do and how you shine. The Moon sign describes your emotional nature — how you rest, react, and feel safe. The Rising sign describes the way you meet the world: your manner, your first impression, the lens everything else is seen through.',
          'The remaining planets fill in the rest of life: Mercury for mind and speech, Venus for love and value, Mars for drive, Jupiter for growth, Saturn for duty and time, and the three outer planets — Uranus, Neptune, Pluto — for the slow themes that whole generations share.',
        ],
      },
      {
        heading: 'What a chart is not',
        paragraphs: [
          'A birth chart is not a verdict. Two people born minutes apart in the same city will live different lives, because a chart describes tendencies and themes, not events. Used well, it is a vocabulary for self-knowledge: a way of naming patterns you already half-recognise, so you can work with them deliberately. Any reading that claims certainty about your future is going past what the tool can honestly do.',
        ],
      },
    ],
  },
  {
    id: 'the-moon-sign',
    title: 'The Moon sign',
    standfirst:
      'Your Sun sign gets the fame, but your Moon sign runs your evenings, your reactions, and your recovery. Here is how to read it.',
    minutes: 4,
    premium: false,
    sections: [
      {
        paragraphs: [
          'In a birth chart, the Moon describes your emotional operating system: what you need in order to feel safe, how you react before you have time to think, and how you restore yourself when life has taken something out of you. Where the Sun is the self you are growing into, the Moon is the self you started as — habits and hungers laid down early.',
          'This is why Moon sign descriptions often feel more private and more accurate than Sun sign ones. Your Sun sign is on display; your Moon sign is what your household sees. It governs the 11 p.m. version of you.',
        ],
      },
      {
        heading: 'How to use yours',
        paragraphs: [
          'Start with a practical question: what actually restores you? A Moon in Taurus usually recovers through the senses — good food, sleep, a familiar place. A Moon in Gemini recovers by talking it out. A Moon in Capricorn recovers by getting one thing handled. None of these is better; they are different instructions for the same machine.',
          'The Moon sign is also the first thing many astrologers look at in compatibility, because daily life runs on it. Two people can admire each other\'s Suns enormously and still exhaust each other if their Moons need opposite things at the end of every day.',
        ],
      },
      {
        heading: 'Why ASTRONO-ME leads with the Moon',
        paragraphs: [
          'The transiting Moon changes sign every two and a half days and touches every point in your chart each month. That makes it the most useful clock in everyday astrology — fast enough to describe the texture of a week, regular enough to learn from. Your daily reading follows it for exactly that reason.',
        ],
      },
    ],
  },
  {
    id: 'houses-in-plain-english',
    title: 'Houses in plain English',
    standfirst:
      'The twelve houses are the stage sets of the chart: the areas of life where the planets do their work. No jargon, one house at a time.',
    minutes: 7,
    premium: true,
    sections: [
      {
        paragraphs: [
          'If the planets are the actors and the signs are their costumes, the houses are the rooms they are standing in. A house placement answers the question: where in life does this theme play out? Venus describes how you love; Venus in the tenth house puts love and value in the room marked career and public life.',
          'The houses are counted from the Rising sign. The sign on the horizon at your birth becomes the first house, and the twelve houses follow in order around the chart. This is why the Rising sign matters so much: it decides which room everything is standing in.',
        ],
      },
      {
        heading: 'The twelve rooms',
        paragraphs: [
          'First house: the self — body, manner, first impressions. Second: money and possessions, what you own and what you value. Third: siblings, neighbours, short trips, and everyday communication. Fourth: home, family, and your roots. Fifth: pleasure, romance, children, and creative work. Sixth: health, habits, and daily work.',
          'Seventh: partnership — marriage, business partners, and open opponents. Eighth: shared resources, debts, inheritance, and the deep end of intimacy. Ninth: travel, study, law, and belief. Tenth: career, reputation, and public standing. Eleventh: friends, groups, and hopes. Twelfth: rest, retreat, hospitals and monasteries, and everything done in private or in dreams.',
        ],
      },
      {
        heading: 'How to read a house without scaring yourself',
        paragraphs: [
          'Houses describe topics, not fortunes. A planet in the eighth house does not predict a crisis; it says shared money and deep trust are recurring themes that deserve care. Read every house the way you would read a weather map of a coastline you live on: the point is to dress appropriately, not to fear the sea.',
        ],
      },
    ],
  },
  {
    id: 'what-is-a-transit',
    title: 'What a transit is',
    standfirst:
      'Your birth chart never moves. The planets do. A transit is where the moving sky meets your fixed map — and it is the basis of every forecast.',
    minutes: 5,
    premium: true,
    sections: [
      {
        paragraphs: [
          'Your natal chart is fixed at your birth moment. The real planets, meanwhile, kept moving. A transit is the relationship between a planet in the sky now and a point in your birth chart. When astrologers say "Saturn is transiting your Moon," they mean Saturn in the sky today is standing at an exact angle to the Moon\'s position in your chart.',
          'Transits are timed by speed. The Moon transits everything monthly, which is why Moon transits describe days. The Sun takes a year. Saturn takes about two and a half years per sign, so a Saturn transit is a season of life, not a week.',
        ],
      },
      {
        heading: 'The angles: aspects',
        paragraphs: [
          'The main aspects are the conjunction (same place, blending), the sextile (60 degrees, an opening), the square (90 degrees, friction that demands action), the trine (120 degrees, flow and ease), and the opposition (180 degrees, two ends of a seesaw, usually experienced through other people). None of them is simply good or bad. A trine can make a bad habit comfortable; a square can be the making of a person.',
        ],
      },
      {
        heading: 'How to take a forecast honestly',
        paragraphs: [
          'A transit describes weather, not events. "The Moon squares your natal Saturn on Thursday" means Thursday may feel heavier, more duty-bound, more easily discouraged — it does not name what will happen, because that depends on your life, not the sky. The honest use of a forecast is preparation: knowing which days ask for patience and which ask for initiative, the way you would check a real forecast before a long drive.',
        ],
      },
    ],
  },
  {
    id: 'mercury-retrograde-honestly',
    title: 'Mercury retrograde, honestly explained',
    standfirst:
      'Three or four times a year, Mercury appears to move backwards. Here is what is actually happening, and what it is and is not reasonable to do about it.',
    minutes: 6,
    premium: true,
    sections: [
      {
        paragraphs: [
          'Mercury retrograde is an optical effect. Because Mercury orbits the Sun faster than Earth does, there are stretches — about three weeks at a time, three or four times a year — when it passes us on the inside track, and from our point of view it appears to move backwards against the stars. The planet never actually reverses. The astronomy is ordinary; it is the interpretation that needs care.',
          'Mercury in astrology covers communication, contracts, travel schedules, technology, and the everyday movement of information. The traditional advice for its retrograde periods follows from that symbolism: review rather than launch, re-read before signing, leave margin in travel plans, back up the files.',
        ],
      },
      {
        heading: 'What the evidence of your own life will show',
        paragraphs: [
          'You will notice that miscommunications and delays happen in every month of the year, including the nine months when Mercury is direct. Retrograde periods get blamed partly because they are announced in advance, which primes us to notice every glitch and file it under the headline. That is not a reason to dismiss the cycle; it is a reason to hold it at the right size.',
          'Used at the right size, Mercury retrograde is a useful rhythm: a standing appointment, four times a year, to review, repair, reconnect, and finish old business. Writers revise in it. Businesses reconcile accounts in it. Nothing about it requires fear, and no contract becomes safe or unsafe because of it alone.',
        ],
      },
      {
        heading: 'The practical version',
        paragraphs: [
          'If a signing can comfortably wait three weeks, waiting costs nothing. If it cannot wait, read the document twice and keep copies — which was good advice in every week of the year. ASTRONO-ME will always tell you the actual dates of a retrograde period when one is running, and will never use it to frighten you into anything.',
        ],
      },
    ],
  },
];

export function articleById(id: string): Article | undefined {
  return ARTICLES.find((a) => a.id === id);
}

/** Audio entries are part of Premium; in v1 they are listed, honestly, as coming. */
export interface AudioEntry {
  id: string;
  title: string;
  detail: string;
  status: 'coming-with-premium';
}

export const AUDIO_ENTRIES: AudioEntry[] = [
  {
    id: 'audio-week',
    title: 'Your Week, read aloud',
    detail: 'A short audio version of your weekly outlook, recorded in a calm reading voice.',
    status: 'coming-with-premium',
  },
  {
    id: 'audio-moon',
    title: 'Moon sign meditations',
    detail: 'Five-minute reflections for each Moon sign change, written to be listened to in the evening.',
    status: 'coming-with-premium',
  },
];
