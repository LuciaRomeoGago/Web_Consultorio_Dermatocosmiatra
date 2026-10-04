import { Link } from 'react-router-dom';
import { treatments } from '../data/treatments';
import { img } from '../lib/format';
import './TreatmentGrid.css';

/**
 * Hilera de las 10 tarjetas de tratamiento (componente "Card tratamiento").
 * Al pasar el mouse la tarjeta sube y aparece un punto debajo del nombre.
 */
export function TreatmentGrid() {
  return (
    <ul className="treatment-row scroller">
      {treatments.map((t) => (
        <li key={t.slug}>
          <Link to={`/tratamientos/${t.slug}`} className="treatment-card">
            <img src={img(t.cardImg)} alt="" loading="lazy" width={206} height={258} />
            <span className="treatment-card__name">{t.name}</span>
            <span className="treatment-card__dot" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
