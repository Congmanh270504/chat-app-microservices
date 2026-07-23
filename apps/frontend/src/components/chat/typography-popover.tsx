"use client"

import * as React from "react"
import { Type } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function TypographyPopover() {
  return (
    <Popover>
      <PopoverTrigger render={
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted" title="Typography Settings" />
      }>
        <Type size={24} />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-[#1e1e1e] border-[#333] text-white" side="right" align="end">
        <div className="space-y-3">
          {/* Measure */}
          <div className="flex items-center justify-between p-2.5 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a] cursor-pointer hover:bg-[#333]">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium">Measure</span>
              <span className="text-sm font-semibold">80ch</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M21 12H3m14-5 4 5-4 5m-14-5L3 12l4-5" />
            </svg>
          </div>

          {/* Heading */}
          <div className="flex items-center justify-between p-2.5 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a] cursor-pointer hover:bg-[#333]">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium">Heading</span>
              <span className="text-sm font-semibold">Inter</span>
            </div>
            <span className="font-serif text-lg text-gray-400">Aa</span>
          </div>

          {/* Body */}
          <div className="flex items-center justify-between p-2.5 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a] cursor-pointer hover:bg-[#333]">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium">Body</span>
              <span className="text-sm font-semibold">Geist</span>
            </div>
            <span className="font-serif text-lg text-gray-400">Aa</span>
          </div>

          {/* Mono */}
          <div className="flex items-center justify-between p-2.5 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a] cursor-pointer hover:bg-[#333]">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium">Mono</span>
              <span className="text-sm font-semibold">Geist Mono</span>
            </div>
            <span className="font-mono text-lg text-gray-400">Aa</span>
          </div>

          {/* Size */}
          <div className="flex items-center justify-between p-2.5 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a] cursor-pointer hover:bg-[#333]">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium">Size</span>
              <span className="text-sm font-semibold">15px</span>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M4 7V4h16v3M9 20h6M12 4v16" />
            </svg>
          </div>

          {/* Leading */}
          <div className="flex items-center justify-between p-2.5 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a] cursor-pointer hover:bg-[#333]">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium">Leading</span>
              <span className="text-sm font-semibold">Regular (1.75)</span>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M21 12H3M21 6H3M21 18H3M12 3v18" />
            </svg>
          </div>

          {/* Flow */}
          <div className="flex items-center justify-between p-2.5 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a] cursor-pointer hover:bg-[#333]">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium">Flow</span>
              <span className="text-sm font-semibold">Regular (1.25em)</span>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4" />
            </svg>
          </div>

          {/* Shuffle Button */}
          <Button variant="outline" className="w-full bg-[#1e1e1e] border-[#3a3a3a] hover:bg-[#333] hover:text-white mt-4 font-semibold h-10 rounded-lg">
            Shuffle
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
