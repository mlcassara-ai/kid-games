/* Heritage Night: Discover Lebanon — shared engine for the big screen (screen.html) and the phones (index.html).
   No host and no server code. Every device works out the current fact/question from the clock alone:
   one "cycle" = fact card, then question, then answer reveal. Clocks are lined up with Firestore's server time.
   Scores: each phone writes its own entry into one of SHARDS small docs in the shared `families` collection
   (same {data,updated,v} shape and anonymous auth as the other kid games). The screen reads the shards. */
(function () {
'use strict';
var FB = { key: 'AIzaSyDisxs0uEXvWrlOp8VchKOz0abxPDKIWpI', project: 'kid-games-dc068' };
var BASE = 'https://firestore.googleapis.com/v1/projects/' + FB.project + '/databases/(default)/documents/families/';
var qs = new URLSearchParams(location.search);
var FAST = qs.get('fast') === '1';                       // testing: short phases
var EVENT = (qs.get('e') || 'oct2026').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'oct2026';
var SHARDS = 8;
/* fact card, question, answer reveal; the 10th question of each round gets a longer reveal (`champ`) for the Round Champion */
var T = FAST ? { fact: 4000, q: 6000, reveal: 3000, champ: 5000 } : { fact: 16000, q: 10000, reveal: 4000, champ: 12000 };
T.cycle = T.fact + T.q + T.reveal;
var PLAY_URL = 'https://mlcassara-ai.github.io/kid-games/heritage-night/';

/* ---------- facts and questions (first option is the right one; options are shuffled per cycle) ---------- */
var QA = [
 { e: '🌲', f: "Lebanon's flag has two red stripes, a white stripe in the middle, and a green cedar tree right in the center.",
   q: 'What is in the middle of Lebanon’s flag?', o: ["A cedar tree", "An olive tree", "A star", "A smiley face"] },
 { e: '🌲', f: 'Cedar trees grow high in Lebanon’s mountains. The oldest ones have been alive for more than 1,000 years!',
   q: 'How old are the oldest cedar trees in Lebanon?', o: ["More than 1,000 years", "About 100 years", "About 300 years", "One week"] },
 { e: '🏙️', f: 'Beirut is the capital of Lebanon. It is a busy city right on the edge of the sea.',
   q: 'What is the capital city of Lebanon?', o: ["Beirut", "Sidon", "Byblos", "Pizza Town"] },
 { e: '🌊', f: 'Lebanon sits on the coast of the Mediterranean Sea, the same sea that touches Greece, Italy and Spain.',
   q: 'Which sea is Lebanon next to?', o: ["The Mediterranean Sea", "The Red Sea", "The Black Sea", "The Jelly Sea"] },
 { b: 1, e: '🗺️', f: 'Lebanon is a small country. The whole country is a little smaller than San Diego County!',
   q: 'Lebanon is about the same size as…', o: ["San Diego County", "Texas", "All of California", "A soccer field"] },
 { e: '⛷️', f: 'In spring you can ski on snowy mountains in the morning and swim in the warm sea in the afternoon. They are that close!',
   q: 'What can you do in Lebanon on the same spring day?', o: ["Ski in snow and swim in the sea", "Watch the northern lights", "See a volcano erupt", "Ride a camel to the moon"] },
 { e: '⛰️', f: 'Lebanon’s highest mountain peak is over 10,000 feet tall. It is covered in snow for much of the year.',
   q: 'How tall is Lebanon’s highest mountain?', o: ["Over 10,000 feet", "About 1,000 feet", "About 3,000 feet", "1 mile underground"] },
 { e: '🗣️', f: 'People in Lebanon speak Arabic. Many also speak French and English, sometimes all in one sentence!',
   q: 'What is the main language of Lebanon?', o: ["Arabic", "French", "Spanish", "Dolphin"] },
 { e: '👋', f: 'To say hello in Arabic, you say “Marhaba!” (mar-ha-ba).',
   q: 'How do you say “hello” in Arabic?', o: ["Marhaba", "Shukran", "Yalla", "Moo-moo"] },
 { e: '🙏', f: 'To say thank you in Arabic, you say “Shukran!” (shook-ran).',
   q: 'What does “Shukran” mean?', o: ["Thank you", "Goodbye", "Good morning", "Pizza"] },
 { b: 1, e: '🏃', f: '“Yalla!” is a word you hear all the time in Lebanon. It means “Let’s go!” or “Hurry up!”',
   q: 'What does “Yalla!” mean?', o: ["Let’s go!", "Be quiet", "Good night", "I’m a banana"] },
 { e: '🏠', f: 'When guests arrive, Lebanese families say “Ahlan wa sahlan,” which means “Welcome!” and offer them food or coffee.',
   q: 'What does “Ahlan wa sahlan” mean?', o: ["Welcome!", "Goodbye!", "Thank you!", "Watch out for llamas!"] },
 { b: 1, e: '✍️', f: 'Arabic is written from right to left, the opposite way from English.',
   q: 'Which way is Arabic written?', o: ["Right to left", "Left to right", "Top to bottom", "In a circle"] },
 { e: '⛵', f: 'Long ago, the Phoenicians lived on Lebanon’s coast. They were amazing sailors who traded all around the sea in wooden ships.',
   q: 'What were the Phoenicians famous for?', o: ["Sailing and trading", "Building pyramids", "Making silk", "Riding dinosaurs"] },
 { b: 1, e: '🔤', f: 'The Phoenicians made one of the first alphabets. Over time it grew into the Greek alphabet and later the ABCs we use today!',
   q: 'Our ABCs come from an alphabet first made by the…', o: ["Phoenicians", "Vikings", "Chinese", "Robots"] },
 { e: '🐌', f: 'The Phoenicians made a special purple dye from tiny sea snails. It was so rare that kings and queens wore it.',
   q: 'What did the Phoenicians use to make purple dye?', o: ["Sea snails", "Grapes", "Purple flowers", "Crayons"] },
 { e: '🏛️', f: 'Byblos is one of the oldest cities in the world. People have lived there for about 7,000 years!',
   q: 'What is special about the city of Byblos?', o: ["It is one of the oldest cities in the world", "It has the tallest tower in the world", "It is the newest city in Lebanon", "It is built on the moon"] },
 { e: '🏛️', f: 'At Baalbek you can walk through giant ancient Roman temples. Some of the stones are as heavy as hundreds of elephants!',
   q: 'What can you see at Baalbek?', o: ["Giant ancient temples", "A huge waterfall", "Ancient pyramids", "A space station"] },
 { e: '🛶', f: 'Jeita Grotto is a huge cave with sparkling rock icicles. The lower cave has an underground river you ride through in a boat!',
   q: 'How do you visit the lower cave at Jeita Grotto?', o: ["By boat", "By train", "On foot", "By helicopter"] },
 { e: '🏰', f: 'In the city of Sidon there is a castle built on a tiny island in the sea, joined to land by a stone bridge.',
   q: 'Where is the Sidon Sea Castle?', o: ["On a tiny island in the sea", "On top of a mountain", "In the desert", "On the moon"] },
 { e: '🏞️', f: 'The Litani is the longest river in Lebanon. It starts and ends inside the country.',
   q: 'What is the longest river in Lebanon?', o: ["The Litani", "The Jordan", "The Orontes", "The Chocolate River"] },
 { e: '🥣', f: 'Hummus is a creamy dip made from mashed chickpeas, sesame paste, lemon and garlic. Scoop it up with pita bread!',
   q: 'Hummus is made mostly from…', o: ["Chickpeas", "Lentils", "Potatoes", "Chocolate"] },
 { e: '🥗', f: 'Tabbouleh is a fresh green salad made mostly of chopped parsley, with tomato, mint, lemon and a little cracked wheat.',
   q: 'What is the main green in tabbouleh?', o: ["Parsley", "Mint", "Lettuce", "Broccoli"] },
 { e: '🌿', f: 'Za’atar is a tasty mix of dried herbs, sesame seeds and tangy red sumac. It is spread on bread with olive oil.',
   q: 'What is za’atar?', o: ["A mix of herbs and sesame", "A spicy red pepper", "A kind of cheese", "A dance"] },
 { b: 1, e: '🍞', f: 'Man’oushe is a warm flatbread topped with za’atar or cheese. Many Lebanese kids eat it for breakfast!',
   q: 'What is man’oushe?', o: ["A flatbread", "A soup", "A rice dish", "A drum"] },
 { e: '🧆', f: 'Falafel are crunchy fried balls made from chickpeas or fava beans, often wrapped in pita with veggies.',
   q: 'Falafel are shaped like…', o: ["Little balls", "Long rolls", "Flat triangles", "Stars"] },
 { e: '🍽️', f: 'Kibbeh is called the national dish of Lebanon. It is made from cracked wheat and meat, and can be baked, fried or even eaten raw.',
   q: 'Which food is called the national dish of Lebanon?', o: ["Kibbeh", "Shawarma", "Falafel", "Tacos"] },
 { e: '🍪', f: 'Ma’amoul are buttery cookies stuffed with dates, pistachios or walnuts. Families bake them together for holidays.',
   q: 'What is inside a ma’amoul cookie?', o: ["Dates or nuts", "Chocolate chips", "Strawberry jam", "Popcorn"] },
 { e: '🍯', f: 'Baklava is a sweet made from many paper-thin layers of pastry, chopped nuts and sweet syrup.',
   q: 'What is baklava made with?', o: ["Thin pastry, nuts and syrup", "Rice and milk", "Bread and cheese", "Fish and chips"] },
 { e: '☕', f: 'Lebanese coffee is strong and served in tiny cups. Many families add a spice called cardamom.',
   q: 'Which spice is often added to Lebanese coffee?', o: ["Cardamom", "Cinnamon", "Black pepper", "Bubble gum"] },
 { e: '💃', f: 'The dabke is a joyful line dance. Dancers hold hands, step and stomp their feet together. It is a must at weddings!',
   q: 'What do people do in the dabke dance?', o: ["Hold hands in a line and stomp", "Dance in pairs like a waltz", "Clap while sitting in a circle", "Spin on their heads"] },
 { e: '🎶', f: 'The oud is a pear-shaped string instrument, like a cousin of the guitar, but with no frets on its neck.',
   q: 'What kind of instrument is the oud?', o: ["A string instrument", "A drum", "A flute", "A kazoo"] },
 { e: '🥁', f: 'The darbuka is a drum shaped like a goblet. You play it with your hands, not sticks.',
   q: 'How do you play the darbuka drum?', o: ["With your hands", "With sticks", "With a bow", "By blowing into it"] },
 { e: '🌎', f: 'Lebanese families live all over the world. Brazil has one of the biggest Lebanese communities anywhere, and so does the United States.',
   q: 'Which country has one of the biggest Lebanese communities?', o: ["Brazil", "Japan", "Norway", "Antarctica"] },
 { b: 1, e: '💰', f: 'The money in Lebanon is called the Lebanese pound. People also call it the lira. Tonight’s prizes are chocolate lira!',
   q: 'What is the money in Lebanon called?', o: ["The Lebanese pound", "The dinar", "The euro", "The cookie coin"] },
 { e: '🤍', f: 'On the flag, white stands for peace, and the green cedar stands for strength and living a long time.',
   q: 'What does white stand for on Lebanon’s flag?', o: ["Peace", "Courage", "Kindness", "Marshmallows"] },
 { e: "🗣️", f: "Lots of Lebanese people greet each other with “Hi, kifak, ça va?” That is English, Arabic and French, all in one sentence!",
   q: "What is special about the greeting “Hi, kifak, ça va?”", o: ["It mixes three languages", "It is a secret code", "It is the national anthem", "It is only for babies"] },
 { b: 1, e: "💛", f: "“Habibi” (said to a boy) and “Habibti” (said to a girl) mean “my dear.” Families say it all day long!",
   q: "What does “habibi” mean?", o: ["My dear", "Hurry up", "Thank you", "I’m a potato"] },
 { b: 1, e: "👵", f: "Lebanese kids call their grandma “Teta” and their grandpa “Jiddo.”",
   q: "What do Lebanese kids call their grandma?", o: ["Teta", "Jiddo", "Mama", "Nana-Banana"] },
 { e: "🏔️", f: "The name “Lebanon” comes from an old word that means “white,” because the tops of its mountains are covered in snow.",
   q: "Where does the name “Lebanon” come from?", o: ["A word meaning “white,” for its snowy mountains", "A word meaning “cedar”", "A famous king named Leb", "A type of fish"] },
 { b: 1, e: "💯", f: "Many Lebanese schools grade tests out of 20, not 100. Getting 20 out of 20 is a perfect score!",
   q: "In many Lebanese schools, what is a perfect score on a test?", o: ["20 out of 20", "100 out of 100", "10 out of 10", "An A+++"] },
 { b: 1, e: "📚", f: "Many Lebanese kids learn three languages at school: Arabic, plus French or English, or both!",
   q: "How many languages do many Lebanese kids learn at school?", o: ["Three", "One", "Two", "Ten"] },
 { b: 1, e: "🍽️", f: "In Lebanon, the biggest meal of the day is lunch, often eaten at home with family after school.",
   q: "What is the biggest meal of the day in Lebanon?", o: ["Lunch", "Breakfast", "Dinner", "A midnight snack"] },
 { b: 1, e: "🥣", f: "Labneh is a thick, creamy yogurt spread. A labneh sandwich with cucumbers or olives is a classic school lunch.",
   q: "What is labneh?", o: ["A thick, creamy yogurt spread", "A kind of bread", "A sweet syrup", "A soccer team"] },
 { e: "🧀", f: "Knefeh is a favorite Lebanese dessert: warm, gooey melted cheese under a crunchy top, soaked in sweet syrup. Some people eat it for breakfast!",
   q: "What is inside knefeh?", o: ["Warm, gooey cheese", "Dates", "Rice pudding", "Jelly beans"] },
 { e: "🍰", f: "Sfouf is a bright yellow cake. Its sunny color comes from a spice called turmeric, not from food coloring.",
   q: "What makes sfouf cake bright yellow?", o: ["A spice called turmeric", "Saffron", "Lemon juice", "Yellow paint"] },
 { b: 1, e: "🎩", f: "Tarboosh is a famous Lebanese treat: a fluffy marshmallow on a cookie, dipped in chocolate. It is named after a tall, round hat because that is what it looks like!",
   q: "Why is the Tarboosh treat called that?", o: ["It looks like a hat called a tarboosh", "It was invented by a man named Tarboosh", "It is shaped like a mountain", "It tastes like tar"] },
 { b: 1, e: "🙈", f: "In Lebanon, hide-and-seek is called “ghommayda,” which comes from the word for closing your eyes.",
   q: "What is “ghommayda”?", o: ["Hide-and-seek", "Tag", "Hopscotch", "A tickle fight"] },
 { b: 1, e: "🥚", f: "At Easter, kids dye eggs and have egg battles: two kids tap their eggs together, and whoever’s egg does not crack wins!",
   q: "How do you win the Easter egg battle?", o: ["Your egg doesn’t crack", "Your egg is the biggest", "You hide your egg best", "Your egg sings the loudest"] },
 { b: 1, e: "⚽", f: "Soccer (called “football”) is the most popular sport in Lebanon. Basketball is a big favorite too.",
   q: "What is the most popular sport in Lebanon?", o: ["Soccer (football)", "Basketball", "Tennis", "Surfing"] },
 { b: 1, e: "🎲", f: "Tawleh (backgammon) is a board game with dice. Grandpas teach it to kids, and games get loud with lots of slapping of pieces and friendly teasing!",
   q: "What is tawleh?", o: ["A board game with dice (backgammon)", "A card game", "A kind of bread", "A bicycle race"] },
 { b: 1, e: "🎄", f: "In Lebanon, both Christmas and Eid are public holidays, so lots of kids get days off from school for both!",
   q: "Which holidays do Lebanese kids get off from school?", o: ["Both Christmas and Eid", "Only Christmas", "Only Eid", "Only Halloween"] },
 { b: 1, e: "💰", f: "On Eid, kids visit relatives and often get “eidiyeh”: a gift of money from grown-ups. Cha-ching!",
   q: "What is “eidiyeh”?", o: ["A money gift for kids on Eid", "A special Eid cookie", "A new outfit for Eid", "A song"] },
 { b: 1, e: "🎃", f: "On December 4 many Lebanese kids celebrate Eid il-Burbara. They dress up in costumes and go house to house, a lot like Halloween! The special treat is boiled wheat with sugar and pomegranate seeds.",
   q: "Eid il-Burbara is a lot like which holiday?", o: ["Halloween", "Thanksgiving", "Valentine’s Day", "Groundhog Day"] },
 { b: 1, e: "💐", f: "In Lebanon, Mother’s Day is on March 21, the first day of spring.",
   q: "When is Mother’s Day in Lebanon?", o: ["March 21, the first day of spring", "May 10", "December 25", "October 31"] },
 { b: 1, e: "☀️", f: "No tooth fairy here! A traditional Arab custom is to throw your baby tooth toward the sun and ask it to swap your tooth for a strong, pretty gazelle’s tooth.",
   q: "In the old custom, where do kids throw a lost baby tooth?", o: ["Toward the sun", "Under the pillow", "Into the sea", "Into a cake"] },
 { b: 1, e: "🎂", f: "The Arabic birthday song is “Sana helwa ya jamil,” which means “Have a sweet year, beautiful one!”",
   q: "What does the Arabic birthday song wish you?", o: ["A sweet year", "A big cake", "Lots of presents", "A long nap"] },
 { e: "🕷️", f: "Lebanon has no giant hunting spiders like Australia, but it does have camel spiders. With their legs, they can be bigger than your hand! They are fast and scary-looking, but they are not venomous.",
   q: "What is true about Lebanon’s camel spiders?", o: ["They can be bigger than your hand but aren’t venomous", "They are deadly to people", "They spin huge webs", "They ride on camels"] },
 { e: "🦎", f: "Lebanon’s black tarantula is big enough to catch and eat lizards! Its bite hurts but is not dangerous to people.",
   q: "What can Lebanon’s black tarantula eat?", o: ["Lizards", "Only leaves", "Fish", "Pizza"] },
 { e: "🦂", f: "More than 10 kinds of scorpions live in Lebanon. One, the deathstalker, is one of the most venomous scorpions in the world, so people shake out their shoes in dry areas!",
   q: "Why do some people in Lebanon shake out their shoes?", o: ["To check for scorpions", "To dry their socks", "To get the sand out", "To find coins"] },
 { e: "🐾", f: "Striped hyenas live in Lebanon. In snowy winters they sometimes sneak down into villages at night looking for food!",
   q: "What wild animal sometimes sneaks into Lebanese villages at night?", o: ["A striped hyena", "A brown bear", "A lion", "A kangaroo"] },
 { e: "🐢", f: "Sea turtles dig nests and lay their eggs on the beaches near the city of Tyre. When the babies hatch, they scurry down the sand into the sea!",
   q: "What lays eggs on the beaches near Tyre?", o: ["Sea turtles", "Crocodiles", "Ostriches", "Penguins"] },
 { b: 1, e: "🐈", f: "Beirut is full of cats! You see them napping on cars, walls and steps all over the city.",
   q: "Which animal will you see all over the streets of Beirut?", o: ["Cats", "Camels", "Goats", "Penguins"] },
 { e: "🚗", f: "Lebanese drivers honk their horns a LOT: to say hi, to say thanks, or just to say “I’m here!”",
   q: "Why do Lebanese drivers honk so much?", o: ["To say hi, thanks, or “I’m here!”", "Because it’s the law", "To scare birds away", "Because horns are free on Tuesdays"] },
 { b: 1, e: "🫓", f: "At a Lebanese table, a piece of pita bread is often your spoon! You tear off a piece and scoop up hummus and other dips.",
   q: "What do Lebanese people often use to scoop up hummus?", o: ["A piece of pita bread", "A fork", "Chopsticks", "Their elbow"] },
 { b: 1, e: "🏡", f: "Sunday lunch at Teta’s house is a big deal. Aunts, uncles and lots of cousins all squeeze around the table together.",
   q: "Where do many Lebanese families have a big Sunday lunch?", o: ["At Teta’s (Grandma’s) house", "At a restaurant", "At school", "At the zoo"] },
 { b: 1, e: "🤗", f: "Lebanese kids call grown-up family friends “Amo” (uncle) or “Tante” (aunt), even if they aren’t really related!",
   q: "What might a Lebanese kid call a grown-up family friend?", o: ["Amo or Tante (uncle or aunt)", "Sir or Ma’am", "Teacher", "Your Majesty"] },
 { e: "💋", f: "Many Lebanese people greet friends and family with three kisses on the cheeks: right, left, right!",
   q: "How many cheek kisses are in a classic Lebanese hello?", o: ["Three", "One", "Two", "Twenty"] },
 { b: 1, e: "🤔", f: "If you ask a Lebanese parent for a treat, they might say “Inshallah,” which means “if God wills.” Kids know it often means “maybe!”",
   q: "When a Lebanese parent answers “Inshallah,” what does it often mean?", o: ["Maybe!", "Yes, right now!", "No way!", "Go to bed"] },
 { e: "🥕", f: "Lebanese pickled turnips are bright pink! They get their color from a slice of beet in the jar.",
   q: "What makes Lebanese pickled turnips pink?", o: ["A slice of beet", "Red peppers", "Cherries", "Bubble gum"] },
 { e: "🍓", f: "In Lebanon, a “cocktail” is a thick fruit smoothie in a cup, piled with fruit chunks, sweet cream called ashta, honey and nuts. You eat it with a spoon!",
   q: "What is a Lebanese fruit “cocktail”?", o: ["A thick fruit smoothie topped with cream, honey and nuts", "A fizzy soda", "A frozen popsicle", "A chicken dish"] },
 { e: "🌸", f: "Many Lebanese desserts are flavored with rose water or orange blossom water, so they taste a little like flowers!",
   q: "Many Lebanese sweets taste a little like…", o: ["Flowers", "Lemons", "Coffee", "Toothpaste"] },
 { b: 1, e: "🧂", f: "In spring, kids snack on janarek: small, sour green plums dipped in salt. Crunchy and super sour!",
   q: "How do Lebanese kids like to eat sour green plums?", o: ["Dipped in salt", "Dipped in honey", "Dipped in chocolate", "Covered in sprinkles"] },
 { b: 1, e: "🔢", f: "Arabic is written from right to left, but numbers are written from left to right, just like in English!",
   q: "Which way are numbers written in Arabic?", o: ["Left to right", "Right to left", "Top to bottom", "In a circle"] },
 { b: 1, e: "🔤", f: "The Arabic alphabet has 28 letters. Most letters change their shape depending on whether they are at the start, middle or end of a word.",
   q: "How many letters are in the Arabic alphabet?", o: ["28", "26", "22", "100"] },
 { b: 1, e: "🎅", f: "In Lebanon, Santa Claus is called “Baba Noël.”",
   q: "What do Lebanese kids call Santa Claus?", o: ["Baba Noël", "Jiddo Noël", "Amo Santa", "Captain Christmas"] },
 { e: "🥁", f: "During Ramadan, a drummer called the musaharati walks the streets before sunrise, drumming and singing to wake families up for their early meal.",
   q: "What does the musaharati do during Ramadan?", o: ["Drums in the streets to wake people for an early meal", "Sings the call to prayer", "Bakes all the bread", "Delivers the mail"] },
 { e: "🦎", f: "Chameleons live in Lebanon. They can change color, and their eyes can look in two different directions at once!",
   q: "What can Lebanon’s chameleons do?", o: ["Change color and look two ways at once", "Change color and glow in the dark", "Fly short distances", "Breathe fire"] },
 { e: "🐺", f: "Wolves still live in the mountains of Lebanon, along with foxes, jackals and wild boars.",
   q: "Which wild animal still lives in Lebanon’s mountains?", o: ["Wolves", "Bears", "Tigers", "Pandas"] },
 { e: "🪼", f: "In summer, huge groups of jellyfish sometimes float along Lebanon’s beaches. Their sting hurts, so swimmers watch out!",
   q: "What do swimmers in Lebanon watch out for in summer?", o: ["Stinging jellyfish", "Electric eels", "Crocodiles", "Hot lava"] },
 { e: "🚀", f: "In the 1960s, a teacher and his college students in Lebanon built and launched their own rockets, called Cedar rockets. Some flew more than 10 miles high!",
   q: "What did college students in Lebanon build in the 1960s?", o: ["Rockets", "A robot", "A video game", "A submarine"] },
 { e: "🇱🇧", f: "Lebanon’s flag was drawn in a hurry in November 1943 by members of Lebanon’s parliament, while they were fighting for their country’s freedom.",
   q: "When was Lebanon’s flag made?", o: ["1943", "1920", "1975", "1492"] },
 { e: "🔴", f: "The two red stripes on Lebanon’s flag stand for the courage of the people who gave their lives for their country.",
   q: "What do the red stripes on Lebanon’s flag stand for?", o: ["Courage", "Peace", "Strength", "Ketchup"] },
 { e: "📏", f: "The white stripe on Lebanon’s flag is twice as tall as each red stripe. That leaves lots of room for the cedar tree!",
   q: "How does the white stripe compare to each red stripe?", o: ["It is twice as tall", "It is the same size", "It is half as tall", "It is ten times as tall"] },
 { b: 1, e: "🎉", f: "Lebanon’s birthday is Independence Day, November 22. People wave flags, march in parades and decorate the streets in red, white and green.",
   q: "When is Lebanon’s Independence Day?", o: ["November 22", "September 1", "January 1", "October 31"] },
 { e: "⚽", f: "Lebanon’s national soccer team is nicknamed “the Cedars,” after the tree on the flag.",
   q: "What is the nickname of Lebanon’s soccer team?", o: ["The Cedars", "The Lions", "The Eagles", "The Lemons"] },
 { e: "🏀", f: "Basketball is a huge favorite in Lebanon. The national team has played in the Basketball World Cup against the best teams on Earth!",
   q: "In which sport has Lebanon played in the World Cup?", o: ["Basketball", "Volleyball", "Ice hockey", "Curling"] },
 { e: "⛷️", f: "Lebanon has ski slopes high in its snowy mountains, and it has sent skiers to the Winter Olympics.",
   q: "Which Winter Olympics sport does Lebanon compete in?", o: ["Skiing", "Figure skating", "Bobsled", "Ice fishing"] },
 { e: "🏃", f: "Every fall, thousands of people run the Beirut Marathon through the city, and kids join in with a shorter fun run!",
   q: "What race happens in Beirut every fall?", o: ["A marathon", "A camel race", "A boat race", "A snail race"] },
 { e: "🤼", f: "Lebanon has won Olympic medals in wrestling and weightlifting, sports where you have to be super strong!",
   q: "In which sports has Lebanon won Olympic medals?", o: ["Wrestling and weightlifting", "Swimming and diving", "Running and jumping", "Pie eating"] },
 { b: 1, e: "🚗", f: "Driving from the top of Lebanon to the bottom takes about as long as driving from San Diego to Los Angeles. The whole country is only about 140 miles long!",
   q: "Driving the whole length of Lebanon is about like driving from San Diego to…", o: ["Los Angeles", "Las Vegas", "San Francisco", "The moon"] },
 { b: 1, e: "👨‍👩‍👧", f: "Lebanon is smaller than San Diego County, but more people live there: over 5 million, compared to about 3 million in San Diego County!",
   q: "Which has more people: Lebanon or San Diego County?", o: ["Lebanon", "San Diego County", "They are exactly the same", "Nobody lives in either"] },
 { b: 1, e: "⏰", f: "Lebanon is 10 hours ahead of San Diego. When you eat breakfast at 7 in the morning, kids in Lebanon are getting ready for dinner at 5 in the evening!",
   q: "When it is 7 in the morning in San Diego, what time is it in Lebanon?", o: ["5 in the evening", "Noon", "Midnight", "Tuesday"] },
 { b: 1, e: "🌍", f: "Beirut and San Diego are almost the same distance from the equator, so they get a lot of the same sunshine and warm weather.",
   q: "What do Beirut and San Diego have in common?", o: ["They are about the same distance from the equator", "They are both capital cities", "They both get lots of snow", "They are both in the desert"] },
 { b: 1, e: "🍋", f: "Lebanon’s coast and San Diego have the same kind of weather: warm, dry summers and mild, rainy winters. Lemons, olives, figs and avocados grow in both places!",
   q: "Which fruit grows in both Lebanon and San Diego?", o: ["Lemons", "Coconuts", "Cranberries", "Lollipops"] },
 { b: 1, e: "⛰️", f: "Lebanon’s highest mountain is over 10,000 feet tall. That is about one and a half times as tall as Cuyamaca Peak, one of the tallest mountains in San Diego County!",
   q: "How does Lebanon’s highest mountain compare to Cuyamaca Peak?", o: ["About 1½ times as tall", "About the same", "Half as tall", "100 times as tall"] },
 { b: 1, e: "✈️", f: "Lebanon is more than 7,000 miles from San Diego. Flying there takes a whole day with stops along the way!",
   q: "About how far is Lebanon from San Diego?", o: ["More than 7,000 miles", "About 700 miles", "About 70,000 miles", "7 miles"] },
 { b: 1, e: "🏠", f: "Old Lebanese houses are made of stone with red tile roofs and three arched windows in a row. Lots of San Diego houses have red tile roofs too!",
   q: "What do many old Lebanese houses and San Diego houses both have?", o: ["Red tile roofs", "Grass roofs", "Log cabin walls", "Igloo walls"] },
 { b: 1, e: "🏢", f: "In Lebanese cities, many families live in tall apartment buildings, and grandparents, aunts and cousins often live in the same building or just down the street.",
   q: "In Lebanese cities, where do grandparents and cousins often live?", o: ["In the same building or nearby", "In another country", "In a hotel", "On another planet"] },
 { b: 1, e: "👕", f: "Many Lebanese kids wear a school uniform every day, with the school’s colors and logo.",
   q: "What do many Lebanese kids wear to school every day?", o: ["A school uniform", "Whatever they want", "Sports clothes every day", "Superhero capes"] },
 { b: 1, e: "🗓️", f: "In Lebanon the weekend is Saturday and Sunday, just like here. In some nearby countries the weekend is Friday and Saturday!",
   q: "Which days are the weekend in Lebanon?", o: ["Saturday and Sunday", "Friday and Saturday", "Thursday and Friday", "Every day ending in “y”"] },
 { b: 1, e: "🌽", f: "On weekends, families walk along Beirut’s seaside path, the Corniche, and buy hot corn on the cob and sesame bread from carts.",
   q: "What can you buy from carts on Beirut’s Corniche?", o: ["Hot corn on the cob", "Hot pretzels", "Cotton candy only", "Snow cones made of real snow"] },
 { b: 1, e: "🥯", f: "Ka’ak is a sesame bread shaped like a purse with a handle, sold from carts. Kids sprinkle za’atar inside.",
   q: "What shape is Lebanese ka’ak bread?", o: ["A purse with a handle", "A long stick", "A round donut", "A dinosaur"] },
 { b: 1, e: "🏔️", f: "In summer, many families go “up to the village” in the mountains, where it is cooler, and spend weeks there with their cousins.",
   q: "Where do many Lebanese families go in summer?", o: ["Their village in the mountains", "The desert", "A big city far away", "The moon, by rocket"] },
 { b: 1, e: "🚡", f: "In the town of Jounieh, a cable car carries families high over the town and up a mountain to Harissa.",
   q: "How do families ride up the mountain to Harissa?", o: ["By cable car", "By train", "By horse", "Down a giant slide, backwards"] },
 { b: 1, e: "🏳️", f: "During the soccer World Cup, Lebanese fans hang the flags of their favorite teams, often Brazil or Germany, from balconies and cars.",
   q: "What do Lebanese fans hang from balconies during the World Cup?", o: ["Flags of their favorite teams", "Christmas lights", "Soccer balls", "Pizzas"] },
 { b: 1, e: "🎿", f: "Mzaar is one of the biggest ski resorts in the Middle East, only about an hour’s drive from Beirut.",
   q: "What can you do at Mzaar?", o: ["Ski", "Surf", "Ride camels", "Ice-skate on a lake of lemonade"] },
 { b: 1, e: "🎬", f: "Keanu Reeves, the voice of Duke Caboom in Toy Story 4, was born in Beirut!",
   q: "Which Toy Story character’s actor was born in Beirut?", o: ["Duke Caboom", "Woody", "Buzz Lightyear", "Mr. Potato Head"] },
 { b: 1, e: "🚗", f: "Tony Shalhoub, the voice of Luigi in the movie Cars, has parents who came from Lebanon.",
   q: "Which Cars character is voiced by a Lebanese-American actor?", o: ["Luigi", "Lightning McQueen", "Mater", "A traffic cone"] },
 { b: 1, e: "🎤", f: "The singer Shakira, the voice of Gazelle in Zootopia, has Lebanese family on her dad’s side.",
   q: "Which singer has Lebanese family?", o: ["Shakira", "Taylor Swift", "Ed Sheeran", "Mickey Mouse"] },
 { e: "🚀", f: "Charles Elachi grew up in Lebanon and later led NASA’s Jet Propulsion Laboratory, the place that builds the Mars rovers.",
   q: "What does the NASA lab Charles Elachi led build?", o: ["Mars rovers", "Submarines", "Airplanes", "Ice cream trucks"] },
 { e: "🏥", f: "Lebanese-American entertainer Danny Thomas started St. Jude Children’s Research Hospital, which helps sick kids for free.",
   q: "What did Danny Thomas start?", o: ["A children’s hospital", "A toy company", "A soccer team", "A bubble-gum factory"] },
 { b: 1, e: "🤖", f: "Many Lebanese grown-ups’ favorite childhood hero was Grendizer, a giant robot cartoon. Its Arabic voices were recorded in Lebanon.",
   q: "Who was Grendizer?", o: ["A giant robot cartoon hero", "A famous chef", "A soccer player", "A talking falafel"] },
 { e: "✍️", f: "Lebanese writer Gibran Khalil Gibran wrote a book called The Prophet. He is one of the best-selling poets of all time.",
   q: "What was Gibran Khalil Gibran?", o: ["A poet and writer", "A race-car driver", "An astronaut", "A magician"] },
 { b: 1, e: "🧮", f: "In many Lebanese schools, kids learn math and science in French or English, and other subjects in Arabic.",
   q: "In many Lebanese schools, what language is math taught in?", o: ["French or English", "Only Arabic", "Spanish", "Emoji"] },
 { b: 1, e: "📝", f: "In 9th grade, Lebanese students take a big national test called the Brevet. Everyone in the country takes it at the same time!",
   q: "What is the big national test Lebanese students take in 9th grade?", o: ["The Brevet", "The SAT", "The Spelling Bee", "The Olympics"] },
 { b: 1, e: "🧍", f: "In many Lebanese schools, students stand up when the teacher walks into the classroom, to show respect.",
   q: "What do students in many Lebanese schools do when the teacher walks in?", o: ["Stand up", "Clap their hands", "Raise their hands", "Do a cartwheel"] },
 { b: 1, e: "👩‍🏫", f: "Lebanese kids call their teacher “Miss” in English schools or “Mademoiselle” in French schools.",
   q: "What might a Lebanese kid call their teacher?", o: ["Miss or Mademoiselle", "By their first name", "Coach", "Your Majesty"] },
 { b: 1, e: "🛝", f: "In Lebanese French schools, recess is called “la récré.” It is the best part of the day for lots of kids!",
   q: "What is recess called in Lebanese French schools?", o: ["La récré", "La siesta", "Le lunch", "Le snack attack"] },
 { b: 1, e: "🎶", f: "Lebanese kids sing their national anthem, “Kulluna lil watan,” at school. Its name means “All of us, for our country.”",
   q: "What does “Kulluna lil watan” mean?", o: ["All of us, for our country", "Good morning, teacher", "Let’s go, team", "Happy cedar day"] },
 { b: 1, e: "🌙", f: "Eid al-Fitr comes right after Ramadan, a month when many people fast from sunrise to sunset. Families celebrate with a big feast, sweets and new clothes!",
   q: "What comes right before Eid al-Fitr?", o: ["A month of fasting called Ramadan", "A week of school tests", "A month of snow days", "A year of pancakes"] },
 { b: 1, e: "🏮", f: "During Ramadan, streets and homes in Lebanon are decorated with glowing lanterns and lights, a bit like Christmas lights here.",
   q: "How are streets decorated during Ramadan?", o: ["With lanterns and lights", "With pumpkins", "With snowmen", "With giant balloons only"] },
 { b: 1, e: "🃏", f: "Lebanese families love card games like Tarneeb and Trix, played in teams. Kids often learn them at Teta’s house after Sunday lunch.",
   q: "What are Tarneeb and Trix?", o: ["Card games played in teams", "Kinds of cookies", "Dances", "Soccer teams"] },
 { b: 1, e: "🪁", f: "In Arabic, a kite is called a “tayyara waraq,” which means “paper airplane”! Kids fly kites on beaches and rooftops in spring.",
   q: "What does the Arabic word for kite mean?", o: ["Paper airplane", "Flying fish", "Sky balloon", "Bird with a string"] },
 { b: 1, e: "🌙", f: "Lebanese families often eat dinner late, and at weddings and big family parties kids stay up dancing past midnight!",
   q: "At a big Lebanese family party, kids often stay up until…", o: ["After midnight", "7 o’clock", "Right after lunch", "Next Tuesday"] },
 { b: 1, e: "🏪", f: "Lebanese kids are often sent to the little corner shop, called the “dekkene,” to buy bread or milk for the family.",
   q: "What is a “dekkene”?", o: ["A little corner shop", "A school bus", "A kind of cookie", "A pet dragon"] },
 { b: 1, e: "🫒", f: "In the fall, many Lebanese families pick olives together. Kids help shake the branches and gather the olives from sheets on the ground.",
   q: "What do many Lebanese families pick together in the fall?", o: ["Olives", "Apples", "Pumpkins", "Marshmallows"] },
 { b: 1, e: "🐦", f: "Many Lebanese families keep singing birds like canaries and goldfinches on the balcony, and they sing every morning.",
   q: "Which pet might you hear singing on a Lebanese balcony?", o: ["A canary", "A rooster", "A frog", "A singing hamster"] },
 { b: 1, e: "⚽", f: "Captain Majid is a soccer cartoon from Japan, dubbed into Arabic. Lots of Lebanese grown-ups watched it as kids. In English it is called Captain Tsubasa.",
   q: "What is the cartoon Captain Majid about?", o: ["Soccer", "Pirates", "Space", "Dancing broccoli"] },
 { b: 1, e: "🕷️", f: "Lebanese kids today love lots of the same shows you do, like Spider-Man, Pokémon and Bluey, often watched in Arabic or French!",
   q: "In which languages might Lebanese kids watch Spider-Man?", o: ["Arabic or French", "Only Spanish", "Only Japanese", "Dolphin"] }
];
/* Two question lists. List A is all of QA. List B (marked b: 1) keeps only kid-relatable facts (school, family,
   weekends, games) and comparisons to things kids know (San Diego, the ABCs, Halloween, movies): 70 questions.
   Every device must use the same list, so the choice is made here, not in the URL. */
var ACTIVE_LIST = 'B';
var Q = ACTIVE_LIST === 'A' ? QA : QA.filter(function (x) { return x.b; });

/* ---------- seeded randomness so every device agrees ---------- */
function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shuffled(n, seed) { var r = rng(seed), a = []; for (var i = 0; i < n; i++) a.push(i); for (var j = n - 1; j > 0; j--) { var k = Math.floor(r() * (j + 1)), t = a[j]; a[j] = a[k]; a[k] = t; } return a; }
var permCache = {};
/* which fact a cycle shows (question order reshuffles every loop through Q) */
function loopOrder(loop) {
  if (permCache[loop]) return permCache[loop];
  var p = shuffled(Q.length, loop * 7919 + 17), prevLast = shuffled(Q.length, (loop - 1) * 7919 + 17)[Q.length - 1];
  if (p[0] === prevLast) { var t = p[0]; p[0] = p[1]; p[1] = t; }   // a new loop never repeats the fact that ended the last one
  return (permCache[loop] = p);
}
function itemFor(cycle) {
  var loop = Math.floor(cycle / Q.length), pos = ((cycle % Q.length) + Q.length) % Q.length;
  return loopOrder(loop)[pos];
}
function factFor(cycle) { var b = Q[itemFor(cycle)]; return { e: b.e, f: b.f }; }
/* A cycle's question is about the PREVIOUS cycle's fact, so players have to remember it: the fact they need left the
   screen one question earlier. Answer order is shuffled per cycle. */
function questionFor(cycle) {
  var id = itemFor(cycle - 1), base = Q[id], order = shuffled(4, cycle * 31 + 5), opts = [], right = 0;
  order.forEach(function (oi, i) { opts.push(base.o[oi]); if (oi === 0) right = i; });
  return { id: id, e: base.e, f: base.f, q: base.q, opts: opts, right: right };
}

/* ---------- clock (lined up with Firestore's server time) ---------- */
var offset = 0, synced = false;
function now() { return Date.now() + offset; }
function serverMs(ts) { var m = /^(.*\.\d{3})\d*Z$/.exec(ts); return Date.parse(m ? m[1] + 'Z' : ts); }
function noteServerTime(ts, t0, t1) { var s = serverMs(ts); if (!isNaN(s)) { offset = s - (t0 + t1) / 2; synced = true; } }
/* The schedule counts from the game's start time T0 (set by Reset, kept in every shard and in the board doc), so a Reset
   starts everyone at Round 1, Question 1. Before any Reset T0 is 0 and the schedule runs from the clock alone. */
var T0 = lsGet('heritagenight.t0.' + EVENT) || 0;
function setT0(v) { if (typeof v === 'number' && v > 0 && v !== T0) { T0 = v; lsSet('heritagenight.t0.' + EVENT, v); } }
function phase(t) {
  t = (t == null ? now() : t) - T0;
  // a round is ROUND cycles; the last one's reveal is T.champ long instead of T.reveal
  var RL = ROUND * T.cycle - T.reveal + T.champ, r = Math.floor(t / RL), rp = t - r * RL;
  var i = Math.min(ROUND - 1, Math.floor(rp / T.cycle)), start = r * RL + i * T.cycle, cl = i === ROUND - 1 ? T.cycle - T.reveal + T.champ : T.cycle;
  var cycle = r * ROUND + i, pos = t - start, name, left, len;
  if (pos < T.fact) { name = 'fact'; left = T.fact - pos; len = T.fact; }
  else if (pos < T.fact + T.q) { name = 'question'; left = T.fact + T.q - pos; len = T.q; }
  else { name = 'reveal'; left = cl - pos; len = cl - T.fact - T.q; }
  return { cycle: cycle, name: name, left: left, len: len, qStart: T0 + start + T.fact };
}
function points(ms) { return 50 + Math.round(50 * Math.max(0, 1 - ms / T.q)); }   // right: 50, plus up to 50 for speed

/* ---------- rounds, streaks, double points (all from the cycle number, so every device agrees) ---------- */
var ROUND = 10, STREAK_AT = 3, STREAK_BONUS = 10;
function roundOf(cycle) { return Math.floor(cycle / ROUND); }
function qInRound(cycle) { return ((cycle % ROUND) + ROUND) % ROUND + 1; }           // 1..10
function isDouble(cycle) { return rng(cycle * 7907 + 3)() < 1 / 8; }                  // about 1 in 8
/* points for a right answer: speed points, +10 once the streak (counting this answer) is 3+, all doubled on a double cycle */
function award(ms, streak, cycle) { return (points(ms) + (streak >= STREAK_AT ? STREAK_BONUS : 0)) * (isDouble(cycle) ? 2 : 1); }
/* top scorers of one round (rs only counts when r is that round) */
function roundTop(players, round) {
  return Object.keys(players).map(function (k) { var p = players[k]; return { id: k, n: p.n, a: p.a, g: p.g || '', rs: p.r === round ? p.rs || 0 : 0, j: p.j || 0 }; })
    .filter(function (p) { return p.rs > 0; }).sort(function (x, y) { return y.rs - x.rs || x.j - y.j; });
}
/* a streak shows only if the player answered the last question (or this one) */
function onFire(p, cycle) { return (p.st || 0) >= STREAK_AT && p.q >= cycle - 1; }

/* ---------- avatars, names and grades ---------- */
/* the player taps an avatar; the game makes the name (adjective + the avatar's noun), so nothing is ever typed */
var ADJ = ['Happy', 'Brave', 'Speedy', 'Sunny', 'Jolly', 'Clever', 'Lucky', 'Bouncy', 'Sparkly', 'Mighty', 'Cozy', 'Zippy', 'Giggly', 'Swift', 'Golden', 'Fluffy', 'Daring', 'Cheerful', 'Snappy', 'Super', 'Rocket', 'Twinkly', 'Wiggly', 'Dancing'];
var AVATARS = [['🌲', 'Cedar'], ['🍋', 'Lemon'], ['🦊', 'Fox'], ['🐢', 'Sea Turtle'], ['🐱', 'Cat'], ['🐐', 'Mountain Goat'], ['🦉', 'Owl'], ['🦔', 'Hedgehog'],
  ['🦋', 'Butterfly'], ['🐬', 'Dolphin'], ['🧆', 'Falafel'], ['🍪', 'Ma’amoul'], ['🥙', 'Pita'], ['🍇', 'Grape'], ['🥁', 'Drummer'], ['⛵', 'Sailboat']];
var GRADES = [['tk', 'TK'], ['k', 'K'], ['1', '1st'], ['2', '2nd'], ['3', '3rd'], ['4', '4th'], ['5', '5th'], ['a', 'Grown-up']];
function gradeLabel(g) { for (var i = 0; i < GRADES.length; i++) if (GRADES[i][0] === g) return GRADES[i][1]; return ''; }
function isGrown(p) { return p && p.g === 'a'; }   // anyone without a grade counts as a kid
function randInt(n) { return crypto.getRandomValues(new Uint32Array(1))[0] % n; }
function newName(taken, av) {
  var x = AVATARS[av == null ? randInt(AVATARS.length) : av];
  for (var i = 0; i < 40; i++) { var name = ADJ[randInt(ADJ.length)] + ' ' + x[1]; if (!taken || !taken[name]) return { n: name, a: x[0] }; }
  return { n: ADJ[randInt(ADJ.length)] + ' ' + x[1] + ' ' + (2 + randInt(98)), a: x[0] };
}

/* ---------- Kids vs Grown-ups tug-of-war ----------
   Every question is one pull: the side with the higher average points on THAT question pulls the rope one notch.
   A side's average covers everyone on it who is playing now (answered this question or one of the 5 before it; a wrong
   answer or a skipped question counts 0, so guessing never hurts the team more than skipping) plus its robot helpers; kids' average counts KID_BONUS times
   (tuned by simulation for a close night). Each side is topped up to BOT_FILL with labelled robot helpers until enough real
   players join. Robots are not very smart (ROBOT_RIGHT chance, slow answers, seeded so every device agrees), never appear on
   the leaderboard, and a pull won by a side with no real answer can't give that side the lead (the screen enforces this). */
var KID_BONUS = 1.8, BOT_FILL = 5, ROBOT_RIGHT = 0.35;
function robotPts(cycle, side, i) { var r = rng(cycle * 92821 + side * 613 + i * 37 + 11); return r() < ROBOT_RIGHT ? 50 + Math.round(50 * 0.15 * r()) : 0; }
function pull(players, cycle) {
  var t = [{ n: 0, pts: 0, ans: 0, real: 0 }, { n: 0, pts: 0, ans: 0, real: 0 }];   // 0 = kids, 1 = grown-ups
  for (var id in players) {
    var p = players[id], x = t[isGrown(p) ? 1 : 0]; x.n++;
    if (p.q === cycle) { x.ans++; x.real++; if (p.k) x.pts += award(p.t || 0, p.st || 0, cycle); }
    else if (p.q >= cycle - 5) x.ans++;   // playing now but skipped this one: counts 0
  }
  var avg = t.map(function (x, side) {
    x.bots = Math.max(0, BOT_FILL - x.n); var pts = x.pts, n = x.ans;
    for (var i = 0; i < x.bots; i++) { pts += robotPts(cycle, side, i); n++; }
    return n ? pts / n : 0;
  });
  var kid = KID_BONUS * avg[0], gr = avg[1], winner = kid > gr ? 'kids' : gr > kid ? 'grown' : '';
  return { kids: t[0].n, grown: t[1].n, kidBots: t[0].bots, grownBots: t[1].bots, winner: winner,
    robotOnly: winner === 'kids' ? !t[0].real : winner === 'grown' ? !t[1].real : false };
}
/* the rope after one pull: notches from -8 (grown-ups) to +8 (kids); a robots-only win can't put its side ahead */
function movePos(pos, pl) {
  if (!pl.winner) return pos;
  var next = Math.max(-8, Math.min(8, pos + (pl.winner === 'kids' ? 1 : -1)));
  if (pl.robotOnly && (pl.winner === 'kids' ? next > 0 : next < 0)) return pos;
  return next;
}
/* kids-only or grown-ups-only ranking (the big leaderboard and Round Champion are for kids) */
function kidsOnly(list) { return list.filter(function (p) { return p.g !== 'a'; }); }

/* ---------- 🍫 chocolate lira prizes ----------
   At the end of a prize round the big screen picks the top 3 kids by round points who haven't reached the win limit;
   1st wins PRIZES[0] chocolate lira, 2nd PRIZES[1], 3rd PRIZES[2]. The host page sets how often (ctrl.every: every N
   rounds, 0 = off) and the limit (ctrl.max wins per kid tonight, counting host calls too). Defaults: every round, 1 win. */
var PRIZES = [3, 2, 1];
function liraText(n) { return n + ' chocolate lira'; }
function prizeRules(ctrl) {
  ctrl = ctrl || {};
  return { every: ctrl.every == null ? 1 : Math.max(0, +ctrl.every || 0), max: ctrl.max == null ? 1 : Math.max(1, +ctrl.max || 1) };
}
/* wins so far tonight: every round winner in the champs log plus every host call */
function winCounts(champs, ctrl) {
  var w = {}, r = champs && champs.r || {}, calls = ctrl && ctrl.calls || {};
  for (var k in r) (r[k].win || []).forEach(function (p) { w[p.id] = (w[p.id] || 0) + 1; });
  for (var id in calls) w[id] = (w[id] || 0) + (calls[id].n || 1);
  return w;
}
/* A winner's points go back to 0 (so the board stays open for newer players, and a winner who plays on starts again).
   Each phone owns its own score, so the phone zeroes itself when it learns of the win and counts it in `wz`; until then
   the screen and host page already show it as 0: a player with more wins than zeroings counts as 0 points. */
function afterWins(players, champs, ctrl) {
  var w = winCounts(champs, ctrl), out = {};
  for (var id in players) { var p = players[id]; out[id] = (w[id] || 0) > (p.wz || 0) ? Object.assign({}, p, { s: 0, rs: 0, st: 0 }) : p; }
  return out;
}
/* the round's winners: top kids by round points, skipping anyone already at the limit */
function pickWinners(top, wins, max) {
  var out = [], maxed = [];
  top.forEach(function (p) {
    if (out.length >= PRIZES.length) return;
    if ((wins[p.id] || 0) >= max) { if (!out.length) maxed.push(p); return; }
    out.push(p);
  });
  return { win: out.map(function (p, i) { return { id: p.id, n: p.n, a: p.a, g: p.g, rs: p.rs, place: i, lira: PRIZES[i] }; }), maxed: maxed.slice(0, 2) };
}
/* is round `label` (the big screen's Round 1, 2, 3 ...) a prize round, and how many questions until the next prize
   (counting the one on screen now); null when prizes are off */
function isPrizeRound(label, every) { return every > 0 && label > 0 && label % every === 0; }
function questionsToPrize(cycle, label, every) {
  if (!(every > 0) || !(label > 0)) return null;
  return ((every - label % every) % every) * ROUND + ROUND - qInRound(cycle) + 1;
}

/* ---------- Firestore over REST (anonymous auth, like the other games) ---------- */
var AUTH_KEY = 'heritagenight.auth';
function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
var tokP = null;
function token() {
  if (tokP) return tokP;
  tokP = (async function () {
    var a = lsGet(AUTH_KEY);
    if (a && a.id && a.exp > Date.now() + 120000) return a.id;
    if (a && a.refresh) {
      try {
        var r = await fetch('https://securetoken.googleapis.com/v1/token?key=' + FB.key, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(a.refresh) });
        if (r.ok) { var j = await r.json(); a = { id: j.id_token, refresh: j.refresh_token, exp: Date.now() + (+j.expires_in) * 1000 }; lsSet(AUTH_KEY, a); return a.id; }
      } catch (e) { }
    }
    var r2 = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + FB.key, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }) });
    if (!r2.ok) throw new Error('auth ' + r2.status);
    var j2 = await r2.json(); a = { id: j2.idToken, refresh: j2.refreshToken, exp: Date.now() + (+j2.expiresIn) * 1000 }; lsSet(AUTH_KEY, a); return a.id;
  })();
  tokP.then(function () { setTimeout(function () { tokP = null; }, 5 * 60000); }, function () { tokP = null; });
  return tokP;
}
/* the Firestore rules only allow doc ids of 16+ characters, so the name is padded out with 'leaderboard' */
function docId(name) { return 'hn_' + EVENT + '_leaderboard_' + name; }
async function getDoc(name) {
  var t = await token();
  var r = await fetch(BASE + docId(name), { headers: { Authorization: 'Bearer ' + t }, cache: 'no-store' });
  if (r.status === 404) return { data: null, updateTime: null };
  if (!r.ok) throw new Error('get ' + r.status);
  var j = await r.json(), s = j.fields && j.fields.data && j.fields.data.stringValue;
  return { data: s ? JSON.parse(s) : null, updateTime: j.updateTime };
}
/* returns {ok, updateTime} or {conflict:true}; updateTime null => must not exist yet; 'any' => unconditional */
async function putDoc(name, data, updateTime) {
  var t = await token();
  var q = updateTime === 'any' ? '' : updateTime ? '?currentDocument.updateTime=' + encodeURIComponent(updateTime) : '?currentDocument.exists=false';
  var body = { fields: { data: { stringValue: JSON.stringify(data) }, updated: { integerValue: String(Date.now()) }, v: { integerValue: '1' } } };
  var t0 = Date.now();
  var r = await fetch(BASE + docId(name) + q, { method: 'PATCH', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  var t1 = Date.now();
  if (r.ok) { var j = await r.json(); noteServerTime(j.updateTime, t0, t1); return { ok: true, updateTime: j.updateTime }; }
  if (r.status === 400 || r.status === 409 || r.status === 404 || r.status === 412) return { conflict: true };
  throw new Error('put ' + r.status);
}
function shardOf(pid) { var h = 2166136261; for (var i = 0; i < pid.length; i++) { h ^= pid.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % SHARDS; }
/* all players, as {pid: entry} */
/* robot helpers are never stored as players; anything wearing the robot avatar is dropped anyway so it can never be listed or win */
function isBot(p) { return !p || p.a === '🤖'; }
async function allPlayers() {
  var res = await Promise.all(Array.from({ length: SHARDS }, function (_, i) { return getDoc('s' + i).catch(function () { return null; }); }));
  var out = {}, ok = 0;
  res.forEach(function (d, i) { if (!d) return; ok++; if (i === 0) { game = (d.data && d.data.z) || ''; setT0(d.data && d.data.t0); } var p = d.data && d.data.p; if (p) for (var k in p) if (!isBot(p[k])) out[k] = p[k]; });
  if (!ok) throw new Error('offline');
  return out;
}
/* Reset: every shard carries the game id `z`. The big screen's Reset button empties all shards under a new id; a phone whose
   player was made under another id (entry.z) is told {reset:true} and starts over. A new player (no z yet) adopts the shard's. */
var game = null;
async function saveEntry(pid, entry) {
  var name = 's' + shardOf(pid);
  for (var i = 0; i < 8; i++) {
    var d = await getDoc(name), data = d.data || { p: {} }, z = data.z || '';
    if (entry.z != null && entry.z !== z) return { reset: true };
    setT0(data.t0);
    entry.z = z; data.p = data.p || {}; data.p[pid] = entry;
    var r = await putDoc(name, data, d.updateTime);
    if (r.ok) return { ok: true, z: z };
    await new Promise(function (res) { setTimeout(res, 120 + Math.random() * 500 * (i + 1)); });
  }
  throw new Error('busy');
}
async function resetAll() {
  var z = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  var t0 = Math.round(now()) - 500;   // Round 1, Question 1 starts now
  await Promise.all(Array.from({ length: SHARDS }, function (_, i) { return putDoc('s' + i, { p: {}, z: z, t0: t0 }, 'any'); }));
  game = z; setT0(t0); return z;
}
/* read-modify-write of a small shared doc (board, ctrl, champs), retried on conflict like saveEntry */
async function updateDoc(name, fn) {
  for (var i = 0; i < 8; i++) {
    var d = await getDoc(name), data = fn(d.data || {});
    var r = await putDoc(name, data, d.updateTime);
    if (r.ok) return data;
    await new Promise(function (res) { setTimeout(res, 150 + Math.random() * 400 * (i + 1)); });
  }
  throw new Error('busy');
}
async function readDoc(name) { return (await getDoc(name)).data; }
/* The host page (host.html) unlocks with a secret key in its address (#k=...). Only its SHA-256 is stored here, since
   this repo is public. It keeps kids out of the host page; it is not strong security. */
var HOST_HASH = '90c774c999886bd134b1e46090fe688e3dc937d407733b3055fbe3222c3a2369';
async function hostKeyOk(key) {
  if (!key || !crypto.subtle) return false;
  var b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return Array.from(new Uint8Array(b)).map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join('') === HOST_HASH;
}
/* a short code a winner shows at the prize table, matched on the host page */
function prizeCode(pid) { return String(pid || '').slice(0, 4).toUpperCase(); }
/* the screen keeps its clock honest by touching a tiny doc of its own */
async function syncClock() { try { await putDoc('clock', { at: Date.now() }, 'any'); } catch (e) { } }

function rank(players) {
  return Object.keys(players).map(function (k) { var p = players[k]; return { id: k, n: p.n, a: p.a, g: p.g || '', st: p.st || 0, q: p.q, s: p.s || 0, c: p.c || 0, j: p.j || 0 }; })
    .sort(function (x, y) { return y.s - x.s || y.c - x.c || x.j - y.j; });
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

/* New versions load by themselves: every 2 minutes each page re-reads its own HTML (from GitHub Pages, not Firestore);
   when the hn-core.js?v= number there changes, the page reloads at the start of the next fact card, so the TV never
   needs a hand reload and nobody is cut off mid-question. The phase is checked every second so the 3 s window is never missed. */
function watchVersion() {
  var tag = document.querySelector('script[src*="hn-core.js"]'), v = tag && (tag.getAttribute('src').match(/v=(\d+)/) || [])[1];
  if (!v) return;
  var pending = false, ticks = 0;
  setInterval(async function () {
    if (!pending && ++ticks % 120 === 0) {
      try {
        var t = await (await fetch(location.pathname + '?vcheck=' + Date.now(), { cache: 'no-store' })).text();
        var n = (t.match(/hn-core\.js\?v=(\d+)/) || [])[1];
        if (n && n !== v) pending = true;
      } catch (e) { }
    }
    var ph = phase();
    if (pending && ph.name === 'fact' && ph.left > T.fact - 3000) {   // a fresh copy, not the browser's cached one
      var q = location.search.replace(/[?&]_v=[^&]*/g, '').replace(/^&/, '?');
      location.replace(location.pathname + (q ? q + '&' : '?') + '_v=' + Date.now() + location.hash);
    }
  }, 1000);
}
if (typeof document !== 'undefined') watchVersion();

window.HN = { Q: Q, T: T, EVENT: EVENT, FAST: FAST, PLAY_URL: PLAY_URL, questionFor: questionFor, factFor: factFor, phase: phase, now: now, points: points, ROUND: ROUND, STREAK_AT: STREAK_AT, roundOf: roundOf, qInRound: qInRound, isDouble: isDouble, award: award, roundTop: roundTop, onFire: onFire,
  isSynced: function () { return synced; }, newName: newName, AVATARS: AVATARS, GRADES: GRADES, gradeLabel: gradeLabel, isGrown: isGrown, pull: pull, movePos: movePos, kidsOnly: kidsOnly, allPlayers: allPlayers, saveEntry: saveEntry, resetAll: resetAll, readDoc: readDoc, putDoc: putDoc, updateDoc: updateDoc, hostKeyOk: hostKeyOk, prizeCode: prizeCode, PRIZES: PRIZES, liraText: liraText, prizeRules: prizeRules, winCounts: winCounts, afterWins: afterWins, pickWinners: pickWinners, isPrizeRound: isPrizeRound, questionsToPrize: questionsToPrize, game: function () { return game; }, t0: function () { return T0; }, setT0: setT0, syncClock: syncClock, rank: rank, esc: esc, lsGet: lsGet, lsSet: lsSet };
})();
