// Interest-led framing (CLAUDE.md, "Real-life & interest-led scenarios"):
// every task gets a theme and, for A1-A2, a one-line hook that makes you want to read on.

export const THEMES = ['Gaming', 'Travel', 'Tech', 'Culture', 'Daily life'];

export const TASK_META = {
  // reading
  'r-a1-ali': { fn: 'interactional', theme: 'Daily life', hook: 'Meet Ali: teacher, coffee lover, and no fan of rain.' },
  'r-a1-cafe': { fn: 'transactional', theme: 'Daily life', hook: 'The best cake in town costs less than you think.' },
  'r-a1-flat': { fn: 'interactional', theme: 'Daily life', hook: 'A tiny flat, a sleepy cat, and a lot of stairs.' },
  'r-a2-izmir': { fn: 'interactional', theme: 'Travel', hook: 'Seven hours on a train, and the best part is the sea.' },
  'r-a2-message': { fn: 'transactional', theme: 'Daily life', hook: 'You are invited. Read the message before Thursday!' },
  'r-a2-phone': { fn: 'interactional', theme: 'Daily life', hook: 'He lost everything on one bus ride. Then someone knocked.' },
  'r-b1-remote': { fn: 'interactional', theme: 'Tech' },
  'r-b1-language': { fn: 'interactional', theme: 'Culture' },
  'r-b1-fourday': { fn: 'evaluative', theme: 'Tech' },
  'r-b2-phones': { fn: 'evaluative', theme: 'Tech' },
  'r-b2-boredom': { fn: 'evaluative', theme: 'Culture' },
  'r-b2-forests': { fn: 'evaluative', theme: 'Culture' },
  // writing
  'w-a1-me': { fn: 'interactional', theme: 'Daily life', hook: 'Imagine your new teammate asks: so, who are you?' },
  'w-a1-day': { fn: 'interactional', theme: 'Daily life', hook: 'A day in your life, in five simple sentences.' },
  'w-a1-place': { fn: 'evaluative', theme: 'Travel', hook: 'A friend is visiting. Where do you take them first?' },
  'w-a2-weekend': { fn: 'interactional', theme: 'Daily life', hook: 'Your friend wants the story of your weekend.' },
  'w-a2-note': { fn: 'transactional', theme: 'Daily life', hook: 'Your plants are counting on you. Write the note!' },
  'w-a2-summer': { fn: 'interactional', theme: 'Travel', hook: 'Close your eyes: where are you next August?' },
  'w-b1-decision': { fn: 'interactional', theme: 'Daily life' },
  'w-b1-review': { fn: 'evaluative', theme: 'Culture' },
  'w-b1-advice': { fn: 'interactional', theme: 'Daily life' },
  'w-b2-email': { fn: 'transactional', theme: 'Tech' },
  'w-b2-essay': { fn: 'evaluative', theme: 'Tech' },
  'w-b2-proposal': { fn: 'transactional', theme: 'Tech' },
  // listening
  'l-a1-hotel': { fn: 'transactional', theme: 'Travel', hook: 'You just arrived. What time is breakfast?' },
  'l-a1-cafe': { fn: 'transactional', theme: 'Daily life', hook: 'Order like a local, then check the bill.' },
  'l-a1-neighbour': { fn: 'interactional', theme: 'Daily life', hook: 'A new neighbour knocks. Catch the details.' },
  'l-a2-plans': { fn: 'interactional', theme: 'Culture', hook: 'A free concert in the park. Are you in?' },
  'l-a2-directions': { fn: 'transactional', theme: 'Travel', hook: 'Lost in a new city? Listen for left and right.' },
  'l-a2-weekend': { fn: 'interactional', theme: 'Travel', hook: 'Camping, a lake, and very cold water.' },
  'l-b1-flat': { fn: 'transactional', theme: 'Daily life' },
  'l-b1-doctor': { fn: 'transactional', theme: 'Daily life' },
  'l-b1-train': { fn: 'transactional', theme: 'Travel' },
  'l-b2-meeting': { fn: 'transactional', theme: 'Tech' },
  'l-b2-sleep': { fn: 'evaluative', theme: 'Culture' },
  'l-b2-deadline': { fn: 'transactional', theme: 'Tech' },
  // speaking
  's-a1-family': { fn: 'interactional', theme: 'Daily life', hook: 'Introduce your family like a cast list.' },
  's-a1-room': { fn: 'interactional', theme: 'Daily life', hook: 'Give a 30-second tour of the room you are in.' },
  's-a1-day': { fn: 'interactional', theme: 'Daily life', hook: 'From alarm clock to bedtime in 30 seconds.' },
  's-a2-holiday': { fn: 'interactional', theme: 'Travel', hook: 'Your best holiday story, told to a friend.' },
  's-a2-directions': { fn: 'transactional', theme: 'Travel', hook: 'Be the local guide: get someone to your favourite café.' },
  's-a2-friend': { fn: 'evaluative', theme: 'Daily life', hook: 'Describe your best friend so well we could find them.' },
  's-b1-change': { fn: 'evaluative', theme: 'Culture' },
  's-b1-challenge': { fn: 'interactional', theme: 'Daily life' },
  's-b1-visitors': { fn: 'transactional', theme: 'Travel' },
  's-b2-debate': { fn: 'evaluative', theme: 'Tech' },
  's-b2-career': { fn: 'evaluative', theme: 'Daily life' },
  's-b2-tech': { fn: 'evaluative', theme: 'Tech' },
};

