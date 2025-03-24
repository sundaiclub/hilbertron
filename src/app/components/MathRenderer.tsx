'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  content: string;
}

// Regex patterns to identify inline and block LaTeX expressions
const INLINE_MATH_REGEX = /\\\\(\(|\[)(.*?)\\\\(\)|\])/g;
const BLOCK_MATH_REGEX = /\$\$(.*?)\$\$/g;
const BLOCK_MATH_BRACKETED_REGEX = /\\\\?\[(.*?)\\\\?\]/g;

const MathRenderer: React.FC<MathRendererProps> = ({ content }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Store the current value of the ref
    const currentContainer = containerRef.current;
    
    // Clean up the content - handle raw JSON string formatting
    // Replace escaped newlines with actual newlines
    let cleanContent = content.replace(/\\n/g, '\n');
    
    // Remove extra backslashes from LaTeX commands (JSON escaping)
    cleanContent = cleanContent.replace(/\\\\([^\\])/g, '\\$1');
    
    // Process sections that are in LaTeX block format
    cleanContent = cleanContent.replace(/\\\\?\[([\s\S]*?)\\\\?\]/g, (match, formula) => {
      return `\\[${formula.trim()}\\]`;
    });
    
    // Convert markdown headers (##, ###) to HTML 
    let processedContent = cleanContent.replace(/^##\s+(.*?)$/gm, '<h2>$1</h2>');
    processedContent = processedContent.replace(/^###\s+(.*?)$/gm, '<h3>$1</h3>');
    
    // Handle LaTeX subsection commands
    processedContent = processedContent.replace(/\\subsection\*\{(.*?)\}/g, '<h3>$1</h3>');
    processedContent = processedContent.replace(/\\section\*\{(.*?)\}/g, '<h2>$1</h2>');
    
    // Insert line breaks
    processedContent = processedContent.replace(/\n/g, '<br />');
    
    // Process LaTeX expressions
    // First, handle \\[ ... \\] and \\( ... \\) format
    processedContent = processedContent.replace(INLINE_MATH_REGEX, (match, openTag, formula, closeTag) => {
      try {
        const isDisplay = openTag === '[' && closeTag === ']';
        return katex.renderToString(formula, {
          displayMode: isDisplay,
          throwOnError: false
        });
      } catch (error) {
        console.error('KaTeX error:', error);
        return match; // Return original if there's an error
      }
    });
    
    // Then handle $$ ... $$ format if present
    processedContent = processedContent.replace(BLOCK_MATH_REGEX, (match, formula) => {
      try {
        return katex.renderToString(formula, {
          displayMode: true,
          throwOnError: false
        });
      } catch (error) {
        console.error('KaTeX error:', error);
        return match; // Return original if there's an error
      }
    });
    
    // Handle block LaTeX with brackets
    processedContent = processedContent.replace(BLOCK_MATH_BRACKETED_REGEX, (match, formula) => {
      try {
        return katex.renderToString(formula, {
          displayMode: true,
          throwOnError: false
        });
      } catch (error) {
        console.error('KaTeX error:', error);
        return match; // Return original if there's an error
      }
    });
    
    // Set the processed content
    currentContainer.innerHTML = processedContent;
    
    // Clean up function
    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [content]);
  
  return (
    <div className="math-content" ref={containerRef} />
  );
};

export default MathRenderer;
