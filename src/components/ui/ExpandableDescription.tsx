import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableDescriptionProps {
  text: string;
  maxLength?: number;
}

export function ExpandableDescription({ text, maxLength = 300 }: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (text.length <= maxLength) {
    return <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{text}</p>;
  }

  return (
    <div>
      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
        {isExpanded ? text : `${text.slice(0, maxLength)}...`}
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
