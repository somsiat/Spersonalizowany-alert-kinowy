'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User, UserPreferences } from '@/lib/auth'
import AuthForm from '@/components/AuthForm'
import PreferencesForm from '@/components/PreferencesForm'
import MovieMatches from '@/components/MovieMatches'
import AlertHistory from '@/components/AlertHistory'

// Funkcja do tłumaczenia gatunków na polski
const translateGenre = (genre: string): string => {
  const translations: { [key: string]: string } = {
    'Action': 'Akcja',
    'Adventure': 'Przygoda',
    'Animation': 'Animacja',
    'Biography': 'Biografia',
    'Comedy': 'Komedia',
    'Crime': 'Kryminał',
    'Documentary': 'Dokument',
    'Drama': 'Dramat',
    'Family': 'Rodzinny',
    'Fantasy': 'Fantasy',
    'History': 'Historia',
    'Horror': 'Horror',
    'Music': 'Muzyczny',
    'Musical': 'Musical',
    'Mystery': 'Mystery',
    'Romance': 'Romans',
    'Sci-Fi': 'Science Fiction',
    'Science Fiction': 'Science Fiction',
    'Sport': 'Sportowy',
    'Thriller': 'Thriller',
    'War': 'Wojenny',
    'Western': 'Western'
  }
  
  return genre.split(', ').map(g => translations[g.trim()] || g.trim()).join(', ')
}

// Funkcja do tłumaczenia tytułów filmów na polski
const translateTitle = (title: string): string => {
  const translations: { [key: string]: string } = {
    'Oppenheimer': 'Oppenheimer',
    'Barbie': 'Barbie',
    'Fast X': 'Szybcy i wściekli X',
    'Spider-Man: Across the Spider-Verse': 'Spider-Man: Poprzez multiwersum',
    'The Batman': 'Batman',
    'Spider-Man: No Way Home': 'Spider-Man: Bez drogi do domu',
    'Doctor Strange in the Multiverse of Madness': 'Doktor Strange w multiwersum obłędu',
    'Guardians of the Galaxy Vol. 3': 'Strażnicy Galaktyki: Volume 3',
    'John Wick: Chapter 4': 'John Wick: Rozdział 4',
    'The Little Mermaid': 'Mała Syrenka',
    'The Super Mario Bros. Movie': 'Film Super Mario Bros.',
    'Lightyear': 'Buzz Astral',
    'Thor: Love and Thunder': 'Thor: Miłość i grom',
    'The Matrix Resurrections': 'Matrix: Zmartwychwstania',
    'Eternals': 'Wieczni',
    'Shang-Chi and the Legend of the Ten Rings': 'Shang-Chi i legenda dziesięciu pierścieni',
    'Dune': 'Diuna',
    'Black Widow': 'Czarna Wdowa',
    'Avengers: Endgame': 'Avengers: Koniec gry'
  }
  
  return translations[title] || title
}

