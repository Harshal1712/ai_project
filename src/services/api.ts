import { 
  SourceContent, 
  TransformationConfig, 
  OutputType, 
  ProjectItem 
} from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

export class ContentIQApiClient {
  public static async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return res.ok;
    } catch (err) {
      return false;
    }
  }

  public static async generateTransformation(
    source: SourceContent,
    config: TransformationConfig,
    outputs: OutputType[]
  ): Promise<ProjectItem | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/transformations/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, config, outputs })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.project;
    } catch (err) {
      console.warn('Backend API server offline, using client-side simulated pipeline fallback');
      return null;
    }
  }

  public static async askContentQA(query: string, sourceName: string): Promise<{ answer: string; citation: string } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/qa/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, sourceName })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.result;
    } catch (err) {
      return null;
    }
  }

  public static async analyzeYouTube(url: string): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/youtube/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch (err) {
      return null;
    }
  }
}
