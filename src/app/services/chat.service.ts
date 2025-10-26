import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ChatResponse } from '../models/chat-response.model';
import { AI_MODELS } from '../constants/app.constants';

type AIProvider = 'MISTRAL' | 'GEMINI' | 'ASHISH' | 'AGENTIC';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private currentProvider: AIProvider = 'MISTRAL';

  constructor(private http: HttpClient) {}

  setProvider(provider: AIProvider): void {
    this.currentProvider = provider;
  }

  getCurrentProvider(): string {
    return AI_MODELS[this.currentProvider].name;
  }

  sendMessage(message: string, image: string | null, sessionId: string): Observable<ChatResponse> {
    switch (this.currentProvider) {
      case 'MISTRAL':
        return this.sendToMistral(message, image);
      case 'GEMINI':
        return this.sendToGemini(message);
      case 'ASHISH':
        return this.sendToAshish(message);
      case 'AGENTIC':
        return this.sendToAgenticBackend(message, image);
      default:
        return this.sendToMistral(message, image);
    }
  }

  private sendToMistral(message: string, image: string | null = null): Observable<ChatResponse> {
    const config = AI_MODELS.MISTRAL;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    });

    // System prompt for medical analysis
    const systemMessage = {
      role: 'system',
      content: 'You are a medical diagnostic assistant. Analyze symptoms carefully and provide helpful, accurate information. When analyzing images, describe visible symptoms, potential conditions, and recommend appropriate medical consultation. Always remind users to seek professional medical advice for accurate diagnosis.'
    };

    // Build message content - if image exists, use multimodal format
    let messageContent: any;
    
    if (image) {
      // Multimodal format with text and image
      messageContent = [
        {
          type: 'text',
          text: message || 'Please analyze this image and describe what you see, focusing on any medical symptoms or concerns.'
        },
        {
          type: 'image_url',
          image_url: image // Base64 image string
        }
      ];
    } else {
      // Text-only format
      messageContent = message;
    }

    const body = {
      model: config.model,
      messages: [
        systemMessage,
        { role: 'user', content: messageContent }
      ]
    };

    return this.http.post<any>(config.apiUrl, body, { headers }).pipe(
      map(response => ({
        response: response.choices[0].message.content,
        status: 'success'
      }))
    );
  }

  private sendToGemini(message: string): Observable<ChatResponse> {
    const config = AI_MODELS.GEMINI;
    const url = `${config.apiUrl}?key=${config.apiKey}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      contents: [{
        parts: [{ text: message }]
      }]
    };

    return this.http.post<any>(url, body, { headers }).pipe(
      map(response => ({
        response: response.candidates[0].content.parts[0].text,
        status: 'success'
      }))
    );
  }

  private sendToAshish(message: string): Observable<ChatResponse> {
    const config = AI_MODELS.ASHISH;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    });

    const body = {
      model: config.model,
      messages: [{ role: 'user', content: message }]
    };

    return this.http.post<any>(config.apiUrl, body, { headers }).pipe(
      map(response => ({
        response: response.choices?.[0]?.message?.content || response.response || 'No response',
        status: 'success'
      }))
    );
  }

  /**
   * Send message to local Agentic Medical Assistant FastAPI backend
   * 
   * Backend Requirements:
   * - Endpoint: POST http://localhost:8000/api/process_input
   * - Headers: Content-Type: application/json (NO Authorization needed for local)
   * 
   * Request Body:
   * {
   *   "text_query": "string or null",     // Your text question
   *   "image_base64": "data:image/png;base64,... or null"  // Full base64 data URL
   * }
   * 
   * Response includes:
   * - answer: Main AI response text
   * - citations: Array of RAG document sources [{label, source, score}]
   * - confidence_profile: {overall_confidence, confidence_level, image_confidence, rag_confidence, llm_confidence}
   * - image_analysis: {classification, confidence} from ViT model
   * - web_sources: Array from Brave search [{title, url, snippet}]
   * - hitl_flagged: Boolean - true if flagged for human review
   * - warnings: Array of warning strings
   * - follow_up: Array of suggested follow-up questions
   */
  private sendToAgenticBackend(message: string, image: string | null = null): Observable<ChatResponse> {
    const config = AI_MODELS.AGENTIC;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      // No Authorization header - local backend doesn't require it
    });

    // Build request body matching FastAPI ProcessInputRequest DTO
    const body: any = {
      text_query: message || null,
      image_base64: image || null
    };

    return this.http.post<any>(config.apiUrl, body, { headers }).pipe(
      map((response: any) => {
        let formattedResponse = '';

        // Main answer - clean it by removing duplicate sections
        let mainAnswer = response.answer || 'No response received.';
        
        // Remove duplicate confidence sections from main answer
        mainAnswer = mainAnswer.replace(/\n\n📊 \*\*Confidence Level\*\*:.*?(?=\n\n|$)/gs, '');
        mainAnswer = mainAnswer.replace(/\n\n⚠️ \*\*Human Review Flagged\*\*:.*?(?=\n\n|$)/gs, '');
        mainAnswer = mainAnswer.replace(/\n\n🔬 \*\*Image Analysis\*\*:.*?(?=\n\n|$)/gs, '');
        mainAnswer = mainAnswer.replace(/\n\n📚 \*\*Sources\*\*:.*?(?=\n\n|$)/gs, '');
        mainAnswer = mainAnswer.replace(/\n\n🌐 \*\*Web Sources\*\*:.*?(?=\n\n|$)/gs, '');
        mainAnswer = mainAnswer.replace(/\n\n⚠️ \*\*Warnings\*\*:.*?(?=\n\n|$)/gs, '');
        mainAnswer = mainAnswer.replace(/\n\n💡 \*\*Follow-up Questions\*\*:.*?(?=\n\n|$)/gs, '');
        mainAnswer = mainAnswer.replace(/> \*\*Confidence Notes\*\*[\s\S]*?(?=\n\n[^\s>]|$)/g, '');
        mainAnswer = mainAnswer.replace(/\*\*Recommended Next Steps:\*\*[\s\S]*?(?=\n\n[^\s•]|$)/g, '');
        mainAnswer = mainAnswer.replace(/\*\*Important Notice:\*\*[\s\S]*?(?=\n\n[^\s>]|$)/g, '');
        
        formattedResponse = mainAnswer.trim();

        // Image Analysis (if available)
        if (response.image_analysis) {
          const imgAnalysis = response.image_analysis;
          formattedResponse += `\n\n---\n\n🔬 **Image Analysis**`;
          if (imgAnalysis.classification) {
            formattedResponse += `\n• Classification: **${imgAnalysis.classification}**`;
          }
          if (imgAnalysis.confidence !== null && imgAnalysis.confidence !== undefined) {
            formattedResponse += `\n• Confidence: **${Math.round(imgAnalysis.confidence * 100)}%**`;
          }
        }

        // Confidence Profile
        if (response.confidence_profile) {
          const conf = response.confidence_profile;
          formattedResponse += `\n\n---\n\n📊 **Confidence Assessment**`;
          formattedResponse += `\n• Overall: **${conf.confidence_level.toUpperCase()}** (${Math.round(conf.overall_confidence * 100)}%)`;
          
          if (conf.image_confidence !== null && conf.image_confidence !== undefined) {
            formattedResponse += `\n• Image Analysis: ${Math.round(conf.image_confidence * 100)}%`;
          }
          if (conf.rag_confidence !== null && conf.rag_confidence !== undefined) {
            formattedResponse += `\n• Knowledge Base: ${Math.round(conf.rag_confidence * 100)}%`;
          }
          if (conf.llm_confidence !== null && conf.llm_confidence !== undefined) {
            formattedResponse += `\n• AI Reasoning: ${Math.round(conf.llm_confidence * 100)}%`;
          }
        }

        // HITL Flag
        if (response.hitl_flagged) {
          formattedResponse += `\n\n⚠️ **Medical Review Required**\nThis assessment has been flagged for professional medical review due to low diagnostic confidence.`;
        }

        // Warnings (deduplicated)
        if (response.warnings && response.warnings.length > 0) {
          const uniqueWarnings = [...new Set(response.warnings)] as string[];
          formattedResponse += `\n\n---\n\n⚠️ **Clinical Notes**`;
          uniqueWarnings.forEach((warning: string) => {
            formattedResponse += `\n• ${warning}`;
          });
        }

        // Web Sources (clean format)
        if (response.web_sources && response.web_sources.length > 0) {
          formattedResponse += `\n\n---\n\n🌐 **Research Sources**`;
          response.web_sources.forEach((source: any, idx: number) => {
            formattedResponse += `\n\n**${idx + 1}. ${source.title}**`;
            formattedResponse += `\n🔗 [${source.url}](${source.url})`;
            if (source.snippet) {
              formattedResponse += `\n${source.snippet.substring(0, 150)}...`;
            }
          });
        }

        // Citations from RAG (if not generic web references)
        if (response.citations && response.citations.length > 0) {
          const nonWebCitations = response.citations.filter((c: any) => 
            !c.label.startsWith('web') && c.label.toLowerCase() !== 'unknown'
          );
          
          if (nonWebCitations.length > 0) {
            formattedResponse += `\n\n---\n\n📚 **Medical Knowledge Base**`;
            nonWebCitations.forEach((citation: any, idx: number) => {
              formattedResponse += `\n• ${citation.label}`;
              if (citation.score && citation.score > 0.5) {
                formattedResponse += ` (${Math.round(citation.score * 100)}% relevant)`;
              }
            });
          }
        }

        // Follow-up suggestions
        if (response.follow_up && response.follow_up.length > 0) {
          formattedResponse += `\n\n---\n\n💡 **Suggested Follow-up Questions**`;
          response.follow_up.forEach((followUp: string, idx: number) => {
            formattedResponse += `\n${idx + 1}. ${followUp}`;
          });
        }

        // Medical disclaimer footer
        formattedResponse += `\n\n---\n\n*⚕️ This is an AI-assisted analysis. Always consult qualified healthcare professionals for medical diagnosis and treatment decisions.*`;

        return {
          response: formattedResponse,
          status: 'success'
        };
      }),
      catchError((error: any) => {
        console.error('Agentic backend error:', error);
        let errorMessage = 'Failed to connect to local backend. ';
        
        if (error.status === 0) {
          errorMessage += 'Make sure the backend is running on http://localhost:8000';
        } else if (error.status === 400) {
          errorMessage += 'Invalid request format.';
        } else if (error.status === 503) {
          errorMessage += 'Backend services not initialized.';
        } else {
          errorMessage += error.error?.detail || error.message || 'Unknown error';
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}

