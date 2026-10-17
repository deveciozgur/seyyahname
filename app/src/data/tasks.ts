import { MORE } from './tasks-more';
import { TASK_META, THEMED } from './tasks-themes';
import { FUNCTIONAL } from './tasks-functions';

// Task bank, graded by CEFR level. Every task carries a few key words that are added to
// vocabulary.md when the learner completes it.
//
// Reading question types:
//   mc     - options[] + answer (index)
//   yesno  - answer: 'yes' | 'no'
//   short  - accept: [[...any of these], [...and any of these]] (normalised substring match)

export const READING = {
  A1: [
    {
      id: 'r-a1-ali',
      title: 'My Name Is Ali',
      text: `Hello! My name is Ali. I am 25 years old. I am from Turkey. I live in Istanbul with my sister. Her name is Elif.

I am a teacher. I work at a school. I like coffee and music. I don't like rain.

Every morning, I get up at 7 o'clock. I go to work by bus.`,
      questions: [
        { id: 1, type: 'short', q: 'How old is Ali?', tr: 'Ali kaç yaşında?', accept: [['25', 'twenty-five', 'twenty five']] },
        { id: 2, type: 'short', q: 'Where does Ali live?', tr: 'Ali nerede yaşıyor?', accept: [['istanbul']] },
        { id: 3, type: 'short', q: 'What is his job?', tr: 'Mesleği ne?', accept: [['teacher']] },
        { id: 4, type: 'yesno', q: 'Does Ali like rain?', tr: 'Ali yağmuru seviyor mu?', answer: 'no' },
        { id: 5, type: 'mc', q: 'How does Ali go to work?', tr: 'Ali işe nasıl gidiyor?', options: ['by car', 'by bus', 'by bike'], answer: 1 },
      ],
      vocab: [
        { word: 'get up', cefr: 'A1', meaning: 'kalkmak (yataktan)', example: 'I get up at 7 o\'clock.', alternative: 'rise (formal)' },
        { word: 'by bus', cefr: 'A1', meaning: 'otobüsle', example: 'I go to work by bus.', alternative: 'commute by bus' },
        { word: 'live with', cefr: 'A1', meaning: '…ile yaşamak', example: 'I live with my sister.', alternative: 'share a flat with' },
      ],
    },
    {
      id: 'r-a1-cafe',
      title: 'At the Café',
      text: `This is Sun Café. It is small, but it is very nice. It is next to the park.

The café opens at 8 a.m. and closes at 6 p.m. It is closed on Sunday.

A cup of tea is 2 euros. A coffee is 3 euros. The cakes are very good!`,
      questions: [
        { id: 1, type: 'mc', q: 'Where is the café?', tr: 'Kafe nerede?', options: ['next to the park', 'next to the school', 'in the station'], answer: 0 },
        { id: 2, type: 'short', q: 'What time does the café open?', tr: 'Kafe saat kaçta açılıyor?', accept: [['8', 'eight']] },
        { id: 3, type: 'yesno', q: 'Is the café open on Sunday?', tr: 'Kafe pazar günü açık mı?', answer: 'no' },
        { id: 4, type: 'short', q: 'How much is a coffee?', tr: 'Bir kahve ne kadar?', accept: [['3', 'three']] },
        { id: 5, type: 'mc', q: 'The café is…', tr: 'Kafe…', options: ['big', 'small', 'new'], answer: 1 },
      ],
      vocab: [
        { word: 'next to', cefr: 'A1', meaning: '…ın yanında', example: 'The café is next to the park.', alternative: 'adjacent to' },
        { word: 'closed', cefr: 'A1', meaning: 'kapalı', example: 'It is closed on Sunday.', alternative: 'shut' },
        { word: 'a cup of', cefr: 'A1', meaning: 'bir fincan', example: 'A cup of tea, please.', alternative: '' },
      ],
    },
  ],
  A2: [
    {
      id: 'r-a2-izmir',
      title: 'A Weekend in Izmir',
      text: `Last weekend, Deniz visited her grandparents in Izmir. She took the train on Friday evening because it was cheaper than the plane. The journey took about seven hours, so she read a book and listened to music.

On Saturday morning, they went to the market together. Her grandmother bought fresh fish and vegetables, and Deniz carried the bags. In the afternoon, it was very hot, so they stayed at home and watched an old film.

On Sunday, Deniz walked along the sea before she went back to Ankara. She was tired, but she felt happy. She wants to visit them again next month.`,
      questions: [
        { id: 1, type: 'mc', q: 'Why did Deniz take the train?', tr: 'Deniz neden treni seçti?', options: ['It was faster.', 'It was cheaper.', 'Her grandparents told her to.'], answer: 1 },
        { id: 2, type: 'short', q: 'How long was the journey?', tr: 'Yolculuk ne kadar sürdü?', accept: [['seven', '7']] },
        { id: 3, type: 'mc', q: 'What did they do on Saturday afternoon?', tr: 'Cumartesi öğleden sonra ne yaptılar?', options: ['They went to the beach.', 'They went to the market.', 'They watched a film at home.'], answer: 2 },
        { id: 4, type: 'yesno', q: 'Does Deniz live in Izmir?', tr: 'Deniz İzmir\'de mi yaşıyor?', answer: 'no' },
        { id: 5, type: 'short', q: 'When does she want to visit again?', tr: 'Tekrar ne zaman ziyaret etmek istiyor?', accept: [['next month']] },
      ],
      vocab: [
        { word: 'journey', cefr: 'A2', meaning: 'yolculuk', example: 'The journey took seven hours.', alternative: 'voyage (sea), trek (long, hard)' },
        { word: 'fresh', cefr: 'A2', meaning: 'taze', example: 'She bought fresh fish.', alternative: 'freshly caught' },
        { word: 'walk along', cefr: 'A2', meaning: 'boyunca yürümek', example: 'She walked along the sea.', alternative: 'stroll along' },
      ],
    },
  ],
  B1: [
    {
      id: 'r-b1-remote',
      title: 'Working from Home: Not for Everyone',
      text: `When Mert's company allowed staff to work from home three days a week, he was delighted. No more crowded metro, no more expensive lunches. For the first month, he felt more productive than ever.

However, things slowly changed. Without colleagues around him, Mert found it hard to separate work from free time. He started answering emails late at night and skipping his evening runs. He also missed the small conversations by the coffee machine, which, he realised, had often given him new ideas.

Now Mert goes to the office on the days he has meetings, and he works from a library on the others. "Home is for living," he says. "I need a different place to think about work."`,
      questions: [
        { id: 1, type: 'mc', q: 'How did Mert feel at first about working from home?', options: ['Worried', 'Very pleased', 'Bored'], answer: 1 },
        { id: 2, type: 'mc', q: 'What was the main problem later?', options: ['His internet was slow.', 'Work and free time mixed together.', 'His manager checked on him too much.'], answer: 1 },
        { id: 3, type: 'mc', q: 'Why did Mert miss the conversations by the coffee machine?', options: ['They helped him have ideas.', 'He liked the coffee.', 'They were about his salary.'], answer: 0 },
        { id: 4, type: 'short', q: 'Where does Mert work on days without meetings?', accept: [['library']] },
        { id: 5, type: 'mc', q: 'What does "Home is for living" suggest?', options: ['He wants a bigger home.', 'He prefers to keep work out of his home.', 'He wants to stop working.'], answer: 1 },
      ],
      vocab: [
        { word: 'productive', cefr: 'B1', meaning: 'verimli', example: 'I feel more productive in the morning.', alternative: 'efficient, prolific (C1)' },
        { word: 'separate … from …', cefr: 'B1', meaning: '…ı …dan ayırmak', example: 'It is hard to separate work from free time.', alternative: 'draw a line between' },
        { word: 'realise', cefr: 'B1', meaning: 'farkına varmak', example: 'He realised the chats gave him ideas.', alternative: 'come to the realisation that (C1)' },
      ],
    },
  ],
  B2: [
    {
      id: 'r-b2-phones',
      title: 'Why We Keep Our Phones Face Down',
      text: `In many cafés today, you will notice a small but telling ritual: people placing their phones face down on the table. On the surface, it looks like politeness, a signal that the person in front of them matters more than their notifications. Yet researchers suggest the gesture reveals something less flattering. We turn the screen away not because we have stopped caring about it, but because we know we cannot resist it.

Studies have found that the mere presence of a smartphone, even when silent, can reduce a person's working memory and make conversations feel shallower. Participants rarely noticed the effect themselves; they simply reported that the discussion had been "fine" but somehow less meaningful.

None of this means that technology is the enemy. The problem, critics argue, lies in design choices that reward constant checking. Until those incentives change, the face-down phone will remain what it is: not a sign of self-control, but a quiet admission that we lack it.`,
      questions: [
        { id: 1, type: 'mc', q: 'According to the text, why do people really put their phones face down?', options: ['To be polite to others', 'Because they know they cannot resist checking them', 'To save battery', 'Because notifications are silent'], answer: 1 },
        { id: 2, type: 'mc', q: 'What does "telling" mean in "a small but telling ritual"?', options: ['spoken aloud', 'revealing something important', 'very common', 'slightly rude'], answer: 1 },
        { id: 3, type: 'mc', q: 'What can we infer from participants saying the talk was "fine" but "less meaningful"?', options: ['The phones had no effect.', 'The effect is real but hard to notice.', 'The participants were lying.', 'The conversations were too short.'], answer: 1 },
        { id: 4, type: 'mc', q: 'Where does the author locate the main problem?', options: ['In users\' lack of education', 'In design that rewards constant checking', 'In technology itself', 'In café culture'], answer: 1 },
        { id: 5, type: 'mc', q: 'The author\'s attitude is best described as…', options: ['bitter', 'measured and critical', 'enthusiastic', 'purely neutral'], answer: 1 },
      ],
      vocab: [
        { word: 'telling', cefr: 'B2', meaning: 'çok şey anlatan, manidar', example: 'It was a telling silence.', alternative: 'revealing, indicative (C1)' },
        { word: 'mere', cefr: 'B2', meaning: 'sadece, salt', example: 'The mere presence of a phone distracts us.', alternative: 'the very' },
        { word: 'admission', cefr: 'B2', meaning: 'itiraf', example: 'It is an admission of weakness.', alternative: 'concession, acknowledgement (C1)' },
      ],
    },
  ],
};

