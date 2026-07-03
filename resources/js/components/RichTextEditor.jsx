import { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';

const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 'ul', 'li', 'br', 'div', 'p'];

function sanitize(html) {
    return DOMPurify.sanitize(html ?? '', { ALLOWED_TAGS, ALLOWED_ATTR: [] });
}

function ToolbarButton({ onClick, title, children }) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={e => e.preventDefault()}
            onClick={onClick}
            className="flex size-7 items-center justify-center rounded-md text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm transition-colors">
            {children}
        </button>
    );
}

/* ── Éditeur de texte enrichi minimal (gras, italique, souligné, liste à tirets) ── */
export default function RichTextEditor({ value, onChange, placeholder }) {
    const ref = useRef(null);
    const focused = useRef(false);

    useEffect(() => {
        if (!ref.current || focused.current) return;
        const html = sanitize(value);
        if (ref.current.innerHTML !== html) {
            ref.current.innerHTML = html;
        }
    }, [value]);

    const emitChange = () => {
        if (!ref.current) return;
        const clean = sanitize(ref.current.innerHTML);
        const isEmpty = ref.current.textContent.trim() === '';
        if (isEmpty && ref.current.innerHTML !== '') {
            ref.current.innerHTML = '';
        }
        onChange(isEmpty ? '' : clean);
    };

    const exec = (command) => {
        ref.current?.focus();
        document.execCommand(command, false, undefined);
        emitChange();
    };

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-0.5 border-b border-black/10 bg-black/5 px-1.5 py-1">
                <ToolbarButton title="Gras" onClick={() => exec('bold')}>
                    <span className="text-xs font-black">B</span>
                </ToolbarButton>
                <ToolbarButton title="Italique" onClick={() => exec('italic')}>
                    <span className="text-xs italic">I</span>
                </ToolbarButton>
                <ToolbarButton title="Souligné" onClick={() => exec('underline')}>
                    <span className="text-xs underline">U</span>
                </ToolbarButton>
                <span className="mx-1 h-4 w-px bg-black/10" />
                <ToolbarButton title="Liste à tirets" onClick={() => exec('insertUnorderedList')}>
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                    </svg>
                </ToolbarButton>
            </div>
            <div
                ref={ref}
                contentEditable
                suppressContentEditableWarning
                data-placeholder={placeholder}
                onFocus={() => { focused.current = true; }}
                onBlur={() => { focused.current = false; emitChange(); }}
                onInput={emitChange}
                className="rte-content min-h-[132px] flex-1 overflow-y-auto bg-transparent p-3 text-sm text-gray-800 focus:outline-none"
            />
        </div>
    );
}
