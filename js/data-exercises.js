/* The exercise library: 30 exercises in three languages.

   group      main muscle group (filter on the Exercises page)
   equipment  none | dumbbells | barbell | machine | kettlebell
   kind       weight  = sets of reps × kg
              body    = sets of reps (extra kg optional)
              time    = sets measured in seconds (plank)
              cardio  = distance and time (used by cardio workouts)
   muscles    muscles worked, main one first
   met        energy cost, used to estimate calories (cardio only)
   speed      show km/h instead of minutes per km (cycling) */
window.MUSCLE_GROUPS = ["chest", "back", "legs", "shoulders", "arms", "core", "cardio", "full"];
window.EQUIPMENT = ["none", "dumbbells", "barbell", "machine", "kettlebell"];

window.EXERCISES = [
  // ---------- chest ----------
  { id: 1, group: "chest", equipment: "barbell", kind: "weight", muscles: ["chest", "triceps", "shoulders"],
    name: { en: "Bench press", ru: "Жим лёжа", uz: "Yotib shtanga ko'tarish" },
    how: { en: "Lie on the bench, lower the bar to mid-chest, then press it straight up.", ru: "Лягте на скамью, опустите штангу к середине груди и выжмите вверх.", uz: "Skameykaga yoting, shtangani ko'krak o'rtasiga tushiring va tepaga itaring." } },
  { id: 2, group: "chest", equipment: "none", kind: "body", muscles: ["chest", "triceps", "core"],
    name: { en: "Push-up", ru: "Отжимания", uz: "Yerdan itarilish" },
    how: { en: "Keep your body in a straight line, lower your chest to the floor and push back up.", ru: "Держите тело прямым, опустите грудь к полу и поднимитесь.", uz: "Tanani to'g'ri tuting, ko'krakni yerga tushiring va qayta ko'tariling." } },
  { id: 3, group: "chest", equipment: "dumbbells", kind: "weight", muscles: ["chest", "shoulders", "triceps"],
    name: { en: "Dumbbell press", ru: "Жим гантелей лёжа", uz: "Yotib gantel ko'tarish" },
    how: { en: "Lying on a bench, press both dumbbells up until your arms are straight.", ru: "Лёжа на скамье, выжмите обе гантели вверх до прямых рук.", uz: "Skameykada yotib, ikkala gantelni qo'llar to'g'rilanguncha tepaga itaring." } },
  { id: 4, group: "chest", equipment: "machine", kind: "weight", muscles: ["chest", "shoulders"],
    name: { en: "Chest fly machine", ru: "Сведение рук в тренажёре", uz: "Trenajyorda qo'llarni birlashtirish" },
    how: { en: "Bring the handles together in front of your chest in a wide arc, then open slowly.", ru: "Сведите рукояти перед грудью по широкой дуге, затем медленно разведите.", uz: "Dastaklarni keng yoy bo'ylab ko'krak oldida birlashtiring, keyin sekin oching." } },

  // ---------- back ----------
  { id: 5, group: "back", equipment: "none", kind: "body", muscles: ["lats", "biceps", "forearms"],
    name: { en: "Pull-up", ru: "Подтягивания", uz: "Turnikda tortilish" },
    how: { en: "Hang from the bar and pull until your chin is above it, then lower with control.", ru: "Повисните на перекладине, подтянитесь до подбородка над ней и медленно опуститесь.", uz: "Turnikka osiling, iyagingiz undan oshguncha torting va sekin tushing." } },
  { id: 6, group: "back", equipment: "barbell", kind: "weight", muscles: ["back", "glutes", "hamstrings"],
    name: { en: "Deadlift", ru: "Становая тяга", uz: "Shtangani yerdan ko'tarish" },
    how: { en: "With a flat back, push the floor away and stand up with the bar close to your legs.", ru: "С ровной спиной оттолкнитесь от пола и встаньте, держа штангу у ног.", uz: "Belni tekis tutib, yerdan itarilib turing, shtanga oyoqqa yaqin bo'lsin." } },
  { id: 7, group: "back", equipment: "barbell", kind: "weight", muscles: ["back", "lats", "biceps"],
    name: { en: "Bent-over row", ru: "Тяга штанги в наклоне", uz: "Engashib shtanga tortish" },
    how: { en: "Lean forward with a flat back and pull the bar to your belly.", ru: "Наклонитесь с ровной спиной и тяните штангу к животу.", uz: "Belni tekis tutib engashing va shtangani qorningizga torting." } },
  { id: 8, group: "back", equipment: "machine", kind: "weight", muscles: ["lats", "biceps"],
    name: { en: "Lat pulldown", ru: "Тяга верхнего блока", uz: "Yuqori blokni tortish" },
    how: { en: "Pull the wide bar down to your upper chest, squeezing your shoulder blades.", ru: "Тяните широкую рукоять к верху груди, сводя лопатки.", uz: "Keng dastakni ko'krak tepasiga torting, kuraklarni bir-biriga yaqinlashtiring." } },

  // ---------- legs ----------
  { id: 9, group: "legs", equipment: "barbell", kind: "weight", muscles: ["quads", "glutes", "core"],
    name: { en: "Squat", ru: "Приседания со штангой", uz: "Shtanga bilan o'tirib turish" },
    how: { en: "With the bar on your upper back, sit down until your thighs are level, then stand up.", ru: "Со штангой на спине присядьте до параллели бёдер с полом и встаньте.", uz: "Shtangani yelkaga qo'yib, sonlar gorizontal bo'lguncha o'tiring va turing." } },
  { id: 10, group: "legs", equipment: "dumbbells", kind: "weight", muscles: ["quads", "glutes"],
    name: { en: "Lunge", ru: "Выпады", uz: "Oldinga qadam (vypad)" },
    how: { en: "Step forward and lower your back knee towards the floor, then push back.", ru: "Шагните вперёд, опустите заднее колено к полу и вернитесь.", uz: "Oldinga qadam tashlang, orqa tizzani yerga yaqinlashtiring va qayting." } },
  { id: 11, group: "legs", equipment: "machine", kind: "weight", muscles: ["quads", "glutes", "hamstrings"],
    name: { en: "Leg press", ru: "Жим ногами", uz: "Oyoq bilan itarish" },
    how: { en: "Push the platform away until your legs are almost straight, then bend slowly.", ru: "Выжмите платформу почти до прямых ног и медленно согните их.", uz: "Platformani oyoqlar deyarli to'g'rilanguncha itaring, keyin sekin buking." } },
  { id: 12, group: "legs", equipment: "barbell", kind: "weight", muscles: ["hamstrings", "glutes", "back"],
    name: { en: "Romanian deadlift", ru: "Румынская тяга", uz: "Rumincha tortish" },
    how: { en: "With soft knees, hinge at the hips and lower the bar along your legs, then rise.", ru: "Слегка согнув колени, наклонитесь в тазу, опуская штангу вдоль ног, и поднимитесь.", uz: "Tizzalarni sal bukib, tos bilan engashing, shtangani oyoq bo'ylab tushiring va turing." } },
  { id: 13, group: "legs", equipment: "none", kind: "body", muscles: ["calves"],
    name: { en: "Calf raise", ru: "Подъёмы на носки", uz: "Oyoq uchida ko'tarilish" },
    how: { en: "Rise up on your toes as high as you can, pause, and lower slowly.", ru: "Поднимитесь на носки как можно выше, задержитесь и медленно опуститесь.", uz: "Oyoq uchida imkon qadar baland ko'tariling, to'xtang va sekin tushing." } },

  // ---------- shoulders ----------
  { id: 14, group: "shoulders", equipment: "barbell", kind: "weight", muscles: ["shoulders", "triceps", "core"],
    name: { en: "Overhead press", ru: "Жим стоя", uz: "Tik turib shtanga ko'tarish" },
    how: { en: "Standing tall, press the bar from your shoulders to straight arms overhead.", ru: "Стоя прямо, выжмите штангу от плеч над головой до прямых рук.", uz: "Tik turib, shtangani yelkadan bosh ustiga, qo'llar to'g'rilanguncha itaring." } },
  { id: 15, group: "shoulders", equipment: "dumbbells", kind: "weight", muscles: ["shoulders"],
    name: { en: "Lateral raise", ru: "Махи гантелями в стороны", uz: "Gantelni yonga ko'tarish" },
    how: { en: "Raise the dumbbells out to the sides up to shoulder height, then lower slowly.", ru: "Поднимите гантели в стороны до уровня плеч и медленно опустите.", uz: "Gantellarni yon tomonga yelka balandligigacha ko'taring va sekin tushiring." } },
  { id: 16, group: "shoulders", equipment: "machine", kind: "weight", muscles: ["shoulders", "back"],
    name: { en: "Face pull", ru: "Тяга к лицу", uz: "Arqonni yuzga tortish" },
    how: { en: "Pull the rope towards your face, elbows high, and squeeze your upper back.", ru: "Тяните канат к лицу, держа локти высоко, и сводите лопатки.", uz: "Arqonni yuzingizga torting, tirsaklar baland, kuraklarni qisib turing." } },

  // ---------- arms ----------
  { id: 17, group: "arms", equipment: "dumbbells", kind: "weight", muscles: ["biceps", "forearms"],
    name: { en: "Biceps curl", ru: "Подъём гантелей на бицепс", uz: "Bitseps uchun gantel ko'tarish" },
    how: { en: "Keep your elbows by your sides and curl the dumbbells up to your shoulders.", ru: "Прижмите локти к корпусу и поднимите гантели к плечам.", uz: "Tirsaklarni tanaga yopishtirib, gantellarni yelkagacha buking." } },
  { id: 18, group: "arms", equipment: "none", kind: "body", muscles: ["triceps", "chest", "shoulders"],
    name: { en: "Triceps dip", ru: "Отжимания на брусьях", uz: "Brusda itarilish" },
    how: { en: "On parallel bars, lower your body by bending your elbows, then push back up.", ru: "На брусьях опуститесь, сгибая локти, и выжмите себя вверх.", uz: "Bruslarda tirsaklarni bukib tushing, keyin o'zingizni tepaga itaring." } },
  { id: 19, group: "arms", equipment: "dumbbells", kind: "weight", muscles: ["biceps", "forearms"],
    name: { en: "Hammer curl", ru: "Молотковые сгибания", uz: "\"Bolg'a\" usulida ko'tarish" },
    how: { en: "Hold the dumbbells with palms facing each other and curl them up.", ru: "Держите гантели ладонями друг к другу и сгибайте руки.", uz: "Gantellarni kaftlar bir-biriga qaragan holda ushlab, qo'llarni buking." } },
  { id: 20, group: "arms", equipment: "machine", kind: "weight", muscles: ["triceps"],
    name: { en: "Triceps pushdown", ru: "Разгибания на блоке", uz: "Blokda qo'lni yozish" },
    how: { en: "Push the cable bar down until your arms are straight, elbows fixed at your sides.", ru: "Разгибайте руки на блоке до прямых, держа локти у корпуса.", uz: "Blok dastagini qo'llar to'g'rilanguncha pastga itaring, tirsaklar qimirlamasin." } },

  // ---------- core ----------
  { id: 21, group: "core", equipment: "none", kind: "time", muscles: ["core", "shoulders"],
    name: { en: "Plank", ru: "Планка", uz: "Planka" },
    how: { en: "Hold a straight line from head to heels on your forearms. Don't let your hips drop.", ru: "Держите тело прямой линией на предплечьях. Не опускайте таз.", uz: "Bilaklarga tayanib, boshdan tovongacha to'g'ri chiziqni ushlab turing. Tosni tushirmang." } },
  { id: 22, group: "core", equipment: "none", kind: "body", muscles: ["core"],
    name: { en: "Crunch", ru: "Скручивания", uz: "Qorin mashqi" },
    how: { en: "Lying on your back, lift your shoulders towards your knees using your abs.", ru: "Лёжа на спине, поднимайте плечи к коленям за счёт пресса.", uz: "Chalqancha yotib, qorin mushaklari bilan yelkalarni tizzaga ko'taring." } },
  { id: 23, group: "core", equipment: "none", kind: "body", muscles: ["core", "forearms"],
    name: { en: "Hanging leg raise", ru: "Подъём ног в висе", uz: "Osilib oyoq ko'tarish" },
    how: { en: "Hang from a bar and raise your legs to hip height without swinging.", ru: "В висе на перекладине поднимайте ноги до уровня таза без раскачки.", uz: "Turnikka osilib, chayqalmasdan oyoqlarni tos balandligigacha ko'taring." } },
  { id: 24, group: "core", equipment: "dumbbells", kind: "weight", muscles: ["core"],
    name: { en: "Russian twist", ru: "Русские скручивания", uz: "Ruscha burilish" },
    how: { en: "Sit leaning back with feet up and turn a weight from side to side.", ru: "Сидя с наклоном назад и поднятыми ногами, поворачивайте вес из стороны в сторону.", uz: "Orqaga sal yotib, oyoqlarni ko'tarib, yukni u yoqdan bu yoqqa buring." } },

  // ---------- cardio ----------
  { id: 25, group: "cardio", equipment: "none", kind: "cardio", met: 9.8, muscles: ["heart", "legs"],
    name: { en: "Running", ru: "Бег", uz: "Yugurish" },
    how: { en: "Run at a pace where you can still talk in short sentences.", ru: "Бегите в темпе, при котором можно говорить короткими фразами.", uz: "Qisqa gaplar bilan gapira oladigan tezlikda yuguring." } },
  { id: 26, group: "cardio", equipment: "none", kind: "cardio", met: 7.5, speed: true, muscles: ["heart", "legs"],
    name: { en: "Cycling", ru: "Велосипед", uz: "Velosiped" },
    how: { en: "Keep a steady cadence and change gears instead of pushing too hard.", ru: "Держите ровный каденс и переключайте передачи, а не давите изо всех сил.", uz: "Bir xil tezlikda pedal bosing, kuch berish o'rniga uzatmani almashtiring." } },
  { id: 27, group: "cardio", equipment: "machine", kind: "cardio", met: 7, muscles: ["heart", "back", "legs"],
    name: { en: "Rowing machine", ru: "Гребной тренажёр", uz: "Eshkak trenajyori" },
    how: { en: "Push with the legs first, then lean back and pull the handle to your ribs.", ru: "Сначала толкайтесь ногами, затем отклонитесь и тяните рукоять к рёбрам.", uz: "Avval oyoqlar bilan itaring, keyin orqaga egilib dastakni qovurg'alarga torting." } },
  { id: 28, group: "cardio", equipment: "none", kind: "cardio", met: 11, muscles: ["heart", "calves"],
    name: { en: "Jump rope", ru: "Скакалка", uz: "Arg'amchi" },
    how: { en: "Jump low on the balls of your feet and turn the rope with your wrists.", ru: "Прыгайте невысоко на носках и вращайте скакалку кистями.", uz: "Oyoq uchida past sakrang va arg'amchini bilaklar bilan aylantiring." } },

  // ---------- full body ----------
  { id: 29, group: "full", equipment: "none", kind: "body", muscles: ["quads", "chest", "core", "heart"],
    name: { en: "Burpee", ru: "Бёрпи", uz: "Byorpi" },
    how: { en: "Squat, jump your feet back to a plank, do a push-up, jump forward and jump up.", ru: "Присядьте, прыжком перейдите в планку, отожмитесь, вернитесь и выпрыгните вверх.", uz: "O'tiring, sakrab plankaga o'ting, itariling, qaytib tepaga sakrang." } },
  { id: 30, group: "full", equipment: "kettlebell", kind: "weight", muscles: ["glutes", "hamstrings", "core", "shoulders"],
    name: { en: "Kettlebell swing", ru: "Махи гирей", uz: "Girya silkitish" },
    how: { en: "Drive your hips forward to swing the kettlebell to chest height. Arms stay relaxed.", ru: "Толкните таз вперёд, чтобы гиря взлетела до груди. Руки расслаблены.", uz: "Tosni oldinga itarib, giryani ko'krak balandligigacha silkiting. Qo'llar bo'sh tursin." } },
];
