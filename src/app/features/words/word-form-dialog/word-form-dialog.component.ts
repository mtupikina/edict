import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, startWith, switchMap } from 'rxjs';

import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardSelectImports } from '@/shared/components/select/select.imports';

import { PART_OF_SPEECH_LABELS, PART_OF_SPEECH_SELECT_ORDER, Word } from '../models/word.model';
import { WordsService } from '../services/words.service';
import {
  getFieldError,
  WORD_FORM_FIELD_CONFIG,
} from './word-form.config';
import {
  aiEnrichedDataToFormValue,
  DEFAULT_FORM_VALUE,
  formValueToPayload,
  wordFormValuesEqual,
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
  private readonly platformId = inject(PLATFORM_ID);

  private static readonly HISTORY_STATE_KEY = 'wordFormDialog';

  /** Snapshot used to detect unsaved edits (add or edit). */
  private baselineFormValue: WordFormValue = { ...DEFAULT_FORM_VALUE };
  private historyGuardActive = false;
  private suppressPopstate = false;

  word = input<Word | null>(null);
  saved = output<Word>();
  dialogCancel = output<void>();

  private readonly wordInputRef = viewChild('wordInputRef', { read: ElementRef<HTMLInputElement> });

  protected readonly partOfSpeechSelectItems = PART_OF_SPEECH_SELECT_ORDER.map(value => ({
    value,
    label: PART_OF_SPEECH_LABELS[value],
  }));
  protected showAddForm = signal(false);
  protected submitting = signal(false);
  /** True while `POST /words/enrich` is in flight. */
  protected enrichingAi = signal(false);
  /** True when the word field has any non-whitespace text (show AI assist control). */
  protected wordEnteredForAi = signal(false);
  protected error = signal<string | null>(null);
  /** Up to 7 existing words matching the word input (for duplicate hint). Empty when no search or no matches. */
  protected searchHints = signal<Word[]>([]);
  /** Inline prompt when closing with unsaved edits (same modal, no stacked dialog). */
  protected showDiscardConfirm = signal(false);
  private pendingCloseOnConfirm: (() => void) | null = null;
  private pendingCloseOnCancel: (() => void) | null = null;
  /** True after the user has focused the word input; prevents search from firing on dialog open (e.g. edit mode patch). */
  private wordInputTouched = signal(false);
  private clearHintsTimeoutId: ReturnType<typeof setTimeout> | null = null;

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
    this.destroyRef.onDestroy(() => {
      if (this.clearHintsTimeoutId != null) clearTimeout(this.clearHintsTimeoutId);
      if (this.historyGuardActive) this.disableHistoryGuard();
    });
    let lastSyncedId: string | null = null;
    effect(() => {
      const w = this.word();
      const currentId = w?._id ?? null;
      if (currentId !== lastSyncedId) {
        lastSyncedId = currentId;
        this.wordInputTouched.set(false);
        if (w) {
          this.form.patchValue(wordToFormValue(w));
          this.setBaselineFromCurrentForm();
        }
      }
    });

    effect(() => {
      const open = this.isDialogOpen();
      untracked(() => {
        if (open) {
          this.enableHistoryGuard();
        } else if (this.historyGuardActive) {
          this.disableHistoryGuard();
        }
      });
    });

    this.form
      .get('word')
      ?.valueChanges.pipe(
        startWith(this.form.get('word')?.value ?? ''),
        map((v) => !!(typeof v === 'string' && v.trim())),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((hasText) => this.wordEnteredForAi.set(hasText));

    this.form
      .get('word')
      ?.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term: string) => {
          if (!this.wordInputTouched()) return of([]);
          const t = term?.trim();
          if (!t || t.length < 2) return of([]);
          return this.wordsService
            .getPage(7, undefined, 'word', 'asc', t)
            .pipe(
              map((page) => page.items),
              catchError(() => of([])),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((items) => {
        const current = this.word();
        const filtered = current
          ? items.filter((w) => w._id !== current._id)
          : items;
        this.searchHints.set(filtered);
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
    this.clearDiscardConfirmState();
    this.form.reset(DEFAULT_FORM_VALUE);
    this.setBaselineFromCurrentForm();
    this.error.set(null);
    this.searchHints.set([]);
    this.wordInputTouched.set(false);
    this.showAddForm.set(true);
  }

  protected onWordInputFocus(): void {
    this.wordInputTouched.set(true);
    if (this.clearHintsTimeoutId != null) {
      clearTimeout(this.clearHintsTimeoutId);
      this.clearHintsTimeoutId = null;
    }
  }

  protected onWordInputBlur(): void {
    this.clearHintsTimeoutId = setTimeout(() => {
      this.clearHintsTimeoutId = null;
      this.clearSearchHints();
    }, 150);
  }

  protected onWordInputEscape(event: Event): void {
    if (this.searchHints().length > 0) {
      this.clearSearchHints();
      event.preventDefault();
      event.stopPropagation();
    }
  }

  protected clearSearchHints(): void {
    this.searchHints.set([]);
  }

  protected onEnrichClick(event?: Event): void {
    event?.stopPropagation();
    const raw = this.form.get('word')?.value ?? '';
    const term = typeof raw === 'string' ? raw.trim() : '';
    if (!term || this.enrichingAi() || this.submitting()) return;

    this.enrichingAi.set(true);
    this.error.set(null);
    this.wordsService
      .enrich(term)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.form.patchValue(aiEnrichedDataToFormValue(res.data));
          this.enrichingAi.set(false);
        },
        error: (err) => {
          this.error.set(this.getApiErrorMessage(err) ?? 'AI enrichment failed');
          this.enrichingAi.set(false);
        },
      });
  }

  protected requestClose(): void {
    this.attemptClose(() => this.performClose());
  }

  protected onBackdropClick(): void {
    if (this.showDiscardConfirm()) {
      this.dismissDiscardConfirm();
      return;
    }
    this.requestClose();
  }

  protected onDialogEscape(event: Event): void {
    if (this.showDiscardConfirm()) {
      this.dismissDiscardConfirm();
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.requestClose();
  }

  protected confirmDiscard(): void {
    const onConfirm = this.pendingCloseOnConfirm;
    this.clearDiscardConfirmState();
    onConfirm?.();
  }

  protected dismissDiscardConfirm(): void {
    this.pendingCloseOnCancel?.();
    this.clearDiscardConfirmState();
  }

  private clearDiscardConfirmState(): void {
    this.pendingCloseOnCancel = null;
    this.pendingCloseOnConfirm = null;
    this.showDiscardConfirm.set(false);
  }

  protected close(): void {
    this.requestClose();
  }

  @HostListener('window:popstate')
  protected onPopState(): void {
    if (this.suppressPopstate) {
      this.suppressPopstate = false;
      return;
    }
    if (!this.historyGuardActive || !this.isDialogOpen()) {
      return;
    }
    this.historyGuardActive = false;
    this.attemptClose(
      () => this.performClose(),
      () => this.enableHistoryGuard(),
    );
  }

  private isDialogOpen(): boolean {
    return !!(this.word() || this.showAddForm());
  }

  private hasUnsavedChanges(): boolean {
    return !wordFormValuesEqual(this.form.getRawValue(), this.baselineFormValue);
  }

  private setBaselineFromCurrentForm(): void {
    this.baselineFormValue = { ...this.form.getRawValue() };
  }

  private attemptClose(onConfirm: () => void, onCancel?: () => void): void {
    if (!this.hasUnsavedChanges()) {
      onConfirm();
      return;
    }
    if (this.showDiscardConfirm()) {
      return;
    }
    this.pendingCloseOnConfirm = onConfirm;
    this.pendingCloseOnCancel = onCancel ?? null;
    this.showDiscardConfirm.set(true);
  }

  private performClose(): void {
    this.clearDiscardConfirmState();
    this.showAddForm.set(false);
    this.dialogCancel.emit();
  }

  private enableHistoryGuard(): void {
    if (!isPlatformBrowser(this.platformId) || this.historyGuardActive) {
      return;
    }
    history.pushState({ [WordFormDialogComponent.HISTORY_STATE_KEY]: true }, '');
    this.historyGuardActive = true;
  }

  private disableHistoryGuard(): void {
    if (!isPlatformBrowser(this.platformId) || !this.historyGuardActive) {
      return;
    }
    this.suppressPopstate = true;
    this.historyGuardActive = false;
    history.back();
  }

  /** Done button in add mode: save current word if form is valid, then close. If invalid, show validation and do not close. */
  protected onDoneClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.form.valid) {
      const payload = formValueToPayload(this.form.getRawValue());
      this.executeSave(this.wordsService.create(payload), {
        closeAddForm: true,
        resetFormAfterSave: false,
      });
    } else {
      this.form.markAllAsTouched();
      this.focusWordInput();
    }
  }

  /** Reset form and state so the user can add another word (after a successful create). */
  private resetFormForAddAnother(): void {
    this.form.reset(DEFAULT_FORM_VALUE);
    this.setBaselineFromCurrentForm();
    this.error.set(null);
    this.searchHints.set([]);
    this.focusWordInput();
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
      this.executeSave(this.wordsService.update(w._id, payload), {
        closeAddForm: true,
      });
    } else {
      this.executeSave(this.wordsService.create(payload), {
        closeAddForm: false,
        resetFormAfterSave: true,
      });
    }
  }

  private executeSave(
    request$: Observable<Word>,
    options: { closeAddForm?: boolean; resetFormAfterSave?: boolean },
  ): void {
    this.submitting.set(true);
    this.error.set(null);
    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.saved.emit(result);
          if (options.closeAddForm) this.showAddForm.set(false);
          if (options.resetFormAfterSave) this.resetFormForAddAnother();
          this.submitting.set(false);
        },
        error: (err) => {
          this.error.set(this.getApiErrorMessage(err) ?? 'Request failed');
          this.submitting.set(false);
        },
      });
  }

  protected focusWordInput(): void {
    setTimeout(() => this.wordInputRef()?.nativeElement?.focus(), 0);
  }

  private getApiErrorMessage(err: {
    error?: {
      message?: string | string[];
      error?: { message?: string };
    };
    message?: string;
  }): string | null {
    const nested = err?.error?.error?.message;
    if (typeof nested === 'string' && nested.length > 0) return nested;
    const msg = err?.error?.message;
    if (Array.isArray(msg) && msg.length > 0) return msg.join(' ');
    if (typeof msg === 'string') return msg;
    return err?.message ?? null;
  }
}
