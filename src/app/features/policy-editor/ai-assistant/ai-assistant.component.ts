import {
  Component, EventEmitter, inject, Input, OnInit, Output, ViewChild, ElementRef, AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AiAssistantService } from '../../../core/services/ai-assistant.service';
import { Graph } from '../../../core/models/graph.model';
import { Mutation } from '../../../core/models/policy.model';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const window: any;

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatTabsModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  templateUrl: './ai-assistant.component.html',
  styleUrl: './ai-assistant.component.scss',
})
export class AiAssistantComponent implements AfterViewChecked {
  @ViewChild('chatScroll') chatScroll!: ElementRef<HTMLDivElement>;
  @Input() currentGraph?: Graph;
  @Output() mutationsReady = new EventEmitter<Mutation[]>();
  @Output() processingChange = new EventEmitter<boolean>();

  private ai = inject(AiAssistantService);

  mode: 'editor' | 'tutor' = 'editor';
  prompt = '';
  loading = false;
  recording = false;
  messages: ChatMessage[] = [];

  private shouldScroll = false;

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  setMode(m: 'editor' | 'tutor'): void {
    this.mode = m;
  }

  send(): void {
    const text = this.prompt.trim();
    if (!text || this.loading) return;

    this.messages.push({ role: 'user', text });
    this.prompt = '';
    this.loading = true;
    this.shouldScroll = true;
    this.processingChange.emit(this.mode === 'editor');

    if (this.mode === 'editor') {
      this.ai.sendDiagramPrompt(text, this.currentGraph ?? { lanes: [], nodes: [], edges: [] }).subscribe({
        next: (res) => {
          this.messages.push({ role: 'assistant', text: res.explanation });
          this.mutationsReady.emit(res.mutations);
          this.finish();
        },
        error: () => {
          this.messages.push({ role: 'assistant', text: 'Error al procesar la solicitud. Intenta de nuevo.' });
          this.finish();
        },
      });
    } else {
      this.ai.askTutor(text).subscribe({
        next: (res) => {
          this.messages.push({ role: 'assistant', text: res });
          this.finish();
        },
        error: () => {
          this.messages.push({ role: 'assistant', text: 'Error al conectar con el tutor. Intenta de nuevo.' });
          this.finish();
        },
      });
    }
  }

  toggleRecording(): void {
    if (this.recording) {
      this.recording = false;
      return;
    }
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.onstart  = () => { this.recording = true; };
    recognition.onend    = () => { this.recording = false; };
    recognition.onresult = (event: any) => {
      this.prompt = event.results[0][0].transcript;
    };
    recognition.start();
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
  }

  private finish(): void {
    this.loading = false;
    this.shouldScroll = true;
    this.processingChange.emit(false);
  }

  private scrollToBottom(): void {
    const el = this.chatScroll?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
