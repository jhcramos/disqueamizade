type LobbyRoom = { _slug?: string; online_count?: number }

/** Keep the general lobby focused, with one explicitly separate adult option. */
export function lobbyRooms<T extends LobbyRoom>(rooms: T[]): T[] {
  const general = rooms.find(room => room._slug === 'geral-brasil')
    || [...rooms].filter(room => !room._slug?.startsWith('adult-'))
      .sort((a, b) => (b.online_count || 0) - (a.online_count || 0))[0]
  const adult = rooms.find(room => room._slug === 'adult-lounge')
  return [general, adult].filter((room): room is T => !!room)
}
