import {NAMES,type LifeAction,type LifeState} from './model';
export function HostInvitation({state,visitor,disabled,onAction,onMeet}:{state:LifeState;visitor:string;disabled:boolean;onAction:(action:LifeAction,target:string)=>void;onMeet:(id:string)=>void}){
 const invite=state.social.invites.find(i=>(i.from===visitor||i.to===visitor)&&i.expires>Date.now());
 if(!invite||disabled)return null;
 const outgoing=invite.from===visitor&&invite.kind!=='welcome',ready=invite.stage==='ready';
 const text=invite.kind==='welcome'?'Quer ajuda para conhecer o pessoal da casa?':ready?`${outgoing?invite.toName:invite.fromName} aceitou conhecer você. ${invite.topic}`:outgoing?`Esperando ${invite.toName} responder. Você pode continuar explorando.`:invite.kind==='ball'?`${invite.fromName} convidou você para jogar a bolinha da Layla. Quer pegar a próxima vez?`:`${invite.fromName} quer ${invite.kind==='activity'?'fazer algo junto':'conhecer alguém'}. Quer que eu apresente vocês?`;
 return <aside className="host-invitation" aria-label="Convite dos moradores"><strong>{ready?'Um encontro na casa':invite.kind==='ball'?'Sua vez de brincar?':`${NAMES[invite.host]} · ${invite.host==='teo'?'anfitrião':'anfitriã'} virtual`}</strong><p>{text}</p><div>
  {ready?<><button onClick={()=>onMeet(invite.id)}>Ir ao encontro</button><button onClick={()=>onAction('dismissHost',invite.id)}>Já nos encontramos</button></>:outgoing?<button onClick={()=>onAction('declineHost',invite.id)}>Cancelar convite</button>:<><button onClick={()=>onAction('acceptHost',invite.id)}>{invite.kind==='welcome'?'Sim, me apresente':invite.kind==='ball'?'Aceitar bolinha':'Quero participar'}</button><button onClick={()=>onAction('declineHost',invite.id)}>Agora não</button></>}
  {invite.kind==='welcome'&&<button onClick={()=>onAction('solo','dora')}>Quero explorar sozinho</button>}
 </div>{ready&&<small>Câmera e microfone continuam desligados. Vocês escolhem como conversar.</small>}</aside>;
}
