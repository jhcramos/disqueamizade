/** Carry a free-look offset through vehicle turns, including the +/-pi boundary. */
export function followVehicleTurn(viewYaw:number,previous:number|null,current:number){
 return previous===null?viewYaw:viewYaw+Math.atan2(Math.sin(current-previous),Math.cos(current-previous));
}
