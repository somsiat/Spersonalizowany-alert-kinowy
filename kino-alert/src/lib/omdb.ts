export interface MovieData {
  Title: string
  Year: string
  Rated: string
  Released: string
  Runtime: string
  Genre: string
  Director: string
  Writer: string
  Actors: string
  Plot: string
  Language: string
  Country: string
  Awards: string
  Poster: string
  Ratings: Array<{
    Source: string
    Value: string
  }>
  Metascore: string
  imdbRating: string
  imdbVotes: string
  imdbID: string
  Type: string
  DVD: string
  BoxOffice: string
  Production: string
  Website: string
  Response: string
}

export async function fetchMovieData(imdbId: string): Promise<MovieData | null> {
  try {
    const url = `${process.env.OMDB_API_URL}?i=${imdbId}&apikey=${process.env.OMDB_API_KEY}`
    const response = await fetch(url, { cache: 'no-store' })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.Response === 'False') {
      console.error('OMDb API error:', data.Error)
      return null
    }
    
    return data as MovieData
  } catch (error) {
    console.error('Error fetching movie data:', error)
    return null
  }
}

export async function searchMovies(query: string): Promise<MovieData[]> {
  try {
    const url = `${process.env.OMDB_API_URL}?s=${encodeURIComponent(query)}&apikey=${process.env.OMDB_API_KEY}`
    const response = await fetch(url, { cache: 'no-store' })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.Response === 'False') {
      console.error('OMDb API error:', data.Error)
      return []
    }
    
    return data.Search || []
  } catch (error) {
    console.error('Error searching movies:', error)
    return []
  }
}
