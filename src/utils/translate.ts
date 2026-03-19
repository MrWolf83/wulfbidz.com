const TRANSLATION_CACHE = new Map<string, string>();

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (targetLanguage === 'en' || !text || text.trim() === '') {
    return text;
  }

  const cacheKey = `${text}_${targetLanguage}`;

  if (TRANSLATION_CACHE.has(cacheKey)) {
    return TRANSLATION_CACHE.get(cacheKey)!;
  }

  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`
    );

    if (!response.ok) {
      console.error('Translation API error:', response.statusText);
      return text;
    }

    const data = await response.json();

    if (data && data[0] && Array.isArray(data[0])) {
      const translatedText = data[0].map((item: any) => item[0]).join('');
      TRANSLATION_CACHE.set(cacheKey, translatedText);
      return translatedText;
    }

    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

export function clearTranslationCache() {
  TRANSLATION_CACHE.clear();
}
