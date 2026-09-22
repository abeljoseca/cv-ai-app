'use client';

import { useState } from 'react';

interface EditableFieldProps {
  tag?: string;
  value: string;
  path: string;
  isEditMode: boolean;
  onFieldChange?: (path: string, value: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function EditableField({
  tag = 'span',
  value,
  path,
  isEditMode,
  onFieldChange,
  className,
  style = {},
}: EditableFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  const El = tag as any;

  if (!isEditMode) {
    return <El className={className} style={style}>{value}</El>;
  }

  const editStyle: React.CSSProperties = {
    ...style,
    cursor: 'text',
    borderRadius: 3,
    outline: focused
      ? '2px solid #4B6BFB'
      : hovered
      ? '1.5px dashed #4B6BFB'
      : '1.5px dashed transparent',
    background: focused || hovered ? 'rgba(75, 107, 251, 0.06)' : undefined,
    transition: 'outline 0.1s ease, background 0.1s ease',
  };

  return (
    <El
      contentEditable
      suppressContentEditableWarning
      className={className}
      style={editStyle}
      onFocus={() => setFocused(true)}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        setFocused(false);
        onFieldChange?.(path, e.currentTarget.textContent || '');
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {value}
    </El>
  );
}