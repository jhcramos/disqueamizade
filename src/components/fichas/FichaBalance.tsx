import { Coins, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

interface FichaBalanceProps {
  balance?: number
  showBuy?: boolean
}

export const FichaBalance = ({ balance = 150, showBuy = true }: FichaBalanceProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/10 border border-accent/20">
        <Coins className="w-5 h-5 text-accent" />
        <span className="text-accent font-bold">{balance}</span>
        <span className="text-xs text-gray-500">fichas</span>
      </div>
      {showBuy && (
        <Link
          to="/pricing"
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-accent/20 border border-accent/30 text-accent hover:bg-accent/30 transition-all text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Comprar
        </Link>
      )}
    </div>
  )
}