export const WRITING = {
  A1: [
    { id: 'w-a1-me', title: 'About Me', prompt: 'Introduce yourself. Write your name, age, city, job, and two things you like.', tr: 'Kendini tanıt: adın, yaşın, şehrin, işin ve sevdiğin iki şey.', minWords: 30, maxWords: 60, register: 'neutral', hints: ['My name is …', 'I am … years old.', 'I live in …', 'I like … and …'] },
    { id: 'w-a1-day', title: 'My Day', prompt: 'Write about a normal day. What time do you get up? What do you eat? What do you do in the evening?', tr: 'Normal bir gününü anlat.', minWords: 30, maxWords: 60, register: 'neutral', hints: ['I get up at …', 'For breakfast I eat …', 'In the evening I …'] },
  ],
  A2: [
    { id: 'w-a2-weekend', title: 'Last Weekend', prompt: 'Write a message to a friend about your last weekend. Where did you go? What did you do? Did you enjoy it?', tr: 'Bir arkadaşına geçen hafta sonunu anlatan bir mesaj yaz.', minWords: 50, maxWords: 90, register: 'informal', hints: ['Hi …!', 'On Saturday I went …', 'It was …', 'See you soon!'] },
  ],
  B1: [
    { id: 'w-b1-decision', title: 'An Important Decision', prompt: 'Write an email to a friend about an important decision you made (a job, a move, a course). Explain what would have happened if you had chosen differently, and whether you are glad about your choice.', minWords: 80, maxWords: 130, register: 'informal', hints: ['If I hadn\'t …, I would have …', 'Looking back, …'] },
  ],
  B2: [
    { id: 'w-b2-email', title: 'Formal Complaint', prompt: 'You ordered a laptop online. It arrived two weeks late and damaged. Write a formal email to the company: describe the problem, explain how it affected you, and say what you expect them to do.', minWords: 150, maxWords: 220, register: 'formal', hints: ['I am writing to complain about …', 'Not only … but also …', 'I would appreciate it if …'] },
  ],
};

