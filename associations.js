// Clue words the built-in AI players can use for each secret word.
// Format: "Word: clue clue clue …" — one-word clues only, never the word itself or its partner.
// A word with no line here falls back to generic clues for its category.

const TEXT = `
Coffee: latte caffeine mug beans morning roast barista bitter
Tea: kettle leaves bag herbal green steep cup British
Pizza: slice pepperoni crust oven delivery cheesy Italian dough
Burger: patty bun grill fries beef cheeseburger fastfood lettuce
Sushi: rice raw fish Japanese chopsticks seaweed wasabi roll
Tacos: shell salsa Mexican tortilla Tuesday guacamole beef crunchy
Pancake: syrup flat stack breakfast flip batter griddle fluffy
Waffle: grid syrup crispy breakfast Belgian iron squares fluffy
Donut: glazed hole sprinkles sweet frosted fried bakery round
Bagel: hole schmear toasted sesame chewy breakfast deli round
Ice cream: scoop cone vanilla cold sundae dessert sprinkles melt
Frozen yogurt: tangy toppings cold cup healthy swirl dessert creamy
Cupcake: frosting sprinkles birthday bakery sweet liner vanilla mini
Muffin: blueberry breakfast bakery top bran bake crumb morning
Ketchup: tomato red fries bottle squeeze condiment Heinz sauce
Mustard: yellow hotdog tangy condiment Dijon spicy sauce squeeze
Lemon: sour yellow citrus squeeze zest juice tart wedge
Lime: green sour citrus margarita zest juice tart wedge
Strawberry: red seeds jam berry shortcake summer sweet field
Cherry: red pit pie stem sundae sweet tree dark
Popcorn: movie butter kernels pop salty microwave snack bucket
Chips: crunchy salty bag snack potato dip crispy party
Spaghetti: noodles meatballs Italian sauce fork pasta twirl long
Ramen: noodles broth Japanese bowl instant slurp egg soup
Croissant: flaky French buttery pastry bakery breakfast layers crescent
Pretzel: twisted salty knot soft baked snack mustard German
Milkshake: straw thick vanilla diner cold shake creamy blended
Smoothie: blender fruit healthy straw banana berries cold blended
Cookie: chocolate chips baked crunchy milk dough sweet jar
Brownie: fudge chocolate square baked gooey sweet nuts dense
Wine: grape glass red cheers vineyard bottle cork white
Beer: pint brewery foam bar cold hops lager pub
Avocado: green guacamole toast pit creamy healthy Mexican ripe
Mango: tropical sweet yellow juicy fruit summer smoothie ripe
Hot dog: sausage bun ballpark mustard grill relish stadium frank
Sandwich: bread lunch deli slice ham layers sub toasted
Cereal: bowl milk breakfast crunchy spoon box flakes morning
Oatmeal: warm porridge breakfast oats bowl healthy creamy spoon
Honey: bees sweet sticky jar golden nectar hive tea
Maple syrup: Canada pancakes sweet sticky tree golden waffles bottle
Peanut butter: jelly sandwich creamy crunchy jar nuts spread sticky
Nutella: hazelnut chocolate spread jar toast crepes sweet Italian
Salad: lettuce healthy greens dressing bowl fresh leafy vegetables
Soup: bowl spoon warm broth hot chicken noodle winter
Orange juice: breakfast citrus glass pulp vitamin morning fresh carton
Lemonade: stand sour sweet summer pitcher yellow ice refreshing
Cheese: cheddar mouse slice dairy melt pizza cracker yellow
Butter: toast spread dairy yellow melt stick creamy popcorn
Tiger: stripes jungle roar orange predator cat wild fierce
Lion: mane king roar savanna pride Africa cat fierce
Dog: bark puppy fetch leash loyal pet walk tail
Wolf: howl pack moon wild fangs forest grey hunter
Cat: meow purr whiskers kitten litter pet nap claws
Fox: sly orange bushy clever forest tail wild den
Dolphin: smart ocean flipper clicks friendly swim marine jump
Shark: fin teeth ocean predator Jaws bite swim scary
Penguin: tuxedo ice waddle Antarctica cold flightless fish huddle
Owl: hoot night wise feathers eyes nocturnal bird tree
Rabbit: hop carrot ears bunny fluffy burrow Easter fast
Hamster: wheel cage tiny cheeks pet fluffy rodent cute
Eagle: soar talons beak America feathers wings nest hunter
Parrot: talk colorful pirate feathers tropical beak squawk bird
Horse: gallop saddle mane hooves ride stable neigh racing
Zebra: stripes Africa savanna black white herd hooves wild
Frog: green jump pond croak lily slimy tadpole tongue
Turtle: shell slow pond reptile ancient swim green tortoise
Butterfly: wings colorful flutter caterpillar garden flower pretty spring
Bee: buzz honey sting hive yellow flower pollen busy
Elephant: trunk tusks gray huge memory Africa ears heavy
Hippo: river huge Africa mouth heavy gray water yawn
Monkey: banana climb tree swing playful jungle tail cheeky
Gorilla: strong silverback jungle huge chest ape primate Africa
Spider: web eight legs creepy silk crawl bite fangs
Ant: tiny colony hill picnic worker queen march strong
Squirrel: nuts acorn tree bushy park climb fluffy hide
Raccoon: mask trash night bandit striped clever tail sneaky
Panda: bamboo China black white cuddly bear lazy zoo
Koala: eucalyptus Australia sleepy tree cuddly grey marsupial cute
Goldfish: bowl orange pet tiny memory swim fins aquarium
Octopus: tentacles ink eight sea clever squishy arms ocean
Zoom: video call mute camera remote gallery link meeting
Teams: Microsoft chat channel call video office workspace meeting
Slack: channel chat ping emoji thread workspace message notification
Email: inbox send reply subject attachment spam Outlook address
Excel: spreadsheet cells formulas columns rows data chart pivot
PowerPoint: slides deck presentation animation bullets template projector transitions
Laptop: portable keyboard screen battery work typing charger computer
Tablet: touchscreen portable swipe iPad stylus thin screen apps
Stapler: staples paper office clip press desk metal attach
Tape: sticky roll clear wrap tear dispenser seal duct
Printer: paper ink jam copies toner office pages cartridge
Scanner: copy digital paper PDF image document light flatbed
Coworker: desk colleague team office lunch chat cubicle neighbor
Boss: manager meeting approve office promotion leader review corner
Meeting: agenda calendar conference room notes discussion invite slides
Webinar: online presentation registration slides audience live virtual speaker
Deadline: due urgent rush date pressure overdue late project
Reminder: alert note calendar notification forget memo ping alarm
Promotion: title career ladder congratulations manager celebrate achievement new
Raise: money salary increase negotiate paycheck annual review bump
Interview: questions candidate hiring nervous suit HR job panel
Exam: test grade study questions school nervous score pass
Badge: ID swipe access security photo card entrance clip
Lanyard: neck strap ID card conference string clip colorful
Whiteboard: marker erase brainstorm diagram meeting office drawing dry
Sticky note: yellow paper reminder Post-it memo stick small square
Calendar: dates schedule month events planner days weeks appointments
Clock: time hands tick wall hours minutes alarm round
Headphones: music ears noise listen wireless audio wear podcast
Speaker: sound loud bass music volume Bluetooth party audio
Keyboard: typing keys letters computer shortcut spacebar clicky QWERTY
Mouse: click cursor scroll computer pointer wireless pad right
Desk: work drawer office chair workspace computer surface standing
Table: dinner legs chairs eat dining wooden surface kitchen
Elevator: up down buttons floors lift stuck ding small
Escalator: moving stairs mall up down steps ride rail
Password: secret login security characters forgot account hidden reset
PIN: numbers four ATM digits code bank secret phone
Vacation: travel beach relax trip holiday hotel getaway time-off
Weekend: Saturday Sunday rest relax lazy brunch off free
Overtime: extra hours late paid office tired workload evening
Night shift: dark late hospital sleepy security overnight work schedule
Lunch break: sandwich noon cafeteria eat hour sandwich food rest
Coffee break: mug kitchen chat short caffeine pause quick snack
Resume: experience job skills paper education CV page history
Cover letter: application motivation hiring paragraph introduce dear job page
Pillow: soft sleep bed head fluffy feathers cushion rest
Blanket: warm cozy cover sleep soft couch winter fleece
Shower: water bathroom wash morning steam head quick clean
Bathtub: soak bubbles bathroom relax water rubber ducky warm
Sofa: couch living cushions sit lounge comfy TV relax
Bed: sleep mattress sheets bedroom nap pillow night rest
Umbrella: rain wet open handle cover storm drops shelter
Raincoat: rain hood wet yellow waterproof jacket storm wear
Toothbrush: teeth bristles paste brush morning dentist bathroom clean
Comb: hair teeth brush style tidy part pocket plastic
Candle: wax flame light birthday scented wick dark romantic
Lamp: light bulb switch shade desk bright lamp night
Mirror: reflection glass bathroom look selfie face vanity wall
Window: glass view open curtain light house frame breeze
Fridge: cold milk kitchen food magnets leftovers door chill
Freezer: ice frozen cold kitchen popsicle meat chill deep
Microwave: heat beep popcorn leftovers minute kitchen reheat quick
Oven: bake hot roast kitchen cake pizza heat timer
Backpack: school straps zip books hiking carry shoulders bag
Suitcase: travel wheels luggage pack trip airport clothes zip
Wallet: money cards cash pocket leather ID coins fold
Purse: handbag money shoulder fashion strap carry clutch designer
Sneakers: shoes running laces comfy sport rubber walk Nike
Sandals: summer feet beach straps open toes flip warm
Sunglasses: sun shades eyes dark summer cool UV beach
Glasses: eyes lenses frames see nerdy vision optician read
Hat: head cap sun fashion brim cowboy wear top
Helmet: head safety bike hard protect crash motorcycle strap
Scarf: neck winter warm wool knit wrap cozy cold
Tie: neck suit knot formal office business shirt dad
Watch: wrist time hands strap tick smart digital wear
Bracelet: wrist jewelry chain charm gold beads gift wear
Socks: feet pair cotton warm drawer wool striped laundry
Gloves: hands warm winter fingers wool leather pair cold
Key: door unlock metal keychain house car ring copy
Lock: secure door safe padlock combination bolt closed latch
Soap: bubbles wash hands clean bar lather bathroom foam
Shampoo: hair wash bottle lather shower bubbles scalp clean
Broom: sweep floor dust bristles witch handle clean dustpan
Vacuum: suction carpet noisy dust clean hose cord Dyson
Text message: phone typing SMS emoji reply quick chat thumbs
Phone call: ring voice talk dial hello answer speaker hang
Selfie: camera phone pose stick face smile filter front
Group photo: everyone smile cheese pose camera friends crowd together
Alarm clock: wake morning ring beep bedside early time loud
Snooze button: sleepy lazy morning five minutes again tap late
Gift card: present store balance plastic shopping birthday voucher spend
Coupon: discount save deal clip paper percent store bargain
Credit card: plastic swipe debt bill payment points Visa limit
Cash: money bills coins wallet paper green dollars tip
Beach: sand waves sun ocean towel shells surf tan
Pool: swim water chlorine diving lifeguard splash float summer
Airport: flights gate security luggage boarding terminal planes check-in
Train station: platform tracks tickets commute schedule rail departure station
Hotel: room lobby checkin key bed suite pool stay
Hospital: doctor nurse emergency sick ward ambulance beds surgery
Library: books quiet shelves borrow reading silent study card
Bookstore: books buy shelves reading cafe novels store browse
Mountain: peak climb snow high hike summit rocky view
Volcano: lava eruption ash hot magma crater smoke island
Desert: sand hot dry cactus camel dunes sun thirsty
Island: ocean beach palm tropical surrounded paradise boat isolated
Paris: France Eiffel croissant fashion romantic Louvre French baguette
London: England Big Ben rain British Thames tea royal
Gym: workout weights sweat treadmill fitness muscles exercise membership
Park: trees grass bench picnic playground walk dog green
Restaurant: menu waiter table dinner order chef reservation food
Cafe: coffee pastries laptop cozy latte barista small chat
Museum: art exhibits history paintings tickets quiet gallery tour
Zoo: animals cages lions elephants visit enclosures keeper safari
Taxi: yellow cab fare driver meter ride city hail
Bus: stop route public seats driver commute ticket big
Bicycle: pedal wheels ride helmet chain bike cycling handlebars
Scooter: electric ride kick wheels city fast handlebars rent
Airplane: fly pilot wings airport seat boarding jet clouds
Helicopter: rotor blades hover rescue chopper fly loud pad
Boat: water sail fishing lake dock row float captain
Submarine: underwater deep periscope ocean navy sonar dive yellow
Camping: tent campfire outdoors marshmallows woods sleeping nature hike
Picnic: blanket basket park sandwiches outdoors lunch grass sunny
Castle: towers moat knight medieval stone fortress walls king
Palace: royal king queen luxury gold grand mansion throne
Road trip: car drive highway music snacks friends adventure miles
Cruise: ship ocean buffet deck vacation cabin sea ports
Passport: travel stamps border photo ID country abroad visa
Ticket: entry seat concert train paper stub admission price
Christmas: tree gifts Santa December snow presents carols lights
Thanksgiving: turkey November family dinner grateful pie feast pumpkin
Halloween: costume candy pumpkin spooky October trick scary masks
Birthday: cake candles party presents balloons age celebrate wish
Wedding: bride ring dress vows cake ceremony married aisle
Graduation: cap gown diploma school ceremony degree tassel proud
Netflix: streaming shows binge series watch chill subscription original
YouTube: videos creators subscribe watch vlog channel upload clips
Instagram: photos stories filter likes posts reels influencer feed
TikTok: short videos dance trend viral scroll creator sound
Movie: cinema film popcorn screen actor theater watch tickets
TV show: series episodes season couch watch channel binge remote
Chess: king queen board knight strategy pawn checkmate rook
Checkers: board red black jump king pieces diagonal kids
Karaoke: sing microphone lyrics bar songs off-key stage night
Dancing: moves music party floor rhythm club steps groove
Roller coaster: loops screaming fast drop ride theme thrill track
Ferris wheel: slow view round carnival ride seats tall fair
Magician: tricks rabbit hat wand cards disappear illusion stage
Clown: red nose circus funny makeup balloons wig scary
Superhero: cape powers save hero mask comic fly strong
Villain: evil bad plan enemy laugh dark scheme lair
Ghost: spooky boo haunted invisible white sheet spirit float
Zombie: undead brains walking slow apocalypse green scary grave
Robot: machine metal beep programmed mechanical artificial steel future
Alien: space UFO green outer planet visitor strange abduct
Snow: white cold flakes winter snowman sled ski frozen
Rain: wet drops clouds umbrella puddle storm grey drizzle
Sun: bright hot day yellow light sunny warm star
Moon: night crescent full glow lunar tides craters dark
Rainbow: colors sky rain arc pot gold seven bright
Fireworks: explosion boom sky colors July night sparkle celebrate
Summer: hot beach vacation sunny swim July warm ice
Spring: flowers bloom rain Easter fresh March green warm
Doctor: stethoscope prescription clinic diagnose white coat patient medicine
Nurse: hospital scrubs care patient injection shift medical ward
Chef: kitchen hat cook recipe knife restaurant food spicy
Waiter: serve menu tip order table tray restaurant bill
Teacher: class lessons homework students school blackboard grades chalk
Student: learn homework class study backpack school exams notes
Pilot: plane cockpit fly captain uniform airline wings sky
Astronaut: space rocket moon helmet NASA zero orbit suit
Police officer: badge uniform siren patrol arrest law cop car
Firefighter: truck hose flames rescue helmet ladder brave siren

Football: touchdown helmet quarterback NFL tackle Sunday field Superbowl
Rugby: scrum tackle oval tough England muddy try team
Basketball: hoop dunk court NBA dribble three-pointer jump orange
Volleyball: net spike beach serve bump sand team set
Tennis: racket court serve Wimbledon love ball net match
Badminton: shuttlecock racket net light feathers smash backyard serve
Golf: club hole course swing caddie tee green putt
Bowling: pins strike lane alley spare shoes heavy gutter
Baseball: bat diamond pitcher homerun glove innings stadium mitt
Cricket: bat wicket England India overs bowler pitch test
Skiing: slopes snow poles lift mountain winter downhill goggles
Snowboarding: board slopes snow tricks halfpipe winter mountain jump
Swimming: pool laps strokes goggles water freestyle lanes wet
Diving: board splash deep flip pool plunge platform water
Boxing: gloves punch ring knockout rounds bell fighter ropes
Wrestling: mat pin grapple ring takedown match strong singlet
Marathon: long miles endurance runners race finish distance training
Sprint: fast short dash quick race track speed burst
Hockey: puck ice stick skates goalie Canada rink fight
Lacrosse: stick net ball field college helmet catch fast
Surfing: waves board ocean beach wetsuit ride Hawaii wipeout
Skateboarding: board tricks ramp wheels skatepark ollie street kickflip
Cycling: bike pedal helmet race road Tour wheels lycra
Running: jog shoes miles track pace sweat race fitness
Yoga: mat stretch pose calm breathe flexible namaste studio
Pilates: core mat reformer stretch toning studio balance strength
Karate: belt kick chop dojo black martial Japan punch
Judo: throw belt mat grapple martial Japan dojo Olympic
Referee: whistle rules card stripes call fair official game
Coach: team strategy whistle trainer pep motivate sidelines practice
Goal: net score soccer keeper ball celebrate point kick
Touchdown: score end-zone football six points spike celebrate NFL
Stadium: seats crowd fans huge football tickets cheer outdoor
Arena: indoor seats crowd concert basketball event tickets lights
Trophy: cup winner gold champion shiny prize shelf award
Medal: gold silver bronze podium neck Olympic ribbon winner
Olympics: rings gold athletes countries torch summer winter medals
World Cup: soccer countries trophy football tournament fans FIFA goals
Archery: bow arrow target bullseye aim Robin quiver shoot
Darts: board bullseye pub throw aim triple pointy bar
Ice skating: rink blades spin cold glide figure winter frozen
Roller skating: wheels rink disco retro glide skates roll fun
Rowing: oars boat river team crew paddle strokes Oxford
Kayaking: paddle river boat solo rapids lake splash outdoors
Climbing: rocks rope wall harness grip mountain heights chalk
Hiking: trail boots backpack mountain nature walk outdoors summit
Gymnastics: flips beam vault Olympics flexible bars routine leotard
Ballet: tutu pointe dancer graceful Swan tiptoe stage spin
Ping pong: paddle table bounce spin quick small ball rally
Air hockey: arcade table puck slide fast paddle neon air
Jersey: shirt number team name sports fans wear player
Uniform: school work dress-code matching outfit military same wear
Dumbbell: weights lift arms gym heavy curl muscles iron
Treadmill: running gym machine belt cardio walk incline sweat
Penalty: kick foul punishment card shootout rules referee free
Foul: rules whistle unfair referee card dirty push illegal

Guitar: strings strum chords rock acoustic electric pick band
Ukulele: Hawaii small strings strum cute tiny tropical chords
Piano: keys black white grand classical pedals Mozart keyboard
Organ: church pipes keys loud wedding cathedral pedals hymn
Violin: bow strings classical orchestra chin fiddle Vivaldi high
Cello: bow strings big deep classical orchestra seated low
Drum: beat sticks loud rhythm kit snare bang drummer
Tambourine: shake jingle hand rhythm bells circle percussion tap
Trumpet: brass blow jazz loud valves military fanfare horn
Saxophone: jazz brass smooth reed sexy sax curvy blow
Flute: wind silver high classical blow birds whistle magic
Clarinet: reed black woodwind jazz band blow classical school
Rock: guitar loud band concert electric metal roll stage
Jazz: improvise saxophone smooth swing club cool trumpet blues
Pop: catchy charts radio hits mainstream dance singer popular
Hip hop: beats rap rhymes street DJ breakdance flow urban
Opera: soprano singing dramatic Italian theater classical aria costume
Musical: Broadway singing theater dancing stage show Hamilton songs
Concert: live stage crowd tickets band lights loud encore
Festival: outdoor tents crowds summer lineup Coachella camping music
Band: members guitar drummer group play stage rock garage
Choir: singers church voices harmony robes group altos sopranos
Singer: voice microphone songs vocals stage star solo famous
Rapper: rhymes beats mic flow lyrics bars hiphop verse
DJ: turntables mix party club decks beats spin music
Producer: studio beats record mixing album sound executive tracks
Microphone: voice stage amplify karaoke speak sing record mic
Megaphone: loud cone shout protest cheerleader announce amplify crowd
Album: songs tracks record artist release cover collection music
Playlist: songs shuffle Spotify mix list queue curated music
Vinyl: record turntable retro needle scratch analog spin collectors
Cassette: tape retro 80s rewind Walkman mixtape analog plastic
Lullaby: baby sleep gentle soft bedtime cradle sing quiet
Anthem: national flag stand proud sing stadium country patriotic
Spotify: streaming playlist green app music premium shuffle podcasts
Radio: station FM DJ car tune signal broadcast talk
Lyrics: words song verses chorus sing written poetry lines
Melody: tune notes humming song catchy harmony sweet music
Conductor: baton orchestra wave lead podium tempo maestro classical
Composer: write music Mozart symphony notes score classical create
Harp: strings angel heaven golden pluck tall gentle Irish
Banjo: twang country bluegrass strings pluck folk southern round
Tour: cities concerts travel bus dates world band venues
Gig: show bar small live band paid performance venue
Country: cowboy twang Nashville boots guitar truck southern hat
Blues: sad guitar soul Chicago soulful slow deep feeling
Orchestra: symphony violins conductor classical instruments concert hall musicians
Marching band: parade drums uniforms football halftime march brass school
Beat: tempo drum bass pulse rhythm loop drop pounding
Rhythm: tempo pattern groove timing beat dance count flow
Duet: two pair partners together sing harmony couple duo
Trio: three group threesome musicians band small triple together

Dumpling: steamed Chinese wrapper filling pork dip folded boiled
Ravioli: pasta Italian stuffed square sauce cheese pillows tomato
Burrito: wrap tortilla beans rice Mexican foil big Chipotle
Quesadilla: cheese tortilla melted grilled folded Mexican crispy triangle
Lasagna: layers pasta baked Italian meat sauce Garfield oven
Mac and cheese: macaroni cheesy creamy kids comfort orange baked box
Steak: beef grill medium rare juicy knife sizzle ribeye
Pork chop: pig grilled bone meat pan juicy dinner applesauce
Bacon: crispy breakfast pig strips sizzle salty eggs smoky
Sausage: link pork grill breakfast casing ground spicy German
Shrimp: seafood pink prawn cocktail fried tiny tails boil
Lobster: claws red Maine fancy seafood butter shell expensive
Salmon: pink fish fillet smoked river omega sushi grilled
Tuna: fish can sandwich steak sushi ocean salad canned
Rice: grains white bowl steamed Asian sticky fried boil
Noodles: long slurp chopsticks soup pasta stir-fry bowl Asian
Garlic: clove smell vampire bread stinky white bulb mince
Onion: tears layers ring chop smell purple bulb fried
Chili: spicy beans pepper hot bowl red stew cookoff
Curry: spicy Indian sauce rice yellow coconut turmeric naan
Pie: crust slice apple bake dessert filling pumpkin round
Tart: small pastry fruit French crust glazed custard mini
Cheesecake: creamy New York dessert slice graham crust rich
Tiramisu: Italian coffee mascarpone layers cocoa dessert ladyfingers creamy
Pudding: creamy dessert spoon cup chocolate jiggly sweet soft
Jelly: wobbly jam sweet grape peanut gelatin fruit spread
Caramel: sticky sweet golden sauce chewy candy toffee butterscotch
Chocolate: cocoa sweet bar brown dark candy milk Hershey
Vanilla: plain white bean extract flavor sweet classic ice
Cinnamon: spice roll sugar brown stick sweet warm apple
Salt: shaker white ocean seasoning sea salty crystals grain
Pepper: black shaker spicy grind sneeze seasoning ground cracked
Mayonnaise: white creamy sandwich egg jar spread dressing tangy
Ranch: dressing white dip wings salad creamy carrots herbs
Toast: bread toaster crunchy brown butter breakfast slice crispy
Biscuit: flaky gravy southern buttery baked fluffy breakfast cookie
Fries: potato salty crispy ketchup golden McDonald's side fried
Hash browns: potato shredded breakfast crispy golden fried diner patty
Watermelon: green red seeds summer juicy picnic slice big
Cantaloupe: orange melon rind sweet breakfast fruit juicy round
Pineapple: tropical spiky yellow Hawaii sweet juicy pizza crown
Coconut: tropical hairy milk palm hard island shell white
Blueberry: blue tiny muffin berry sweet antioxidant pie bush
Raspberry: red seeds tart berry jam sweet soft bush
Peach: fuzzy juicy pit orange Georgia sweet summer soft
Apricot: orange dried small pit sweet fruit tangy soft
Broccoli: green trees vegetable florets healthy steamed kids crunchy
Cauliflower: white florets vegetable rice healthy roasted crunchy keto
Carrot: orange crunchy rabbit vegetable root eyes snack long
Celery: green stalk crunchy stringy water dip healthy vegetable
Cucumber: green cool salad crunchy pickle slices water vegetable
Zucchini: green squash summer grilled noodles vegetable garden long
Espresso: shot strong Italian coffee tiny bitter crema quick
Cappuccino: foam milk coffee Italian froth cup creamy morning
Soda: fizzy sugar can bubbles cola sweet pop carbonated
Sparkling water: bubbles fizzy healthy LaCroix lime bottle carbonated refreshing
Champagne: bubbles toast celebrate bottle cork New-Year flute fancy
Cocktail: bar mixed shaker drink olive party glass fancy
Brunch: Sunday mimosas eggs late weekend friends pancakes avocado
Buffet: all-you-can-eat plates line serve yourself hotel unlimited
Barbecue: grill smoke ribs outdoor summer sauce charcoal party
Hot pot: broth boil table Chinese spicy dip share bubbling

Ocean: waves salty blue deep sea fish huge tides
Lake: calm freshwater boat shore fishing cabin dock still
River: flow current bank stream bridge rapids water fish
Waterfall: cascade drop mist splash Niagara rocks pool high
Canyon: cliffs deep gorge rocks Grand Arizona echo red
Valley: low green between hills meadow farmland wide peaceful
Glacier: ice slow melting cold huge mountain blue frozen
Iceberg: Titanic floating tip ice ocean cold huge frozen
Jungle: tropical vines monkeys humid dense wild rain trees
Forest: trees woods hiking pine deer green leaves quiet
Cave: dark bats rocky underground echo stalactite hidden deep
Tunnel: dark underground road train passage light through long
Japan: sushi Tokyo anime Fuji cherry blossom samurai island
Korea: kimchi Seoul K-pop BBQ peninsula Gangnam spicy drama
China: Beijing Great panda dragon chopsticks huge dumplings Wall
India: curry Bollywood Taj Delhi cricket spices saree Mumbai
Brazil: samba Rio carnival soccer Amazon coffee beach Portuguese
Argentina: tango Messi steak Buenos Aires soccer Patagonia wine
Canada: maple hockey moose cold Toronto polite snow Vancouver
Australia: kangaroo Sydney koala outback beach Aussie reef down-under
Italy: pizza pasta Rome boot Venice gelato fashion wine
Spain: Madrid paella flamenco tapas siesta Barcelona bullfight sunny
Egypt: pyramids pharaoh Nile Cairo desert camels mummy ancient
Greece: Athens islands olive gods ancient Santorini feta blue
Mexico: tacos sombrero Cancun spicy fiesta tequila Aztec beaches
Cuba: Havana cigars salsa island Caribbean vintage cars rum
New York: Manhattan Broadway subway pizza skyscrapers Liberty yellow Brooklyn
Los Angeles: Hollywood beaches traffic celebrities palm sunny movies Venice
Tokyo: Japan neon sushi crowded subway Shibuya busy anime
Seoul: Korea K-pop kimchi Gangnam BBQ city skincare palace
Rome: Italy Colosseum pizza Vatican ancient gladiators pasta empire
Athens: Greece Acropolis ancient Parthenon philosophy olive democracy gods
Mississippi: river steamboat south delta Mark Twain long blues
Nile: Egypt river longest Africa Cairo crocodile ancient delta
Sahara: desert sand Africa dunes hot camels huge dry
Antarctica: ice penguins coldest south pole frozen research white
Hawaii: beach volcano hula surf island tropical leis Aloha
Bahamas: islands Caribbean beach turquoise cruise resort tropical sand
Alaska: cold bears snow salmon Anchorage glaciers huge northern
Siberia: Russia cold frozen tundra snow remote vast winter
Everest: highest climb summit Nepal snow peak oxygen dangerous
Kilimanjaro: Africa Tanzania mountain climb snowcap peak tall volcano
Atlantic: ocean Europe America east crossing Titanic waves cold
Pacific: ocean biggest west Hawaii deep islands huge waves
Europe: countries continent EU Paris Euro trains history old
Asia: continent biggest China Japan India crowded diverse east
Map: directions paper roads location navigate fold legend lost
Globe: sphere spin countries round Earth world model atlas
Compass: north needle directions navigate magnetic south hiking points
GPS: navigation satellite directions phone location route coordinates app
Earthquake: shaking ground tremor Richter cracks fault California disaster
Tsunami: wave giant ocean flood disaster coast warning rush
Tornado: twister funnel spinning wind Kansas storm siren cyclone
Hurricane: storm wind rain Florida evacuate eye category coast
Las Vegas: casino gambling Strip neon desert shows Elvis jackpot
Miami: beach Florida sunny nightlife palm Cuban party art
Texas: cowboy big boots BBQ ranch Austin Houston oil
California: sunny Hollywood beaches surf Golden Gate tech wine

Pyramid: Egypt triangle ancient stone tomb pharaoh desert giant
Sphinx: lion riddle Egypt statue nose desert guard ancient
Pharaoh: Egypt king mummy Tutankhamun ancient tomb gold ruler
Emperor: ruler empire Rome throne China crown power royal
Knight: armor sword horse shining castle medieval loyal lance
Samurai: Japan sword honor warrior katana armor ancient code
Viking: helmet longship Norse raid beard axe Scandinavia warrior
Pirate: ship treasure parrot eyepatch plank sword hook ocean
Gladiator: arena Rome fight sword Colosseum crowd warrior sandals
Soldier: army uniform war helmet rifle troops camouflage salute
Dinosaur: extinct T-Rex fossil Jurassic huge reptile roar bones
Mammoth: woolly ice-age tusks hairy extinct elephant frozen giant
Cowboy: horse hat boots ranch lasso western saloon cattle
Sheriff: badge star western town law deputy outlaw jail
King: crown throne royal castle rule kingdom palace majesty
President: election White House leader country vote office speech
Queen: crown royal England palace majesty throne chess jewels
Princess: tiara castle Disney royal fairytale gown prince pretty
Crown: jewels gold king head royal diamonds tiara power
Throne: chair king royal seat power sit gold palace
Sword: blade sharp knight steel fight medieval handle duel
Shield: protect defense knight armor block round guard metal
Telegraph: Morse code wires message dots dashes old signal
Telephone: ring dial call receiver landline Bell talk cord
Printing press: Gutenberg books ink paper printing invention letters newspaper
Typewriter: keys ink paper clacking old writer ribbon ding
Columbus: 1492 ships America explorer sail Spain Atlantic Santa-Maria
Magellan: circumnavigate ships explorer Portugal strait voyage ocean world
Napoleon: France short emperor Waterloo hat general exile Corsica
Caesar: Rome salad Julius emperor Brutus toga senate Ides
Lincoln: Abraham tall hat beard penny Civil Gettysburg honest
Washington: George first president dollar teeth cherry general Delaware
Einstein: relativity genius hair physics E=mc2 scientist brain German
Newton: gravity apple physics laws Isaac scientist English calculus
Shakespeare: Hamlet plays Romeo poet England theater Globe sonnets
Dickens: Christmas Carol Oliver London novels Victorian Scrooge author
Great Wall: China long ancient stone wall visible defense Beijing
Colosseum: Rome arena gladiators ancient ruins stadium Italy round
Titanic: ship iceberg sank 1912 Jack Rose ocean disaster
Mayflower: Pilgrims ship 1620 Plymouth Thanksgiving colonists voyage America
Declaration: independence July 1776 Jefferson freedom signed document Philadelphia
Constitution: law amendments rights founding document government Supreme framework
Mummy: wrapped bandages Egypt tomb ancient pharaoh preserved scary
Fossil: bones dinosaur ancient rock preserved museum imprint dig
Empire: large ruler conquered Rome British territory power vast
Kingdom: king realm land castle royal rule monarchy fairy
Medieval: knights castles plague Middle-Ages feudal armor peasants dark
Renaissance: Leonardo art Italy rebirth Florence painting Michelangelo culture
Explorer: discover maps adventure travel unknown expedition journey brave
Pioneer: wagon frontier settler west first trailblazer covered land
Revolution: overthrow change uprising war independence protest freedom new
Rebellion: rebels revolt fight resist uprising defy rebels power
Spy: secret agent disguise mission gadget James hidden espionage
Detective: clues mystery magnifying Sherlock solve case crime investigate

Atom: tiny proton electron nucleus element matter particle smallest
Molecule: atoms bonded water compound chemical structure tiny formula
Planet: orbit sun Earth Mars round solar system space
Star: bright twinkle night sky shining sun constellation wish
Galaxy: Milky Way stars spiral space huge cosmic billions
Universe: everything space infinite cosmos Big Bang vast expanding
Microscope: tiny lens cells lab slide magnify science zoom
Telescope: stars lens space observe astronomy sky distant zoom
Gravity: fall pull Newton apple weight down force Earth
Magnet: attract poles fridge north metal pull iron stick
Oxygen: breathe air O2 lungs gas element life fire
Hydrogen: H2O lightest gas element fuel balloon water explosive
Battery: power charge AA energy lithium dead percent electric
Charger: cable plug phone power outlet USB wire charging
Drone: flying remote camera propellers buzz aerial quadcopter pilot
Satellite: orbit space signal GPS dish communication NASA spinning
Rocket: launch space fuel blast NASA countdown fast fire
Spaceship: alien astronaut sci-fi stars travel cockpit galaxy capsule
Virus: sick flu contagious infection germ spread cold computer
Bacteria: germs microbes probiotic antibiotics tiny gut infection cells
DNA: genes helix genetic code double heredity blueprint molecule
Cell: tiny biology nucleus membrane organism unit microscope prison
Laboratory: beakers experiments science coat test tubes chemicals research
Classroom: desks teacher students school whiteboard lessons chairs learning
Wi-Fi: internet wireless password signal router connection bars network
Bluetooth: wireless pair headphones speaker connect device short-range blue
Smartphone: iPhone apps touchscreen calls camera mobile texting Android
Smartwatch: wrist fitness steps notifications Apple tiny screen heartbeat
App: download phone icon store tap software mobile install
Website: browser URL internet page homepage link online domain
Wikipedia: online free articles edit knowledge facts references internet
Encyclopedia: books volumes knowledge alphabetical facts reference Britannica heavy
Chatbot: AI conversation assistant answers chat robot automated typing
Search engine: query results Google browse find keywords web index
USB: plug stick port drive cable flash storage computer
Cloud: online storage backup sync upload internet sky Dropbox
Thunder: loud boom storm rumble clap sound rain scary
Lightning: flash bolt storm electric bright zap sky strike
Eclipse: shadow moon sun dark rare glasses blocked total
Comet: tail ice space Halley streak orbit rare bright
Asteroid: rock space belt impact dinosaurs crater orbit huge
Meteor: shooting star streak sky wish burn falling night
Recycling: bins plastic green reuse environment bottles sort blue
Compost: organic soil garden scraps worms rot natural fertilizer
Solar panel: sun energy roof electricity green renewable panels power
Wind turbine: blades spinning energy green farm tall renewable power
Chemistry: elements reactions lab formulas periodic beakers molecules science
Physics: forces motion Einstein energy laws gravity science equations
Experiment: test hypothesis lab try results science method trial
Theory: idea hypothesis explain abstract science proof concept thinking

Apple: iPhone Mac Steve logo Cupertino sleek expensive iOS
Samsung: Galaxy Korean Android phones TVs screens electronics foldable
Google: search Gmail Android Maps colorful Chrome browse Alphabet
Microsoft: Windows Office Xbox Bill Excel Seattle Teams software
Amazon: Prime delivery boxes Bezos shopping online Alexa packages
Walmart: store cheap groceries supercenter everything discount aisles Arkansas
Nike: swoosh Just-Do-It sneakers Jordan sportswear running athletes Oregon
Adidas: three stripes German sneakers soccer sportswear trefoil athletes
Coca-Cola: red classic soda Santa fizzy bottle polar cola
Pepsi: blue soda challenge cola fizzy can Super-Bowl sweet
McDonald's: Big Mac golden arches fries Happy Meal clown fastfood drive-thru
Burger King: Whopper crown flame-grilled fast-food fries Have-it fastfood
Starbucks: coffee green mermaid latte Frappuccino barista misspelled venti
Dunkin': donuts coffee Boston iced orange pink America runs
Hulu: streaming shows TV green ads series binge subscription
Disney+: Marvel Mickey streaming Pixar Star princesses family subscription
Uber: ride app driver car rideshare surge black rating
Lyft: pink ride app driver rideshare car mustache share
Tesla: electric Elon car autopilot battery charging Model futuristic
Ford: trucks Mustang American Detroit F-150 cars Henry assembly
Toyota: Japanese Camry Prius reliable cars hybrid Corolla sedan
Honda: Japanese Civic Accord motorcycles reliable cars sedan engine
Target: red bullseye store shopping aisles dollar-spot home Tarjay
Costco: bulk membership warehouse samples hotdog giant wholesale Kirkland
IKEA: furniture Swedish meatballs flatpack assemble blue maze Allen
Home Depot: hardware orange tools DIY lumber paint garden renovation
Facebook: social friends likes Zuckerberg profile posts newsfeed Meta
LinkedIn: professional jobs network resume connections recruiter career endorse
Visa: card payment credit blue swipe everywhere travel debit
Mastercard: card circles red payment credit priceless swipe debit
PayPal: online payment transfer eBay money account send checkout
Venmo: send split friends app payment money emoji pay
FedEx: shipping packages overnight purple delivery trucks express boxes
UPS: brown shipping packages trucks delivery boxes driver logistics
Airbnb: rental host stay apartment vacation booking house guest
Expedia: travel booking flights hotels deals trip website vacation
Lego: bricks build colorful plastic step Danish blocks minifigure
Play-Doh: clay dough squish colorful mold kids smell sculpt
Nintendo: Mario Switch Zelda games Japanese Pokemon console handheld
PlayStation: Sony console controller games PS5 gaming Japanese buttons
Chipotle: burrito bowl guac Mexican rice burrito-bowl fast-casual chips
Taco Bell: tacos late-night cheap Mexican bell crunchwrap fast-food fastfood
KFC: chicken fried Colonel bucket crispy recipe southern drumsticks
Popeyes: chicken sandwich Louisiana spicy fried biscuits cajun crispy
Subway: footlong sandwich sub fresh bread toppings veggies deli
Domino's: pizza delivery dominoes tracker fast cheesy order boxes
Gucci: Italian luxury fashion designer expensive logo bags handbags
Prada: Italian luxury fashion Devil designer handbags expensive black
Red Bull: energy wings can caffeine extreme sports drink racing
Monster: energy claw green can caffeine drink gamers extreme
Oreo: cookie dunk milk cream black white twist sandwich
KitKat: chocolate wafer break snap bar fingers candy crunchy
Delta: airline flights Atlanta planes seats travel triangle SkyMiles
United: airline flights Chicago planes seats travel globe MileagePlus
Marriott: hotel chain rooms Bonvoy business travel lobby points
Hilton: hotel chain rooms Paris luxury Honors travel lobby
Zara: fashion Spanish clothes trendy store fast-fashion jeans outfits
H&M: fashion Swedish clothes cheap store fast-fashion basics trendy
DoorDash: food delivery app restaurant dasher driver order red
Instacart: groceries delivery app shopper supermarket order green fresh

Doge: Shiba dog meme crypto wow coin internet funny
Grumpy Cat: frown meme cat angry face famous internet no
Rickroll: Never-gonna-give-you-up prank link trick song 80s internet
Clickbait: headline shocking link trick misleading YouTube thumbnail bait
Meme: funny internet image caption viral joke share template
GIF: animated loop reaction moving image short funny jif
Emoji: smiley yellow faces icons text heart thumbs cute
Sticker: chat cute WhatsApp funny pack send image animated
Hashtag: pound trending tag topic Twitter symbol keyword Instagram
Mention: tag notification at-sign name reply Twitter user alert
Influencer: Instagram followers sponsored brand lifestyle fame posts promo
YouTuber: videos channel subscribers vlog camera creator upload thumbnails
Viral: spread popular shares millions internet fast blowup everywhere
Trending: popular topic hashtag now hot rising list buzz
Like: thumbs heart button tap approve social count click
Share: repost send forward spread button social retweet pass
Follower: fans count social Instagram audience profile track subscribe
Subscriber: YouTube bell channel notify membership audience count newsletter
Troll: mean comments online annoy bridge provoke internet bait
Bot: automated fake account spam robot script AI program
Spam: junk email unwanted inbox ads canned annoying filter
Scam: fraud fake trick con money cheat phishing lie
Podcast: listen episodes audio host interview headphones show talk
Livestream: live real-time Twitch broadcast chat streamer online now
Unboxing: package open new video reveal product box excited
Review: rating stars opinion critic product feedback evaluate Yelp
FOMO: missing out anxiety party fear left-out jealous social
YOLO: live once reckless adventure carpe diem risk bold
LOL: laugh funny text haha joke lol chat hilarious
OMG: wow shock surprise gasp text exclaim excited dramatic
Ghosting: disappear ignore dating silent vanish unanswered texts gone
Blocking: block ban cut-off restrict hide stop unfriend shut
Thumbs up: approve like okay good yes agree hand cool
Heart: love red like emoji favorite care romantic beat
Reddit: forum upvote subreddit Reddit-gold threads karma comments alien
Twitter: tweets bird X Elon hashtags followers short posts
Snapchat: ghost yellow disappearing stories filters streaks selfies Snap
WhatsApp: messages green chat groups calls international texting voice
Wordle: five letters guess green yellow daily puzzle grid
Sudoku: numbers grid puzzle logic nine boxes pencil daily
Among Us: impostor crewmate spaceship vote sus tasks vent red
Minecraft: blocks craft build mine Steve creeper pixel survival
Fortnite: battle royale build skins dance Epic island victory
Roblox: kids games blocky avatar Robux create online players
NPC: background character game bland robotic generic random filler
Main character: protagonist hero spotlight story lead star energy plot
Plot twist: surprise unexpected story shocking reveal turn ending wow
Spoiler: reveal ending ruin warning secret leak alert finale
Screenshot: capture screen image save phone proof snap evidence
Photoshop: edit image Adobe fake retouch layers filter design
Catfish: fake profile online dating pretend lie deceive persona
Fake account: bot impostor anonymous burner profile pretend sock-puppet hidden
Cringe: awkward embarrassing yikes uncomfortable secondhand wince oof bad
Awkward: silence uncomfortable weird embarrassing stiff clumsy pause odd
Vibe: feeling energy aura atmosphere chill mood energy groove
Mood: feeling emotion attitude temper relatable state vibes day
Hot take: opinion controversial bold spicy unpopular debate claim argue
Rant: complain vent angry long shout frustrated speech outburst

Taylor Swift: Swifties eras pop country breakup Kelce concerts friendship
Beyoncé: Queen Bey Destiny's Child Formation Jay-Z Renaissance singer Houston
Rihanna: Fenty Barbados Umbrella singer makeup pop Super-Bowl billionaire
Lady Gaga: Poker Face meat dress monsters pop theatrical Bradley singer
Justin Bieber: Baby Beliebers Canadian pop Hailey YouTube heartthrob singer
Ed Sheeran: ginger British guitar Shape loop-pedal singer songwriter acoustic
Drake: Toronto rapper Hotline Bling Canadian OVO hip-hop Raptors
Kanye West: Ye rapper Yeezy Kardashian controversial producer Chicago sneakers
Elon Musk: Tesla SpaceX Twitter Mars billionaire rockets electric X
Jeff Bezos: Amazon billionaire bald rockets Blue Origin founder space
Bill Gates: Microsoft Windows billionaire philanthropy glasses founder nerdy charity
Steve Jobs: Apple iPhone turtleneck visionary Mac founder black innovator
Oprah: talk show TV book club you-get-a-car billionaire host Chicago
Ellen: talk show dance comedian TV host DeGeneres kindness Dory
Tom Cruise: Top Gun stunts Mission actor running action Hollywood jumps
Brad Pitt: actor Fight Club handsome Hollywood Angelina Oscar movie
Leonardo DiCaprio: Titanic Oscar actor Wolf climate Hollywood Inception handsome
Johnny Depp: Jack Sparrow pirates actor quirky Hollywood Edward Scissorhands
Dwayne Johnson: Rock wrestler muscles actor eyebrow Jumanji bald strong
Vin Diesel: Fast Furious family bald actor cars Groot deep
Kim Kardashian: reality TV Skims Kanye famous influencer selfie family
Paris Hilton: heiress socialite blonde reality pink that's-hot DJ
Michael Jordan: Bulls basketball GOAT Air Nike 23 dunk Chicago
LeBron James: Lakers basketball King Cleveland NBA dunk 23 Ohio
Lionel Messi: Argentina soccer GOAT Barcelona Inter Miami World-Cup dribble
Cristiano Ronaldo: Portugal soccer CR7 Madrid Manchester Siu goals abs
Serena Williams: tennis Grand-Slams champion powerful sister GOAT Wimbledon serve
Roger Federer: tennis Swiss elegant Wimbledon champion graceful GOAT backhand
Tiger Woods: golf Masters champion green-jacket Nike legend comeback putter
Usain Bolt: fastest sprinter Jamaica lightning 100m Olympic gold pose
Michael Jackson: moonwalk Thriller pop King glove Billie Jean dance
Elvis: King rock hips Graceland Memphis pompadour Vegas jumpsuit
Madonna: Queen pop Material Girl Vogue 80s icon reinvent provocative
Britney Spears: pop Toxic Baby One-More-Time freedom 2000s singer dancer
Ariana Grande: ponytail pop high-notes Wicked singer tiny Nickelodeon whistle
Selena Gomez: Disney Rare beauty actress singer Wizards Only-Murders Texas
Keanu Reeves: Matrix John Wick nice actor breathtaking Neo Speed
Will Smith: Fresh Prince Men Black actor rapper Oscars slap
Jennifer Lopez: J.Lo Bronx dancer singer actress Ben Latin Jenny
Shakira: Colombia hips belly dance Waka singer Latin World-Cup
Gordon Ramsay: chef angry Hell's Kitchen British raw lamb sauce
Martha Stewart: homemaking cooking crafts Snoop domestic diva magazine baking
Zendaya: Euphoria Spider-Man Dune actress Disney fashion Tom style
Margot Robbie: Barbie Australian actress Harley Wolf blonde pink producer
Tom Hanks: Forrest Gump Toy Story Woody Castaway nice actor Big
Morgan Freeman: voice narrator God Shawshank actor deep calm wise
Jackie Chan: kung-fu stunts Hong Kong Rush comedy action funny actor
Bruce Lee: kung-fu martial yellow jumpsuit Hong Kong legend Enter Dragon
BTS: K-pop Korean boy band ARMY seven Dynamite Butter
One Direction: boy band British Harry X-Factor five Directioners Niall
MrBeast: YouTube challenges giveaways money philanthropy chocolate Jimmy videos
PewDiePie: YouTube gamer Swedish subscribers memes Felix bro fist
Simone Biles: gymnast Olympics GOAT flips gold twisties American tiny
Michael Phelps: swimmer Olympics gold medals butterfly record GOAT wingspan

Comedy: funny laugh jokes humor stand-up silly hilarious lighthearted
Drama: serious emotional tears intense acting plot heavy tension
Horror: scary jumpscare blood ghosts screaming monsters nightmare creepy
Thriller: suspense tense twist mystery chase edge-of-seat danger heart-racing
Cartoon: animated kids Saturday colorful drawings Looney funny characters
Anime: Japanese animated manga Naruto big eyes Ghibli series
Sitcom: laugh track episodes funny family couch Friends 30-minutes
Soap opera: dramatic daytime twins amnesia romance long-running melodrama cheesy
Sequel: part two continuation follow-up franchise next again more
Remake: redo new version reboot classic updated modern again
Director: chair action cut camera vision film lead Spielberg
Actor: role performance star script Hollywood stage cast scene
Oscar: Academy statue gold award film Hollywood ceremony winner
Grammy: music award gramophone gold singer ceremony album winner
Red carpet: celebrities premiere photos fashion glamour paparazzi gowns arrival
Premiere: opening night debut first showing release launch event
Trailer: preview movie coming-soon clips YouTube teaser previews hype
Teaser: short hint preview tease mysterious brief sneak peek
Binge-watch: marathon episodes Netflix couch weekend nonstop hours snacks
Rerun: repeat old episode TV again rewatch classic syndication
Star Wars: Jedi Darth Vader lightsaber force galaxy Skywalker Yoda
Star Trek: Spock Enterprise Kirk Vulcan warp captain space boldly
Harry Potter: wizard Hogwarts wand scar magic Hermione Voldemort glasses
Lord of the Rings: hobbit Frodo ring Mordor Gandalf elves Tolkien
Batman: Gotham bat Bruce Joker dark knight cape Robin
Spider-Man: Peter Parker web Queens spider mask swing friendly
Shrek: ogre green swamp Donkey Fiona onion Far-Far-Away layers
Toy Story: Woody Buzz Pixar toys Andy infinity cowboy friends
Frozen: Elsa Anna Let-It-Go snow Olaf ice princess Disney
Moana: ocean Polynesian Maui island Disney boat princess wayfinder
Jaws: shark beach dun-dun Spielberg ocean bite boat scary
Jurassic Park: dinosaurs T-Rex island Spielberg park raptors amber DNA
Friends: Central Perk Ross Rachel coffee sitcom New York couch
The Office: Michael Scott Dunder Mifflin paper mockumentary Jim Pam Dwight
Game of Thrones: dragons throne winter Westeros Stark HBO battles Jon
Stranger Things: Upside Down Eleven Hawkins 80s Demogorgon kids Netflix
Mickey Mouse: Disney ears mouse cartoon red shorts gloves Minnie
Bugs Bunny: carrot Looney What's-up-doc rabbit cartoon wabbit Warner gray
SpongeBob: Bikini Bottom pineapple square yellow Patrick Krabby sea
Pokémon: Pikachu Ash catch cards Gotta-catch-em-all evolve trainer balls
James Bond: 007 spy martini tuxedo British agent shaken gadgets
Mission Impossible: Tom Cruise stunts spy theme mask self-destruct agent rope
Barbie: pink doll Ken Malibu Margot dreamhouse plastic fashion
Oppenheimer: atomic bomb Nolan physicist Cillian Los Alamos history black-and-white
Subtitles: text bottom foreign read captions translation words screen
Dubbing: voices foreign translated lip-sync audio actors language over
Cinema: theater screen popcorn tickets seats dark movies big
Drive-in: car outdoor screen retro parking speakers night movies
Stunt: dangerous double jump action crash fall trick risky
Special effects: CGI explosions visual green-screen effects magic computer illusion
Documentary: real facts nature interview narrator true educational history
Reality show: unscripted drama contestants Kardashians Survivor island vote cast
Cameo: brief appearance surprise celebrity Stan Lee guest moment quick
Extra: background crowd non-speaking filler set walk-on scene people

Lawyer: court attorney suit case law legal client argue
Judge: gavel court robe verdict sentence order bench law
Dentist: teeth drill cavity floss checkup braces chair mouth
Surgeon: operation scalpel hospital scrubs stitches mask precise doctor
Accountant: taxes numbers CPA spreadsheets books audit April finance
Banker: money loans bank vault finance suit investment interest
Engineer: build design math bridges technical problem-solving machines hardhat
Architect: blueprints buildings design drawings skyscraper plans model houses
Plumber: pipes leaks toilet wrench water drain sink fix
Electrician: wires circuits power outlets shock voltage lights fix
Barista: coffee espresso latte art cafe milk foam apron
Bartender: drinks cocktails bar shaker tips pour night mixing
Mail carrier: letters postal mailbox route stamps uniform packages walking
Delivery driver: packages van boxes doorstep Amazon route deliver truck
Farmer: crops tractor barn cows fields harvest overalls rural
Gardener: plants flowers soil shovel watering garden prune green
Photographer: camera photos shoot lens portrait snap studio flash
Painter: brush canvas colors art paint easel portrait oils
Writer: books words author pen typing novel stories ink
Journalist: news reporter articles interview newspaper press story deadline
Mechanic: cars engine garage wrench oil repair tools grease
Carpenter: wood hammer saw nails furniture build tools workshop
Hairdresser: haircut scissors salon styling dye blowdryer chair trim
Makeup artist: brushes foundation lipstick beauty face palette glam contour
Scientist: lab experiments research coat discovery test theory data
Inventor: invention patent idea create Edison gadget prototype genius
Programmer: code computer software bugs developer keyboard Python app
Designer: creative design visual layout fashion graphics style Figma
Intern: student coffee young learning junior summer unpaid trainee
Manager: boss team meetings oversee lead schedule supervise reports
CEO: chief boss company executive leader board corner-office big
Founder: startup started company entrepreneur vision original owner creator
Salesperson: sell pitch commission deals customers persuade quota store
Cashier: register checkout scan cash receipt till groceries line
Librarian: books quiet shush library catalog reading shelves cards
Professor: university lecture tenure students college research PhD class
Vet: animals pets clinic doctor dogs cats care checkup
Zookeeper: animals zoo feed cages lions keeper care enclosures
Lifeguard: pool beach whistle rescue swimming red tower Baywatch
Paramedic: ambulance emergency first-aid siren rescue medical stretcher urgent
Tour guide: tourists group flag history walking sightseeing explain city
Flight attendant: airplane cabin safety drinks uniform cart crew seatbelt
Nanny: kids babysit care family live-in Mary-Poppins children home
Babysitter: kids evening teen watch children parents money night
Recruiter: hiring LinkedIn candidates jobs interview talent search offer
HR: human resources policies hiring benefits payroll onboarding complaints
Data analyst: SQL dashboards charts numbers Excel insights reports trends
Financial analyst: models forecasts stocks Excel budgets investments valuation reports
Consultant: advice clients slides strategy McKinsey travel expensive project
Auditor: review compliance accounts check books inspection CPA taxes
`;

const MAP = {};
for (const line of TEXT.split("\n")) {
  const i = line.indexOf(":");
  if (i < 0) continue;
  MAP[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim().split(/\s+/).filter(Boolean);
}
// Chinese clue words come with the Chinese packs (words_zh.txt).
for (const [w, list] of Object.entries(require("./words_zh").ASSOC)) MAP[w.toLowerCase()] = list;
module.exports = MAP;
