import { useEffect, useRef, useState } from 'react';
import { Armchair, CameraOff, MessageCircle, Users } from 'lucide-react';
import { CONVERSATION_SPOTS, type ConversationSpot, type Gathering } from './gatherings';
import type { Person, RoomId } from './model';
import type { Knock, GroupView } from './useLocalGroup';

type Props = {
  room: RoomId; self: Person; people: Person[]; gathering?: Gathering;
  knocks: Knock[]; group: GroupView | null; pending: boolean; unavailable: boolean;
  onOpen: (spot: ConversationSpot) => void; onChange: (value?: Gathering) => void;
  onKnock: (person: Person) => void; onAnswer: (id: string, accept: boolean) => void;
  isBlocked: (id: string) => boolean; canVideo: boolean;
  onShare: (text: string) => boolean;
};
export function GatheringPanel(props: Props) {
  const { room, self, people, gathering, group, pending, unavailable } = props;
  const [question, setQuestion] = useState('');
  const [notice, setNotice] = useState('');
  const details = useRef<HTMLDetailsElement>(null);
  const visibleKnocks = props.knocks.filter(k => !props.isBlocked(k.from));
  useEffect(() => { if (visibleKnocks.length && details.current) details.current.open = true; }, [visibleKnocks.length]);
  useEffect(() => { setQuestion(''); setNotice(''); }, [room]);
  const mine = gathering && (!group || group.host === self.id);
  const others = people.filter(p => p.gathering && !props.isBlocked(p.id));
  const frozen = unavailable || pending || (!!group && group.host !== self.id);
  return <section className="gathering-panel" aria-label="Rodas de conversa">
    <details open ref={details}>
      <summary><Users size={18} /> Encontre sua roda <small>{visibleKnocks.length ? `${visibleKnocks.length} pedido(s)` : 'Até 4 pessoas'}</small></summary>
      <p className="gathering-welcome">{room === 'garage' ? 'Chegue perto do som ou puxe uma cadeira. Um oi já é um começo.' : room === 'living' ? 'O sofá é um bom lugar para uma conversa sem pressa.' : 'Escolha uma mesa e veja quem está aberto a companhia.'}</p>
      {unavailable && <p>As rodas compartilhadas ainda estão em preparação neste modo.</p>}
      {!unavailable && <>
        <div className="gathering-spots">
          {CONVERSATION_SPOTS[room].map(spot => {
            const own = mine && gathering.spot === spot.id;
            const hosts = others.filter(p => p.gathering?.spot === spot.id);
            return <article key={spot.id} className="gathering-spot">
              <h3><Armchair size={16} /> {spot.name}</h3>
              {own ? <div className="gathering-own">
                <strong>{(group?.members.length || 1) >= 4 ? 'Roda completa' : gathering.open ? 'Pode chegar' : 'Conversa reservada'} · {group?.members.length || 1}/4</strong>
                <button disabled={pending} onClick={() => props.onChange({ ...gathering, open: !gathering.open })}>{gathering.open ? 'Reservar conversa' : 'Aceitar companhia'}</button>
                <button onClick={() => props.onChange(undefined)}>Retirar placa</button>
              </div> : hosts.length ? hosts.map(person => <div key={person.id} className="gathering-host">
                <span>{person.name} · {person.gathering!.count}/4</span>
                <small>{person.gathering!.count >= 4 ? 'Roda completa' : person.gathering!.open ? 'Pode chegar' : 'Conversa reservada'}</small>
                <button disabled={!!group || pending || !props.canVideo || !person.gathering!.open || person.gathering!.count >= 4} onClick={() => props.onKnock(person)}>Pedir para participar</button>
              </div>) : <>
                <p>Um lugar para começar um papo.</p>
                <button disabled={frozen || !props.canVideo} onClick={() => props.onOpen(spot)}>Abrir roda aqui</button>
              </>}
            </article>;
          })}
        </div>
        {mine && visibleKnocks.map(k => <div className="gathering-request" key={k.from} role="status">
          <strong>{people.find(p => p.id === k.from)?.name || 'Uma visita'} quer participar.</strong>
          <button disabled={pending || !props.canVideo || (group?.members.length || 1) >= 4} onClick={() => props.onAnswer(k.from, true)}>Convidar para a roda</button>
          <button onClick={() => props.onAnswer(k.from, false)}>Agora não</button>
        </div>)}
        <p className="gathering-privacy"><CameraOff size={14} /> Participar exige convite e aceite. Câmera e microfone ficam desligados.</p>
        {!props.canVideo && <p>Você está em “Só mensagens” ou em outra conversa. Termine a conversa e habilite convites de vídeo nas suas preferências para participar de uma roda.</p>}
      </>}
      <div className="gathering-icebreaker">
        <button onClick={() => { const choices = [...CONVERSATION_SPOTS[room].map(s => s.question), 'Qual coisa pequena você aprendeu e adorou?', 'Se a gente montasse uma playlist, qual seria sua primeira música?']; setQuestion(choices[(choices.indexOf(question) + 1) % choices.length]); setNotice(''); }}><MessageCircle size={16} /> Caixinha de assuntos</button>
        {question && <><p>{question}</p><button disabled={unavailable} onClick={() => setNotice(props.onShare(question) ? 'Pergunta enviada ao chat público da sala.' : 'Não foi possível enviar agora. Aguarde um instante.')}>Compartilhar no chat da sala</button></>}
        {notice && <small role="status">{notice}</small>}
      </div>
    </details>
  </section>;
}
