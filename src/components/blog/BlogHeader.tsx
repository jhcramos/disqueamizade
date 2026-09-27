import { Link, useLocation } from "react-router-dom";
import { BrandLogo } from "@/components/common/BrandLogo";
export function BlogHeader() {
  const { pathname } = useLocation();
  return (
    <header className="mag-header">
      <Link to="/" aria-label="Disque Amizade — início">
        <BrandLogo />
      </Link>
      <nav aria-label="Menu da revista">
        <Link
          to="/blog"
          aria-current={pathname === "/blog" ? "page" : undefined}
        >
          A revista
        </Link>
        <Link to="/blog#brincar">Para quebrar o gelo</Link>
        <Link to="/garagem" className="mag-button">
          Entrar na casa <span aria-hidden="true">↗</span>
        </Link>
      </nav>
    </header>
  );
}