// Funkcja do tłumaczenia opisów filmów na polski
const translatePlot = (plot: string): string => {
  const translations: { [key: string]: string } = {
    'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.': 'Historia amerykańskiego naukowca J. Roberta Oppenheimera i jego roli w rozwoju bomby atomowej.',
    'Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land. However, when they get a chance to go to the real world, they soon discover the joys and perils of living among humans.': 'Barbie i Ken przeżywają najlepsze chwile w kolorowym i pozornie idealnym świecie Barbie Land. Jednak gdy dostają szansę na wyjazd do prawdziwego świata, szybko odkrywają radości i niebezpieczeństwa życia wśród ludzi.',
    'Barbie and Ken are having the time of their lives in the seemingly perfect world of Barbie Land. However, when they get a chance to go to the outside world, they soon discover the joys and perils of living among regular humans.': 'Barbie i Ken przeżywają najlepsze chwile w pozornie idealnym świecie Barbie Land. Jednak gdy dostają szansę na wyjazd do zewnętrznego świata, szybko odkrywają radości i niebezpieczeństwa życia wśród zwykłych ludzi.',
    'Dom Toretto and his family are targeted by the vengeful son of drug kingpin Hernan Reyes.': 'Dom Toretto i jego rodzina stają się celem mściwego syna barona narkotykowego Hernana Reyesa.',
    'After reuniting with Gwen Stacy, Brooklyn\'s full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.': 'Po ponownym spotkaniu z Gwen Stacy, pełnoetatowy, przyjazny Spider-Man z Brooklynu zostaje przeniesiony przez Multiwersum, gdzie spotyka zespół Spider-Ludzi odpowiedzialnych za ochronę jego istnienia.',
    'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city\'s hidden corruption and question his family\'s involvement.': 'Gdy sadystyczny seryjny morderca zaczyna zabijać kluczowe postacie polityczne w Gotham, Batman jest zmuszony zbadać ukrytą korupcję miasta i zakwestionować zaangażowanie swojej rodziny.',
    'With Spider-Man\'s identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear, forcing Peter to discover what it truly means to be Spider-Man.': 'Gdy tożsamość Spider-Mana zostaje ujawniona, Peter prosi Doktora Strange\'a o pomoc. Gdy zaklęcie idzie nie tak, niebezpieczni wrogowie z innych światów zaczynają się pojawiać, zmuszając Petera do odkrycia, co naprawdę oznacza być Spider-Manem.',
    'Doctor Strange teams up with a mysterious teenage girl from his dreams who can travel across multiverses, to battle multiple threats, including other versions of himself, which threaten to wipe out millions across the multiverse.': 'Doktor Strange łączy siły z tajemniczą nastolatką ze swoich snów, która może podróżować przez multiwersa, aby walczyć z wieloma zagrożeniami, w tym innymi wersjami siebie, które grożą wymazaniem milionów w multiwersum.',
    'Still reeling from the loss of Gamora, Peter Quill rallies his team to defend the universe and one of their own - a mission that could mean the end of the Guardians if not successful.': 'Nadal oszołomiony stratą Gamory, Peter Quill mobilizuje swój zespół do obrony wszechświata i jednego z nich - misji, która może oznaczać koniec Strażników, jeśli się nie powiedzie.',
    'John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe and forces that turn old friends into foes.': 'John Wick odkrywa ścieżkę do pokonania Wysokiego Stołu. Ale zanim zdobędzie wolność, Wick musi zmierzyć się z nowym wrogiem o potężnych sojuszach na całym świecie i siłach, które zamieniają starych przyjaciół we wrogów.',
    'A young mermaid makes a deal with a sea witch to trade her beautiful voice for human legs so she can discover the world above water and impress a prince.': 'Młoda syrenka zawiera umowę z morską czarownicą, aby wymienić swój piękny głos na ludzkie nogi, aby mogła odkryć świat nad wodą i zaimponować księciu.',
    'The story of the Mario Bros. and their adventures in the Mushroom Kingdom.': 'Historia braci Mario i ich przygód w Królestwie Grzybów.',
    'While spending years attempting to return home, marooned Space Ranger Buzz Lightyear encounters an army of ruthless robots commanded by Zurg who are attempting to steal his fuel source.': 'Spędzając lata próbując wrócić do domu, rozbitkowie Space Ranger Buzz Lightyear spotyka armię bezwzględnych robotów dowodzonych przez Zurg, którzy próbują ukraść jego źródło paliwa.',
    'Thor enlists the help of Valkyrie, Korg and ex-girlfriend Jane Foster to fight Gorr the God Butcher, who intends to make the gods extinct.': 'Thor zaciąga pomoc Valkyrie, Korg i byłej dziewczyny Jane Foster, aby walczyć z Gorrem Rzeźnikiem Bogów, który zamierza uczynić bogów wymarłymi.',
    'Return to a world of two realities: one, everyday life; the other, what lies behind it. To find out if his reality is a construct, to truly know himself, Mr. Anderson will have to choose to follow the white rabbit once more.': 'Powrót do świata dwóch rzeczywistości: jednej, codziennego życia; drugiej, tego, co za nim leży. Aby dowiedzieć się, czy jego rzeczywistość jest konstruktem, aby naprawdę poznać siebie, pan Anderson będzie musiał ponownie wybrać podążanie za białym królikiem.',
    'The saga of the Eternals, a race of immortal beings who lived on Earth and shaped its history and civilizations.': 'Saga Wiecznych, rasy nieśmiertelnych istot, które żyły na Ziemi i kształtowały jej historię i cywilizacje.',
    'Shang-Chi, the master of weaponry-based Kung Fu, is forced to confront his past after being drawn into the web of the mysterious Ten Rings organization.': 'Shang-Chi, mistrz kung-fu opartego na broni, jest zmuszony skonfrontować się ze swoją przeszłością po wciągnięciu w sieć tajemniczej organizacji Dziesięciu Pierścieni.',
    'Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet in the universe to ensure the future of his family and his people.': 'Paul Atreides, błyskotliwy i utalentowany młody człowiek urodzony w wielkim przeznaczeniu poza jego zrozumieniem, musi podróżować na najbardziej niebezpieczną planetę we wszechświecie, aby zapewnić przyszłość swojej rodziny i swojego ludu.',
    'Natasha Romanoff confronts the darker parts of her ledger when a dangerous conspiracy with ties to her past arises. Pursued by a force that will stop at nothing to bring her down, Natasha must deal with her history as a spy and the broken relationships left in her wake long before she became an Avenger.': 'Natasha Romanoff konfrontuje się z ciemniejszymi częściami swojej księgi, gdy pojawia się niebezpieczny spisek związany z jej przeszłością. Ścigana przez siłę, która nie zatrzyma się przed niczym, aby ją powalić, Natasha musi poradzić sobie ze swoją historią jako szpieg i zniszczonymi relacjami pozostawionymi na jej drodze na długo przed tym, jak została Avengers.',
    'After the devastating events of Avengers: Infinity War (2018), the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos\' actions and restore balance to the universe.': 'Po dewastujących wydarzeniach Avengers: Wojna bez granic (2018), wszechświat jest w ruinach. Z pomocą pozostałych sojuszników, Avengers zbierają się ponownie, aby odwrócić działania Thanosa i przywrócić równowagę we wszechświecie.'
  }
  
  return translations[plot] || plot
}

// Funkcja do tłumaczenia reżyserów na polski
const translateDirector = (director: string): string => {
  const translations: { [key: string]: string } = {
    'Christopher Nolan': 'Christopher Nolan',
    'Greta Gerwig': 'Greta Gerwig',
    'Louis Leterrier': 'Louis Leterrier',
    'Joaquim Dos Santos': 'Joaquim Dos Santos',
    'Matt Reeves': 'Matt Reeves',
    'Jon Watts': 'Jon Watts',
    'Sam Raimi': 'Sam Raimi',
    'James Gunn': 'James Gunn',
    'Chad Stahelski': 'Chad Stahelski',
    'Rob Marshall': 'Rob Marshall',
    'Aaron Horvath': 'Aaron Horvath',
    'Angus MacLane': 'Angus MacLane',
    'Taika Waititi': 'Taika Waititi',
    'Lana Wachowski': 'Lana Wachowski',
    'Chloé Zhao': 'Chloé Zhao',
    'Destin Daniel Cretton': 'Destin Daniel Cretton',
    'Denis Villeneuve': 'Denis Villeneuve',
    'Cate Shortland': 'Cate Shortland',
    'Anthony Russo': 'Anthony Russo',
    'Joe Russo': 'Joe Russo'
  }
  
  return translations[director] || director
}

// Funkcja do tłumaczenia aktorów na polski
const translateActors = (actors: string): string => {
  const translations: { [key: string]: string } = {
    'Cillian Murphy': 'Cillian Murphy',
    'Emily Blunt': 'Emily Blunt',
    'Matt Damon': 'Matt Damon',
    'Robert Downey Jr.': 'Robert Downey Jr.',
    'Florence Pugh': 'Florence Pugh',
    'Margot Robbie': 'Margot Robbie',
    'Ryan Gosling': 'Ryan Gosling',
    'America Ferrera': 'America Ferrera',
    'Vin Diesel': 'Vin Diesel',
    'Michelle Rodriguez': 'Michelle Rodriguez',
    'Tyrese Gibson': 'Tyrese Gibson',
    'Shameik Moore': 'Shameik Moore',
    'Hailee Steinfeld': 'Hailee Steinfeld',
    'Jake Johnson': 'Jake Johnson',
    'Robert Pattinson': 'Robert Pattinson',
    'Zoë Kravitz': 'Zoë Kravitz',
    'Paul Dano': 'Paul Dano',
    'Tom Holland': 'Tom Holland',
    'Zendaya': 'Zendaya',
    'Benedict Cumberbatch': 'Benedict Cumberbatch',
    'Elizabeth Olsen': 'Elizabeth Olsen',
    'Chris Pratt': 'Chris Pratt',
    'Bradley Cooper': 'Bradley Cooper',
    'Keanu Reeves': 'Keanu Reeves',
    'Halle Bailey': 'Halle Bailey',
    'Melissa McCarthy': 'Melissa McCarthy',
    'Chris Evans': 'Chris Evans',
    'Scarlett Johansson': 'Scarlett Johansson',
    'Mark Ruffalo': 'Mark Ruffalo',
    'Jeremy Renner': 'Jeremy Renner'
  }
  
  return actors.split(', ').map(actor => translations[actor.trim()] || actor.trim()).join(', ')
}

