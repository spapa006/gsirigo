import type { Locale } from '@/i18n/routing';

export type DestinationLocalized = {
  /** Display name, e.g. "Dubai" */
  name: string;
  /** Country name, e.g. "United Arab Emirates" */
  country: string;
  /** Pickup city pre-filled into widgets */
  city: string;
  tagline: string;
  description: string;
  highlights: string[];
  /** Typical weekly rental price in the local intro phrase, e.g. "from $120/week" */
  priceFrom: string;
};

export type Destination = {
  slug: string;
  /** Free-to-use travel photo that visually represents this destination (Unsplash CDN) */
  image: string;
  /** Sort weight for the homepage */
  weight: number;
  i18n: Record<Locale, DestinationLocalized>;
};

export const destinations: Destination[] = [
  {
    slug: 'dubai',
    image: 'https://images.unsplash.com/photo-1746731341047-76b2652ea843?q=80&w=1600&auto=format&fit=crop', // Burj Khalifa, Dubai
    weight: 1,
    i18n: {
      en: {
        name: 'Dubai',
        country: 'United Arab Emirates',
        city: 'Dubai Airport',
        tagline: 'Glide between malls and desert dunes',
        description:
          'Dubai rewards drivers with wide highways, cheap fuel and endless things to see. Rent at the airport and be at the Burj Khalifa in 15 minutes.',
        highlights: ['Airport pick-up in minutes', 'Very cheap fuel', 'Desert road trips nearby'],
        priceFrom: 'from $120/week',
      },
      fr: {
        name: 'Dubaï',
        country: 'Émirats arabes unis',
        city: 'Aéroport de Dubaï',
        tagline: 'Glissez entre les malls et les dunes',
        description:
          'Dubaï récompense les conducteurs : autoroutes larges, carburant bon marché et attractions à foison. Louez à l’aéroport et soyez à la Burj Khalifa en 15 minutes.',
        highlights: ['Retrait à l’aéroport en quelques minutes', 'Carburant très abordable', 'Road-trips dans le désert'],
        priceFrom: 'dès 120 $/semaine',
      },
      es: {
        name: 'Dubái',
        country: 'Emiratos Árabes Unidos',
        city: 'Aeropuerto de Dubái',
        tagline: 'Desliza entre centros comerciales y dunas',
        description:
          'Dubái premia al conductor: autopistas anchas, combustible barato y mil cosas que ver. Alquila en el aeropuerto y llega al Burj Khalifa en 15 minutos.',
        highlights: ['Recogida en el aeropuerto en minutos', 'Combustible muy barato', 'Rutas por el desierto'],
        priceFrom: 'desde 120 $/semana',
      },
      ar: {
        name: 'دبي',
        country: 'الإمارات العربية المتحدة',
        city: 'مطار دبي',
        tagline: 'انطلق بين المراكز التجارية وكثبان الصحراء',
        description:
          'دبي تكافئ السائقين بطرق سريعة واسعة ووقود رخيص ومعالم لا تنتهي. استأجر سيارتك من المطار وكن في برج خليفة خلال 15 دقيقة.',
        highlights: ['استلام من المطار في دقائق', 'وقود رخيص جداً', 'رحلات برية قريبة في الصحراء'],
        priceFrom: 'ابتداءً من 120$ أسبوعياً',
      },
    },
  },
  {
    slug: 'spain',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=1600&auto=format&fit=crop', // Sagrada Família, Barcelona
    weight: 2,
    i18n: {
      en: {
        name: 'Spain',
        country: 'Spain',
        city: 'Barcelona Airport',
        tagline: 'Coast-to-coast road trips made easy',
        description:
          'From the Costa del Sol to the Pyrenees, Spain is a road-tripper’s paradise. Pick up a car in Barcelona or Madrid and go at your own pace.',
        highlights: ['Motorways with light tolls', 'Tons of beach towns', 'Year-round mild climate'],
        priceFrom: 'from $95/week',
      },
      fr: {
        name: 'Espagne',
        country: 'Espagne',
        city: 'Aéroport de Barcelone',
        tagline: 'Des road-trips faciles d’une côte à l’autre',
        description:
          'De la Costa del Sol aux Pyrénées, l’Espagne est un paradis pour les road-trips. Louez à Barcelone ou à Madrid et avancez à votre rythme.',
        highlights: ['Autoroutes à péage modéré', 'De nombreuses villes balnéaires', 'Climat doux toute l’année'],
        priceFrom: 'dès 95 $/semaine',
      },
      es: {
        name: 'España',
        country: 'España',
        city: 'Aeropuerto de Barcelona',
        tagline: 'Rutas de costa a costa sin complicaciones',
        description:
          'De la Costa del Sol a los Pirineos, España es un paraíso para viajar en coche. Recoge tu coche en Barcelona o Madrid y sigue tu propio ritmo.',
        highlights: ['Autopistas con peajes ligeros', 'Muchos pueblos de playa', 'Clima suave todo el año'],
        priceFrom: 'desde 95 $/semana',
      },
      ar: {
        name: 'إسبانيا',
        country: 'إسبانيا',
        city: 'مطار برشلونة',
        tagline: 'رحلات برية سهلة من ساحل إلى ساحل',
        description:
          'من ساحل الشمس إلى جبال البرانس، إسبانيا جنة لعشاق الرحلات البرية. استلم سيارتك في برشلونة أو مدريد وتنقل بإيقاعك الخاص.',
        highlights: ['طرق سريعة برسوم خفيفة', 'مدن شاطئية كثيرة', 'مناخ معتدل طوال العام'],
        priceFrom: 'ابتداءً من 95$ أسبوعياً',
      },
    },
  },
  {
    slug: 'italy',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1600&auto=format&fit=crop', // Colosseum, Rome
    weight: 3,
    i18n: {
      en: {
        name: 'Italy',
        country: 'Italy',
        city: 'Rome Fiumicino Airport',
        tagline: 'Tuscany, Amalfi and everything between',
        description:
          'Italy is best explored by car — small towns, coastal cliffs and vineyard roads. Book early for summer and compare the big brands for the best price.',
        highlights: ['Scenic Amalfi coastline', 'ZTL zones to learn about', 'Great value in shoulder season'],
        priceFrom: 'from $110/week',
      },
      fr: {
        name: 'Italie',
        country: 'Italie',
        city: 'Aéroport de Rome-Fiumicino',
        tagline: 'La Toscane, Amalfi et tout le reste',
        description:
          'L’Italie se découvre idéalement en voiture : villages, falaises côtières et routes viticoles. Réservez tôt pour l’été et comparez les grandes marques.',
        highlights: ['Côte amalfitaine spectaculaire', 'Zones à trafic limité (ZTL)', 'Excellent rapport qualité/prix hors saison'],
        priceFrom: 'dès 110 $/semaine',
      },
      es: {
        name: 'Italia',
        country: 'Italia',
        city: 'Aeropuerto de Roma-Fiumicino',
        tagline: 'Toscana, Amalfi y todo lo demás',
        description:
          'Italia se recorre mejor en coche: pueblos pequeños, acantilados costeros y rutas entre viñedos. Reserva pronto para el verano y compara marcas.',
        highlights: ['Costa de Amalfi espectacular', 'Zonas de tráfico limitado (ZTL)', 'Gran precio en temporada media'],
        priceFrom: 'desde 110 $/semana',
      },
      ar: {
        name: 'إيطاليا',
        country: 'إيطاليا',
        city: 'مطار روما فيوميتشينو',
        tagline: 'توسكانا وأمالفي وكل ما بينهما',
        description:
          'تُكتشف إيطاليا بشكل مثالي بالسيارة: قرى صغيرة وجروف ساحلية وطرق بين الكروم. احجز مبكراً لفصل الصيف وقارن بين العلامات الكبرى.',
        highlights: ['ساحل أمالفي الخلاب', 'مناطق المرور المقيّد (ZTL)', 'قيمة ممتازة خارج الموسم'],
        priceFrom: 'ابتداءً من 110$ أسبوعياً',
      },
    },
  },
  {
    slug: 'turkey',
    image: 'https://images.unsplash.com/photo-1752926269883-78794047bac5?q=80&w=1600&auto=format&fit=crop', // Hagia Sophia, Istanbul
    weight: 4,
    i18n: {
      en: {
        name: 'Turkey',
        country: 'Türkiye',
        city: 'Istanbul Airport',
        tagline: 'From Istanbul’s streets to the Turquoise Coast',
        description:
          'A car unlocks Cappadocia’s valleys, the Aegean coast and the Turquoise Coast. Compare local and international suppliers for huge savings.',
        highlights: ['Affordable weekly rates', 'Incredible scenery in Cappadocia', 'Great road network'],
        priceFrom: 'from $85/week',
      },
      fr: {
        name: 'Turquie',
        country: 'Türkiye',
        city: 'Aéroport d’Istanbul',
        tagline: 'Des rues d’Istanbul à la côte turquoise',
        description:
          'Une voiture ouvre les portes des vallées de Cappadoce, de la côte égéenne et de la côte turquoise. Comparez les fournisseurs locaux et internationaux.',
        highlights: ['Tarifs hebdomadaires abordables', 'Paysages incroyables en Cappadoce', 'Bon réseau routier'],
        priceFrom: 'dès 85 $/semaine',
      },
      es: {
        name: 'Turquía',
        country: 'Türkiye',
        city: 'Aeropuerto de Estambul',
        tagline: 'De las calles de Estambul a la costa turquesa',
        description:
          'Un coche desbloquea los valles de Capadocia, la costa egea y la costa turquesa. Compara proveedores locales e internacionales y ahorra mucho.',
        highlights: ['Tarifas semanales económicas', 'Paisajes increíbles en Capadocia', 'Buenas carreteras'],
        priceFrom: 'desde 85 $/semana',
      },
      ar: {
        name: 'تركيا',
        country: 'تركيا',
        city: 'مطار إسطنبول',
        tagline: 'من شوارع إسطنبول إلى الساحل الفيروزي',
        description:
          'السيارة تفتح لك أبواب وديان كبادوكيا والساحل الإيجي والساحل الفيروزي. قارن بين المورّدين المحليين والدوليين لتحقق وفورات كبيرة.',
        highlights: ['أسعار أسبوعية مناسبة', 'مناظر رائعة في كبادوكيا', 'شبكة طرق جيدة'],
        priceFrom: 'ابتداءً من 85$ أسبوعياً',
      },
    },
  },
  {
    slug: 'morocco',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1600&auto=format&fit=crop', // Chefchaouen, Morocco
    weight: 5,
    i18n: {
      en: {
        name: 'Morocco',
        country: 'Morocco',
        city: 'Marrakech Menara Airport',
        tagline: 'Atlas mountains, medinas and desert nights',
        description:
          'Rent in Marrakech and drive to the Atlas foothills, Essaouira or the Sahara. Read our Morocco guide for requirements, insurance and prices.',
        highlights: ['Unique desert landscapes', 'Great value currency', 'Airport pick-up easy'],
        priceFrom: 'from $75/week',
      },
      fr: {
        name: 'Maroc',
        country: 'Maroc',
        city: 'Aéroport de Marrakech-Ménara',
        tagline: 'Montagnes de l’Atlas, médinas et nuits au désert',
        description:
          'Louez à Marrakech pour rouler vers l’Atlas, Essaouira ou le Sahara. Consultez notre guide Maroc pour les conditions, assurances et prix.',
        highlights: ['Paysages désertiques uniques', 'Excellent rapport qualité/prix', 'Retrait à l’aéroport simple'],
        priceFrom: 'dès 75 $/semaine',
      },
      es: {
        name: 'Marruecos',
        country: 'Marruecos',
        city: 'Aeropuerto de Marrakech-Menara',
        tagline: 'Atlas, medinas y noches en el desierto',
        description:
          'Alquila en Marrakech y conduce hasta el Atlas, Essaouira o el Sáhara. Lee nuestra guía de Marruecos para requisitos, seguros y precios.',
        highlights: ['Paisajes desérticos únicos', 'Gran valor por tu dinero', 'Recogida en el aeropuerto fácil'],
        priceFrom: 'desde 75 $/semana',
      },
      ar: {
        name: 'المغرب',
        country: 'المغرب',
        city: 'مطار مراكش المنارة',
        tagline: 'جبال الأطلس والمدن العتيقة وليالي الصحراء',
        description:
          'استأجر في مراكش وتوجه نحو الأطلس أو الصويرة أو الصحراء الكبرى. اقرأ دليلنا عن المغرب للتعرف على المتطلبات والتأمين والأسعار.',
        highlights: ['مناظر صحراوية فريدة', 'قيمة ممتازة مقابل المال', 'استلام سهل من المطار'],
        priceFrom: 'ابتداءً من 75$ أسبوعياً',
      },
    },
  },
  {
    slug: 'greece',
    image: 'https://images.unsplash.com/photo-1555993539-1732b0258235?q=80&w=1600&auto=format&fit=crop', // Acropolis, Athens
    weight: 6,
    i18n: {
      en: {
        name: 'Greece',
        country: 'Greece',
        city: 'Athens Airport',
        tagline: 'Island hopping starts at the rental desk',
        description:
          'A car is the best way to explore the Peloponnese and the islands beyond Athens. Book early in summer — rentals sell out fast in August.',
        highlights: ['Ferry ports nearby', 'Beautiful coastal drives', 'Sunny weather almost all year'],
        priceFrom: 'from $90/week',
      },
      fr: {
        name: 'Grèce',
        country: 'Grèce',
        city: 'Aéroport d’Athènes',
        tagline: 'L’escapade insulaire commence au comptoir',
        description:
          'La voiture est le meilleur moyen d’explorer le Péloponnèse et les îles. Réservez tôt l’été : les voitures partent vite en août.',
        highlights: ['Ports de ferry à proximité', 'De superbes routes côtières', 'Soleil presque toute l’année'],
        priceFrom: 'dès 90 $/semaine',
      },
      es: {
        name: 'Grecia',
        country: 'Grecia',
        city: 'Aeropuerto de Atenas',
        tagline: 'El salto entre islas empieza en el mostrador',
        description:
          'El coche es la mejor forma de explorar el Peloponeso y las islas. Reserva pronto en verano: los coches se agotan en agosto.',
        highlights: ['Puertos de ferry cercanos', 'Bonitas carreteras costeras', 'Sol casi todo el año'],
        priceFrom: 'desde 90 $/semana',
      },
      ar: {
        name: 'اليونان',
        country: 'اليونان',
        city: 'مطار أثينا',
        tagline: 'تتنقل بين الجزر بدءاً من مكتب التأجير',
        description:
          'السيارة أفضل وسيلة لاستكشاف البيلوبونيز والجزر. احجز مبكراً في الصيف — فسيارات الإيجار تنفد بسرعة في أغسطس.',
        highlights: ['موانئ العبارات قريبة', 'طرق ساحلية جميلة', 'شمس طوال العام تقريباً'],
        priceFrom: 'ابتداءً من 90$ أسبوعياً',
      },
    },
  },
];

export function getDestination(slug: string): Destination | undefined {
  return destinations.find((d) => d.slug === slug);
}

export function getLocalizedDestination(slug: string, locale: string) {
  const destination = getDestination(slug);
  if (!destination) return null;
  return {
    ...destination,
    localized: destination.i18n[locale as Locale] ?? destination.i18n.en,
  };
}