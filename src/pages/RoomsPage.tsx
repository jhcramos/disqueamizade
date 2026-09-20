import { CommunityCatalog } from '@/components/rooms/CommunityCatalog'
import { AgeGate } from '@/components/common/AgeVerificationModal'
export const RoomsPage = () => (
  <AgeGate>
    <CommunityCatalog refresh={0} />
  </AgeGate>
)