// Funkcja do tłumaczenia scenarzystów na polski
const translateWriter = (writer: string): string => {
  const translations: { [key: string]: string } = {
    'Christopher Nolan': 'Christopher Nolan',
    'Greta Gerwig': 'Greta Gerwig',
    'Louis Leterrier': 'Louis Leterrier',
    'Joaquim Dos Santos': 'Joaquim Dos Santos',
    'Matt Reeves': 'Matt Reeves',
    'Jon Watts': 'Jon Watts',
    'Sam Raimi': 'Sam Raimi',
    'James Gunn': 'James Gunn',
    'Chad Stahelski': 'Chad Stahelski',
    'Rob Marshall': 'Rob Marshall',
    'Aaron Horvath': 'Aaron Horvath',
    'Angus MacLane': 'Angus MacLane',
    'Taika Waititi': 'Taika Waititi',
    'Lana Wachowski': 'Lana Wachowski',
    'Chloé Zhao': 'Chloé Zhao',
    'Destin Daniel Cretton': 'Destin Daniel Cretton',
    'Denis Villeneuve': 'Denis Villeneuve',
    'Cate Shortland': 'Cate Shortland',
    'Anthony Russo': 'Anthony Russo',
    'Joe Russo': 'Joe Russo'
  }
  
  return writer.split(', ').map(w => translations[w.trim()] || w.trim()).join(', ')
}

// Funkcja do tłumaczenia krajów na polski
const translateCountry = (country: string): string => {
  const translations: { [key: string]: string } = {
    'United States': 'Stany Zjednoczone',
    'United Kingdom': 'Wielka Brytania',
    'Canada': 'Kanada',
    'Australia': 'Australia',
    'Germany': 'Niemcy',
    'France': 'Francja',
    'Italy': 'Włochy',
    'Spain': 'Hiszpania',
    'Poland': 'Polska',
    'Japan': 'Japonia',
    'South Korea': 'Korea Południowa',
    'China': 'Chiny',
    'India': 'Indie',
    'Brazil': 'Brazylia',
    'Mexico': 'Meksyk',
    'Argentina': 'Argentyna',
    'Russia': 'Rosja',
    'Netherlands': 'Holandia',
    'Belgium': 'Belgia',
    'Sweden': 'Szwecja',
    'Norway': 'Norwegia',
    'Denmark': 'Dania',
    'Finland': 'Finlandia',
    'Czech Republic': 'Czechy',
    'Hungary': 'Węgry',
    'Romania': 'Rumunia',
    'Bulgaria': 'Bułgaria',
    'Greece': 'Grecja',
    'Turkey': 'Turcja',
    'Israel': 'Izrael',
    'South Africa': 'Republika Południowej Afryki',
    'Egypt': 'Egipt',
    'Morocco': 'Maroko',
    'Nigeria': 'Nigeria',
    'Kenya': 'Kenia',
    'Thailand': 'Tajlandia',
    'Vietnam': 'Wietnam',
    'Philippines': 'Filipiny',
    'Indonesia': 'Indonezja',
    'Malaysia': 'Malezja',
    'Singapore': 'Singapur',
    'New Zealand': 'Nowa Zelandia'
  }
  
  return country.split(', ').map(c => translations[c.trim()] || c.trim()).join(', ')
}

// Funkcja do tłumaczenia języków na polski
const translateLanguage = (language: string): string => {
  const translations: { [key: string]: string } = {
    'English': 'Angielski',
    'Spanish': 'Hiszpański',
    'French': 'Francuski',
    'German': 'Niemiecki',
    'Italian': 'Włoski',
    'Portuguese': 'Portugalski',
    'Russian': 'Rosyjski',
    'Chinese': 'Chiński',
    'Japanese': 'Japoński',
    'Korean': 'Koreański',
    'Arabic': 'Arabski',
    'Hindi': 'Hindi',
    'Polish': 'Polski',
    'Dutch': 'Holenderski',
    'Swedish': 'Szwedzki',
    'Norwegian': 'Norweski',
    'Danish': 'Duński',
    'Finnish': 'Fiński',
    'Czech': 'Czeski',
    'Hungarian': 'Węgierski',
    'Romanian': 'Rumuński',
    'Bulgarian': 'Bułgarski',
    'Greek': 'Grecki',
    'Turkish': 'Turecki',
    'Hebrew': 'Hebrajski',
    'Thai': 'Tajski',
    'Vietnamese': 'Wietnamski',
    'Filipino': 'Filipiński',
    'Indonesian': 'Indonezyjski',
    'Malay': 'Malajski',
    'Mandarin': 'Mandaryński',
    'Cantonese': 'Kantoński',
    'Tamil': 'Tamilski',
    'Telugu': 'Telugu',
    'Bengali': 'Bengalski',
    'Urdu': 'Urdu',
    'Persian': 'Perski',
    'Swahili': 'Suahili',
    'Amharic': 'Amharski',
    'Yoruba': 'Joruba',
    'Igbo': 'Igbo',
    'Hausa': 'Hausa',
    'Zulu': 'Zulu',
    'Afrikaans': 'Afrikaans',
    'Xhosa': 'Xhosa'
  }
  
  return language.split(', ').map(l => translations[l.trim()] || l.trim()).join(', ')
}

