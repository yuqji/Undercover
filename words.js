// Word packs for Undercover.
// The room owner picks any mix of packs (at least one). New rooms start with "basic".
// Each entry is [wordA, wordB]. Civilians get one word, the Undercover the other (random each game).
// Mr. White's hint is the category: Basic uses its sub-category, other packs use the pack name.
// To add a pack: copy one block, give it a new id, name and pairs. Keep words well known and office-friendly.

const PACKS = {
  basic: {
    name: "Basic",
    blurb: "Everyday words everyone knows",
    groups: {
      "Food & drink": [
        ["Coffee", "Tea"], ["Pizza", "Burger"], ["Sushi", "Tacos"], ["Pancake", "Waffle"], ["Donut", "Bagel"],
        ["Ice cream", "Frozen yogurt"], ["Cupcake", "Muffin"], ["Ketchup", "Mustard"], ["Lemon", "Lime"], ["Strawberry", "Cherry"],
        ["Popcorn", "Chips"], ["Spaghetti", "Ramen"], ["Croissant", "Pretzel"], ["Milkshake", "Smoothie"], ["Cookie", "Brownie"],
        ["Wine", "Beer"], ["Avocado", "Mango"], ["Hot dog", "Sandwich"], ["Cereal", "Oatmeal"], ["Honey", "Maple syrup"],
        ["Peanut butter", "Nutella"], ["Salad", "Soup"], ["Orange juice", "Lemonade"], ["Cheese", "Butter"],
      ],
      Animals: [
        ["Tiger", "Lion"], ["Dog", "Wolf"], ["Cat", "Fox"], ["Dolphin", "Shark"], ["Penguin", "Owl"],
        ["Rabbit", "Hamster"], ["Eagle", "Parrot"], ["Horse", "Zebra"], ["Frog", "Turtle"], ["Butterfly", "Bee"],
        ["Elephant", "Hippo"], ["Monkey", "Gorilla"], ["Spider", "Ant"], ["Squirrel", "Raccoon"], ["Panda", "Koala"],
        ["Goldfish", "Octopus"],
      ],
      "Work & office": [
        ["Zoom", "Teams"], ["Slack", "Email"], ["Excel", "PowerPoint"], ["Laptop", "Tablet"], ["Stapler", "Tape"],
        ["Printer", "Scanner"], ["Coworker", "Boss"], ["Meeting", "Webinar"], ["Deadline", "Reminder"], ["Promotion", "Raise"],
        ["Interview", "Exam"], ["Badge", "Lanyard"], ["Whiteboard", "Sticky note"], ["Calendar", "Clock"], ["Headphones", "Speaker"],
        ["Keyboard", "Mouse"], ["Desk", "Table"], ["Elevator", "Escalator"], ["Password", "PIN"], ["Vacation", "Weekend"],
        ["Overtime", "Night shift"], ["Lunch break", "Coffee break"], ["Resume", "Cover letter"],
      ],
      "Everyday things": [
        ["Pillow", "Blanket"], ["Shower", "Bathtub"], ["Sofa", "Bed"], ["Umbrella", "Raincoat"], ["Toothbrush", "Comb"],
        ["Candle", "Lamp"], ["Mirror", "Window"], ["Fridge", "Freezer"], ["Microwave", "Oven"], ["Backpack", "Suitcase"],
        ["Wallet", "Purse"], ["Sneakers", "Sandals"], ["Sunglasses", "Glasses"], ["Hat", "Helmet"], ["Scarf", "Tie"],
        ["Watch", "Bracelet"], ["Socks", "Gloves"], ["Key", "Lock"], ["Soap", "Shampoo"], ["Broom", "Vacuum"],
        ["Text message", "Phone call"], ["Selfie", "Group photo"], ["Alarm clock", "Snooze button"], ["Gift card", "Coupon"], ["Credit card", "Cash"],
      ],
      "Places & travel": [
        ["Beach", "Pool"], ["Airport", "Train station"], ["Hotel", "Hospital"], ["Library", "Bookstore"], ["Mountain", "Volcano"],
        ["Desert", "Island"], ["Paris", "London"], ["Gym", "Park"], ["Restaurant", "Cafe"], ["Museum", "Zoo"],
        ["Taxi", "Bus"], ["Bicycle", "Scooter"], ["Airplane", "Helicopter"], ["Boat", "Submarine"], ["Camping", "Picnic"],
        ["Castle", "Palace"], ["Road trip", "Cruise"], ["Passport", "Ticket"],
      ],
      "Fun & life": [
        ["Christmas", "Thanksgiving"], ["Halloween", "Birthday"], ["Wedding", "Graduation"], ["Netflix", "YouTube"], ["Instagram", "TikTok"],
        ["Movie", "TV show"], ["Chess", "Checkers"], ["Karaoke", "Dancing"], ["Roller coaster", "Ferris wheel"], ["Magician", "Clown"],
        ["Superhero", "Villain"], ["Ghost", "Zombie"], ["Robot", "Alien"], ["Snow", "Rain"], ["Sun", "Moon"],
        ["Rainbow", "Fireworks"], ["Summer", "Spring"], ["Doctor", "Nurse"], ["Chef", "Waiter"], ["Teacher", "Student"],
        ["Pilot", "Astronaut"], ["Police officer", "Firefighter"],
      ],
    },
  },

  sports: {
    name: "Sports",
    blurb: "Games, gear and big events",
    pairs: [
      ["Football", "Rugby"], ["Basketball", "Volleyball"], ["Tennis", "Badminton"], ["Golf", "Bowling"], ["Baseball", "Cricket"],
      ["Skiing", "Snowboarding"], ["Swimming", "Diving"], ["Boxing", "Wrestling"], ["Marathon", "Sprint"], ["Hockey", "Lacrosse"],
      ["Surfing", "Skateboarding"], ["Cycling", "Running"], ["Yoga", "Pilates"], ["Karate", "Judo"], ["Referee", "Coach"],
      ["Goal", "Touchdown"], ["Stadium", "Arena"], ["Trophy", "Medal"], ["Olympics", "World Cup"], ["Archery", "Darts"],
      ["Ice skating", "Roller skating"], ["Rowing", "Kayaking"], ["Climbing", "Hiking"], ["Gymnastics", "Ballet"], ["Ping pong", "Air hockey"],
      ["Jersey", "Uniform"], ["Dumbbell", "Treadmill"], ["Penalty", "Foul"],
    ],
  },

  music: {
    name: "Music",
    blurb: "Instruments, genres and gigs",
    pairs: [
      ["Guitar", "Ukulele"], ["Piano", "Organ"], ["Violin", "Cello"], ["Drum", "Tambourine"], ["Trumpet", "Saxophone"],
      ["Flute", "Clarinet"], ["Rock", "Jazz"], ["Pop", "Hip hop"], ["Opera", "Musical"], ["Concert", "Festival"],
      ["Band", "Choir"], ["Singer", "Rapper"], ["DJ", "Producer"], ["Microphone", "Megaphone"], ["Album", "Playlist"],
      ["Vinyl", "Cassette"], ["Lullaby", "Anthem"], ["Spotify", "Radio"], ["Lyrics", "Melody"], ["Conductor", "Composer"],
      ["Harp", "Banjo"], ["Tour", "Gig"], ["Country", "Blues"], ["Orchestra", "Marching band"], ["Beat", "Rhythm"],
      ["Duet", "Trio"],
    ],
  },

  food: {
    name: "Food",
    blurb: "More dishes, snacks and drinks",
    pairs: [
      ["Dumpling", "Ravioli"], ["Burrito", "Quesadilla"], ["Lasagna", "Mac and cheese"], ["Steak", "Pork chop"], ["Bacon", "Sausage"],
      ["Shrimp", "Lobster"], ["Salmon", "Tuna"], ["Rice", "Noodles"], ["Garlic", "Onion"], ["Chili", "Curry"],
      ["Pie", "Tart"], ["Cheesecake", "Tiramisu"], ["Pudding", "Jelly"], ["Caramel", "Chocolate"], ["Vanilla", "Cinnamon"],
      ["Salt", "Pepper"], ["Mayonnaise", "Ranch"], ["Toast", "Biscuit"], ["Fries", "Hash browns"], ["Watermelon", "Cantaloupe"],
      ["Pineapple", "Coconut"], ["Blueberry", "Raspberry"], ["Peach", "Apricot"], ["Broccoli", "Cauliflower"], ["Carrot", "Celery"],
      ["Cucumber", "Zucchini"], ["Espresso", "Cappuccino"], ["Soda", "Sparkling water"], ["Champagne", "Cocktail"], ["Brunch", "Buffet"],
      ["Barbecue", "Hot pot"],
    ],
  },

  geography: {
    name: "Geography",
    blurb: "Countries, cities and wild places",
    pairs: [
      ["Ocean", "Lake"], ["River", "Waterfall"], ["Canyon", "Valley"], ["Glacier", "Iceberg"], ["Jungle", "Forest"],
      ["Cave", "Tunnel"], ["Japan", "Korea"], ["China", "India"], ["Brazil", "Argentina"], ["Canada", "Australia"],
      ["Italy", "Spain"], ["Egypt", "Greece"], ["Mexico", "Cuba"], ["New York", "Los Angeles"], ["Tokyo", "Seoul"],
      ["Rome", "Athens"], ["Mississippi", "Nile"], ["Sahara", "Antarctica"], ["Hawaii", "Bahamas"], ["Alaska", "Siberia"],
      ["Everest", "Kilimanjaro"], ["Atlantic", "Pacific"], ["Europe", "Asia"], ["Map", "Globe"], ["Compass", "GPS"],
      ["Earthquake", "Tsunami"], ["Tornado", "Hurricane"], ["Las Vegas", "Miami"], ["Texas", "California"],
    ],
  },

  history: {
    name: "History",
    blurb: "Empires, inventions and famous names",
    pairs: [
      ["Pyramid", "Sphinx"], ["Pharaoh", "Emperor"], ["Knight", "Samurai"], ["Viking", "Pirate"], ["Gladiator", "Soldier"],
      ["Dinosaur", "Mammoth"], ["Cowboy", "Sheriff"], ["King", "President"], ["Queen", "Princess"], ["Crown", "Throne"],
      ["Sword", "Shield"], ["Telegraph", "Telephone"], ["Printing press", "Typewriter"], ["Columbus", "Magellan"], ["Napoleon", "Caesar"],
      ["Lincoln", "Washington"], ["Einstein", "Newton"], ["Shakespeare", "Dickens"], ["Great Wall", "Colosseum"], ["Titanic", "Mayflower"],
      ["Declaration", "Constitution"], ["Mummy", "Fossil"], ["Empire", "Kingdom"], ["Medieval", "Renaissance"], ["Explorer", "Pioneer"],
      ["Revolution", "Rebellion"], ["Spy", "Detective"],
    ],
  },

  science: {
    name: "Science & tech",
    blurb: "Space, labs and gadgets",
    pairs: [
      ["Atom", "Molecule"], ["Planet", "Star"], ["Galaxy", "Universe"], ["Microscope", "Telescope"], ["Gravity", "Magnet"],
      ["Oxygen", "Hydrogen"], ["Battery", "Charger"], ["Drone", "Satellite"], ["Rocket", "Spaceship"], ["Virus", "Bacteria"],
      ["DNA", "Cell"], ["Laboratory", "Classroom"], ["Wi-Fi", "Bluetooth"], ["Smartphone", "Smartwatch"], ["App", "Website"],
      ["Wikipedia", "Encyclopedia"], ["Chatbot", "Search engine"], ["USB", "Cloud"], ["Thunder", "Lightning"], ["Eclipse", "Comet"],
      ["Asteroid", "Meteor"], ["Recycling", "Compost"], ["Solar panel", "Wind turbine"], ["Chemistry", "Physics"], ["Experiment", "Theory"],
    ],
  },

  brands: {
    name: "Brands",
    blurb: "Companies everyone knows",
    pairs: [
      ["Apple", "Samsung"], ["Google", "Microsoft"], ["Amazon", "Walmart"], ["Nike", "Adidas"], ["Coca-Cola", "Pepsi"],
      ["McDonald's", "Burger King"], ["Starbucks", "Dunkin'"], ["Hulu", "Disney+"], ["Uber", "Lyft"], ["Tesla", "Ford"],
      ["Toyota", "Honda"], ["Target", "Costco"], ["IKEA", "Home Depot"], ["Facebook", "LinkedIn"], ["Visa", "Mastercard"],
      ["PayPal", "Venmo"], ["FedEx", "UPS"], ["Airbnb", "Expedia"], ["Lego", "Play-Doh"], ["Nintendo", "PlayStation"],
      ["Chipotle", "Taco Bell"], ["KFC", "Popeyes"], ["Subway", "Domino's"], ["Gucci", "Prada"], ["Red Bull", "Monster"],
      ["Oreo", "KitKat"], ["Delta", "United"], ["Marriott", "Hilton"], ["Zara", "H&M"], ["DoorDash", "Instacart"],
    ],
  },

  memes: {
    name: "Internet & memes",
    blurb: "Online life, slang and viral stuff",
    pairs: [
      ["Doge", "Grumpy Cat"], ["Rickroll", "Clickbait"], ["Meme", "GIF"], ["Emoji", "Sticker"], ["Hashtag", "Mention"],
      ["Influencer", "YouTuber"], ["Viral", "Trending"], ["Like", "Share"], ["Follower", "Subscriber"], ["Troll", "Bot"],
      ["Spam", "Scam"], ["Podcast", "Livestream"], ["Unboxing", "Review"], ["FOMO", "YOLO"], ["LOL", "OMG"],
      ["Ghosting", "Blocking"], ["Thumbs up", "Heart"], ["Reddit", "Twitter"], ["Snapchat", "WhatsApp"], ["Wordle", "Sudoku"],
      ["Among Us", "Minecraft"], ["Fortnite", "Roblox"], ["NPC", "Main character"], ["Plot twist", "Spoiler"], ["Screenshot", "Photoshop"],
      ["Catfish", "Fake account"], ["Cringe", "Awkward"], ["Vibe", "Mood"], ["Hot take", "Rant"],
    ],
  },

  celebrities: {
    name: "Celebrities",
    blurb: "Stars, athletes and famous faces",
    pairs: [
      ["Taylor Swift", "Beyoncé"], ["Rihanna", "Lady Gaga"], ["Justin Bieber", "Ed Sheeran"], ["Drake", "Kanye West"], ["Elon Musk", "Jeff Bezos"],
      ["Bill Gates", "Steve Jobs"], ["Oprah", "Ellen"], ["Tom Cruise", "Brad Pitt"], ["Leonardo DiCaprio", "Johnny Depp"], ["Dwayne Johnson", "Vin Diesel"],
      ["Kim Kardashian", "Paris Hilton"], ["Michael Jordan", "LeBron James"], ["Lionel Messi", "Cristiano Ronaldo"], ["Serena Williams", "Roger Federer"], ["Tiger Woods", "Usain Bolt"],
      ["Michael Jackson", "Elvis"], ["Madonna", "Britney Spears"], ["Ariana Grande", "Selena Gomez"], ["Keanu Reeves", "Will Smith"], ["Jennifer Lopez", "Shakira"],
      ["Gordon Ramsay", "Martha Stewart"], ["Zendaya", "Margot Robbie"], ["Tom Hanks", "Morgan Freeman"], ["Jackie Chan", "Bruce Lee"], ["BTS", "One Direction"],
      ["MrBeast", "PewDiePie"], ["Simone Biles", "Michael Phelps"],
    ],
  },

  movies: {
    name: "Movies & TV",
    blurb: "Genres, shows and famous films",
    pairs: [
      ["Comedy", "Drama"], ["Horror", "Thriller"], ["Cartoon", "Anime"], ["Sitcom", "Soap opera"], ["Sequel", "Remake"],
      ["Director", "Actor"], ["Oscar", "Grammy"], ["Red carpet", "Premiere"], ["Trailer", "Teaser"], ["Binge-watch", "Rerun"],
      ["Star Wars", "Star Trek"], ["Harry Potter", "Lord of the Rings"], ["Batman", "Spider-Man"], ["Shrek", "Toy Story"], ["Frozen", "Moana"],
      ["Jaws", "Jurassic Park"], ["Friends", "The Office"], ["Game of Thrones", "Stranger Things"], ["Mickey Mouse", "Bugs Bunny"], ["SpongeBob", "Pokémon"],
      ["James Bond", "Mission Impossible"], ["Barbie", "Oppenheimer"], ["Subtitles", "Dubbing"], ["Cinema", "Drive-in"], ["Stunt", "Special effects"],
      ["Documentary", "Reality show"], ["Cameo", "Extra"],
    ],
  },

  jobs: {
    name: "Jobs",
    blurb: "Who does what at work",
    pairs: [
      ["Lawyer", "Judge"], ["Dentist", "Surgeon"], ["Accountant", "Banker"], ["Engineer", "Architect"], ["Plumber", "Electrician"],
      ["Barista", "Bartender"], ["Mail carrier", "Delivery driver"], ["Farmer", "Gardener"], ["Photographer", "Painter"], ["Writer", "Journalist"],
      ["Mechanic", "Carpenter"], ["Hairdresser", "Makeup artist"], ["Scientist", "Inventor"], ["Programmer", "Designer"], ["Intern", "Manager"],
      ["CEO", "Founder"], ["Salesperson", "Cashier"], ["Librarian", "Professor"], ["Vet", "Zookeeper"], ["Lifeguard", "Paramedic"],
      ["Tour guide", "Flight attendant"], ["Nanny", "Babysitter"], ["Recruiter", "HR"], ["Data analyst", "Financial analyst"], ["Consultant", "Auditor"],
    ],
  },
};

// Chinese packs (words_zh.txt) join the same catalog, marked lang: "zh".
Object.assign(PACKS, require("./words_zh").PACKS);
for (const p of Object.values(PACKS)) p.lang = p.lang || "en";

// Flat list: { id, a, b, pack, hint, lang }
const ALL = [];
for (const [packId, pack] of Object.entries(PACKS)) {
  const groups = pack.groups || { [pack.name]: pack.pairs };
  for (const [hint, pairs] of Object.entries(groups))
    pairs.forEach(([a, b], i) => ALL.push({ id: `${packId}:${hint}:${i}`, a, b, pack: packId, hint, lang: pack.lang }));
}
const CATALOG = Object.entries(PACKS).map(([id, p]) => ({ id, name: p.name, blurb: p.blurb, lang: p.lang, count: ALL.filter((w) => w.pack === id).length }));

module.exports = { PACKS, ALL, CATALOG };
