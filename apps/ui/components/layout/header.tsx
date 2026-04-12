'use client'

import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronsUpDown, ChevronDown, GitFork, Github, Settings } from 'lucide-react'

const RadixLockIcon = ({ className }: { className?: string }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M5 4.63601C5 3.76031 5.24219 3.1054 5.64323 2.67357C6.03934 2.24705 6.64582 1.9783 7.5014 1.9783C8.35745 1.9783 8.96306 2.24652 9.35823 2.67208C9.75838 3.10299 10 3.75708 10 4.63325V5.99999H5V4.63601ZM4 5.99999V4.63601C4 3.58148 4.29339 2.65754 4.91049 1.99307C5.53252 1.32329 6.42675 0.978302 7.5014 0.978302C8.57583 0.978302 9.46952 1.32233 10.091 1.99162C10.7076 2.65557 11 3.57896 11 4.63325V5.99999H12C12.5523 5.99999 13 6.44771 13 6.99999V13C13 13.5523 12.5523 14 12 14H3C2.44772 14 2 13.5523 2 13V6.99999C2 6.44771 2.44772 5.99999 3 5.99999H4ZM3 6.99999H12V13H3V6.99999Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
)

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  return (
    <header
      className={`flex h-12 items-center justify-between gap-x-0 border-b border-[#1a1a1a] bg-surface-header px-4 text-left text-sm font-thin leading-7 tracking-tighter ${className || ''}`}
    >
      <div className="flex items-center gap-1.5 text-text-secondary">
        <Button variant="ghost" size="sm" className="flex items-center gap-1 px-2 hover:bg-[#252525]">
          <Avatar className="h-4 w-4">
            <AvatarImage src="https://github.com/emmanuel-martinez-dev.png" alt="User avatar" />
          </Avatar>
          <span className="text-slate-50">AG3NT</span>
          <ChevronsUpDown className="h-4 w-4" />
        </Button>
        <span className="text-text-muted opacity-65">/</span>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 hover:underline hover:underline-offset-2 hover:text-slate-100 hover:decoration-white hover:!bg-transparent transition-colors duration-200"
        >
          PAI Control Plane
          <ChevronsUpDown className="h-4 w-4" />
        </Button>
        <span className="text-text-muted opacity-65">/</span>
        <Button variant="ghost" size="sm" className="flex items-center gap-1 hover:underline hover:!bg-transparent">
          <span className="text-white">Local-first runtime</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="ml-0.5 flex items-center gap-0.5 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-1 py-0.5 text-xs text-white hover:!bg-[#252525]"
        >
          <RadixLockIcon className="h-3 w-3" />
          Protected
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 border border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#252525]"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 border border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#252525]"
        >
          <GitFork className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 border border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#252525]"
        >
          <Github className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 border border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#252525]">
          Docs
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" className="h-8 bg-white text-black hover:bg-gray-200">
              Open
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Open dashboard</DropdownMenuItem>
            <DropdownMenuItem>Export system map</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="sm" className="flex items-center gap-1 px-2 hover:bg-[#252525]">
          <Avatar className="h-4 w-4">
            <AvatarImage src="https://github.com/emmanuel-martinez-dev.png" alt="User avatar" />
          </Avatar>
        </Button>
      </div>
    </header>
  )
}
