import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import QuoteGuesser from './quote'
import EPTSGame from './eptsdle'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function CombinedGame() {
  const [isEPTSGame, setIsEPTSGame] = useState(false)

  return (
    <div className='min-h-screen bg-gradient-to-r from-black flex flex-col items-center'>
      <nav className='w-full bg-black px-5 py-4 flex justify-between items-center'>
        <h1 className='text-[#E0E0E0] text-2xl font-bold'>
          {isEPTSGame ? 'EPTSdle' : 'QuoteGuesser'}
        </h1>
        <div className='flex items-center space-x-2'>
          <span className='text-[#E0E0E0]'>QuoteGuesser</span>
          <Switch checked={isEPTSGame} onCheckedChange={setIsEPTSGame} />
          <span className='text-[#E0E0E0]'>EPTSdle</span>
        </div>
      </nav>

      <div className='w-full max-w-4xl px-4 py-6'>
        <div>{isEPTSGame ? <EPTSGame /> : <QuoteGuesser />}</div>
      </div>
    </div>
  )
}
