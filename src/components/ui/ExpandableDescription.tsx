import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableDescriptionProps {
  text: string;
  maxLength?: number;
}

export function ExpandableDescription({ text, maxLength = 200 }: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (text.length <= maxLength) {
    return <p className="text-gray-700 whitespace-pre-wrap">{text}</p>;
  }

  return (
    <div>
      <p className="text-gray-700 whitespace-pre-wrap">
        {isExpanded ? text : `${text.slice(0, maxLength)}...`}
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium text-sm"
      >
        {isExpanded ? (
          <>
            Show less <ChevronUp size={16} />
          </>
        ) : (
          <>
            Show more <ChevronDown size={16} />
          </>
        )}
      </button>
    </div>
  );
}
