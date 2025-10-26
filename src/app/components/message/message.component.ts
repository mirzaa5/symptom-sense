import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Message } from '../../models/message.model';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message.component.html',
  styleUrl: './message.component.css',
})
export class MessageComponent {
  @Input() message!: Message;

  constructor(private sanitizer: DomSanitizer) {}

  get formattedContent(): SafeHtml {
    if (!this.message.content) return '';
    
    let html = this.message.content
      // Convert markdown-style bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      
      // Convert headers
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      
      // Convert links
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Convert bullet points
      .replace(/^• (.+)$/gm, '<li>$1</li>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      
      // Convert numbered lists
      .replace(/^(\d+)\. (.+)$/gm, '<li class="numbered">$2</li>')
      
      // Wrap consecutive list items
      .replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>')
      .replace(/(<li class="numbered">.*<\/li>\n)+/g, '<ol>$&</ol>')
      
      // Convert horizontal rules
      .replace(/^---$/gm, '<hr>')
      
      // Convert line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    // Wrap in paragraph tags if not already wrapped
    if (!html.startsWith('<')) {
      html = '<p>' + html + '</p>';
    }
    
    return this.sanitizer.sanitize(1, html) || '';
  }
}

