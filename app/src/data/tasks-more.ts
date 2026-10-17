// Extra tasks so every skill has at least three distinct tasks per level (A1-B2),
// which the promotion rule needs: 80%+ in 3 distinct contexts before moving up.
// Same shapes as tasks.js.

export const MORE = {
  reading: {
    A1: [
      {
        id: 'r-a1-flat',
        title: 'My New Flat',
        text: `I have a new flat. It is small, but I love it. There is one bedroom and there is a big window in the living room.

The kitchen is next to the living room. There is a table in the kitchen and there are two chairs. My cat sleeps under the table.

The flat is on the third floor. There is no lift, so I walk up the stairs every day.`,
        questions: [
          { id: 1, type: 'mc', q: 'How many bedrooms are there?', options: ['one', 'two', 'three'], answer: 0 },
          { id: 2, type: 'short', q: 'Where is the kitchen?', accept: [['next to', 'near'], ['living room']] },
          { id: 3, type: 'short', q: 'Where does the cat sleep?', accept: [['under'], ['table']] },
          { id: 4, type: 'yesno', q: 'Is there a lift?', answer: 'no' },
          { id: 5, type: 'mc', q: 'The flat is on the…', options: ['first floor', 'second floor', 'third floor'], answer: 2 },
        ],
        vocab: [
          { word: 'there is / there are', cefr: 'A1', meaning: 'something exists (one / many)', example: 'There are two chairs in the kitchen.', alternative: 'contains, features (B2)' },
          { word: 'under', cefr: 'A1', meaning: 'below something', example: 'My cat sleeps under the table.', alternative: 'beneath (B2)' },
          { word: 'stairs', cefr: 'A1', meaning: 'steps between floors', example: 'I walk up the stairs every day.', alternative: 'staircase' },
        ],
      },
    ],
    A2: [
      {
        id: 'r-a2-message',
        title: 'A Message from Selin',
        text: `Hi Emre,

I'm going to have a small party on Saturday evening because it's my birthday. A few friends from work are going to come, and my sister is going to make a cake. We're going to eat at my flat and then maybe go dancing.

The party starts at 7 p.m. Can you bring some drinks? You don't need to buy a present, really! Please tell me by Thursday if you can come.

See you soon,
Selin`,
        questions: [
          { id: 1, type: 'mc', q: 'Why is Selin having a party?', options: ['She has a new job.', 'It is her birthday.', 'Her sister is visiting.'], answer: 1 },
          { id: 2, type: 'short', q: 'Who is going to make the cake?', accept: [['sister']] },
          { id: 3, type: 'short', q: 'What does Selin ask Emre to bring?', accept: [['drink']] },
          { id: 4, type: 'yesno', q: 'Does Emre need to buy a present?', answer: 'no' },
          { id: 5, type: 'mc', q: 'When should Emre reply?', options: ['by Thursday', 'on Saturday', 'at 7 p.m.'], answer: 0 },
        ],
        vocab: [
          { word: 'be going to', cefr: 'A2', meaning: 'talk about a future plan', example: "I'm going to have a party on Saturday.", alternative: 'intend to, plan to (B1)' },
          { word: 'bring', cefr: 'A2', meaning: 'take something with you somewhere', example: 'Can you bring some drinks?', alternative: 'contribute (B2)' },
          { word: 'by Thursday', cefr: 'A2', meaning: 'no later than Thursday', example: 'Please tell me by Thursday.', alternative: 'no later than Thursday (B2)' },
        ],
      },
      {
        id: 'r-a2-phone',
        title: 'The Lost Phone',
        text: `Last Tuesday, Kerem took the bus to work as usual. He listened to music and looked out of the window. When he got off the bus, he put his hand in his pocket, but his phone wasn't there.

He felt terrible. All his photos and work messages were on that phone. He called the bus company from a colleague's phone, but they didn't have it.

In the evening, a woman knocked on his door. She was holding his phone! She found it on the bus seat and saw his address on an old message. Kerem thanked her and gave her a box of chocolates.`,
        questions: [
          { id: 1, type: 'mc', q: 'Where did Kerem lose his phone?', options: ['at work', 'on the bus', 'at home'], answer: 1 },
          { id: 2, type: 'mc', q: 'How did Kerem feel?', options: ['terrible', 'happy', 'bored'], answer: 0 },
          { id: 3, type: 'short', q: 'Whose phone did he use to call the bus company?', accept: [['colleague']] },
          { id: 4, type: 'mc', q: 'How did the woman know his address?', options: ['The bus company told her.', 'She saw it in an old message.', 'Kerem called her.'], answer: 1 },
          { id: 5, type: 'short', q: 'What did Kerem give the woman?', accept: [['chocolate']] },
        ],
        vocab: [
          { word: 'get off (the bus)', cefr: 'A2', meaning: 'leave a bus, train or plane', example: 'When he got off the bus, his phone was gone.', alternative: 'alight from (C1, formal)' },
          { word: 'knock on the door', cefr: 'A2', meaning: 'hit a door gently to be let in', example: 'A woman knocked on his door.', alternative: 'rap on the door (C1)' },
          { word: 'as usual', cefr: 'A2', meaning: 'the same as always', example: 'He took the bus to work as usual.', alternative: 'as is customary (C1)' },
        ],
      },
    ],
    B1: [
      {
        id: 'r-b1-language',
        title: 'Learning a Language at Forty',
        text: `When Aylin turned forty, she decided to learn Spanish. Her friends thought it was a strange idea. "Isn't it too late?" they asked. Two years later, she has visited Mexico twice and can hold a real conversation.

Aylin believes that adults have some advantages over children. "I know why I'm learning, so I stay motivated," she explains. "I also understand grammar rules more quickly." However, she admits that pronunciation has been harder. Some sounds still feel strange in her mouth.

Her advice is simple: practise a little every day rather than a lot once a week, and don't be afraid of making mistakes. "Mistakes are just proof that you are trying," she says.`,
        questions: [
          { id: 1, type: 'mc', q: 'How did Aylin\'s friends react to her plan?', options: ['They wanted to join her.', 'They thought it was strange.', 'They offered to teach her.'], answer: 1 },
          { id: 2, type: 'mc', q: 'What has been the most difficult part for her?', options: ['Grammar', 'Motivation', 'Pronunciation'], answer: 2 },
          { id: 3, type: 'short', q: 'Which country has she visited twice?', accept: [['mexico']] },
          { id: 4, type: 'mc', q: 'What does "admits" suggest in "she admits that pronunciation has been harder"?', options: ['She is proud of it.', 'She accepts something negative is true.', 'She is not sure.'], answer: 1 },
          { id: 5, type: 'mc', q: 'What is her main advice?', options: ['Study a lot once a week.', 'Avoid mistakes at all costs.', 'Practise a little every day.'], answer: 2 },
        ],
        vocab: [
          { word: 'hold a conversation', cefr: 'B1', meaning: 'keep a conversation going', example: 'She can hold a real conversation in Spanish.', alternative: 'converse fluently (C1)' },
          { word: 'advantage', cefr: 'B1', meaning: 'something that helps you', example: 'Adults have some advantages over children.', alternative: 'edge (B2)' },
          { word: 'admit', cefr: 'B1', meaning: 'agree that something is true', example: 'She admits that pronunciation is hard.', alternative: 'concede (C1)' },
        ],
      },
      {
        id: 'r-b1-fourday',
        title: 'The Four-Day Week',
        text: `Last year, a software company in Izmir tried something new: staff worked four days a week for the same salary. The experiment was watched closely by other businesses in the city.

The results were surprising. Productivity did not fall; in fact, more projects were finished on time. Employees reported less stress, and fewer people were off sick. Some managers were worried at first that customers would be unhappy, but complaints actually went down.

Not everything was easy, though. Meetings had to be shorter, and some workers found the four longer days tiring. Even so, the company has decided to keep the new system, and two other firms have already copied it.`,
        questions: [
          { id: 1, type: 'mc', q: 'What happened to productivity?', options: ['It fell.', 'It stayed the same or improved.', 'It was not measured.'], answer: 1 },
          { id: 2, type: 'mc', q: 'What were some managers worried about?', options: ['Customers would be unhappy.', 'Salaries would go up.', 'Workers would leave.'], answer: 0 },
          { id: 3, type: 'mc', q: 'Which problem is mentioned?', options: ['Some found the longer days tiring.', 'Projects were late.', 'Customers complained more.'], answer: 0 },
          { id: 4, type: 'short', q: 'How many other firms have copied the system?', accept: [['two', '2']] },
          { id: 5, type: 'mc', q: 'What is the writer\'s overall view of the experiment?', options: ['Mostly positive', 'Completely negative', 'No opinion at all'], answer: 0 },
        ],
        vocab: [
          { word: 'productivity', cefr: 'B1', meaning: 'how much work gets done', example: 'Productivity did not fall.', alternative: 'output, efficiency (B2)' },
          { word: 'be off sick', cefr: 'B1', meaning: 'stay home from work because you\'re ill', example: 'Fewer people were off sick.', alternative: 'absenteeism (C1)' },
          { word: 'even so', cefr: 'B1', meaning: 'despite that', example: 'Even so, the company kept the system.', alternative: 'nonetheless (B2)' },
        ],
      },
    ],
    B2: [
      {
        id: 'r-b2-boredom',
        title: 'In Defence of Boredom',
        text: `We have become remarkably good at never being bored. A queue, a short train ride, even a pause in conversation can now be filled instantly with a screen. On the face of it, this seems like progress: why waste time doing nothing?

Psychologists, however, are increasingly suggesting that boredom serves a purpose. In one study, participants who first completed a dull task, copying numbers from a phone book, later came up with more creative uses for everyday objects than those who had not. The researchers argue that a mind left without stimulation begins to wander, and that wandering is where unexpected connections are made.

This is not an argument for endless tedium. But it may be worth resisting the urge to reach for our phones the moment we feel restless. The empty minutes we are so eager to fill could be the very ones in which our best ideas would otherwise have appeared.`,
        questions: [
          { id: 1, type: 'mc', q: 'What is the main argument of the text?', options: ['Boredom should be avoided.', 'Some boredom can be useful for creativity.', 'Phones make us more creative.', 'Dull tasks improve memory.'], answer: 1 },
          { id: 2, type: 'mc', q: 'What does "On the face of it" signal?', options: ['A first impression that may be wrong', 'A scientific fact', 'The author\'s final conclusion', 'A personal story'], answer: 0 },
          { id: 3, type: 'mc', q: 'Why does the writer mention the phone book study?', options: ['To show that dull tasks are useless', 'As evidence that boredom can lead to creativity', 'To criticise psychologists', 'To explain how memory works'], answer: 1 },
          { id: 4, type: 'mc', q: '"This is not an argument for endless tedium" means the writer…', options: ['wants people to be bored all the time', 'is limiting the claim', 'has changed their mind', 'thinks the study was wrong'], answer: 1 },
          { id: 5, type: 'mc', q: 'The tone of the final paragraph is best described as…', options: ['urgent and angry', 'gently persuasive', 'humorous', 'purely factual'], answer: 1 },
        ],
        vocab: [
          { word: 'on the face of it', cefr: 'B2', meaning: 'at first glance', example: 'On the face of it, this seems like progress.', alternative: 'ostensibly (C1)' },
          { word: 'come up with', cefr: 'B2', meaning: 'think of an idea', example: 'They came up with more creative ideas.', alternative: 'devise, conceive (C1)' },
          { word: 'resist the urge', cefr: 'B2', meaning: 'stop yourself from doing something', example: 'Resist the urge to reach for your phone.', alternative: 'refrain from (C1)' },
        ],
      },
      {
        id: 'r-b2-forests',
        title: 'Tiny Forests in Big Cities',
        text: `Across Europe, a surprising kind of green space is appearing between car parks and apartment blocks: forests the size of a tennis court. Based on a method developed by the Japanese botanist Akira Miyawaki, these "tiny forests" are planted densely with dozens of native species, so that they grow quickly and need little maintenance after the first few years.

Supporters claim that the forests cool the surrounding streets, absorb rainwater and attract insects and birds that had all but disappeared from the area. They are also cheap enough for schools and neighbourhood groups to plant themselves, which gives local people a sense of ownership.

Critics are more cautious. Some ecologists point out that the most dramatic claims about growth rates come from the method's own promoters, and that a few hundred square metres of trees cannot offset the loss of larger habitats. Nevertheless, even sceptics tend to agree that a tiny forest is better than another strip of concrete.`,
        questions: [
          { id: 1, type: 'mc', q: 'Why do tiny forests grow quickly?', options: ['They use imported fast-growing trees.', 'They are planted densely with native species.', 'They are watered daily.', 'They are built on old parks.'], answer: 1 },
          { id: 2, type: 'mc', q: '"all but disappeared" means…', options: ['completely vanished', 'almost disappeared', 'recently arrived', 'grown in number'], answer: 1 },
          { id: 3, type: 'mc', q: 'What social benefit is mentioned?', options: ['Local people feel ownership.', 'House prices rise.', 'Traffic is reduced.', 'Jobs are created.'], answer: 0 },
          { id: 4, type: 'mc', q: 'Why are some ecologists cautious?', options: ['The forests are too expensive.', 'Bold claims come mainly from promoters.', 'The trees are not native.', 'Insects avoid the forests.'], answer: 1 },
          { id: 5, type: 'mc', q: 'How does the text end?', options: ['With a broadly positive conclusion', 'With a strong rejection of the idea', 'With a question', 'With a personal story'], answer: 0 },
        ],
        vocab: [
          { word: 'maintenance', cefr: 'B2', meaning: 'work to keep something in good condition', example: 'They need little maintenance.', alternative: 'upkeep (C1)' },
          { word: 'all but', cefr: 'B2', meaning: 'almost completely', example: 'Birds had all but disappeared.', alternative: 'virtually (B2)' },
          { word: 'offset', cefr: 'B2', meaning: 'balance out a loss or cost', example: 'It cannot offset the loss of habitats.', alternative: 'counterbalance (C1)' },
        ],
      },
    ],
  },

  writing: {
    A1: [{ id: 'w-a1-place', title: 'My Favourite Place', prompt: 'Write about your favourite place in your city. Where is it? What is there? Why do you like it?', hint: 'Name the place first, then say what is there and give one reason you like it.', minWords: 30, maxWords: 60, register: 'neutral', hints: ['My favourite place is …', 'It is near …', 'There is a …', 'I like it because …'] }],
    A2: [
      { id: 'w-a2-note', title: 'A Note to a Neighbour', prompt: 'You are going away for a week. Write a note to your neighbour. Ask them to water your plants and take your post. Say thank you.', hint: 'Say why you\'re away, ask for two favors politely, then say thank you.', minWords: 40, maxWords: 80, register: 'neutral', hints: ['Hi …,', "I'm going to … next week.", 'Could you please …?', 'Thanks a lot!'] },
      { id: 'w-a2-summer', title: 'Plans for Next Summer', prompt: 'Write about your plans for next summer. Where are you going to go? Who with? What are you going to do there?', hint: 'Use "I\'m going to ..." for each plan: where, who with and what you\'ll do.', minWords: 50, maxWords: 90, register: 'informal', hints: ["Next summer I'm going to …", 'We are going to stay …', "I can't wait to …"] },
    ],
    B1: [
      { id: 'w-b1-review', title: 'A Film or Series Review', prompt: 'Write a short review of a film or series you have watched recently. Say what it is about, what you liked or disliked, and whether you would recommend it.', minWords: 80, maxWords: 130, register: 'neutral', hints: ["I've recently watched …", 'What I liked most was …', 'On the other hand, …', 'I would recommend it to …'] },
      { id: 'w-b1-advice', title: 'Advice to a Friend', prompt: 'A friend wants to move to a big city for work but is nervous. Write an email giving advice. Use "should" and at least one sentence with "if".', minWords: 80, maxWords: 130, register: 'informal', hints: ['If I were you, I would …', 'You should …', "Don't worry about …"] },
    ],
    B2: [
      { id: 'w-b2-essay', title: 'Social Media for Children', prompt: 'Write an essay: "Children under 13 should not be allowed to use social media." Discuss both sides and give your own opinion.', minWords: 150, maxWords: 220, register: 'formal', hints: ['It is often argued that …', 'On the other hand, …', 'Had parents known …', 'All things considered, …'] },
      { id: 'w-b2-proposal', title: 'A Proposal to Your Manager', prompt: 'Write a formal email to your manager proposing one change that would improve your team (for example flexible hours or a new tool). Explain the benefits and possible concerns.', minWords: 150, maxWords: 220, register: 'formal', hints: ['I would like to propose …', 'This would allow us to …', 'One possible concern is …', 'I would welcome the opportunity to …'] },
    ],
  },

  listening: {
    A1: [
      {
        id: 'l-a1-cafe',
        title: 'Ordering at a Café',
        rate: 0.8,
        script: `Waiter: Hello! What would you like?
Customer: Can I have a [tea], please?
Waiter: Sure. With [milk]?
Customer: No, thanks. And one [cheese] sandwich.
Waiter: That's [six] euros, please.
Customer: Here you are. [Thank] you!`,
        questions: [
          { id: 1, q: 'Does the customer want milk?', options: ['yes', 'no'], answer: 1 },
          { id: 2, q: 'How much is it?', options: ['six euros', 'seven euros', 'sixteen euros'], answer: 0 },
        ],
        vocab: [{ word: 'Can I have …?', cefr: 'A1', meaning: 'polite way to ask for something', example: 'Can I have a tea, please?', alternative: "I'd like … (A2), Could I get … (B1)" }],
      },
      {
        id: 'l-a1-neighbour',
        title: 'A New Neighbour',
        rate: 0.8,
        script: `Anna: Hi! Are you new here?
Murat: Yes, I live in flat [five]. I'm Murat.
Anna: Nice to meet you, Murat. I'm Anna. Where are you [from]?
Murat: I'm from [Bursa], in Turkey. And you?
Anna: I'm from [Poland]. I work at the [hospital] near here.`,
        questions: [
          { id: 1, q: 'Which flat does Murat live in?', options: ['flat four', 'flat five', 'flat nine'], answer: 1 },
          { id: 2, q: 'Where does Anna work?', options: ['at a school', 'at a hospital', 'at a café'], answer: 1 },
        ],
        vocab: [{ word: 'Nice to meet you', cefr: 'A1', meaning: 'friendly greeting for someone new', example: 'Nice to meet you, Murat.', alternative: 'Pleased to meet you (formal)' }],
      },
    ],
    A2: [
      {
        id: 'l-a2-directions',
        title: 'Asking for Directions',
        rate: 0.9,
        script: `Tourist: Excuse me, how do I get to the [museum]?
Local: Go straight on and turn [left] at the traffic lights.
Tourist: Left at the lights. Is it far?
Local: Not really, about [ten] minutes on foot. It's [opposite] the post office.
Tourist: Great. Is there a [bus] if I get lost?
Local: Yes, the number 4 stops right outside.`,
        questions: [
          { id: 1, q: 'Where should the tourist turn left?', options: ['at the bank', 'at the traffic lights', 'at the post office'], answer: 1 },
          { id: 2, q: 'Where is the museum?', options: ['next to the station', 'opposite the post office', 'behind the park'], answer: 1 },
        ],
        vocab: [{ word: 'opposite', cefr: 'A2', meaning: 'across from, facing', example: "It's opposite the post office.", alternative: 'across from (B1)' }],
      },
      {
        id: 'l-a2-weekend',
        title: 'How Was Your Weekend?',
        rate: 0.9,
        script: `Ece: How was your weekend?
Tom: Really good, thanks. I went [camping] with my brother.
Ece: Oh nice! Where did you [go]?
Tom: To a lake near Bolu. It [rained] on Saturday, but Sunday was lovely.
Ece: Did you [swim]?
Tom: No, the water was too [cold]!`,
        questions: [
          { id: 1, q: 'Who did Tom go camping with?', options: ['his friend', 'his brother', 'Ece'], answer: 1 },
          { id: 2, q: 'Why didn\'t Tom swim?', options: ['It was raining.', 'The water was too cold.', 'He forgot his towel.'], answer: 1 },
        ],
        vocab: [{ word: 'go camping', cefr: 'A2', meaning: 'sleep outdoors in a tent', example: 'I went camping with my brother.', alternative: '' }],
      },
    ],
    B1: [
      {
        id: 'l-b1-doctor',
        title: 'Booking a Doctor\'s Appointment',
        rate: 1,
        script: `Receptionist: Good morning, City Health Centre. How can I help?
Patient: Hi, I'd like to make an [appointment] with Dr Yılmaz, please.
Receptionist: She's fully booked [today], I'm afraid. Is it urgent?
Patient: Not really. I've had a [cough] for about two weeks.
Receptionist: I can offer you Thursday at [ten] past nine.
Patient: That's fine. Should I bring anything?
Receptionist: Just your ID card and a list of any [medicine] you're taking.`,
        questions: [
          { id: 1, q: 'Why can\'t the patient see the doctor today?', options: ['She is on holiday.', 'She is fully booked.', 'The centre is closed.'], answer: 1 },
          { id: 2, q: 'What should the patient bring?', options: ['ID and a list of medicine', 'Only money', 'A letter from work'], answer: 0 },
        ],
        vocab: [{ word: 'fully booked', cefr: 'B1', meaning: 'no free places left', example: "She's fully booked today.", alternative: 'at full capacity (B2)' }],
      },
      {
        id: 'l-b1-train',
        title: 'Changing a Train Ticket',
        rate: 1,
        script: `Clerk: Next, please.
Passenger: Hi, I've got a ticket for the 3 o'clock to Ankara, but my meeting has been [cancelled].
Clerk: Would you like a [refund], or do you want to change it?
Passenger: Could I change it to [tomorrow] morning?
Clerk: There's a train at 8:15. There's a small [fee] of twenty lira for changes.
Passenger: That's fine. Is it possible to get a window [seat]?
Clerk: Yes, carriage 4, seat 12.`,
        questions: [
          { id: 1, q: 'Why does the passenger want to change the ticket?', options: ['The train is late.', 'The meeting was cancelled.', 'They lost the ticket.'], answer: 1 },
          { id: 2, q: 'How much does the change cost?', options: ['nothing', 'twenty lira', 'twelve lira'], answer: 1 },
        ],
        vocab: [{ word: 'refund', cefr: 'B1', meaning: 'money given back to you', example: 'Would you like a refund?', alternative: 'reimbursement (C1)' }],
      },
    ],
    B2: [
      {
        id: 'l-b2-sleep',
        title: 'Podcast: Sleep Myths',
        rate: 1.05,
        script: `Host: So, is it true that we all need exactly eight hours of sleep?
Expert: Not quite. Most adults need somewhere [between] seven and nine, and it varies quite a bit.
Host: And what about catching up at the weekend?
Expert: You can make up for a [little] lost sleep, but you can't fully [compensate] for a whole week of late nights.
Host: Interesting. Any quick tips?
Expert: Keep a [consistent] wake-up time, even on Sundays, and keep screens out of the [bedroom].`,
        questions: [
          { id: 1, q: 'What does the expert say about eight hours?', options: ['Everyone needs exactly eight.', 'Needs vary, usually seven to nine.', 'Six hours is enough.'], answer: 1 },
          { id: 2, q: 'What is the expert\'s view on weekend catch-up sleep?', options: ['It fully fixes a bad week.', 'It helps only a little.', 'It is harmful.'], answer: 1 },
        ],
        vocab: [{ word: 'make up for', cefr: 'B2', meaning: 'do something good to fix a loss', example: 'You can make up for a little lost sleep.', alternative: 'compensate for (B2), redress (C2)' }],
      },
      {
        id: 'l-b2-deadline',
        title: 'Negotiating a Deadline',
        rate: 1.05,
        script: `Client: We really need the designs by Friday. Is that realistic?
Designer: Honestly, it's [tight]. Friday would mean cutting corners on testing.
Client: What would you [suggest] instead?
Designer: If we could push it back to [Tuesday], I'd be able to deliver something I'm confident in.
Client: Tuesday might work, provided we see a [draft] on Friday.
Designer: That sounds like a fair [compromise].`,
        questions: [
          { id: 1, q: 'Why is Friday a problem for the designer?', options: ['She is on holiday.', 'Testing would suffer.', 'The client changed the brief.'], answer: 1 },
          { id: 2, q: 'What condition does the client set?', options: ['A draft on Friday', 'A lower price', 'Daily meetings'], answer: 0 },
        ],
        vocab: [{ word: 'cut corners', cefr: 'B2', meaning: 'do a job quickly but badly', example: 'Friday would mean cutting corners on testing.', alternative: 'skimp on (C1)' }],
      },
    ],
  },

  speaking: {
    A1: [{ id: 's-a1-day', title: 'My Day', prompt: 'Talk about a normal day. What time do you get up? What do you do in the morning, afternoon and evening?', hint: 'Use simple time words: in the morning, in the afternoon, in the evening.', targetSec: 30, hints: ['I get up at …', 'In the morning I …', 'In the evening I …'] }],
    A2: [
      { id: 's-a2-directions', title: 'Giving Directions', prompt: 'Explain how to get from your home to a shop or café near you. Use: go straight on, turn left/right, next to, opposite.', hint: 'Give one step at a time: go straight on, turn left or right, then say what\'s next to it.', targetSec: 45, hints: ['Go out of my building and …', 'Turn left at …', "It's opposite …"] },
      { id: 's-a2-friend', title: 'My Best Friend', prompt: 'Describe your best friend. What do they look like? What are they like? How are you different?', hint: 'First describe how your friend looks and acts, then compare: "I\'m ..., but she\'s ...".', targetSec: 45, hints: ['My best friend is …', 'They are taller than me …', 'We both like …'] },
    ],
    B1: [
      { id: 's-b1-challenge', title: 'A Challenge I Overcame', prompt: 'Talk about a difficult situation you have faced. What happened, how did you deal with it, and what have you learned from it?', targetSec: 60, hints: ["One of the hardest things I've done is …", 'At first I …', "Since then, I've learned …"] },
      { id: 's-b1-visitors', title: 'Advice for Visitors', prompt: 'A tourist is visiting your city for two days. What should they see, eat and avoid? Use "should" and "if".', targetSec: 60, hints: ['You should definitely …', "If you have time, …", 'I would avoid …'] },
    ],
    B2: [
      { id: 's-b2-career', title: 'A Different Path', prompt: 'If you had chosen a different career or field of study, how would your life be different now? Use third and mixed conditionals.', targetSec: 90, hints: ['If I had studied …, I would have …', 'I would probably be … now', 'Looking back, …'] },
      { id: 's-b2-tech', title: 'Technology Trade-offs', prompt: 'Choose one technology you use every day. Discuss what it has given us and what it has cost us, then give your balanced view.', targetSec: 90, hints: ['On the plus side, …', 'The downside is that …', 'On balance, I would say …'] },
    ],
  },
};
