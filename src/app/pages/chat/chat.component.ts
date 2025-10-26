import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MessageComponent } from '../../components/message/message.component';
import { LoadingComponent } from '../../components/loading/loading.component';
import { ErrorMessageComponent } from '../../components/error-message/error-message.component';
import { ChatService } from '../../services/chat.service';
import { VoiceService } from '../../services/voice.service';
import { SessionService } from '../../services/session.service';
import { Message } from '../../models/message.model';
import { APP_CONSTANTS, ERROR_MESSAGES } from '../../constants/app.constants';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MessageComponent, LoadingComponent, ErrorMessageComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef;

  messages: Message[] = [];
  inputMessage: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  showError: boolean = false;
  selectedImage: string | null = null;
  imagePreviewUrl: string | null = null;
  isRecording: boolean = false;
  isVoiceSupported: boolean = false;
  selectedModel: 'MISTRAL' | 'GEMINI' | 'ASHISH' | 'AGENTIC' = 'AGENTIC';

  private sessionId: string = '';
  private subscriptions: Subscription[] = [];
  private shouldScrollToBottom: boolean = false;
  private errorTimeoutId: any = null;

  constructor(
    private chatService: ChatService,
    private voiceService: VoiceService,
    private sessionService: SessionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sessionId = this.sessionService.getSessionId();
    this.isVoiceSupported = this.voiceService.isBrowserSupported();
    // Set the chat service to use the selected model
    this.chatService.setProvider(this.selectedModel);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.sessionService.clearSessionTimer();
    if (this.errorTimeoutId) {
      clearTimeout(this.errorTimeoutId);
    }
  }

  sendMessage(): void {
    const trimmedMessage = this.inputMessage.trim();
    
    if (!trimmedMessage && !this.selectedImage) {
      this.showErrorMessage(ERROR_MESSAGES.EMPTY_MESSAGE);
      return;
    }

    // Create user message
    const userMessage: Message = {
      id: this.generateId(),
      type: 'user',
      content: trimmedMessage || '(Image)',
      image: this.selectedImage,
      timestamp: new Date(),
    };

    this.messages.push(userMessage);
    this.shouldScrollToBottom = true;

    // Reset input and image
    const messageToSend = trimmedMessage;
    const imageToSend = this.selectedImage;
    this.inputMessage = '';
    this.selectedImage = null;
    this.imagePreviewUrl = null;

    // Send to API
    this.isLoading = true;
    this.sessionService.resetTimer();

    const subscription = this.chatService
      .sendMessage(messageToSend, imageToSend, this.sessionId)
      .subscribe({
        next: (response) => {
          const aiMessage: Message = {
            id: this.generateId(),
            type: 'ai',
            content: response.response,
            image: null,
            timestamp: new Date(),
          };
          this.messages.push(aiMessage);
          this.isLoading = false;
          this.shouldScrollToBottom = true;
        },
        error: (error) => {
          this.isLoading = false;
          this.showErrorMessage(error.message || ERROR_MESSAGES.API_FAILED);
        },
      });

    this.subscriptions.push(subscription);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!APP_CONSTANTS.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.showErrorMessage(ERROR_MESSAGES.IMAGE_TYPE);
      input.value = '';
      return;
    }

    // Validate file size
    if (file.size > APP_CONSTANTS.MAX_IMAGE_SIZE_BYTES) {
      this.showErrorMessage(ERROR_MESSAGES.IMAGE_SIZE);
      input.value = '';
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      this.selectedImage = base64String;
      this.imagePreviewUrl = base64String;
    };
    reader.readAsDataURL(file);
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreviewUrl = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  toggleRecording(): void {
    if (!this.isVoiceSupported) {
      this.showErrorMessage(ERROR_MESSAGES.VOICE_NOT_SUPPORTED);
      return;
    }

    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  private startRecording(): void {
    this.isRecording = true;
    const subscription = this.voiceService.startRecording().subscribe({
      next: (transcript) => {
        console.log('Transcript received in component:', transcript);
        this.inputMessage = transcript;
      },
      error: (error) => {
        console.error('Voice recognition error:', error);
        this.isRecording = false;
        const errorMsg = typeof error === 'string' ? error : 'Voice recognition error. Please try again.';
        this.showErrorMessage(errorMsg);
      },
      complete: () => {
        console.log('Voice recognition completed');
        this.isRecording = false;
      }
    });
    this.subscriptions.push(subscription);
  }

  private stopRecording(): void {
    this.voiceService.stopRecording();
    this.isRecording = false;
  }

  private scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop =
        this.messageContainer.nativeElement.scrollHeight;
    } catch (error) {
      console.error('Error scrolling to bottom:', error);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showError = true;

    if (this.errorTimeoutId) {
      clearTimeout(this.errorTimeoutId);
    }

    this.errorTimeoutId = setTimeout(() => {
      this.dismissError();
    }, APP_CONSTANTS.ERROR_AUTO_DISMISS_MS);
  }

  dismissError(): void {
    this.showError = false;
    if (this.errorTimeoutId) {
      clearTimeout(this.errorTimeoutId);
      this.errorTimeoutId = null;
    }
  }

  onModelChange(): void {
    this.chatService.setProvider(this.selectedModel);
    console.log('AI Model changed to:', this.selectedModel);
  }

  startNewChat(): void {
    // Clear all messages
    this.messages = [];
    
    // Clear input and image
    this.inputMessage = '';
    this.selectedImage = null;
    this.imagePreviewUrl = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    
    // Clear any errors
    this.showError = false;
    this.errorMessage = '';
    
    // Generate new session ID
    this.sessionId = this.sessionService.getSessionId();
    
    // Reset session timer
    this.sessionService.resetTimer();
    
    console.log('New chat started with session ID:', this.sessionId);
  }

  goToLanding(): void {
    this.router.navigate(['/']);
  }
}

