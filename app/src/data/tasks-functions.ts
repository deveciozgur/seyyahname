// Tasks that complete the functional coverage at A1-A2: every skill has at least two
// Transactional, two Interactional and two Evaluative tasks per level, so both sub-bands
// (x.1 and x.2) can be reached with distinct tasks (CLAUDE.md, section 3).

export const FUNCTIONAL = {
  reading: {
    A1: [
      {
        id: 'r-a1-museum',
        fn: 'transactional',
        theme: 'Culture',
        hook: 'One night, free entry, and a robot that plays the piano.',
        title: 'Museum Night',
        text: `CITY MUSEUM: MUSEUM NIGHT
Friday 24 October, 6 p.m. to 11 p.m.

Entry is free on Museum Night! Visit our new games room on the second floor. See old computers and play classic games.

At 8 p.m., a robot plays the piano in the main hall.

The café is open until 10 p.m. Tickets for the robot show are not needed. No bags in the museum, please.`,
        questions: [
          { id: 1, type: 'short', q: 'What day is Museum Night?', accept: [['friday']] },
          { id: 2, type: 'mc', q: 'How much is entry?', options: ['5 euros', 'free', '10 euros'], answer: 1 },
          { id: 3, type: 'mc', q: 'Where is the games room?', options: ['on the first floor', 'on the second floor', 'in the café'], answer: 1 },
          { id: 4, type: 'short', q: 'What time does the robot play the piano?', accept: [['8', 'eight']] },
          { id: 5, type: 'yesno', q: 'Can you take your bag into the museum?', answer: 'no' },
        ],
        vocab: [
          { word: 'entry', cefr: 'A1', meaning: 'the right to go in', example: 'Entry is free on Museum Night.', alternative: 'admission (B2)' },
          { word: 'floor', cefr: 'A1', meaning: 'one level of a building', example: 'The games room is on the second floor.', alternative: 'level, storey' },
          { word: 'until', cefr: 'A1', meaning: 'up to a certain time', example: 'The café is open until 10 p.m.', alternative: 'through (AmE)' },
        ],
      },
      {
        id: 'r-a1-reviews',
        fn: 'evaluative',
        theme: 'Daily life',
        hook: 'Same burger, two very different opinions.',
        title: 'Two Reviews of Pixel Burger',
        text: `Pixel Burger is a new restaurant with a gaming theme. Two people wrote reviews.

Aylin: "I love Pixel Burger! The food is great and the music is from old video games. The staff are very friendly. It is a bit expensive, but I want to go again."

Tom: "The restaurant is beautiful, but my burger was cold. I waited for forty minutes. The music is very loud. I don't want to go again."`,
        questions: [
          { id: 1, type: 'mc', q: 'Who likes Pixel Burger?', options: ['Aylin', 'Tom', 'both'], answer: 0 },
          { id: 2, type: 'short', q: 'What was the problem with Tom\'s burger?', accept: [['cold']] },
          { id: 3, type: 'mc', q: 'What does Aylin say about the price?', options: ['It is cheap.', 'It is a bit expensive.', 'She does not say.'], answer: 1 },
          { id: 4, type: 'yesno', q: 'Does Tom want to go again?', answer: 'no' },
          { id: 5, type: 'mc', q: 'They both say the restaurant is…', options: ['quiet', 'nice to look at or fun', 'cheap'], answer: 1 },
        ],
        vocab: [
          { word: 'review', cefr: 'A1', meaning: 'an opinion about something you tried', example: 'Two people wrote reviews.', alternative: 'critique (B2)' },
          { word: 'friendly', cefr: 'A1', meaning: 'kind and pleasant to people', example: 'The staff are very friendly.', alternative: 'welcoming (B1)' },
          { word: 'loud', cefr: 'A1', meaning: 'making a lot of noise', example: 'The music is very loud.', alternative: 'deafening (B2)' },
        ],
      },
    ],
    A2: [
      {
        id: 'r-a2-hostel',
        fn: 'transactional',
        theme: 'Travel',
        hook: 'Read the rules before you check in, or pay for a towel.',
        title: 'Hostel House Rules',
        text: `Welcome to Blue Door Hostel!

Check-in is from 2 p.m. and check-out is before 11 a.m. If you arrive late, please call us so we can leave your key in the lockbox.

Breakfast is included and is served from 7 to 10 a.m. in the kitchen. Towels are not included; you can rent one at reception for 3 euros.

Please be quiet after 11 p.m. Guests can use the washing machine for free, but please bring your own soap.`,
        questions: [
          { id: 1, type: 'mc', q: 'When must guests leave on the last day?', options: ['before 11 a.m.', 'after 2 p.m.', 'before 10 a.m.'], answer: 0 },
          { id: 2, type: 'mc', q: 'What should you do if you arrive late?', options: ['Wait outside.', 'Call the hostel.', 'Send an email the next day.'], answer: 1 },
          { id: 3, type: 'short', q: 'How much does it cost to rent a towel?', accept: [['3', 'three']] },
          { id: 4, type: 'yesno', q: 'Is breakfast free for guests?', answer: 'yes' },
          { id: 5, type: 'short', q: 'What do you need to bring for the washing machine?', accept: [['soap']] },
        ],
        vocab: [
          { word: 'check out', cefr: 'A2', meaning: 'leave a hotel and pay', example: 'Check-out is before 11 a.m.', alternative: 'vacate the room (C1)' },
          { word: 'included', cefr: 'A2', meaning: 'part of the price', example: 'Breakfast is included.', alternative: 'complimentary (B2)' },
          { word: 'rent', cefr: 'A2', meaning: 'pay to use something for a while', example: 'You can rent a towel at reception.', alternative: 'hire (BrE)' },
        ],
      },
      {
        id: 'r-a2-phones',
        fn: 'evaluative',
        theme: 'Tech',
        hook: 'Two phones, one budget. Which one wins?',
        title: 'Which Phone for Selin?',
        text: `Selin needs a new phone and she is choosing between two models.

The Nova X is cheaper and lighter. Its battery lasts longer, about two days. But its camera is not very good at night.

The Pulse 9 is more expensive and a little heavier, but it has the best camera Selin has ever tried. Its screen is bigger too, which is nice for games.

Selin takes a lot of photos at concerts, so in the end she decides that the camera is more important than the price.`,
        questions: [
          { id: 1, type: 'mc', q: 'Which phone is cheaper?', options: ['the Nova X', 'the Pulse 9', 'They cost the same.'], answer: 0 },
          { id: 2, type: 'mc', q: 'What is the weak point of the Nova X?', options: ['the battery', 'the camera at night', 'the weight'], answer: 1 },
          { id: 3, type: 'short', q: 'How long does the Nova X battery last?', accept: [['two days', '2 days']] },
          { id: 4, type: 'mc', q: 'Which phone does Selin probably choose?', options: ['the Nova X', 'the Pulse 9', 'neither'], answer: 1 },
          { id: 5, type: 'mc', q: 'Why?', options: ['It is lighter.', 'Its camera matters most to her.', 'It is cheaper.'], answer: 1 },
        ],
        vocab: [
          { word: 'cheaper than', cefr: 'A2', meaning: 'costs less than', example: 'The Nova X is cheaper than the Pulse 9.', alternative: 'more affordable (B1)' },
          { word: 'last', cefr: 'A2', meaning: 'keep working for a period of time', example: 'The battery lasts about two days.', alternative: 'endure (C1)' },
          { word: 'in the end', cefr: 'A2', meaning: 'finally, after everything', example: 'In the end, she chooses the camera.', alternative: 'ultimately (B2)' },
        ],
      },
    ],
  },
  writing: {
    A1: [
      { id: 'w-a1-booking', fn: 'transactional', theme: 'Daily life', hook: 'Your friends are hungry. Get the table booked!', title: 'Book a Table', prompt: 'Write a short message to a restaurant. Book a table: say the day, the time, how many people, and ask one question.', hint: 'Include the day, the time and how many people, then ask one short question.', minWords: 25, maxWords: 50, register: 'neutral', hints: ['Hello, I want to book a table for …', 'on Saturday at …', 'Do you have …?'] },
      { id: 'w-a1-teacher', fn: 'transactional', theme: 'Daily life', hook: 'You are sick today. Tell your teacher in a few lines.', title: 'A Message to Your Teacher', prompt: 'You cannot come to your English class today. Write to your teacher. Say why, and ask about the homework.', hint: 'Say sorry, give the reason you can\'t come, then ask about the homework.', minWords: 25, maxWords: 50, register: 'neutral', hints: ['Dear …,', "I'm sorry, I can't come to class today because …", 'What is the homework?'] },
    ],
    A2: [
      { id: 'w-a2-return', fn: 'transactional', theme: 'Tech', hook: 'The headphones arrived. The wrong colour, and broken.', title: 'Return an Online Order', prompt: 'You bought headphones online, but they are the wrong colour and one side does not work. Write to the shop. Explain the problem and say what you want.', hint: 'Explain the two problems clearly, then say what you want: a refund or a new pair.', minWords: 50, maxWords: 90, register: 'neutral', hints: ['I ordered … on …', 'Unfortunately, …', 'Could you please …?'] },
      { id: 'w-a2-cities', fn: 'evaluative', theme: 'Travel', hook: 'A friend has one week. Help them pick a city.', title: 'Istanbul or Izmir?', prompt: 'A friend is visiting Turkey for one week. Compare two cities and say which one you think is better for them, and why.', hint: 'Compare the two cities with words like "bigger" and "cheaper", then give your pick.', minWords: 50, maxWords: 90, register: 'informal', hints: ['Istanbul is bigger than …', 'Izmir is more relaxing …', 'I think … is better for you because …'] },
    ],
  },
  listening: {
    A1: [
      {
        id: 'l-a1-classmate',
        fn: 'interactional',
        theme: 'Daily life',
        hook: 'First day in a new class. Who sits next to you?',
        title: 'New in Class',
        rate: 0.8,
        script: `Leo: Hi! Is this seat free?
Ayşe: Yes, sit down! I'm Ayşe. Are you [new]?
Leo: Yes, I'm Leo. I'm from [Brazil].
Ayşe: Cool! Do you live near the [school]?
Leo: Yes, I live with my [aunt]. And you?
Ayşe: I live in Kadıköy. I come by [ferry]!`,
        questions: [
          { id: 1, q: 'Where is Leo from?', options: ['Brazil', 'Spain', 'Italy'], answer: 0 },
          { id: 2, q: 'How does Ayşe come to school?', options: ['by bus', 'by ferry', 'on foot'], answer: 1 },
        ],
        vocab: [{ word: 'Is this seat free?', cefr: 'A1', meaning: 'asking if you can sit here', example: 'Hi! Is this seat free?', alternative: 'Is anyone sitting here? (A2)' }],
      },
      {
        id: 'l-a1-film',
        fn: 'evaluative',
        theme: 'Culture',
        hook: 'They saw the same film. Did they both like it?',
        title: 'After the Film',
        rate: 0.8,
        script: `Mia: So, did you like the film?
Can: Yes! I [loved] it. The music was great.
Mia: Really? I didn't like it. It was too [long].
Can: Too long? It was only two [hours]!
Mia: Ha! But the [actor] was very good.
Can: Yes, he was. Next time you choose the [film].`,
        questions: [
          { id: 1, q: 'Who liked the film?', options: ['Can', 'Mia', 'both'], answer: 0 },
          { id: 2, q: 'What did Mia like?', options: ['the music', 'the actor', 'the length'], answer: 1 },
        ],
        vocab: [{ word: 'too long', cefr: 'A1', meaning: 'longer than you want', example: 'The film was too long.', alternative: 'drawn out (B2)' }],
      },
      {
        id: 'l-a1-pizza',
        fn: 'evaluative',
        theme: 'Daily life',
        hook: 'Friday night, one pizza, two opinions.',
        title: 'Pizza Night',
        rate: 0.8,
        script: `Deniz: Let's order pizza! What do you [like]?
Ella: I like cheese pizza. I don't like [mushrooms].
Deniz: Oh, I love mushrooms! What about [chicken]?
Ella: Chicken is [good]. And no onions, please!
Deniz: OK. A big chicken pizza, half with [mushrooms].`,
        questions: [
          { id: 1, q: 'What does Ella not like?', options: ['cheese', 'mushrooms', 'chicken'], answer: 1 },
          { id: 2, q: 'What pizza do they order?', options: ['a small cheese pizza', 'a big chicken pizza, half with mushrooms', 'a vegetable pizza'], answer: 1 },
        ],
        vocab: [{ word: "I don't like …", cefr: 'A1', meaning: 'say something is not to your taste', example: "I don't like mushrooms.", alternative: "I'm not keen on … (B1)" }],
      },
    ],
    A2: [
      {
        id: 'l-a2-barcelona',
        fn: 'evaluative',
        theme: 'Travel',
        hook: 'Was the trip worth it? Listen to the verdict.',
        title: 'Back from Barcelona',
        rate: 0.9,
        script: `Selin: Welcome back! How was Barcelona?
Omar: Amazing, but very [busy]. There were tourists everywhere.
Selin: What was the best part?
Omar: The [food], definitely. It was much better than I expected.
Selin: And the worst?
Omar: The [hotel]. It was small and quite [noisy].
Selin: Would you go again?
Omar: Yes, but in [winter], when it's quieter.`,
        questions: [
          { id: 1, q: 'What was the best part for Omar?', options: ['the beach', 'the food', 'the hotel'], answer: 1 },
          { id: 2, q: 'When would he go again?', options: ['in summer', 'in winter', 'never'], answer: 1 },
        ],
        vocab: [{ word: 'better than I expected', cefr: 'A2', meaning: 'nicer than you thought', example: 'The food was much better than I expected.', alternative: 'exceeded my expectations (B2)' }],
      },
      {
        id: 'l-a2-gift',
        fn: 'evaluative',
        theme: 'Gaming',
        hook: 'A birthday, two ideas, one decision.',
        title: 'Choosing a Gift',
        rate: 0.9,
        script: `Kerem: What should we get Burak for his birthday?
Lisa: Maybe a new [controller]? His old one is broken.
Kerem: Good idea, but a board game is [cheaper].
Lisa: True, but he plays video games every [day].
Kerem: OK, you're right. A controller is more [useful].
Lisa: Let's buy a blue one. It's his favourite [colour].`,
        questions: [
          { id: 1, q: 'Why does Lisa want to buy a controller?', options: ['It is cheap.', 'His old one is broken.', 'He asked for it.'], answer: 1 },
          { id: 2, q: 'What do they decide?', options: ['a board game', 'a blue controller', 'a video game'], answer: 1 },
        ],
        vocab: [{ word: 'more useful', cefr: 'A2', meaning: 'helps you more', example: 'A controller is more useful.', alternative: 'more practical (B1)' }],
      },
    ],
  },
  speaking: {
    A1: [
      { id: 's-a1-order', fn: 'transactional', theme: 'Daily life', hook: 'You are at the counter. The barista is waiting.', title: 'At the Café', prompt: 'Order a drink and something to eat at a café. Say what size you want, ask the price, and say thank you.', hint: 'Say what you want and the size, ask the price, and finish with "thank you".', targetSec: 30, hints: ["Hi, can I have a …, please?", 'A small / big …', 'How much is it?'] },
      { id: 's-a1-ticket', fn: 'transactional', theme: 'Travel', hook: 'The train leaves in ten minutes. Get your ticket!', title: 'Buy a Train Ticket', prompt: 'You are at a train station. Buy a ticket: say where you want to go, one way or return, and ask the time of the next train.', hint: 'Say where you\'re going, choose single or return, then ask when the next train leaves.', targetSec: 30, hints: ['A ticket to …, please.', 'One way / return.', 'What time is the next train?'] },
      { id: 's-a1-food', fn: 'evaluative', theme: 'Daily life', hook: 'Your favourite food and the one you never eat.', title: 'Food I Love and Hate', prompt: 'Talk about food you love and food you do not like. Give a simple reason for each.', hint: 'Name a food you love and one you don\'t, and give a simple reason with "because".', targetSec: 30, hints: ['I love … because …', "I don't like …", "It's too …"] },
    ],
    A2: [
      { id: 's-a2-reschedule', fn: 'transactional', theme: 'Daily life', hook: 'Something came up. Move your appointment politely.', title: 'Change an Appointment', prompt: 'Call a hair salon or a doctor. You have an appointment on Tuesday but you cannot go. Explain, and ask for a new day and time.', hint: 'Apologize, explain why you can\'t come on Tuesday, then suggest a new day and time.', targetSec: 45, hints: ["Hello, I have an appointment on Tuesday at …", "I'm sorry, but I can't …", 'Is Thursday possible?'] },
      { id: 's-a2-filmbook', fn: 'evaluative', theme: 'Culture', hook: 'The book or the film: which one is better?', title: 'Film or Book?', prompt: 'Think of a story you know as a book and as a film (or a game). Which is better? Compare them and give two reasons.', hint: 'Pick a winner, then give two reasons: "The book is better because ...".', targetSec: 45, hints: ['In my opinion, the … is better because …', 'The film is more exciting than …', 'But the book …'] },
    ],
  },
};
