export const SITE_LOCALE_COOKIE = "site-locale";

export type SiteLocale = "en" | "mn";

export const SITE_TEXT = {
  en: {
    nav: {
      work: "Work",
      sessions: "Sessions",
      locations: "Locations",
      about: "About",
      contact: "Contact",
      book: "Book a session",
      account: "Your account",
      signIn: "Sign in",
      myBookings: "My bookings",
      menu: "Menu",
      collections: "Collections",
      viewAllWork: "View all work",
      allCollections: "All collections",
      bookSession: "Book a session",
      aboutMara: "About Mara",
      locationsLabel: "Sydney locations",
      sessionPricing: "Sessions & pricing",
      checkBooking: "Check a booking",
      clientAccount: "Client account",
      allWork: "All work",
    },
    home: {
      issue: "Nº 01 — Sydney",
      photographer: "The photographer",
      readStory: "Read Mara's story",
      featuredCollections: "Featured collections",
      selectedFrames: "Selected frames",
      yearInPhotographs: "A year in photographs",
      collectionsIntro: "Twenty-one ways of seeing",
      viewAllCollections: "All collections",
      story: "A year in photographs",
      established: "Established",
      storiesTold: "Stories told",
      atelier: "Atelier",
      menuTitle: "Collections",
      menuOpen: "Menu",
    },
    footer: {
      collections: "Collections",
      explore: "Explore",
      serviceArea: "Service area",
      admin: "Admin",
      copyright: "All rights reserved.",
      byAppointment: "Shoots by appointment · seven days · AEST",
      whatsapp: "WhatsApp Mara",
    },
    common: {
      switchToMongolian: "MN",
      switchToEnglish: "EN",
      language: "Language",
    },
  },
  mn: {
    nav: {
      work: "Ажлын бүтээл",
      sessions: "Сешн",
      locations: "Байршил",
      about: "Бидний тухай",
      contact: "Холбоо барих",
      book: "Зураг авуулах",
      account: "Бүртгэл",
      signIn: "Нэвтрэх",
      myBookings: "Миний захиалга",
      menu: "Цэс",
      collections: "Цуглуулга",
      viewAllWork: "Бүх бүтээлүүд",
      allCollections: "Бүх цуглуулга",
      bookSession: "Зураг авуулах",
      aboutMara: "Марагийн тухай",
      locationsLabel: "Сиднейн байршил",
      sessionPricing: "Сешн & үнийн санал",
      checkBooking: "Захиалгаа шалгах",
      clientAccount: "Үйлчлүүлэгчийн бүртгэл",
      allWork: "Бүх бүтээл",
    },
    home: {
      issue: "Nº 01 — Сидней",
      photographer: "Зураглаач",
      readStory: "Марагийн түүхийг унших",
      featuredCollections: "Онцлох цуглуулга",
      selectedFrames: "Сонгосон кадрууд",
      yearInPhotographs: "Фотогоор нэг жил",
      collectionsIntro: "Харах арван нэгэн арга",
      viewAllCollections: "Бүх цуглуулга",
      story: "Фотогоор нэг жил",
      established: "Үүсгэн байгуулагдсан",
      storiesTold: "Түүхүүд",
      atelier: "Ателье",
      menuTitle: "Цуглуулга",
      menuOpen: "Цэс",
    },
    footer: {
      collections: "Цуглуулга",
      explore: "Судлах",
      serviceArea: "Үйлчилгээний бүс",
      admin: "Админ",
      copyright: "Бүх эрхийг хамгаалсан.",
      byAppointment: "Зураг авалт захиалгаар · долоо хоногийн турш · AEST",
      whatsapp: "WhatsApp Мара",
    },
    common: {
      switchToMongolian: "MN",
      switchToEnglish: "EN",
      language: "Хэл",
    },
  },
} as const;

export function getSiteLocale(value?: string | null): SiteLocale {
  return value === "mn" ? "mn" : "en";
}

