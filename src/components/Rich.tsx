import type { Rich as RichText } from '../data/types';

type Tag = 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'blockquote';

interface Props {
  text: RichText;
  as?: Tag;
  className?: string;
}

/** Títulos que mezclan Poppins con la manuscrita, como en el diseño. */
export function Rich({ text, as: Tag = 'h2', className }: Props) {
  return (
    <Tag className={className}>
      {text.map(([part, script], i) => (script ? <span key={i} className="script">{part}</span> : <span key={i}>{part}</span>))}
    </Tag>
  );
}

/** Versión en texto plano, para atributos como alt o title. */
export const plain = (text: RichText) => text.map(([part]) => part).join('');
