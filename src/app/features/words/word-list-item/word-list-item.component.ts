import { DatePipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';

import { Word } from '../models/word.model';
import { WordsService } from '../services/words.service';
import { WordFormDialogComponent } from '../word-form-dialog/word-form-dialog.component';

@Component({
  selector: 'app-word-list-item',
  standalone: true,
  imports: [DatePipe, WordFormDialogComponent],
  templateUrl: './word-list-item.component.html',
  host: { class: 'block' },
})
export class WordListItemComponent {
  private readonly wordsService = inject(WordsService);
  word = input.required<Word>();
  deleted = output<string>();
  edited = output<Word>();

  protected showEdit = false;
  protected confirmDelete = false;

  openEdit(): void {
    this.showEdit = true;
  }

  closeEdit(): void {
    this.showEdit = false;
  }

  onEdited(w: Word): void {
    this.edited.emit(w);
    this.closeEdit();
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