const MONGOLIAN_COPY: Record<string, string> = {
  "Nature Photography": "Байгалийн гэрэл зураг",
  "Wedding Photography": "Хуримын гэрэл зураг",
  "Football & Sports Photography": "Хөлбөмбөг ба спортын гэрэл зураг",
  "Portrait Photography": "Хөрөг гэрэл зураг",
  "Graduation Photography": "Төгсөлтийн гэрэл зураг",
  "Birthday Photography": "Төрсөн өдрийн гэрэл зураг",
  "Couple Photography": "Хосын гэрэл зураг",
  "Family Photography": "Гэр бүлийн гэрэл зураг",
  "Fashion Photography": "Загварын гэрэл зураг",
  "Street Photography": "Гудамжны гэрэл зураг",
  "Travel Photography": "Аяллын гэрэл зураг",
  "Landscape Photography": "Байгалийн үзэмжийн гэрэл зураг",
  "Event Photography": "Арга хэмжээний гэрэл зураг",
  "Concert Photography": "Тоглолтын гэрэл зураг",
  "Product Photography": "Бүтээгдэхүүний гэрэл зураг",
  "Commercial Photography": "Арилжааны гэрэл зураг",
  "Maternity Photography": "Жирэмсний гэрэл зураг",
  "Newborn Photography": "Нярайн гэрэл зураг",
  "Lifestyle Photography": "Амьдралын хэв маягийн гэрэл зураг",
  "Architecture Photography": "Архитектурын гэрэл зураг",
  "The Essential": "Энгийн багц",
  "The Signature": "Онцгой багц",
  "The Atelier": "Ателье багц",
  "Bespoke Commission": "Тусгай захиалга",
  "For a single, beautiful hour": "Ганцхан сайхан цагт зориулав",
  "Our most-booked sitting": "Хамгийн их захиалдаг зураг авалт",
  "A full editorial production": "Бүрэн редакцийн зураг авалт",
  "Made entirely around you": "Танд бүрэн тохируулна",
  "Most loved": "Хамгийн дуртай",
  "Full experience": "Бүрэн туршлага",
  "By request": "Хүсэлтээр",
  "1-hour session, studio or outdoors": "1 цагийн зураг авалт, студид эсвэл гадаа",
  "10 fully retouched images": "Бүрэн засвартай 10 зураг",
  "Private online gallery": "Хувийн онлайн галерей",
  "Digital delivery in 10 working days": "Ажлын 10 хоногт цахимаар хүргэнэ",
  "One outfit change": "Хувцсаа нэг удаа солих",
  "2-hour session with Mara": "Маратай 2 цагийн зураг авалт",
  "25 fully retouched images": "Бүрэн засвартай 25 зураг",
  "Up to two locations nearby": "Ойролцоох хоёр хүртэл байршил",
  "Sneak preview within 72 hours": "Эхний зургуудыг 72 цагт хүргэнэ",
  "Print-ready high resolution files": "Хэвлэхэд бэлэн өндөр нягтралтай файлууд",
  "4-hour session, full creative direction": "4 цагийн зураг авалт, бүрэн бүтээлч чиглүүлэг",
  "50 fully retouched images": "Бүрэн засвартай 50 зураг",
  "Multiple locations and looks": "Олон байршил, төрх",
  "Styling and moodboard consultation": "Стайлинг ба санааны самбарын зөвлөгөө",
  "Priority delivery in 5 working days": "Ажлын 5 хоногт шуурхай хүргэнэ",
  "Fine-art print set of 5 images": "5 зургийн арт хэвлэлийн багц",
  "Private gallery for guests": "Зочдод зориулсан хувийн галерей",
  "Custom scope, crew and locations": "Тусгай ажлын хүрээ, баг болон байршил",
  "Editorial, brand or multi-day coverage": "Редакцийн, брэндийн эсвэл олон өдрийн зураг авалт",
  "Dedicated producer": "Тусгай продюсер",
  "Flexible payment plan": "Уян хатан төлбөрийн нөхцөл",
  "Quoted within 48 hours": "48 цагийн дотор үнийн санал өгнө",
  "Bondi Beach": "Бондигийн наран шарлагын газар",
  "Mrs Macquarie's Chair": "Миссис Маккуоригийн сандал",
  "Barangaroo Reserve": "Барангаругийн нөөц газар",
  "Centennial Park": "Зуун жилийн парк",
  "The Rocks": "Рокс дүүрэг",
  "Paddington Streets": "Пэддингтоны гудамжууд",
  "Manly Beach": "Мэнлигийн наран шарлагын газар",
  "Palm Beach": "Палм Бич",
  "Watsons Bay": "Уотсонс Бэй",
  "Echo Point, Blue Mountains": "Эхо Пойнт, Блю Маунтинс",
  "Eastern Suburbs": "Зүүн захын дүүргүүд",
  "Sydney Harbour": "Сиднейн боомт",
  "Northern Beaches": "Хойд эргийн наран шарлагын газрууд",
  "Greater Sydney": "Сиднейн их бүс",
  Couple: "Хос",
  Portrait: "Хөрөг",
  Lifestyle: "Амьдралын хэв маяг",
  Fashion: "Загвар",
  Wedding: "Хурим",
  Architecture: "Архитектур",
  Family: "Гэр бүл",
  Maternity: "Жирэмсний зураг",
  Street: "Гудамж",
  Landscape: "Байгалийн үзэмж",
  Travel: "Аялал",
  "The obvious one, and still the best at first light — pale sand, cold Pacific light and the long curve of the promenade before the crowds arrive.":
    "Хүн бүрийн мэдэх газар ч үүрийн гэрэлд хамгийн сайхан хэвээр — цайвар элс, Номхон далайн сэрүүн гэрэл, хүмүүс ирэхээс өмнөх урт эргийн зам.",
  "Harbour, bridge and opera house in one frame. Late afternoon light turns the sandstone gold.":
    "Боомт, гүүр, дуурийн театр нэг кадрт. Үдээс хойших гэрэл элсэн чулууг алтлаг болгоно.",
  "Sculpted headland, native planting and clean stone — modern Sydney at its most restrained.":
    "Уран хэлбэртэй хошуу, уугуул ургамал, цэвэр чулуун хийц — орчин үеийн Сиднейн даруухан өнгө төрх.",
  "Fig trees, still water and long avenues — soft, green and endlessly forgiving in the middle of the day.":
    "Фикус модод, тогтуун ус, урт өргөн чөлөө — өдрийн дунд ч зөөлөн, ногоон, үргэлж тохиромжтой орчин.",
  "Sandstone lanes and old brick — the history of the city as a backdrop.":
    "Элсэн чулуун гудамж, хуучин тоосгон барилга — хотын түүхийг арын дэвсгэр болгоно.",
  "Terraces, iron lace and quiet corners. A neighbourhood shoot with the feel of a European editorial.":
    "Эгнээ байшин, төмөр хээтэй тагт, нам гүм булангууд. Европын редакцийн өнгө аястай хорооллын зураг авалт.",
  "North-facing light all afternoon, pine trees and a genuinely relaxed crowd.":
    "Өдрийн турш хойд зүгээс тусах гэрэл, нарс модод, үнэхээр тайван уур амьсгал.",
  "The peninsula at the end of the line — lighthouse walks, turquoise water and nobody in a hurry.":
    "Замын төгсгөл дэх хойг — гэрэлт цамхаг руу алхах зам, оюу өнгийн ус, яарсан хүнгүй орчин.",
  "Cliffs, harbour and the city in the distance. Wind is part of the picture.":
    "Хадан цохио, боомт, алсад харагдах хот. Салхи ч зургийн нэг хэсэг.",
  "Valley fog, eucalypt haze and the kind of scale that makes people quiet.":
    "Хөндийн манан, эвкалиптын униар, хүнийг өөрийн эрхгүй чимээгүй болгодог уудам орон зай.",
  "Long walks, quiet light and the texture of the living world — photographed slowly, on foot, at the hour when everything softens.":
    "Урт алхалт, намуухан гэрэл, амьд ертөнцийн өнгө төрх — бүх зүйл зөөлөрдөг тэр мөчид удаанаар, алхаж зураглав.",
  "Unposed, editorial coverage of the day as it actually unfolds: the shaking hands, the stolen glance, the grandmother laughing too loudly.":
    "Өдөр хэрхэн өрнөж байгааг найруулгагүй, редакцийн хэв маягаар буулгана: салганасан гар, нууцхан харц, чанга инээх эмээ.",
  "On the touchline with fast glass — the tackle, the sweat, the roar. Made for clubs, athletes and the people who love them.":
    "Талбайн хажуугаас хурдан дурангаар — мөргөлдөөн, хөлс, уухай. Клуб, тамирчид болон тэднийг дэмждэг хүмүүст зориулав.",
  "A one-hour sitting in natural light. No stiff posing, no forced smiles — just a conversation, a window and the version of you people remember.":
    "Байгалийн гэрэлд нэг цагийн хөрөг зураг авалт. Хөшүүн поз, хүчээр инээх зүйлгүй — зүгээр л ярилцлага, цонхны гэрэл, хүмүүсийн дурсах таны дүр төрх.",
  "The gown, the campus, the family who drove six hours to be there. A short, celebratory session that captures all of it.":
    "Төгсөлтийн өмсгөл, кампус, зургаан цаг явж ирсэн гэр бүл. Энэ бүхнийг буулгах богино, баяр хөөртэй зураг авалт.",
  "Cakes, candles, confetti and the chaos in between. Documentary coverage for milestones from first birthdays to fiftieths.":
    "Бялуу, лаа, конфетти болон тэдгээрийн хоорондох хөгжилтэй хөл хөдөлгөөн. Анхны төрсөн өдрөөс тавин насны ой хүртэлх дурсамжийг баримтат хэв маягаар буулгана.",
  "An hour for the two of you — golden hour, a quiet street, movement instead of posing. Often booked for anniversaries and engagements.":
    "Та хоёрт зориулсан нэг цаг — алтан цагийн гэрэл, нам гүм гудамж, позоос илүү хөдөлгөөн. Ойн баяр болон сүй тавилтад ихэвчлэн захиалдаг.",
  "Real families, gently directed. We plan for the chaos, photograph the in-between moments, and still get the frame for the wall.":
    "Жинхэнэ гэр бүлүүдийг аядуу чиглүүлнэ. Хөгжилтэй үймээнийг тооцоолж, завсрын мөчүүдийг буулгаад хананд өлгөх зургийг ч авна.",
  "Lookbook, campaign and editorial work with a small, fast crew. Studio or location, film-inspired colour, wardrobe and styling support available.":
    "Бага бүрэлдэхүүнтэй шуурхай баг lookbook, кампанит ажил болон редакцийн зураг авалт хийнэ. Студи эсвэл байршил дээр, киноны өнгө аястай засвар, хувцас болон стайлингийн тусламжтай.",
  "The city as it is: rain, sodium light, strangers mid-gesture. Personal work from Sydney, Tokyo, Milan and New York.":
    "Хотыг байгаагаар нь: бороо, гудамжны шар гэрэл, хөдөлгөөн дундах танихгүй хүмүүс. Сидней, Токио, Милан, Нью-Йоркоос бүтээсэн хувийн цуврал.",
  "Commissions for hotels, tourism boards and travel brands — and the journals that come home with us afterwards.":
    "Зочид буудал, аялал жуулчлалын байгууллага болон аяллын брэндийн захиалга — мөн аяллаас авчрах дурсамжийн тэмдэглэлүүд.",
  "Wide, quiet frames made at dawn. Available as archival fine-art prints in limited editions.":
    "Үүрээр авсан өргөн, нам гүм кадрууд. Хязгаарлагдмал тоогоор архивын арт хэвлэлээр гаргана.",
  "Launches, openings, dinners and conferences. Discreet coverage, same-week delivery of a curated highlight set.":
    "Нээлт, хүлээн авалт, оройн зоог болон хурал. Анзаарагдахгүй зураг авалт, онцлох зургуудыг тухайн долоо хоногт хүргэнэ.",
  "Pit access, low light and honest energy. We work with promoters, labels and artists for tours and festival coverage.":
    "Тайзны урд хэсэг, бүдэг гэрэл, жинхэнэ эрч хүч. Аялан тоглолт болон наадмын зураг авалтад зохион байгуулагч, лэйбл, уран бүтээлчидтэй хамтарна.",
  "Clean, considered product imagery for e-commerce and campaigns — including styling, set building and retouching.":
    "Цахим худалдаа болон кампанит ажилд зориулсан цэвэр, нягт нямбай бүтээгдэхүүний зураг — стайлинг, тайз засалт, засварыг багтаана.",
  "Brand, hospitality and interior commissions with full production support. One crew, one look, every deliverable you need.":
    "Брэнд, зочлох үйлчилгээ болон интерьерийн захиалгад бүрэн продакшны дэмжлэг үзүүлнэ. Нэг баг, нэг өнгө аяс, шаардлагатай бүх материал.",
  "A gentle, unhurried session in studio or at home, usually booked between 28 and 36 weeks. Partners and siblings welcome.":
    "Студи эсвэл гэрт тайван, яаралгүй зураг авалт. Ихэвчлэн жирэмсний 28–36 долоо хоногт товлодог. Хань болон ах, эгчийг урьж болно.",
  "The first fourteen days, photographed slowly and safely. Warm studio, no rush, plenty of time for feeding and settling.":
    "Амьдралын эхний 14 хоногийг тайван, аюулгүйгээр буулгана. Дулаан студи, яарахгүй, хооллох болон тайвшрах хангалттай цагтай.",
  "Brands, creators and families at home in their own light — a documentary approach for people who hate being photographed.":
    "Өөрийн орчин, гэрэлдээ тухалсан брэнд, бүтээгчид болон гэр бүлүүд — зураг авахуулах дургүй хүмүүст зориулсан баримтат арга барил.",
  "Spaces rendered honestly: verticals corrected, light balanced, the architect's intent preserved for portfolio and press.":
    "Орон зайг бодитоор буулгана: босоо шугамыг засаж, гэрлийг тэнцвэржүүлэн, архитекторын санааг портфолио болон хэвлэлд зориулж хадгална.",
  "An art of remembering.": "Дурсамжийг урлахуй.",
  "Sydney · Australia · Worldwide": "Сидней · Австрали · Дэлхий даяар",
  "Now taking bookings for the 2026 wedding season — only 8 dates remain.":
    "2026 оны хуримын улирлын захиалга авч байна — ердөө 8 өдөр үлдлээ.",
  "On location across Sydney, NSW — we travel to you. No fixed studio address.":
    "Шинэ Өмнөд Уэльсийн Сидней даяар таны сонгосон газар очиж үйлчилнэ. Тогтсон студийн хаяггүй.",
  "Every slot on this date is taken. Try another day.":
    "Энэ өдрийн бүх цаг захиалагдсан байна. Өөр өдөр сонгоно уу.",
  "No availability on this date.": "Энэ өдөр боломжтой цаг алга.",
  "Could not load availability — refresh and try again.":
    "Боломжтой цагийг ачаалж чадсангүй — хуудсыг шинэчлээд дахин оролдоно уу.",
  "Conversation": "Ярилцлага",
  "We begin with a call or a coffee. What is this for, who is in it, and what do you want to feel when you look at the photographs in ten years?":
    "Бид утсаар ярилцах эсвэл кофе уухаас эхэлнэ. Энэ зураг авалт ямар зорилготой, хэн оролцох, арван жилийн дараа зургаа харахад ямар мэдрэмж төрөөсэй гэж хүсэж байна вэ?",
  "The plan": "Төлөвлөгөө",
  "A moodboard, a loose shot list, timings and locations. Enough structure to keep the day calm, enough freedom to let it be real.":
    "Санааны самбар, ерөнхий зураг авалтын жагсаалт, цагийн хуваарь болон байршлыг гаргана. Өдрийг тайван байлгахуйц зохион байгуулалттай, бодит мөчүүдийг үлдээхүйц уян хатан байна.",
  "The day": "Зураг авалтын өдөр",
  "We arrive early, shoot quietly, and direct only when it helps. Most clients tell us they forgot the camera was there by the second hour.":
    "Бид эрт ирж, нам гүмхэн зураг авч, шаардлагатай үед л чиглүүлнэ. Ихэнх үйлчлүүлэгч хоёр дахь цаг гэхэд камер байгааг мартсан байдаг гэж хэлдэг.",
  "The edit": "Засвар",
  "Hand-retouched with restraint — no heavy smoothing, no borrowed trends. A sneak peek in 72 hours, the full gallery in 10 working days.":
    "Хэт их арьс толийлголт, түр зуурын чиг хандлагагүй, нямбай гараар засварлана. Эхний зургуудыг 72 цагт, бүрэн галерейг ажлын 10 хоногт хүргэнэ.",
  "Every moment deserves to be remembered.": "Мөч бүр дурсагдан үлдэх үнэ цэнтэй.",
  "An atelier of intimate, editorial photography — quiet direction, honest light, and images that still feel like you in twenty years.":
    "Дотно, редакцийн хэв маягийн гэрэл зургийн ателье — намуухан чиглүүлэг, байгалийн гэрэл, хорин жилийн дараа ч өөрийнхөөрөө мэдрэгдэх зургууд.",
  "A practice built on stillness, light and trust.": "Тайван байдал, гэрэл, итгэлцэлд суурилсан бүтээл.",
  "MARA'S PHOTOGRAPHY is an on-location practice in Sydney, photographing people outdoors in the places they love.\n\nThere is no studio to visit — Mara comes to you, working with natural light and quiet direction to make images that still feel like you in twenty years.":
    "MARA'S PHOTOGRAPHY нь Сиднейд үйл ажиллагаа явуулдаг бөгөөд хүмүүсийн хайртай газарт очиж зураг авдаг.\n\nЗочлох студи байхгүй — Мара таны сонгосон газар очиж, байгалийн гэрэл болон намуухан чиглүүлгээр хорин жилийн дараа ч өөрийнхөөрөө мэдрэгдэх зураг бүтээнэ.",
  "Photographer & founder": "Зураглаач, үүсгэн байгуулагч",
  "I photograph people on location around Sydney — early on a beach, in a terraced street, somewhere that already means something to you.":
    "Би Сидней орчмын байршилд хүмүүсийн зургийг авдаг — эртлэн далайн эрэг дээр, эгнээ байшинтай гудамжинд, эсвэл танд утга учиртай газарт.",
  "Her love for photography began at home, inspired by her father, who was also a photographer. Growing up, she often watched him behind the camera, capturing moments and turning everyday memories into something special. Over time, that inspiration became her own little passion.\n\nWhat started as a hobby led her to pick up a camera and capture her family, everyday moments, and the beauty of nature. As her interest grew, so did her creativity. More recently, she began exploring portrait photography, discovering new ways to capture people's personalities, emotions, and individuality.\n\nToday, photography is more than simply taking pictures. It's her way of preserving moments, expressing creativity, and telling stories through her own perspective.":
    "Гэрэл зурагт дурлах эхлэл нь гэртээ, мөн зураглаач байсан ааваасаа урам авснаар тавигджээ. Өсөж томрохдоо аавыгаа камерын ард агшин бүрийг буулгаж, өдөр тутмын дурсамжийг онцгой болгож байхыг олонтаа хардаг байв. Цаг хугацаа өнгөрөхөд тэрхүү урам зориг өөрийнх нь нандин хүсэл тэмүүлэл болсон.\n\nХоббигоо даган камер барьж, гэр бүл, өдөр тутмын мөчүүд, байгалийн сайхныг буулгаж эхэлжээ. Сонирхол нь нэмэгдэхийн хэрээр бүтээлч байдал нь ч тэлсэн. Сүүлийн үед хөрөг зурагт анхаарч, хүмүүсийн зан чанар, сэтгэл хөдлөл, өвөрмөц төрхийг илэрхийлэх шинэ аргуудыг нээж байна.\n\nӨнөөдөр гэрэл зураг нь зүгээр зураг авах төдий биш. Энэ бол мөчүүдийг хадгалах, бүтээлч байдлаа илэрхийлэх, өөрийн өнцгөөс түүх өгүүлэх арга юм.",
  "How far in advance should I book?": "Хэр эрт захиалах хэрэгтэй вэ?",
  "Weddings and editorial commissions are usually booked three to nine months ahead. Portraits, couples and family sessions can often be arranged within two to three weeks.":
    "Хурим болон редакцийн зураг авалтыг ихэвчлэн 3–9 сарын өмнө захиалдаг. Хөрөг, хосын болон гэр бүлийн зураг авалтыг 2–3 долоо хоногийн дотор товлох боломжтой.",
  "What is included in the session fee?": "Зураг авалтын үнэд юу багтсан бэ?",
  "Your package includes Mara's time on location, direction on the day, professional retouching and a private online gallery. Travel is quoted upfront; prints and albums are available separately.":
    "Багцад Марагийн зураг авалтын цаг, тухайн өдрийн чиглүүлэг, мэргэжлийн засвар болон хувийн онлайн галерей багтана. Аяллын зардлыг урьдчилан тооцож, хэвлэл болон цомгийг тусад нь захиална.",
  "How long until I receive my photographs?": "Зургаа хэзээ хүлээн авах вэ?",
  "A sneak peek arrives within 72 hours. Full galleries are delivered in 10–14 working days, and premium commissions receive priority delivery within 5 working days.":
    "Эхний зургуудыг 72 цагийн дотор илгээнэ. Бүрэн галерейг ажлын 10–14 хоногт, дээд зэрэглэлийн захиалгыг ажлын 5 хоногт багтаан хүргэнэ.",
  "Can we shoot outdoors or at a location we love?": "Гадаа эсвэл дуртай газраа зураг авахуулж болох уу?",
  "Absolutely. We travel across Sydney, the Blue Mountains and beyond. Travel within greater Sydney is included; other locations are quoted at cost.":
    "Мэдээж. Бид Сидней, Блю Маунтинс болон бусад газарт очиж зураг авна. Сиднейн их бүсийн аялал багтсан бөгөөд бусад байршлын зардлыг тусад нь тооцно.",
  "What happens if it rains?": "Бороо орвол яах вэ?",
  "We watch the forecast together. If the weather turns, we move indoors or reschedule at no extra cost — your booking carries over to the next available date.":
    "Бид цаг агаарын мэдээг хамтдаа ажиглана. Цаг агаар тохиромжгүй бол дотор орчинд шилжих эсвэл нэмэлт төлбөргүйгээр өөр өдөр товлоно.",
  "Do you offer payment plans?": "Төлбөрийг хувааж төлж болох уу?",
  "A 30% deposit reserves your date. The balance is due seven days before the session, and instalments can be arranged for premium commissions. All prices are in Australian dollars.":
    "30%-ийн урьдчилгаа таны товыг хадгална. Үлдэгдлийг зураг авалтаас долоо хоногийн өмнө төлөх бөгөөд дээд зэрэглэлийн захиалгад хэсэгчлэн төлөх боломжтой. Бүх үнэ австрали доллараар илэрхийлэгдсэн.",
  "Your details are used only to manage your booking, deliver your gallery and send the notifications you asked for. Photographs are delivered through a private gallery link and are never published without your permission. Ask us at any time to delete your data.":
    "Таны мэдээллийг зөвхөн захиалгыг удирдах, галерей хүргэх болон таны хүссэн мэдэгдлийг илгээхэд ашиглана. Зургийг хувийн галерейн холбоосоор хүргэх бөгөөд таны зөвшөөрөлгүйгээр нийтлэхгүй. Та хүссэн үедээ мэдээллээ устгуулах хүсэлт гаргаж болно.",
  "A booking is a request until Mara confirms it. Prices are in Australian dollars and include GST where applicable. Travel fees and extras are shown before you submit. Galleries remain online for twelve months unless agreed otherwise.":
    "Мара баталгаажуулах хүртэл захиалга нь хүсэлт хэвээр байна. Үнэ австрали доллараар илэрхийлэгдэж, шаардлагатай тохиолдолд GST багтсан. Аяллын зардал болон нэмэлт төлбөрийг хүсэлт илгээхээс өмнө харуулна. Өөрөөр тохироогүй бол галерей 12 сарын турш онлайн байна.",
  "Cancel or move a session at no cost up to 72 hours before the start time. Inside 72 hours the deposit is retained or held as a credit for twelve months. Cancellations by Mara — including unsafe weather — are always refunded or rebooked at no cost.":
    "Зураг авалт эхлэхээс 72-оос доошгүй цагийн өмнө үнэ төлбөргүй цуцлах эсвэл өөрчлөх боломжтой. 72 цагийн дотор цуцалбал урьдчилгааг суутгах эсвэл 12 сарын кредит болгон хадгална. Марагаас шалтгаалан, цаг агаарын аюултай нөхцөл оролцуулан цуцалсан тохиолдолд төлбөрийг буцаах эсвэл үнэ төлбөргүй дахин товлоно.",
  "Shoots are outdoors, so weather matters. If rain, high wind or extreme heat makes your session unsafe or unflattering, we reschedule once at no cost — you can request a new date from your booking page at any time, and Mara confirms it. If a reschedule is impossible, the deposit is held on a credit for twelve months.":
    "Зураг авалт гадаа явагдах тул цаг агаар чухал. Бороо, хүчтэй салхи эсвэл хэт халуунаас шалтгаалан зураг авалт аюултай эсвэл тохиромжгүй бол нэг удаа үнэ төлбөргүй өөр өдөр товлоно. Та захиалгын хуудсаар шинэ өдөр хүсэж болох бөгөөд Мара баталгаажуулна. Өөр өдөр товлох боломжгүй бол урьдчилгааг 12 сарын кредит болгон хадгална.",
  "Travel within 15 km of the Sydney CBD is included in every session. Beyond that, a travel fee is added to your quote and shown before you submit. Locations outside greater Sydney — the Blue Mountains, the Central Coast, the Southern Highlands — carry a minimum booking value and are quoted individually.":
    "Сидней хотын төвөөс 15 км-ийн доторх аяллын зардал бүх зураг авалтад багтсан. Үүнээс цааш аяллын зардлыг үнийн саналд нэмж, хүсэлт илгээхээс өмнө харуулна. Сиднейн их бүсээс гадуурх Блю Маунтинс, Төв эрэг, Өмнөд өндөрлөг зэрэг байршилд захиалгын доод дүн үйлчлэх бөгөөд үнийг тусад нь тооцно.",
  "30 minutes from the CBD. Street parking on Curlewis Street, or arrive by train to Bondi Junction and a short bus.":
    "Хотын төвөөс 30 минут. Curlewis Street-д гудамжны зогсоол бий. Эсвэл галт тэргээр Bondi Junction хүрээд богино зайд автобусаар явна.",
  "Waverley Council permits commercial photography on the sand and promenade; filming/photography permits must be requested at least 5 business days ahead.":
    "Waverley Council элсэн эрэг болон зугаалгын замд арилжааны зураг авалтыг зөвшөөрдөг. Зураг авалтын зөвшөөрлийг ажлын 5-аас доошгүй өдрийн өмнө хүснэ.",
  "Inside the Royal Botanic Garden, 15 minutes from the CBD. Paid parking at the Art Gallery Road car park.":
    "Royal Botanic Garden дотор, хотын төвөөс 15 минутын зайтай. Art Gallery Road зогсоолд төлбөртэй зогсоол бий.",
  "Royal Botanic Garden Sydney requires a permit for commercial photography and wedding parties; applications are assessed case by case.":
    "Royal Botanic Garden Sydney-д арилжааны зураг авалт болон хуримын багт зөвшөөрөл шаардлагатай. Хүсэлтийг тус бүрээр нь хянана.",
  "Walk from Wynyard station. Limited paid parking at Barangaroo.":
    "Wynyard өртөөнөөс явган хүрнэ. Barangaroo-д хязгаарлагдмал төлбөртэй зогсоол бий.",
  "Permit approved for small editorial and portrait sessions (no crew, no tripods on the lawn). Bring the approval letter on the day.":
    "Жижиг редакцийн болон хөрөг зураг авалтад зөвшөөрөл олгосон (баггүй, зүлгэн дээр tripod ашиглахгүй). Зураг авалтын өдөр зөвшөөрлийн бичгээ авчирна уу.",
  "15 minutes from the CBD. Parking on Grand Drive and Robertson Road gates.":
    "Хотын төвөөс 15 минут. Grand Drive болон Robertson Road хаалганы ойролцоо зогсоолтой.",
  "Centennial Parklands permit approved for portrait sessions; no confetti, no props on the grass, no blocking of paths.":
    "Centennial Parklands хөрөг зураг авалтад зөвшөөрөл олгосон. Конфетти, зүлгэн дээр хэрэглэл ашиглах болон зам хаахыг хориглоно.",
  "Walking distance from Circular Quay. Weekend markets make early mornings essential.":
    "Circular Quay-гаас явган хүрэх зайтай. Амралтын өдрийн захтай тул өглөө эрт ирэх нь тохиромжтой.",
  "Place Management NSW requires a permit for commercial photography in the laneways and on the foreshore.":
    "Гудамж болон эргийн бүсэд арилжааны зураг авалт хийхэд Place Management NSW-ийн зөвшөөрөл шаардлагатай.",
  "10 minutes from the CBD. Best on weekday mornings; metered parking on Oxford Street.":
    "Хотын төвөөс 10 минут. Ажлын өдрийн өглөө илүү тохиромжтой; Oxford Street-д төлбөртэй зогсоолтой.",
  "Public footpaths — no permit required. We keep clear of shopfronts and residents' doorways.":
    "Олон нийтийн явган замд зөвшөөрөл шаардахгүй. Дэлгүүрийн нүүр болон оршин суугчдын орц гарцыг чөлөөтэй байлгана.",
  "30 minutes by ferry from Circular Quay — the most pleasant commute in Sydney.":
    "Circular Quay-гаас усан онгоцоор 30 минут — Сиднейн хамгийн таатай аялал.",
  "Northern Beaches Council requires a permit for commercial photography on the beach and promenade.":
    "Далайн эрэг болон зугаалгын замд арилжааны зураг авалт хийхэд Northern Beaches Council-ийн зөвшөөрөл шаардлагатай.",
  "50 minutes north of the CBD. A full-day or sunset session is recommended to justify the drive.":
    "Хотын төвөөс хойш 50 минут. Замын хугацааг нөхөхийн тулд бүтэн өдөр эсвэл нар жаргах үеийн зураг авалт санал болгоно.",
  "Permit requirements with Northern Beaches Council not yet confirmed for this location.":
    "Энэ байршлын Northern Beaches Council-ийн зөвшөөрлийн шаардлагыг хараахан баталгаажуулаагүй.",
  "25 minutes from the CBD, or a ferry to Watsons Bay wharf.":
    "Хотын төвөөс 25 минут, эсвэл усан онгоцоор Watsons Bay зогсоол хүрнэ.",
  "Council permit status to be confirmed before we shoot on the headland.":
    "Хошуун дээр зураг авахаас өмнө зөвлөлийн зөвшөөрлийн төлөвийг баталгаажуулна.",
  "Two hours west of Sydney. Only offered with a full-day or bespoke booking.":
    "Сиднейгээс баруун тийш хоёр цаг. Зөвхөн бүтэн өдрийн эсвэл тусгай захиалгаар санал болгоно.",
  "NSW National Parks requires a commercial photography licence for the Three Sisters lookout and walking tracks.":
    "Three Sisters-ийн харах цэг болон явган замд арилжааны зураг авалт хийхэд NSW National Parks-ийн лиценз шаардлагатай.",
};