// Funkcja do tłumaczenia nagród na polski
const translateAwards = (awards: string): string => {
  const translations: { [key: string]: string } = {
    'Won': 'Wygrana',
    'Nominated': 'Nominacja',
    'Oscar': 'Oscar',
    'Golden Globe': 'Złoty Glob',
    'BAFTA': 'BAFTA',
    'Cannes': 'Cannes',
    'Venice': 'Wenecja',
    'Berlin': 'Berlin',
    'Sundance': 'Sundance',
    'Emmy': 'Emmy',
    'Grammy': 'Grammy',
    'Tony': 'Tony',
    'Academy Award': 'Nagroda Akademii',
    'Best Picture': 'Najlepszy Film',
    'Best Director': 'Najlepszy Reżyser',
    'Best Actor': 'Najlepszy Aktor',
    'Best Actress': 'Najlepsza Aktorka',
    'Best Supporting Actor': 'Najlepszy Aktor Drugoplanowy',
    'Best Supporting Actress': 'Najlepsza Aktorka Drugoplanowa',
    'Best Original Screenplay': 'Najlepszy Scenariusz Oryginalny',
    'Best Adapted Screenplay': 'Najlepszy Scenariusz Adaptowany',
    'Best Cinematography': 'Najlepsze Zdjęcia',
    'Best Editing': 'Najlepszy Montaż',
    'Best Sound': 'Najlepszy Dźwięk',
    'Best Visual Effects': 'Najlepsze Efekty Wizualne',
    'Best Costume Design': 'Najlepsze Kostiumy',
    'Best Production Design': 'Najlepsza Scenografia',
    'Best Makeup': 'Najlepszy Makijaż',
    'Best Original Score': 'Najlepsza Muzyka Oryginalna',
    'Best Original Song': 'Najlepsza Piosenka Oryginalna',
    'Best Animated Feature': 'Najlepszy Film Animowany',
    'Best Documentary': 'Najlepszy Dokument',
    'Best Foreign Language Film': 'Najlepszy Film Obcojęzyczny',
    'Best Short Film': 'Najlepszy Film Krótkometrażowy',
    'Best Short Documentary': 'Najlepszy Dokument Krótkometrażowy',
    'Best Short Animated': 'Najlepszy Animowany Krótkometrażowy'
  }
  
  return awards.split('. ').map(award => {
    const parts = award.split(' ')
    return parts.map(part => translations[part] || part).join(' ')
  }).join('. ')
}

