import { OfficialCatalog } from "../../components/official-catalog";
import { ProductFrame } from "../../components/product-frame";
export default function PlayPage() {
  return (
    <ProductFrame>
      <section className="lobby-heading">
        <span className="eyebrow">LES JEUX</span>
        <h1>Choisir un jeu</h1>
        <p>Avec vos invités, ou seul pour une répétition avant le live.</p>
      </section>
      <OfficialCatalog />
    </ProductFrame>
  );
}