export const THEMED = {
  reading: {
    A1: [
      {
        id: 'r-a1-gamejam', fn: 'evaluative',
        title: 'The Game Jam',
        theme: 'Gaming',
        hook: '48 hours, three friends, one game. Can they finish it?',
        text: `It is Friday evening. Deniz, Can and Mia are at a game jam. They have 48 hours to make a new game.

Deniz is the artist. She draws a small blue robot. Can writes the code, and Mia makes the music. The game is about a robot who is lost in a big city.

On Sunday afternoon, the game is ready. It is short, but it is fun. People play it and they love the robot. Deniz is very tired, but she is very happy.`,
        questions: [
          { id: 1, type: 'mc', q: 'How long is the game jam?', options: ['24 hours', '48 hours', 'one week'], answer: 1 },
          { id: 2, type: 'short', q: 'What does Deniz draw?', accept: [['robot']] },
          { id: 3, type: 'short', q: 'Who makes the music?', accept: [['mia']] },
          { id: 4, type: 'yesno', q: 'Is the game long?', answer: 'no' },
          { id: 5, type: 'mc', q: 'How does Deniz feel on Sunday?', options: ['tired but happy', 'angry', 'bored'], answer: 0 },
        ],
        vocab: [
          { word: 'draw', cefr: 'A1', meaning: 'make a picture with a pen', example: 'She draws a small blue robot.', alternative: 'sketch, illustrate (B2)' },
          { word: 'lost', cefr: 'A1', meaning: 'not knowing where you are', example: 'The robot is lost in a big city.', alternative: 'stranded (B2)' },
          { word: 'ready', cefr: 'A1', meaning: 'finished and prepared', example: 'On Sunday, the game is ready.', alternative: 'complete, polished (B1)' },
        ],
      },
    ],
    A2: [
      {
        id: 'r-a2-indie', fn: 'evaluative',
        title: 'The Little Game That Could',
        theme: 'Gaming',
        hook: 'Made in a bedroom, played by a million people.',
        text: `Two years ago, Elif started making a game in her bedroom after work. She didn't have a big team or much money, only a laptop and an idea: a cozy game about running a tea shop on a tiny island.

At first, only her friends played it. Then a famous streamer found the demo and played it live for three hours. The next morning, Elif had five thousand new messages. Many players asked when the full game was coming out.

Last month, the game finally launched. It sold more copies in one week than Elif expected in a year. "I still make my own tea every morning," she laughed, "but now I answer a lot more emails."`,
        questions: [
          { id: 1, type: 'mc', q: 'Where did Elif start making the game?', options: ['in an office', 'in her bedroom', 'in a café'], answer: 1 },
          { id: 2, type: 'short', q: 'What is the game about?', accept: [['tea']] },
          { id: 3, type: 'mc', q: 'What changed everything?', options: ['A famous streamer played the demo.', 'She won a prize.', 'A big company bought it.'], answer: 0 },
          { id: 4, type: 'yesno', q: 'Did the game sell less than she expected?', answer: 'no' },
          { id: 5, type: 'mc', q: 'What does the last sentence suggest?', options: ['She is now very busy.', 'She stopped drinking tea.', 'She wants to stop making games.'], answer: 0 },
        ],
        vocab: [
          { word: 'launch', cefr: 'A2', meaning: 'release something new to the public', example: 'Last month, the game finally launched.', alternative: 'release, roll out (B2)' },
          { word: 'expect', cefr: 'A2', meaning: 'think something will happen', example: 'It sold more than she expected.', alternative: 'anticipate (B2)' },
          { word: 'at first', cefr: 'A2', meaning: 'in the beginning', example: 'At first, only her friends played it.', alternative: 'initially (B1)' },
        ],
      },
    ],
  },
  listening: {
    A1: [
      {
        id: 'l-a1-gameshop', fn: 'transactional',
        title: 'At the Game Shop',
        theme: 'Gaming',
        hook: 'A new game, a small budget. What does she buy?',
        rate: 0.8,
        script: `Seller: Hi! Can I help you?
Zeynep: Yes, I want a new [game] for my brother.
Seller: How old is he?
Zeynep: He is [ten]. He likes football and [cars].
Seller: This racing game is very popular. It is [thirty] euros.
Zeynep: Great, I'll take it. Can I pay by [card]?`,
        questions: [
          { id: 1, q: 'Who is the game for?', options: ['her sister', 'her brother', 'her friend'], answer: 1 },
          { id: 2, q: 'What kind of game does she buy?', options: ['a racing game', 'a puzzle game', 'a football game'], answer: 0 },
        ],
        vocab: [{ word: 'pay by card', cefr: 'A1', meaning: 'pay with a bank card', example: 'Can I pay by card?', alternative: 'pay contactless (B1)' }],
      },
    ],
    A2: [
      {
        id: 'l-a2-tokyo', fn: 'transactional',
        title: 'Planning a Trip to Tokyo',
        theme: 'Travel',
        hook: 'Two friends, ten days, one very long list.',
        rate: 0.9,
        script: `Kaan: I've booked the [flights]! We leave on the fifth of April.
Lena: Amazing! How long are we going to stay?
Kaan: Ten [days]. I found a small hotel near a [station].
Lena: Perfect. I really want to visit the game [museum].
Kaan: Me too. And we're going to eat [sushi] every day!
Lena: Ha! Let's buy a train [pass] before we go.`,
        questions: [
          { id: 1, q: 'When do they leave?', options: ['on the fifth of April', 'on the fifteenth of April', 'in May'], answer: 0 },
          { id: 2, q: 'What do they want to buy before the trip?', options: ['a guidebook', 'a train pass', 'new bags'], answer: 1 },
        ],
        vocab: [{ word: 'book (a flight)', cefr: 'A2', meaning: 'reserve a seat in advance', example: "I've booked the flights!", alternative: 'reserve (B1)' }],
      },
    ],
  },
  writing: {
    A1: [{ id: 'w-a1-game', fn: 'evaluative', title: 'My Favourite Game', theme: 'Gaming', hook: 'Sell us your favourite game in a few sentences.', prompt: 'Write about your favourite game (video game, board game or sport). What is it? Who do you play with? Why do you like it?', hint: 'Say the name of the game, who you play with and one reason you love it.', minWords: 30, maxWords: 60, register: 'neutral', hints: ['My favourite game is …', 'I play it with …', 'I like it because …'] }],
    A2: [{ id: 'w-a2-gadget', fn: 'evaluative', title: 'A Gadget I Love', theme: 'Tech', hook: 'The one device you would save from a fire.', prompt: 'Write about a gadget you use every day. When did you get it? What do you use it for? Is it better than your old one?', hint: 'Say when you got it and what you use it for, then compare it with your old one.', minWords: 50, maxWords: 90, register: 'informal', hints: ['I got my … last year.', 'I use it to …', "It's faster than …"] }],
  },
  speaking: {
    A1: [{ id: 's-a1-game', fn: 'evaluative', title: "Let's Talk Games", theme: 'Gaming', hook: 'Pitch a game you love, in 30 seconds.', prompt: 'Talk about a game you like. What is it called? What do you do in the game? Who do you play with?', hint: 'Say the game\'s name, what you do in it and who you play with.', targetSec: 30, hints: ['My favourite game is …', 'In the game, you …', 'I play with …'] }],
    A2: [{ id: 's-a2-trip', fn: 'interactional', title: 'Dream Trip', theme: 'Travel', hook: 'Money is no problem. Where are you going?', prompt: 'Describe a dream trip. Where are you going to go? Who with? What are you going to see and eat?', hint: 'Use "I\'m going to ..." to say where you go, who comes with you and what you do.', targetSec: 45, hints: ["I'm going to go to …", "We're going to visit …", 'I really want to try …'] }],
  },
};
