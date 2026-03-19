import { useEffect, useState } from 'react';
import { translateText } from '../utils/translate';

interface TranslatedCommentProps {
  content: string;
  targetLanguage: string;
}

export function TranslatedComment({ content, targetLanguage }: TranslatedCommentProps) {
  const [translatedContent, setTranslatedContent] = useState(content);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (targetLanguage !== 'en' && content) {
      setIsTranslating(true);
      translateText(content, targetLanguage).then((translated) => {
        setTranslatedContent(translated);
        setIsTranslating(false);
      });
    } else {
      setTranslatedContent(content);
    }
  }, [content, targetLanguage]);

  return (
    <>
      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
        {isTranslating ? content : translatedContent}
      </p>
      {isTranslating && <span className="text-xs text-gray-400 mt-1 block">(Translating...)</span>}
    </>
  );
}
