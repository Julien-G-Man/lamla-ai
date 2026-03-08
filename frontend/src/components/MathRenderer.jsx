import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

const SUPERSCRIPT_MAP = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
  'n': 'ⁿ',
  'i': 'ⁱ',
};

const SUBSCRIPT_MAP = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
  '+': '₊',
  '-': '₋',
  '=': '₌',
  '(': '₍',
  ')': '₎',
  'a': 'ₐ',
  'e': 'ₑ',
  'i': 'ᵢ',
  'o': 'ₒ',
  'r': 'ᵣ',
  'u': 'ᵤ',
  'v': 'ᵥ',
  'x': 'ₓ',
  'h': 'ₕ',
  'k': 'ₖ',
  'l': 'ₗ',
  'm': 'ₘ',
  'n': 'ₙ',
  'p': 'ₚ',
  's': 'ₛ',
  't': 'ₜ',
};

const toMappedScript = (value, map) => {
  let out = '';
  for (const ch of String(value || '')) {
    const mapped = map[ch];
    if (!mapped) {
      return null;
    }
    out += mapped;
  }
  return out;
};

const prettifyPlainMathText = (input) => {
  let out = String(input || '');

  // Convert common LaTeX fractions when not wrapped in delimiters.
  out = out.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');

  // Convert x^{...} into superscript characters when possible.
  out = out.replace(/([A-Za-z0-9)\]])\^\{([^{}]+)\}/g, (match, base, exp) => {
    const script = toMappedScript(exp, SUPERSCRIPT_MAP);
    return script ? `${base}${script}` : `${base}^(${exp})`;
  });

  // Convert x^2 style exponents.
  out = out.replace(/([A-Za-z0-9)\]])\^([A-Za-z0-9+\-()=]+)/g, (match, base, exp) => {
    const script = toMappedScript(exp, SUPERSCRIPT_MAP);
    return script ? `${base}${script}` : `${base}^(${exp})`;
  });

  // Convert x_{...} and x_1 into subscripts when possible.
  out = out.replace(/([A-Za-z0-9)\]])_\{([^{}]+)\}/g, (match, base, sub) => {
    const script = toMappedScript(sub, SUBSCRIPT_MAP);
    return script ? `${base}${script}` : `${base}_(${sub})`;
  });

  out = out.replace(/([A-Za-z0-9)\]])_([A-Za-z0-9+\-()=]+)/g, (match, base, sub) => {
    const script = toMappedScript(sub, SUBSCRIPT_MAP);
    return script ? `${base}${script}` : `${base}_(${sub})`;
  });

  return out;
};

/**
 * MathRenderer Component
 * 
 * Renders text with LaTeX mathematical equations. Supports both inline and block math.
 * 
 * LaTeX patterns detected:
 * - Inline: $...$, \(...\)
 * - Block: $$...$$, \[...\]
 * 
 * @param {string} text - Text containing LaTeX equations
 * @param {string} className - Optional CSS class name
 */
const MathRenderer = ({ text, className = '' }) => {
  if (!text) return null;

  // Convert string to string if it's not already
  const content = String(text);

  // Split content by LaTeX delimiters while preserving the delimiters
  const parts = [];
  let lastIndex = 0;
  
  // Regex to match LaTeX patterns:
  // Block math: $$...$$, \[...\]
  // Inline math: $...$, \(...\)
  const mathRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$\n]+?\$|\\\([^)]+?\\\))/g;
  
  let match;
  while ((match = mathRegex.exec(content)) !== null) {
    // Add text before the math
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex, match.index)
      });
    }
    
    // Determine if block or inline math
    const mathContent = match[0];
    let isBlock = false;
    let latex = mathContent;
    
    if (mathContent.startsWith('$$') && mathContent.endsWith('$$')) {
      isBlock = true;
      latex = mathContent.slice(2, -2).trim();
    } else if (mathContent.startsWith('\\[') && mathContent.endsWith('\\]')) {
      isBlock = true;
      latex = mathContent.slice(2, -2).trim();
    } else if (mathContent.startsWith('$') && mathContent.endsWith('$')) {
      latex = mathContent.slice(1, -1).trim();
    } else if (mathContent.startsWith('\\(') && mathContent.endsWith('\\)')) {
      latex = mathContent.slice(2, -2).trim();
    }
    
    parts.push({
      type: isBlock ? 'block-math' : 'inline-math',
      content: latex
    });
    
    lastIndex = match.index + mathContent.length;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.substring(lastIndex)
    });
  }
  
  // If no delimiter-based LaTeX found, still prettify plain exponent/subscript notation.
  if (parts.length === 0) {
    return <span className={className}>{prettifyPlainMathText(content)}</span>;
  }
  
  // Render parts
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{prettifyPlainMathText(part.content)}</span>;
        } else if (part.type === 'inline-math') {
          try {
            return <InlineMath key={index} math={part.content} />;
          } catch (error) {
            console.warn('Failed to render inline math:', part.content, error);
            return <span key={index}>{`$${part.content}$`}</span>;
          }
        } else if (part.type === 'block-math') {
          try {
            return <BlockMath key={index} math={part.content} />;
          } catch (error) {
            console.warn('Failed to render block math:', part.content, error);
            return <div key={index}>{`$$${part.content}$$`}</div>;
          }
        }
        return null;
      })}
    </span>
  );
};

export default MathRenderer;
