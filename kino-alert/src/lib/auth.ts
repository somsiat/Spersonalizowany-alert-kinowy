import { supabase } from './supabase'

export interface User {
  id: string
  email: string
  preferences?: UserPreferences
}

export interface UserPreferences {
  user_id: string
  favorite_cinemas?: number[]  // ARRAY bigint[] w bazie
  favorite_cities?: string[]   // ARRAY text[] w bazie
  genres?: string[]            // ARRAY text[] w bazie
  people?: string[]            // ARRAY text[] w bazie
  min_imdb?: number            // numeric w bazie
  alerts_enabled?: boolean     // boolean w bazie
  email_notifications?: boolean // boolean w bazie (do dodania)
  push_notifications?: boolean  // boolean w bazie (do dodania)
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return {
      id: user.id,
      email: user.email || '',
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('user_prefs')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching user preferences:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return null
  }
}

export async function updateUserPreferences(preferences: Partial<UserPreferences>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_prefs')
      .upsert(preferences)
    
    if (error) {
      console.error('Error updating user preferences:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error updating user preferences:', error)
    return false
  }
}

export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Error signing out:', error)
  }
}