// Listening: words in [brackets] become gaps. Lines are "Speaker: text".
export const LISTENING = {
  A1: [
    {
      id: 'l-a1-hotel',
      title: 'At the Hotel',
      rate: 0.8,
      script: `Receptionist: Good [evening]. Can I help you?
Guest: Yes, I have a room for two [nights]. My name is Sara Kaya.
Receptionist: Thank you. Your room is number [twelve]. It's on the first floor.
Guest: What time is [breakfast]?
Receptionist: From seven to ten. The restaurant is next to the [lift].`,
      questions: [
        { id: 1, q: 'How many nights does Sara stay?', options: ['one', 'two', 'three'], answer: 1 },
        { id: 2, q: 'Where is the restaurant?', options: ['next to the lift', 'on the second floor', 'next to the door'], answer: 0 },
      ],
      vocab: [
        { word: 'floor', cefr: 'A1', meaning: 'kat', example: 'My room is on the first floor.', alternative: 'storey' },
        { word: 'lift', cefr: 'A1', meaning: 'asansör (BrE)', example: 'The restaurant is next to the lift.', alternative: 'elevator (AmE)' },
      ],
    },
  ],
  A2: [
    {
      id: 'l-a2-plans',
      title: 'Weekend Plans',
      rate: 0.9,
      script: `Emre: Are you doing anything on [Saturday]?
Lisa: Not really. Why?
Emre: There's a [concert] in the park. Do you want to come?
Lisa: Sounds great! What time does it [start]?
Emre: At six. We can [meet] at the bus stop at half past five.
Lisa: Perfect. I'll bring some [sandwiches].`,
      questions: [
        { id: 1, q: 'What time does the concert start?', options: ['5:30', '6:00', '6:30'], answer: 1 },
        { id: 2, q: 'Where will they meet?', options: ['in the park', 'at the bus stop', 'at Lisa\'s house'], answer: 1 },
      ],
      vocab: [{ word: 'half past five', cefr: 'A2', meaning: 'beş buçuk', example: 'Let\'s meet at half past five.', alternative: '' }],
    },
  ],
  B1: [
    {
      id: 'l-b1-flat',
      title: 'Viewing a Flat',
      rate: 1,
      script: `Agent: So, this is the living room. As you can see, it gets a lot of [sunlight] in the afternoon.
Can: It's lovely. How much is the [rent] per month?
Agent: It's nine hundred, but that [includes] water and heating.
Can: That's not bad. Is it far from the [station]?
Agent: About ten minutes on foot. The only [downside] is the noise from the street on Friday nights.`,
      questions: [
        { id: 1, q: 'What is included in the rent?', options: ['electricity and internet', 'water and heating', 'nothing'], answer: 1 },
        { id: 2, q: 'What is the disadvantage of the flat?', options: ['It is far from the station.', 'It is dark.', 'It can be noisy at weekends.'], answer: 2 },
      ],
      vocab: [{ word: 'downside', cefr: 'B1', meaning: 'dezavantaj', example: 'The only downside is the noise.', alternative: 'drawback (B2)' }],
    },
  ],
  B2: [
    {
      id: 'l-b2-meeting',
      title: 'Project Update',
      rate: 1.05,
      script: `Manager: Right, let's get [started]. Where are we with the launch?
Aylin: We're slightly behind [schedule], to be honest. The testing phase took longer than we'd [anticipated].
Manager: How far behind are we talking?
Aylin: About a week. But if we bring in two more testers, we should be able to [catch up].
Manager: Okay, let's [go ahead] with that, provided it doesn't blow the budget.`,
      questions: [
        { id: 1, q: 'Why is the project late?', options: ['The budget was cut.', 'Testing took longer than expected.', 'Two testers left.'], answer: 1 },
        { id: 2, q: 'What condition does the manager set?', options: ['It must not exceed the budget.', 'It must be done in two days.', 'Aylin must test it herself.'], answer: 0 },
      ],
      vocab: [{ word: 'catch up', cefr: 'B2', meaning: 'arayı kapatmak, yetişmek', example: 'We can catch up next week.', alternative: 'make up lost ground (C1)' }],
    },
  ],
};

