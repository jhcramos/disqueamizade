import type { ReactNode } from 'react';
import Garage3DPage from './Garage3DPage';
import type { LiveHouseSession } from './liveHouse';

type Props=Omit<LiveHouseSession,'preferences'|'chatBubbles'>&{
  preferences?:LiveHouseSession['preferences'];
  chatBubbles?:LiveHouseSession['chatBubbles'];
  playControls:ReactNode;
};
/** Keep the existing account, chat and call owners while replacing their spatial view. */
export function GarageScene({playControls,...session}:Props){
  return <><Garage3DPage session={{...session,preferences:session.preferences??{},chatBubbles:session.chatBubbles??{}}}/>{playControls}</>;
}