// Funkcja do tłumaczenia box office na polski
const translateBoxOffice = (boxOffice: string): string => {
  const translations: { [key: string]: string } = {
    'Worldwide': 'Światowe',
    'Domestic': 'Krajowe',
    'International': 'Międzynarodowe',
    'North America': 'Ameryka Północna',
    'Europe': 'Europa',
    'Asia': 'Azja',
    'Latin America': 'Ameryka Łacińska',
    'Middle East': 'Bliski Wschód',
    'Africa': 'Afryka',
    'Oceania': 'Oceania',
    'United States': 'Stany Zjednoczone',
    'Canada': 'Kanada',
    'Mexico': 'Meksyk',
    'United Kingdom': 'Wielka Brytania',
    'Germany': 'Niemcy',
    'France': 'Francja',
    'Italy': 'Włochy',
    'Spain': 'Hiszpania',
    'Poland': 'Polska',
    'Japan': 'Japonia',
    'South Korea': 'Korea Południowa',
    'China': 'Chiny',
    'India': 'Indie',
    'Brazil': 'Brazylia',
    'Argentina': 'Argentyna',
    'Russia': 'Rosja',
    'Australia': 'Australia',
    'Netherlands': 'Holandia',
    'Belgium': 'Belgia',
    'Sweden': 'Szwecja',
    'Norway': 'Norwegia',
    'Denmark': 'Dania',
    'Finland': 'Finlandia',
    'Czech Republic': 'Czechy',
    'Hungary': 'Węgry',
    'Romania': 'Rumunia',
    'Bulgaria': 'Bułgaria',
    'Greece': 'Grecja',
    'Turkey': 'Turcja',
    'Israel': 'Izrael',
    'South Africa': 'Republika Południowej Afryki',
    'Egypt': 'Egipt',
    'Morocco': 'Maroko',
    'Nigeria': 'Nigeria',
    'Kenya': 'Kenia',
    'Thailand': 'Tajlandia',
    'Vietnam': 'Wietnam',
    'Philippines': 'Filipiny',
    'Indonesia': 'Indonezja',
    'Malaysia': 'Malezja',
    'Singapore': 'Singapur',
    'New Zealand': 'Nowa Zelandia'
  }
  
  return boxOffice.split(', ').map(bo => {
    const parts = bo.split(' ')
    return parts.map(part => translations[part] || part).join(' ')
  }).join(', ')
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'matches' | 'all-movies' | 'preferences' | 'alerts'>('all-movies')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [movies, setMovies] = useState<any[]>([])
  const [filteredMovies, setFilteredMovies] = useState<any[]>([])
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [selectedCinema, setSelectedCinema] = useState('all')
  const [moviesLoading, setMoviesLoading] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<any>(null)
  const [showMovieModal, setShowMovieModal] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    checkUser()
    loadMovies()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          })
          fetchPreferences(session.user.id)
        } else {
          setUser(null)
          setPreferences(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Filtrowanie filmów
  useEffect(() => {
    let filtered = movies

    if (selectedGenre !== 'all') {
      filtered = filtered.filter(movie => {
        const genre = movie.genre || movie.Genre || ''
        return genre.toLowerCase().includes(selectedGenre.toLowerCase())
      })
    }

    if (selectedCinema !== 'all') {
      filtered = filtered.filter(movie => 
        movie.showtimes?.some((showtime: any) => 
          showtime.cinema?.toLowerCase().includes(selectedCinema.toLowerCase())
        )
      )
    }

    setFilteredMovies(filtered)
  }, [movies, selectedGenre, selectedCinema])

  const loadMovies = async () => {
    console.log('🎬 Starting to load movies...')
    setMoviesLoading(true)
    try {
      // Tymczasowo używaj tylko hardkodowanych filmów
      // TODO: Włącz po skonfigurowaniu .env.local
      console.log('🎬 Loading hardcoded movies...')
      await loadHardcodedMovies()
      console.log('🎬 Movies loaded successfully!')
    } catch (error) {
      console.error('❌ Error loading movies:', error)
    } finally {
      setMoviesLoading(false)
    }
  }

  const loadHardcodedMovies = async () => {
    // Lista aktualnych filmów z 2023-2024 (fallback)
    const movieIds = [
      'tt15398776', // Oppenheimer (2023)
      'tt1517268', // Barbie (2023)
      'tt5433140', // Fast X (2023)
      'tt9362722', // Spider-Man: Across the Spider-Verse (2023)
      'tt10640346', // The Batman (2022)
      'tt10872600', // Spider-Man: No Way Home (2021)
      'tt9419884', // Doctor Strange in the Multiverse of Madness (2022)
      'tt6791350', // Guardians of the Galaxy Vol. 3 (2023)
      'tt10366206', // John Wick: Chapter 4 (2023)
      'tt10676052', // The Little Mermaid (2023)
      'tt13320622', // The Super Mario Bros. Movie (2023)
      'tt10298840', // Lightyear (2022)
      'tt1877830', // The Batman (2022)
      'tt10648342', // Thor: Love and Thunder (2022) - może nie istnieć
      'tt10838180', // The Matrix Resurrections (2021)
      'tt9032400', // Eternals (2021)
      'tt9376612', // Shang-Chi and the Legend of the Ten Rings (2021)
      'tt1160419', // Dune (2021)
      'tt3480822', // Black Widow (2021)
      'tt4154796', // Avengers: Endgame (2019)
    ]

    const moviePromises = movieIds.map(async (id) => {
      try {
        const response = await fetch(`/api/movies/${id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log(`Movie ${id} not found - skipping`)
            return null
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.error) {
          console.log(`Error for movie ${id}:`, data.error)
          return null
        }
        
        // Tymczasowo wyłącz filtrowanie po polsku - pokaż wszystkie filmy
        // TODO: Włącz po skonfigurowaniu bazy danych
        console.log(`Loaded movie ${id}:`, {
          title: data.title || data.Title,
          language: data.language || data.Language,
          country: data.country || data.Country
        })
        
        // Dodaj przykładowe seanse
        const cinemas = ['Helios Rzeszów', 'Multikino Rzeszów', 'Cinema City Rzeszów']
        const showtimes = cinemas.map(cinema => ({
          cinema,
          time: `${Math.floor(Math.random() * 6) + 16}:${Math.random() > 0.5 ? '00' : '30'}`,
          price: Math.floor(Math.random() * 10) + 20
        }))

        return {
          ...data,
          showtimes
        }
      } catch (error) {
        console.log(`Error loading movie ${id}:`, error instanceof Error ? error.message : 'Unknown error')
        return null
      }
    })

    const movieResults = await Promise.all(moviePromises)
    const validMovies = movieResults.filter(movie => movie !== null)
    
    console.log(`🎬 Loaded ${validMovies.length} movies:`, validMovies.map(m => m.title || m.Title))
    
    setMovies(validMovies)
    setFilteredMovies(validMovies)
  }

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        })
        await fetchPreferences(session.user.id)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPreferences = async (userId: string) => {
    try {
      // Pobierz sesję i token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No session found')
        return
      }

      // Użyj API endpoint z tokenem autoryzacji
      const response = await fetch('/api/prefs', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        console.error('Error fetching preferences:', response.statusText)
        return
      }

      const data = await response.json()
      setPreferences(data)
    } catch (error) {
      console.error('Error fetching preferences:', error)
    }
  }

  const handleAuthSuccess = (user: any) => {
    setUser({
      id: user.id,
      email: user.email || '',
    })
    setShowAuthModal(false)
    fetchPreferences(user.id)
  }

  const handleMovieClick = (movie: any) => {
    console.log('Movie data:', movie)
    setSelectedMovie(movie)
    setShowMovieModal(true)
  }

  const handleNotifyMovie = async (movie: any) => {
    if (!user) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No session found')
        return
      }

      console.log('🔔 Creating notification for movie:', movie.title)

      // Przygotuj dane filmu do zapisania
      const movieData = {
        movie_id: movie.id || movie.imdbId,
        showtime_id: null, // Ogólne powiadomienie o filmie
        alert_type: 'new_movie',
        movie_title: movie.title || movie.Title,
        movie_year: movie.year || movie.Year,
        movie_genre: movie.genre || movie.Genre,
        movie_director: movie.director || movie.Director,
        movie_actors: movie.actors || movie.Actors,
        movie_imdb_rating: movie.imdb_rating || movie.imdbRating,
        movie_poster_url: movie.poster_url || movie.Poster,
        movie_plot: movie.plot || movie.Plot,
        movie_rated: movie.rated || movie.Rated,
        movie_runtime: movie.runtime || movie.Runtime
      }

      // Utwórz alert dla filmu
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(movieData)
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Notification created:', data)
        
        // Wyślij powiadomienia zgodnie z preferencjami użytkownika
        await sendNotificationsForMovie(movieData, session.access_token)
        
        // Pokaż komunikat sukcesu
        setSaveMessage({type: 'success', text: `Powiadomienie o filmie "${movie.title}" zostało utworzone!`})
        
        // Ukryj komunikat po 3 sekundach
        setTimeout(() => {
          setSaveMessage(null)
        }, 3000)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error creating notification:', errorData)
        setSaveMessage({type: 'error', text: `Błąd: ${errorData.error || 'Nie udało się utworzyć powiadomienia'}`})
        
        // Ukryj komunikat po 3 sekundach
        setTimeout(() => {
          setSaveMessage(null)
        }, 3000)
      }
    } catch (error) {
      console.error('Error creating notification:', error)
      setSaveMessage({type: 'error', text: 'Błąd połączenia'})
      
      // Ukryj komunikat po 3 sekundach
      setTimeout(() => {
        setSaveMessage(null)
      }, 3000)
    }
  }

  const sendNotificationsForMovie = async (movieData: any, accessToken: string) => {
    try {
      // Pobierz preferencje użytkownika
      const prefsResponse = await fetch('/api/prefs', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (prefsResponse.ok) {
        const preferences = await prefsResponse.json()
        
        // Wyślij powiadomienia zgodnie z preferencjami
        if (preferences.email_notifications || preferences.push_notifications) {
          const notificationData = {
            userId: user?.id,
            movieTitle: movieData.movie_title,
            movieYear: movieData.movie_year,
            movieGenre: movieData.movie_genre,
            movieDirector: movieData.movie_director,
            movieImdbRating: movieData.movie_imdb_rating,
            moviePosterUrl: movieData.movie_poster_url,
            moviePlot: movieData.movie_plot,
            alertType: 'new_movie'
          }

          // Wyślij powiadomienia
          await fetch('/api/send-notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              ...notificationData,
              emailEnabled: preferences.email_notifications,
              pushEnabled: preferences.push_notifications
            })
          })
        }
      }
    } catch (error) {
      console.error('Error sending notifications:', error)
    }
  }

  const handleSavePreferences = async (newPreferences: Partial<UserPreferences>) => {
    if (!user) return

    try {
      setSaveMessage(null) // Wyczyść poprzedni komunikat
      
      // Pobierz sesję i token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No session found')
        setSaveMessage({type: 'error', text: 'Błąd: Brak sesji użytkownika'})
        return
      }

      console.log('💾 Saving preferences...')

      // Użyj API endpoint z tokenem autoryzacji
      const response = await fetch('/api/prefs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(newPreferences)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error saving preferences:', response.statusText, errorData)
        setSaveMessage({type: 'error', text: `Błąd zapisywania: ${errorData.error || response.statusText}`})
        return
      }

      const savedData = await response.json()
      console.log('✅ Preferences saved successfully:', savedData)

      setPreferences(prev => prev ? { ...prev, ...newPreferences } : null)
      
      // Uruchom dopasowywanie po zapisaniu preferencji
      try {
        console.log('🔄 Running matching...')
        const matchingResponse = await fetch('/api/matching', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        
        if (matchingResponse.ok) {
          console.log('✅ Matching completed successfully')
          setSaveMessage({type: 'success', text: 'Preferencje zostały zapisane pomyślnie! Dopasowywanie filmów zostało uruchomione.'})
        } else {
          console.error('Error running matching:', matchingResponse.statusText)
          setSaveMessage({type: 'success', text: 'Preferencje zostały zapisane, ale wystąpił błąd podczas dopasowywania filmów.'})
        }
      } catch (error) {
        console.error('Error running matching:', error)
        setSaveMessage({type: 'success', text: 'Preferencje zostały zapisane, ale wystąpił błąd podczas dopasowywania filmów.'})
      }

      // Ukryj komunikat po 5 sekundach
      setTimeout(() => {
        setSaveMessage(null)
      }, 5000)

    } catch (error) {
      console.error('Error saving preferences:', error)
      setSaveMessage({type: 'error', text: `Błąd: ${error instanceof Error ? error.message : 'Nieznany błąd'}`})
      
      // Ukryj komunikat po 5 sekundach
      setTimeout(() => {
        setSaveMessage(null)
      }, 5000)
    }
  }

  const handleLogout = async () => {
    try {
      // Pobierz sesję i token
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Użyj API endpoint z tokenem autoryzacji
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
      }
      
      await supabase.auth.signOut()
      setUser(null)
      setPreferences(null)
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🎬 Kino Alert</h2>
          <p className="text-black">Ładowanie aplikacji...</p>
        </div>
      </div>
    )
  }

  if (!user) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        {/* Header z logowaniem */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-slate-800">
                🎬 Kino Alert
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-black">
                  Chcesz otrzymywać powiadomienia? Zaloguj się już teraz!
                </span>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                >
                  <span>👤</span>
                  <span>Zaloguj się</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Główna zawartość */}
        <main className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Spersonalizowany Alert Kinowy
            </h2>
            <p className="text-xl text-black max-w-3xl mx-auto">
              Otrzymuj spersonalizowane powiadomienia o filmach w Twoich ulubionych kinach. 
              Ustaw preferencje i nie przegap żadnego seansu!
            </p>
          </div>
          

          {/* Filtry */}
          <div className="max-w-7xl mx-auto mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-slate-800">🔍 Filtruj filmy</h3>
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gatunek</label>
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">Wszystkie gatunki</option>
                    <option value="action">Akcja</option>
                    <option value="drama">Dramat</option>
                    <option value="comedy">Komedia</option>
                    <option value="thriller">Thriller</option>
                    <option value="crime">Kryminał</option>
                    <option value="adventure">Przygoda</option>
                    <option value="fantasy">Fantasy</option>
                    <option value="sci-fi">Science Fiction</option>
                    <option value="horror">Horror</option>
                    <option value="romance">Romans</option>
                    <option value="animation">Animacja</option>
                    <option value="documentary">Dokument</option>
                    <option value="biography">Biografia</option>
                    <option value="history">Historia</option>
                    <option value="mystery">Mystery</option>
                    <option value="family">Rodzinny</option>
                    <option value="war">Wojenny</option>
                    <option value="western">Western</option>
                    <option value="musical">Musical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kino</label>
                  <select
                    value={selectedCinema}
                    onChange={(e) => setSelectedCinema(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">Wszystkie kina</option>
                    <option value="helios">Helios</option>
                    <option value="multikino">Multikino</option>
                    <option value="cinema city">Cinema City</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSelectedGenre('all')
                      setSelectedCinema('all')
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Wyczyść filtry
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Aktualne filmy */}
          <div className="max-w-7xl mx-auto">
            <h3 className="text-2xl font-bold mb-8 text-center text-slate-800">
              Aktualne filmy w kinach ({filteredMovies.length})
            </h3>
            
            {moviesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
                <p className="text-black">Ładowanie filmów z OMDb...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMovies.map((movie, index) => {
                  const colors = [
                    'from-blue-400 to-blue-600',
                    'from-purple-400 to-purple-600', 
                    'from-pink-400 to-pink-600',
                    'from-red-400 to-red-600',
                    'from-green-400 to-green-600',
                    'from-yellow-400 to-yellow-600',
                    'from-indigo-400 to-indigo-600',
                    'from-teal-400 to-teal-600'
                  ]
                  const colorClass = colors[index % colors.length]
                  
                  return (
                    <div key={movie.imdb_id || movie.imdbID} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                      <div className={`h-64 bg-gradient-to-br ${colorClass} flex items-center justify-center relative overflow-hidden`}>
                        {movie.poster_url && movie.poster_url !== 'N/A' ? (
                          <img 
                            src={movie.poster_url} 
                            alt={movie.title || movie.Title}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                              if (nextElement) {
                                nextElement.style.display = 'flex'
                              }
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full flex flex-col items-center justify-center text-white" style={{display: movie.poster_url && movie.poster_url !== 'N/A' ? 'none' : 'flex'}}>
                          <span className="text-6xl mb-2">🎬</span>
                          <span className="text-sm font-medium text-center px-2">
                            {movie.title || movie.Title}
                          </span>
                        </div>
                        {(movie.imdb_rating || movie.imdbRating) && (
                          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-sm font-bold shadow-lg">
                            ⭐ {movie.imdb_rating || movie.imdbRating}
                          </div>
                        )}
                        {(movie.rated || movie.Rated) && (movie.rated || movie.Rated) !== 'N/A' && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                            {movie.rated || movie.Rated}
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h4 className="text-lg font-semibold mb-2 text-slate-800 line-clamp-2">
                          {translateTitle(movie.title || movie.Title)}
                        </h4>
                        <p className="text-black mb-3 text-sm">
                          {translateGenre(movie.genre || movie.Genre || '')} • {movie.year || movie.Year}
                        </p>
                        {(movie.director || movie.Director) && (
                          <p className="text-black text-xs mb-3">
                            Reżyser: {translateDirector(movie.director || movie.Director)}
                          </p>
                        )}
                        <div className="space-y-2 text-sm mb-4">
                          {movie.showtimes?.slice(0, 2).map((showtime: any, idx: number) => (
                            <div key={idx} className="flex justify-between">
                              <span className="text-black truncate">{showtime.cinema}</span>
                              <span className="font-medium text-indigo-600">{showtime.time}</span>
                            </div>
                          ))}
                          {movie.showtimes?.length > 2 && (
                            <div className="text-xs text-black text-center">
                              +{movie.showtimes.length - 2} więcej seansów
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleMovieClick(movie)}
                          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium mt-auto"
                        >
                          🔍 Dowiedz się więcej
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
        </div>
      </main>

        {/* Modal logowania */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Zaloguj się</h3>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="text-black hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <AuthForm onAuthSuccess={handleAuthSuccess} />
            </div>
          </div>
        )}

        {/* Modal szczegółów filmu */}
        {showMovieModal && selectedMovie && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex">
                {/* Lewa strona - plakat */}
                <div className="w-1/3 p-6">
                  {selectedMovie.poster_url && selectedMovie.poster_url !== 'N/A' ? (
                    <img 
                      src={selectedMovie.poster_url} 
                      alt={selectedMovie.title || selectedMovie.Title}
                      className="w-full rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-96 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-6xl">🎬</span>
                    </div>
                  )}
                </div>
                
                {/* Prawa strona - szczegóły */}
                <div className="w-2/3 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-800 mb-2">
                        {translateTitle(selectedMovie.title || selectedMovie.Title)}
                      </h2>
                      <p className="text-black text-lg">
                        {selectedMovie.year || selectedMovie.Year} • {translateGenre(selectedMovie.genre || selectedMovie.Genre || '')}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowMovieModal(false)}
                      className="text-black hover:text-gray-600 text-2xl"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* Oceny i informacje */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {(selectedMovie.imdb_rating || selectedMovie.imdbRating) && (
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-500 text-lg">⭐</span>
                          <div>
                            <div className="text-lg font-bold text-slate-800">
                              {selectedMovie.imdb_rating || selectedMovie.imdbRating}/10
                            </div>
                            <div className="text-xs text-black">Ocena IMDb</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {(selectedMovie.metascore || selectedMovie.Metascore) && (selectedMovie.metascore || selectedMovie.Metascore) !== 'N/A' && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-500 text-lg">📊</span>
                          <div>
                            <div className="text-lg font-bold text-slate-800">
                              {selectedMovie.metascore || selectedMovie.Metascore}/100
                            </div>
                            <div className="text-xs text-black">Ocena krytyków</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {(selectedMovie.runtime || selectedMovie.Runtime) && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-500 text-lg">⏱️</span>
                          <div>
                            <div className="text-lg font-bold text-slate-800">
                              {selectedMovie.runtime || selectedMovie.Runtime} min
                            </div>
                            <div className="text-xs text-black">Czas trwania</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {(selectedMovie.rated || selectedMovie.Rated) && (selectedMovie.rated || selectedMovie.Rated) !== 'N/A' && (
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-purple-500 text-lg">🎭</span>
                          <div>
                            <div className="text-lg font-bold text-slate-800">
                              {selectedMovie.rated || selectedMovie.Rated}
                            </div>
                            <div className="text-xs text-black">Kategoria wiekowa</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Opis */}
                  {(selectedMovie.plot || selectedMovie.Plot) && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Opis</h3>
                      <p className="text-black leading-relaxed">
                        {translatePlot(selectedMovie.plot || selectedMovie.Plot)}
                      </p>
                    </div>
                  )}
                  
                  {/* Reżyser */}
                  {(selectedMovie.director || selectedMovie.Director) && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Reżyser</h3>
                      <p className="text-black">{translateDirector(selectedMovie.director || selectedMovie.Director)}</p>
                    </div>
                  )}
                  
                  {/* Aktorzy */}
                  {(selectedMovie.actors || selectedMovie.Actors) && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Aktorzy</h3>
                      <p className="text-black">{translateActors(selectedMovie.actors || selectedMovie.Actors)}</p>
                    </div>
                  )}
                  
                  {/* Scenarzysta */}
                  {(selectedMovie.writer || selectedMovie.Writer) && (selectedMovie.writer || selectedMovie.Writer) !== 'N/A' && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Scenarzysta</h3>
                      <p className="text-black">{translateWriter(selectedMovie.writer || selectedMovie.Writer)}</p>
                    </div>
                  )}
                  
                  {/* Kraj i język */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {(selectedMovie.country || selectedMovie.Country) && (selectedMovie.country || selectedMovie.Country) !== 'N/A' && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Kraj</h3>
                        <p className="text-black">{translateCountry(selectedMovie.country || selectedMovie.Country)}</p>
                      </div>
                    )}
                    {(selectedMovie.language || selectedMovie.Language) && (selectedMovie.language || selectedMovie.Language) !== 'N/A' && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Język</h3>
                        <p className="text-black">{translateLanguage(selectedMovie.language || selectedMovie.Language)}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Nagrody */}
                  {(selectedMovie.awards || selectedMovie.Awards) && (selectedMovie.awards || selectedMovie.Awards) !== 'N/A' && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Nagrody</h3>
                      <p className="text-black">{translateAwards(selectedMovie.awards || selectedMovie.Awards)}</p>
                    </div>
                  )}
                  
                  {/* Box Office */}
                  {(selectedMovie.box_office || selectedMovie.BoxOffice) && (selectedMovie.box_office || selectedMovie.BoxOffice) !== 'N/A' && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Przychody z biletów</h3>
                      <p className="text-black">{translateBoxOffice(selectedMovie.box_office || selectedMovie.BoxOffice)}</p>
                    </div>
                  )}
                  
                  {/* Seanse */}
                  {selectedMovie.showtimes && selectedMovie.showtimes.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Dostępne seanse</h3>
                      <div className="space-y-2">
                        {selectedMovie.showtimes.map((showtime: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                            <span className="text-slate-700 font-medium">{showtime.cinema}</span>
                            <div className="text-right">
                              <div className="text-indigo-600 font-semibold">{showtime.time}</div>
                              <div className="text-black text-sm">{showtime.price} zł</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Przycisk rezerwacji */}
                  <div className="mt-6">
                    <button className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
                      🎫 Zarezerwuj bilet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">
                🎬 Kino Alert
              </h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('all-movies')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'all-movies'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-black hover:text-gray-700'
                  }`}
                >
                  Wszystkie filmy
                </button>
                <button
                  onClick={() => setActiveTab('matches')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'matches'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-black hover:text-gray-700'
                  }`}
                >
                  Filmy dla Ciebie
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'preferences'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-black hover:text-gray-700'
                  }`}
                >
                  Preferencje
                </button>
                <button
                  onClick={() => setActiveTab('alerts')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'alerts'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-black hover:text-gray-700'
                  }`}
                >
                  📢 Alerty
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-black">{user.email}</span>
              <button
                onClick={handleLogout}
                className="bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-300"
              >
                Wyloguj
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Komunikat o zapisywaniu preferencji */}
        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            saveMessage.type === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            <div className="flex items-center">
              <span className="mr-2">
                {saveMessage.type === 'success' ? '✅' : '❌'}
              </span>
              <span>{saveMessage.text}</span>
            </div>
          </div>
        )}

        {activeTab === 'matches' && <MovieMatches userId={user.id} />}
        {activeTab === 'all-movies' && (
          <div className="max-w-7xl mx-auto">
            {/* Filtry */}
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-slate-800">🔍 Filtruj filmy</h3>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gatunek</label>
                    <select
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="all">Wszystkie gatunki</option>
                      <option value="action">Akcja</option>
                      <option value="drama">Dramat</option>
                      <option value="comedy">Komedia</option>
                      <option value="thriller">Thriller</option>
                      <option value="crime">Kryminał</option>
                      <option value="adventure">Przygoda</option>
                      <option value="fantasy">Fantasy</option>
                      <option value="sci-fi">Science Fiction</option>
                      <option value="horror">Horror</option>
                      <option value="romance">Romans</option>
                      <option value="animation">Animacja</option>
                      <option value="documentary">Dokument</option>
                      <option value="biography">Biografia</option>
                      <option value="history">Historia</option>
                      <option value="mystery">Mystery</option>
                      <option value="family">Rodzinny</option>
                      <option value="war">Wojenny</option>
                      <option value="western">Western</option>
                      <option value="musical">Musical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kino</label>
                    <select
                      value={selectedCinema}
                      onChange={(e) => setSelectedCinema(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="all">Wszystkie kina</option>
                      <option value="helios">Helios</option>
                      <option value="multikino">Multikino</option>
                      <option value="cinema city">Cinema City</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSelectedGenre('all')
                        setSelectedCinema('all')
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Wyczyść filtry
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista filmów */}
            <h3 className="text-2xl font-bold mb-8 text-center text-slate-800">
              Aktualne filmy w kinach ({filteredMovies.length})
            </h3>
            
            {moviesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
                <p className="text-black">Ładowanie filmów z OMDb...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMovies.map((movie, index) => {
                  const colors = [
                    'from-blue-400 to-blue-600',
                    'from-purple-400 to-purple-600', 
                    'from-pink-400 to-pink-600',
                    'from-red-400 to-red-600',
                    'from-green-400 to-green-600',
                    'from-yellow-400 to-yellow-600',
                    'from-indigo-400 to-indigo-600',
                    'from-teal-400 to-teal-600'
                  ]
                  const colorClass = colors[index % colors.length]
                  
                  return (
                    <div key={movie.imdb_id || movie.imdbID} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                      <div className={`h-64 bg-gradient-to-br ${colorClass} flex items-center justify-center relative overflow-hidden`}>
                        {movie.poster_url && movie.poster_url !== 'N/A' ? (
                          <img 
                            src={movie.poster_url} 
                            alt={movie.title || movie.Title}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                              if (nextElement) {
                                nextElement.style.display = 'flex'
                              }
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full flex flex-col items-center justify-center text-white" style={{display: movie.poster_url && movie.poster_url !== 'N/A' ? 'none' : 'flex'}}>
                          <span className="text-6xl mb-2">🎬</span>
                          <span className="text-sm font-medium text-center px-2">
                            {movie.title || movie.Title}
                          </span>
                        </div>
                        {(movie.imdb_rating || movie.imdbRating) && (
                          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-sm font-bold shadow-lg">
                            ⭐ {movie.imdb_rating || movie.imdbRating}
                          </div>
                        )}
                        {(movie.rated || movie.Rated) && (movie.rated || movie.Rated) !== 'N/A' && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                            {movie.rated || movie.Rated}
                          </div>
                        )}
                        
                        {/* Przycisk powiadomienia dla zalogowanych */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNotifyMovie(movie)
                          }}
                          className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-gray-700 hover:text-indigo-600 p-2 rounded-full shadow-md transition-colors"
                          title="Powiadom o tym filmie"
                        >
                          🔔
                        </button>
                      </div>
                      <div className="p-6">
                        <h4 className="text-lg font-semibold mb-2 text-slate-800 line-clamp-2">
                          {translateTitle(movie.title || movie.Title)}
                        </h4>
                        <p className="text-black mb-3 text-sm">
                          {translateGenre(movie.genre || movie.Genre || '')} • {movie.year || movie.Year}
                        </p>
                        {(movie.director || movie.Director) && (
                          <p className="text-black text-xs mb-3">
                            Reżyser: {translateDirector(movie.director || movie.Director)}
                          </p>
                        )}
                        <div className="space-y-2 text-sm mb-4">
                          {movie.showtimes?.slice(0, 2).map((showtime: any, idx: number) => (
                            <div key={idx} className="flex justify-between">
                              <span className="text-black truncate">{showtime.cinema}</span>
                              <span className="font-medium text-indigo-600">{showtime.time}</span>
                            </div>
                          ))}
                          {movie.showtimes?.length > 2 && (
                            <div className="text-xs text-black text-center">
                              +{movie.showtimes.length - 2} więcej seansów
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleMovieClick(movie)}
                          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium mt-auto"
                        >
                          🔍 Dowiedz się więcej
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        {activeTab === 'preferences' && (
          <PreferencesForm
            userId={user.id}
            initialPreferences={preferences}
            onSave={handleSavePreferences}
          />
        )}
        {activeTab === 'alerts' && <AlertHistory />}
      </main>
    </div>
  )
}
