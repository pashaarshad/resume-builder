/**
 * Session management utilities for the resume builder
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

export interface SessionData {
  id: string;
  created_at: string;
  last_accessed: string;
  metadata?: any;
}

export interface ResumeData {
  id: string;
  version: number;
  title: string;
  content: any;
  original_filename?: string;
  job_description?: string;
  created_at: string;
  updated_at: string;
  is_current?: boolean;
}

export interface ResumeVersion {
  id: string;
  version: number;
  title: string;
  created_at: string;
  updated_at: string;
  is_current: boolean;
}

class SessionManager {
  private sessionId: string | null = null;

  constructor() {
    // Try to get existing session from localStorage (only on client-side)
    if (typeof window !== 'undefined') {
      this.sessionId = localStorage.getItem('resume_session_id');
    }
  }

  async getOrCreateSession(): Promise<string> {
    if (this.sessionId) {
      try {
        // Verify existing session is still valid
        const response = await fetch(`${API_BASE_URL}/sessions/${this.sessionId}`);
        if (response.ok) {
          return this.sessionId;
        }
      } catch (error) {
        console.warn('Failed to verify existing session:', error);
      }
    }

    // Create new session
    try {
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: {
            user_agent: navigator.userAgent,
            created_from: 'web_app'
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      this.sessionId = data.session_id;
      if (typeof window !== 'undefined') {
        localStorage.setItem('resume_session_id', this.sessionId!);
      }
      return this.sessionId!;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async getSessionData(): Promise<SessionData | null> {
    if (!this.sessionId) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${this.sessionId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching session data:', error);
    }
    return null;
  }

  async saveResume(resumeData: any, jobDescription?: string): Promise<string | null> {
    const sessionId = await this.getOrCreateSession();

    try {
      const response = await fetch(`${API_BASE_URL}/resumes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          resume_data: resumeData,
          job_description: jobDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save resume');
      }

      const data = await response.json();
      return data.resume_id;
    } catch (error) {
      console.error('Error saving resume:', error);
      return null;
    }
  }

  async getCurrentResume(): Promise<ResumeData | null> {
    if (!this.sessionId) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${this.sessionId}/current-resume`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching current resume:', error);
    }
    return null;
  }

  async getResumeHistory(): Promise<ResumeVersion[]> {
    if (!this.sessionId) return [];

    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${this.sessionId}/resumes`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching resume history:', error);
    }
    return [];
  }

  async getResumeById(resumeId: string): Promise<ResumeData | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/resumes/${resumeId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching resume:', error);
    }
    return null;
  }

  async updateResume(resumeId: string, resumeData: any): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/resumes/${resumeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_id: resumeId,
          resume_data: resumeData,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating resume:', error);
      return false;
    }
  }

  async restoreResumeVersion(resumeId: string): Promise<boolean> {
    if (!this.sessionId) return false;

    try {
      const response = await fetch(
        `${API_BASE_URL}/sessions/${this.sessionId}/restore/${resumeId}`,
        {
          method: 'POST',
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error restoring resume version:', error);
      return false;
    }
  }

  async deleteResume(resumeId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/resumes/${resumeId}`, {
        method: 'DELETE',
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting resume:', error);
      return false;
    }
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  clearSession(): void {
    this.sessionId = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('resume_session_id');
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();