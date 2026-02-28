import { DatePipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';

import { Word } from '../models/word.model';
import { WordsService } from '../services/words.service';

@Component({
  selector: 'app-word-list-item',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './word-list-item.component.html',
  host: { class: 'block' },
})
export class WordListItemComponent {
  private readonly wordsService = inject(WordsService);
  word = input.required<Word>();
  deleted = output<string>();
  editRequested = output<Word>();

  protected confirmDelete = false;

  openEdit(): void {
    this.editRequested.emit(this.word());
  }

  deleteWord(): void {
    const id = this.word()._id;
    this.wordsService.delete(id).subscribe({
      next: () => {
        this.deleted.emit(id);
        this.confirmDelete = false;
      },
      error: () => (this.confirmDelete = false),
    });
  }
}
