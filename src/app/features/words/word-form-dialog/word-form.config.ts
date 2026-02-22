/**
 * Declarative config: for each form control, map validator error keys to messages.
 * Optional apiErrorPattern: when the global API error matches, show it on this field.
 */
interface FieldErrorConfig {
  /** Map of error key (from control.errors) to message shown to the user */
  messages: Record<string, string>;
  /** If the global API error matches this pattern, it is shown as this field's error */
  apiErrorPattern?: RegExp;
}

export const WORD_FORM_FIELD_CONFIG: Record<string, FieldErrorConfig> = {
  word: {
    messages: {
      required: 'Word is required',
    },
    apiErrorPattern: /word.*(required|empty)/i,
  },
  partOfSpeech: {
    messages: {
      partOfSpeech: 'Please select a valid part of speech',
    },
  },
};

/**
 * Returns the error message for a control: API error if it applies to this field, else first validation error from config.
 */
export function getFieldError(
  controlName: string,
  controlErrors: Record<string, unknown> | null,
  apiError: string | null,
  fieldConfig: Record<string, FieldErrorConfig>,
): string | null {
  const config = fieldConfig[controlName];
  if (!config) return null;

  if (apiError && config.apiErrorPattern?.test(apiError)) return apiError;
  if (!controlErrors) return null;

  const firstKey = Object.keys(controlErrors)[0];
  return firstKey ? (config.messages[firstKey] ?? null) : null;
}
