export class AuthService {
  async signUp(email: string, password: string): Promise<{ user: { id: string; email: string } | null; error: null }> {
    return { user: { id: 'mock-user-id', email }, error: null };
  }

  async signIn(email: string, password: string): Promise<{ user: { id: string; email: string } | null; error: null }> {
    return { user: { id: 'mock-user-id', email }, error: null };
  }

  async signOut(): Promise<{ error: null }> {
    return { error: null };
  }

  async resetPassword(email: string): Promise<{ error: null }> {
    return { error: null };
  }

  async getCurrentUser(): Promise<{ id: string; email: string } | null> {
    return { id: 'mock-user-id', email: 'mock@example.com' };
  }

  async updateProfile(userId: string, updates: { [key: string]: any }): Promise<{ error: null }> {
    return { error: null };
  }

  onAuthStateChange(callback: (event: 'SIGNED_IN' | 'SIGNED_OUT', session: any) => void) {
    callback('SIGNED_IN', { user: { id: 'mock-user-id', email: 'mock@example.com' } });
  }
}

export const authService = new AuthService();