type LobbyRoom = { slug?: string; _slug?: string; online_count?: number }

const roomSlug = (room: LobbyRoom) => room._slug || room.slug

/** Keep the general lobby focused, with one explicitly separate adult option. */
export function lobbyRooms<T extends LobbyRoom>(rooms: T[]): T[] {
  const general = rooms.find(room => roomSlug(room) === 'geral-brasil')
    || [...rooms].filter(room => !roomSlug(room)?.startsWith('adult-'))
      .sort((a, b) => (b.online_count || 0) - (a.online_count || 0))[0]
  const adult = rooms.find(room => roomSlug(room) === 'adult-lounge')
  return [general, adult].filter((room): room is T => !!room)
}
