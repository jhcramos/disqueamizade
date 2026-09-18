import type { ReactNode } from 'react';
import type { Person, Point, RoomId } from '../garage/model';
import type { SocialPreference } from '../garage/useSocialChat';
import type { PlayAction, PlayState } from '../garage/play';
export type LiveHouseSession={
  self:Person;people:Person[];destination:Point;revision:number;frozen:boolean;low:boolean;
  preferences:Record<string,SocialPreference>;chatBubbles:Record<string,string>;bubble?:ReactNode;bubbleOwner?:string;
  ringingPhones:string[];play:PlayState;
  onMove:(point:Point)=>void;onRoom:(room:RoomId,point?:Point)=>boolean;onSeat:(id?:string)=>void;
  onSelect:(id:string)=>void;onPhone:(id:string)=>void;onPlay:(action:PlayAction)=>boolean;
};