export const SPEAKING = {
  A1: [
    { id: 's-a1-family', title: 'My Family', prompt: 'Talk about your family. Who are they? How old are they? What do they do?', tr: 'Aileni anlat: kimler, kaç yaşındalar, ne iş yapıyorlar?', targetSec: 30, hints: ['I have …', 'My mother is …', 'She works …'] },
    { id: 's-a1-room', title: 'My Room', prompt: 'Describe the room you are in now. What is in it? Where are the things? (Use: in, on, under, next to)', tr: 'Şu an bulunduğun odayı anlat. Neler var, nerede duruyorlar?', targetSec: 30, hints: ['There is a … next to the …', 'The lamp is on the table.'] },
  ],
  A2: [{ id: 's-a2-holiday', title: 'A Holiday', prompt: 'Talk about your last holiday. Where did you go, who did you go with, and what did you do?', tr: 'Son tatilini anlat.', targetSec: 45, hints: ['Last summer I went to …', 'We stayed …', 'The best part was …'] }],
  B1: [{ id: 's-b1-change', title: 'Something I Would Change', prompt: 'If you could change one thing about your city, what would it be and why? Give an example.', targetSec: 60, hints: ['If I could …, I would …', 'For example, …', 'That\'s why …'] }],
  B2: [{ id: 's-b2-debate', title: 'Quick Debate', prompt: 'Some people say remote work is better for everyone. Do you agree? Give arguments for both sides, then your opinion.', targetSec: 90, hints: ['On the one hand, …', 'Having said that, …', 'All things considered, …'] }],
};

