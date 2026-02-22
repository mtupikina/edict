import {
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardSelectImports } from '@/shared/components/select/select.imports';

import { PART_OF_SPEECH_OPTIONS, Word } from '../models/word.model';
import { WordsService } from '../services/words.service';
import {
  getFieldError,
  WORD_FORM_FIELD_CONFIG,
} from './word-form.config';
import {
  DEFAULT_FORM_VALUE,
  formValueToPayload,
  wordToFormValue,
  WordFormControls,
  WordFormValue,
} from './word-form.utils';
import { partOfSpeechValidator, requiredTrimmed } from './word-form.validators';

@Component({
  selector: 'app-word-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardInputDirective,
    ZardSelectImports,
  ],
  templateUrl: './word-form-dialog.component.html',
  host: { class: 'block' },
})
export class WordFormDialogComponent {
  private readonly wordsService = inject(WordsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  word = input<Word | null>(null);
  saved = output<Word>();
  dialogCancel = output<void>();

  private readonly wordInputRef = viewChild('wordInputRef', { read: ElementRef<HTMLInputElement> });

  protected readonly partOfSpeechOptions = PART_OF_SPEECH_OPTIONS;
  protected showAddForm = signal(false);
  protected submitting = signal(false);
  protected error = signal<string | null>(null);

  /** Form model is the source of truth (reactive forms). */
  protected form: FormGroup<WordFormControls> = this.buildForm();

  /** Error message for a control (form validation or API). Re-evaluates after markAllAsTouched(). */
  protected getControlError(controlName: keyof WordFormValue): string | null {
    const c = this.form.get(controlName);
    const apiError = this.error();
    const config = WORD_FORM_FIELD_CONFIG[controlName];
    if (!config) return null;

    if (apiError && config.apiErrorPattern?.test(apiError)) return apiError;
    if (!c?.invalid || !c.touched) return null;

    return getFieldError(controlName, c.errors ?? null, null, WORD_FORM_FIELD_CONFIG);
  }

  /** True when the control should show error styling (invalid and touched). */
  protected isControlInvalidAndTouched(controlName: keyof WordFormValue): boolean {
    const c = this.form.get(controlName);
    return !!(c?.invalid && c.touched);
  }

  /** Plural field: nouns and adjectives only. Re-evaluated on change detection. */
  protected get showPluralField(): boolean {
    const pos = this.form.get('partOfSpeech')?.value;
    return pos === 'n' || pos === 'adj';
  }

  /** Simple past / past participle: verbs and phrasal verbs only. */
  protected get showVerbFormsField(): boolean {
    const pos = this.form.get('partOfSpeech')?.value;
    return pos === 'v' || pos === 'ph v';
  }

  constructor() {
    let lastSyncedId: string | null = null;
    effect(() => {
      const w = this.word();
      const currentId = w?._id ?? null;
      if (currentId !== lastSyncedId) {
        lastSyncedId = currentId;
        if (w) this.form.patchValue(wordToFormValue(w));
      }
    });
  }

  private buildForm(): FormGroup<WordFormControls> {
    const d = DEFAULT_FORM_VALUE;
    return this.fb.nonNullable.group({
      word: [d.word, [Validators.required, requiredTrimmed()]],
      translation: [d.translation],
      partOfSpeech: [d.partOfSpeech, partOfSpeechValidator()],
      transcription: [d.transcription],
      description: [d.description],
      synonymsText: [d.synonymsText],
      antonymsText: [d.antonymsText],
      examplesText: [d.examplesText],
      tagsText: [d.tagsText],
      plural: [d.plural],
      simplePast: [d.simplePast],
      pastParticiple: [d.pastParticiple],
    });
  }

  protected openAdd(): void {
    this.form.reset(DEFAULT_FORM_VALUE);
    this.error.set(null);
    this.showAddForm.set(true);
  }

  protected close(): void {
    this.showAddForm.set(false);
    this.dialogCancel.emit();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusWordInput();
      return;
    }

    const payload = formValueToPayload(this.form.getRawValue());
    const w = this.word();

    if (w) {
      this.executeSave(this.wordsService.update(w._id, payload), {});
    } else {
      this.executeSave(this.wordsService.create(payload), { closeAddForm: true });
    }
  }

  private executeSave(
    request$: Observable<Word>,
    options: { closeAddForm?: boolean },
  ): void {
    this.submitting.set(true);
    this.error.set(null);
    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.saved.emit(result);
          if (options.closeAddForm) this.showAddForm.set(false);
          this.submitting.set(false);
        },
        error: (err) => {
          this.error.set(this.getApiErrorMessage(err) ?? 'Request failed');
          this.submitting.set(false);
        },
      });
  }

  private focusWordInput(): void {
    setTimeout(() => this.wordInputRef()?.nativeElement?.focus(), 0);
  }

  private getApiErrorMessage(err: {
    error?: { message?: string | string[] };
    message?: string;
  }): string | null {
    const msg = err?.error?.message;
    if (Array.isArray(msg) && msg.length > 0) return msg.join(' ');
    if (typeof msg === 'string') return msg;
    return err?.message ?? null;
  }
}