export function localizeSiteContent(content: string, locale: SiteLocale): string {
  return locale === "mn" ? MONGOLIAN_COPY[content] ?? content : content;
}

export function localizeImageTitle(title: string, locale: SiteLocale): string {
  if (locale === "en") return title;
  const frame = title.match(/^(.*) · Frame (\d+)$/);
  return frame
    ? `${localizeSiteContent(frame[1], locale)} · Кадр ${frame[2]}`
    : localizeSiteContent(title, locale);
}

const MONGOLIAN_STATUSES: Record<string, string> = {
  "Pending review": "Хянагдаж байна",
  Approved: "Зөвшөөрсөн",
  "Awaiting payment": "Төлбөр хүлээгдэж байна",
  Paid: "Төлсөн",
  Completed: "Дууссан",
  Rejected: "Татгалзсан",
  Cancelled: "Цуцалсан",
  Unpaid: "Төлөөгүй",
  "Deposit paid": "Урьдчилгаа төлсөн",
  "Fully paid": "Бүрэн төлсөн",
  Refunded: "Буцаан олгосон",
  settlement: "Төлбөр баталгаажсан",
  capture: "Төлбөр авсан",
  pending: "Хүлээгдэж байна",
  failed: "Амжилтгүй",
  refunded: "Буцаан олгосон",
};

export function localizeStatus(label: string, locale: SiteLocale): string {
  return locale === "mn" ? MONGOLIAN_STATUSES[label] ?? label : label;
}

