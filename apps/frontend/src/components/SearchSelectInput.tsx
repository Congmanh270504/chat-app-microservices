'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export type SearchSelectOption = {
  key: string;
  value: string;
  image_url?: string;
  label: string;
  description?: string | null;
  searchText?: string;
};

export type SearchSelectInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSelectOption?: (option: SearchSelectOption) => void;
  onBlur?: () => void;
  options: SearchSelectOption[];
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
};

function normalizeForSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function SearchSelectInput({
  value,
  onChange,
  onSelectOption,
  onBlur,
  options,
  placeholder = 'Tìm kiếm...',
  emptyText = 'Không tìm thấy',
  disabled = false,
}: SearchSelectInputProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const selectedOption = React.useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  const filteredOptions = React.useMemo(() => {
    const q = normalizeForSearch(search);
    if (!q) return options;
    return options.filter((o) => normalizeForSearch(o.searchText ?? o.label).includes(q));
  }, [options, search]);

  const handleClear = () => {
    onChange('');
    setSearch('');
    setOpen(false);
  };

  const handleSelect = (opt: SearchSelectOption) => {
    onChange(opt.value);
    onSelectOption?.(opt);
    setSearch('');
    setOpen(false);
  };

  return (
    <div className="relative">
      {selectedOption ? (
        <div className="flex h-9 items-center rounded-md border border-input bg-transparent px-3 text-sm shadow-xs">
          <span className="flex-1 truncate">{selectedOption.label}</span>
          <button
            type="button"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleClear}
            className="ml-1 text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex h-9 items-center rounded-md border border-input bg-transparent px-3 shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
          <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            disabled={disabled}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={placeholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              onBlur?.();
              setTimeout(() => setOpen(false), 150);
            }}
          />
        </div>
      )}

      {open && !selectedOption && !disabled && (
        <div
          className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-md"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="max-h-60 overflow-y-auto p-1" onWheel={(e) => e.stopPropagation()}>
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">{emptyText}</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(opt);
                  }}
                  className="w-full flex gap-2 cursor-pointer rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <Avatar>
                    {opt.image_url && <AvatarImage src={opt.image_url} alt={opt.label} />}
                    <AvatarFallback>{opt.label[0]}</AvatarFallback>
                  </Avatar>

                  <div>
                    <span className="block truncate font-medium">{opt.label}</span>
                    {opt.description && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {opt.description}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
