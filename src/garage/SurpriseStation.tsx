import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { PhoneCall, Shuffle, X, ArrowUpRight } from "lucide-react";
export function SurpriseStation({
  near,
  disabled,
  onOpen,
}: {
  near: boolean;
  disabled: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      className={`surprise-station ${near ? "is-near" : ""}`}
      disabled={disabled}
      onClick={onOpen}
      aria-label="Disque Surpresa: abrir roleta 1 a 1"
    >
      <span className="surprise-sign">
        DISQUE
        <br />
        <strong>SURPRESA</strong>
      </span>
      <span className="surprise-phone" aria-hidden="true">
        <PhoneCall />
        <span className="surprise-dial">✦</span>
      </span>
      <span className="surprise-plinth" aria-hidden="true" />
      <span className="surprise-invite">
        {near ? "Atender o inesperado ↗" : "ROLETA · 1 A 1 ↗"}
      </span>
    </button>
  );
}
export function SurpriseDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="surprise-dialog"
      onCancel={onClose}
      aria-labelledby="surprise-title"
    >
      <button
        className="surprise-close"
        aria-label="Fechar Disque Surpresa"
        onClick={onClose}
      >
        <X />
      </button>
      <div className="surprise-dialog-icon">
        <PhoneCall size={46} />
      </div>
      <p className="surprise-kicker">UM TELEFONE. MIL POSSIBILIDADES.</p>
      <h2 id="surprise-title">
        Quem será
        <br />
        do outro lado?
      </h2>
      <p>
        Deixe o acaso apresentar alguém. Uma conversa por vez, só vocês dois.
      </p>
      <div className="surprise-details">
        <span>
          <Shuffle size={18} /> Encontro aleatório 1 a 1
        </span>
        <span>Teste sua câmera e máscara antes da busca.</span>
        <span>Você também pode entrar sem câmera.</span>
      </div>
      <Link to="/roulette?from=house" className="surprise-start">
        Ir para a roleta <ArrowUpRight size={20} />
      </Link>
      <small>
        Você sairá da casa para abrir a roleta de vídeo. Nenhuma busca começa ao
        abrir este convite.
      </small>
      <button className="surprise-stay" onClick={onClose}>
        Continuar na casa
      </button>
    </dialog>
  );
}
