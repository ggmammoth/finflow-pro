import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

/**
 * Returns a function that translates a category's DB name into the
 * current locale, falling back to the raw name for user-created categories.
 * Emoji icon is prepended when provided.
 */
export function useCategoryName() {
  const { t, i18n } = useTranslation();

  const categoryLabel = useCallback(
    (name: string | undefined | null, icon?: string | null): string => {
      if (!name) return '';
      const key = `categories.${name}`;
      const translated = i18n.exists(key) ? t(key) : name;
      return icon ? `${icon} ${translated}` : translated;
    },
    [t, i18n],
  );

  return categoryLabel;
}