export const BANKS = { reading: READING, writing: WRITING, listening: LISTENING, speaking: SPEAKING };
for (const extraBank of [MORE, THEMED, FUNCTIONAL] as Record<string, Record<string, any[]>>[]) {
  for (const [skill, levels] of Object.entries(extraBank)) {
    for (const [level, extra] of Object.entries(levels)) BANKS[skill][level] = [...(BANKS[skill][level] ?? []), ...extra];
  }
}
for (const levels of Object.values(BANKS)) {
  for (const list of Object.values(levels)) for (const t of list) Object.assign(t, { ...TASK_META[t.id], ...t, theme: t.theme ?? TASK_META[t.id]?.theme ?? 'Daily life' });
}

/** Closest available level at or below `level`, so C1/C2 learners still get the hardest tasks. */
export function tasksFor(skill, level, interests = []) {
  const bank = BANKS[skill];
  const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  // Tasks in the learner's favourite themes come first.
  const rank = (t) => (interests.includes(t.theme) ? interests.indexOf(t.theme) : interests.length);
  const sorted = (list) => [...list].sort((a, b) => rank(a) - rank(b));
  for (let i = order.indexOf(level); i >= 0; i--) if (bank[order[i]]) return { level: order[i], tasks: sorted(bank[order[i]]) };
  return { level: 'A1', tasks: sorted(bank.A1) };
}
