// ═══════════════════════════════════════════════════════════════════════════
// MaskSelector Component — UI for Choosing Video Filters
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { X, Lock, Crown, Star } from 'lucide-react'
import type { MaskConfig } from '../../types/filters'
import { AVAILABLE_MASKS } from '../../types/filters'

interface MaskSelectorProps {
  onSelect: (mask: MaskConfig) => void
  currentFilter: string | null
  onClose: () => void
  userTier?: 'free' | 'basic' | 'premium'
}

const TIER_COLORS = {
  free: 'border-gray-500 bg-gray-100',
  basic: 'border-blue-500 bg-blue-100',
  premium: 'border-purple-500 bg-purple-100'
}

const TIER_ICONS = {
  free: null,
  basic: Star,
  premium: Crown
}

export const MaskSelector: React.FC<MaskSelectorProps> = ({
  onSelect,
  currentFilter,
  onClose,
  userTier = 'free' // Default to free tier for demo
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Get unique categories
  const categories = ['all', ...new Set(AVAILABLE_MASKS.map(mask => mask.category))]

  // Filter masks by category
  const filteredMasks = selectedCategory === 'all' 
    ? AVAILABLE_MASKS 
    : AVAILABLE_MASKS.filter(mask => mask.category === selectedCategory)

  // Check if user can access a mask
  const canAccessMask = (mask: MaskConfig): boolean => {
    const tierOrder = { free: 0, basic: 1, premium: 2 }
    return tierOrder[userTier] >= tierOrder[mask.requiredTier]
  }

  const handleMaskClick = (mask: MaskConfig) => {
    if (!canAccessMask(mask)) {
      // Could show upgrade modal here
      return
    }
    onSelect(mask)
  }

  return (
    <div className="w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div>
          <h3 className="font-bold text-lg">AI Face Filters</h3>
          <p className="text-sm opacity-90">Choose your digital mask</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 p-3 bg-gray-50 border-b">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`
              px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 capitalize
              ${selectedCategory === category
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100'
              }
            `}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Masks Grid */}
      <div className="p-4 max-h-80 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {filteredMasks.map(mask => {
            const isSelected = currentFilter === mask.id
            const canAccess = canAccessMask(mask)
            const TierIcon = TIER_ICONS[mask.requiredTier]

            return (
              <button
                key={mask.id}
                onClick={() => handleMaskClick(mask)}
                disabled={!canAccess}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                  ${isSelected 
                    ? 'border-purple-500 bg-purple-50 shadow-lg scale-105' 
                    : canAccess
                      ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                  }
                `}
              >
                {/* Lock Icon for Restricted Masks */}
                {!canAccess && (
                  <div className="absolute top-2 right-2 p-1 bg-gray-400 rounded-full">
                    <Lock size={12} className="text-white" />
                  </div>
                )}

                {/* Tier Icon */}
                {TierIcon && canAccess && (
                  <div className={`absolute top-2 right-2 p-1 rounded-full ${TIER_COLORS[mask.requiredTier]}`}>
                    <TierIcon size={12} className={`text-${mask.requiredTier === 'premium' ? 'purple' : 'blue'}-600`} />
                  </div>
                )}

                {/* Mask Preview */}
                <div className="text-center mb-2">
                  <div className="text-3xl mb-1">{mask.emoji}</div>
                  {mask.thumbnail && (
                    <div className="w-12 h-12 mx-auto bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500">
                      Preview
                    </div>
                  )}
                </div>

                {/* Mask Info */}
                <div className="text-center">
                  <h4 className="font-medium text-gray-900 text-sm mb-1">
                    {mask.name}
                  </h4>
                  <p className="text-xs text-gray-600 leading-tight">
                    {mask.description}
                  </p>
                </div>

                {/* Required Tier Badge */}
                {mask.requiredTier !== 'free' && (
                  <div className={`
                    absolute bottom-2 left-2 px-2 py-0.5 rounded text-xs font-medium
                    ${mask.requiredTier === 'premium' 
                      ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }
                  `}>
                    {mask.requiredTier}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Upgrade Prompt for Locked Features */}
      {filteredMasks.some(mask => !canAccessMask(mask)) && (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-t">
          <div className="text-center">
            <Crown className="mx-auto text-purple-500 mb-2" size={24} />
            <p className="text-sm text-gray-700 mb-2">
              Unlock premium filters with{' '}
              <span className="font-bold text-purple-600">Disque Premium</span>
            </p>
            <button className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* Usage Tips */}
      <div className="p-3 bg-gray-50 text-xs text-gray-600 border-t">
        💡 <strong>Tip:</strong> Filters work best with good lighting and clear face visibility
      </div>
    </div>
  )
}

export default MaskSelector