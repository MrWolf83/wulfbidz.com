import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { translateText } from '../../utils/translate';

interface ExpandableDescriptionProps {
  text: string;
  maxLength?: number;
  targetLanguage?: string;
}

export function ExpandableDescription({ text, maxLength = 300, targetLanguage = 'en' }: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [translatedText, setTranslatedText] = useState(text);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (targetLanguage !== 'en' && text) {
      setIsTranslating(true);
      translateText(text, targetLanguage).then((translated) => {
        setTranslatedText(translated);
        setIsTranslating(false);
      });
    } else {
      setTranslatedText(text);
    }
  }, [text, targetLanguage]);

  const displayText = isTranslating ? text : translatedText;

  if (displayText.length <= maxLength) {
    return (
      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
        {displayText}
        {isTranslating && <span className="text-gray-400 ml-2 text-sm">(Translating...)</span>}
      </p>
    );
  }

  return (
    <div>
      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
        {isExpanded ? displayText : `${displayText.slice(0, maxLength)}...`}
        {isTranslating && <span className="text-gray-400 ml-2 text-sm">(Translating...)</span>}
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-3 flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold text-sm transition-colors"
      >
        {isExpanded ? (
          <>
            Show less <ChevronUp size={16} />
          </>
        ) : (
          <>
            Read full description <ChevronDown size={16} />
          </>
        )}
      </button>
    </div>
  );
}
