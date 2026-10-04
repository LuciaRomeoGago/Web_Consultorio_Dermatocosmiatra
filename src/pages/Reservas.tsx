import { useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Accordion } from '../components/Accordion';
import { Quote } from '../components/Blocks';
import { Button } from '../components/Button';
import { ContactFields } from '../components/ContactFields';
import { Rich } from '../components/Rich';
import { bookingPage as page } from '../data/content';
import { site } from '../data/site';
import { findTreatment } from '../data/treatments';
import type { Treatment } from '../data/types';
import { formatPrice, parseMeta } from '../lib/format';
import { DEFAULT_MINUTES, dayKey, formatLongDay, nextWorkingDays, timeSlots } from '../lib/schedule';
import { emptyContact, validateContact, type ContactErrors } from '../lib/validation';
import { bookingMessage, whatsappUrl } from '../lib/whatsapp';
import './Reservas.css';

const options = page.order.map(findTreatment).filter((t): t is Treatment => !!t);
const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const monthName = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' });

/** Página "Reservas" (frames "Desktop — Reservas" y "Celular — Reservas"). El pedido sale por WhatsApp. */
export function Reservas() {
  const [params, setParams] = useSearchParams();
  const treatment = findTreatment(params.get('tratamiento') ?? undefined);
  const meta = treatment ? parseMeta(treatment.meta) : null;

  // Días con turno: los próximos 40 días hábiles, desde mañana.
  const available = useMemo(() => nextWorkingDays(40), []);
  const availableKeys = useMemo(() => new Set(available.map(dayKey)), [available]);
  const [month, setMonth] = useState(() => new Date(available[0].getFullYear(), available[0].getMonth(), 1));

  const [day, setDay] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [contact, setContact] = useState(emptyContact);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [sentUrl, setSentUrl] = useState<string | null>(null);

  const slots = timeSlots(meta?.minutes ?? DEFAULT_MINUTES);
  const selectedDay = available.find((d) => dayKey(d) === day);

  const chooseTreatment = (slug: string) => {
    setParams({ tratamiento: slug }, { replace: true });
    setTime(null); // la duración cambia, entonces cambian los horarios posibles
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const found = validateContact(contact);
    setErrors(found);
    if (!treatment || !selectedDay || !time || Object.keys(found).length > 0) return;

    const url = whatsappUrl(bookingMessage(treatment.name, `${formatLongDay(selectedDay)}, ${time} hs`, contact));
    setSentUrl(url);
    window.open(url, '_blank', 'noopener');
  };

  if (sentUrl && treatment && selectedDay) {
    return (
      <section className="container bk-done">
        <Rich as="h1" className="bk-head__title" text={[['¡ya casi ', 0], ['está!', 1]]} />
        <p className="bk-head__lead">
          Te abrimos WhatsApp con el pedido de turno para <strong>{treatment.name}</strong> el {formatLongDay(selectedDay)} a las{' '}
          {time} hs. Enviá el mensaje y Jazmín te confirma el turno.
        </p>
        <div className="bk-done__actions">
          <a className="btn btn--primary" href={sentUrl} target="_blank" rel="noreferrer">
            Abrir WhatsApp de nuevo
          </a>
          <Button to="/" variant="link">
            Volver al inicio
          </Button>
        </div>
      </section>
    );
  }

  // Grilla del mes: arranca el lunes de la semana del día 1.
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const lastMonth = new Date(available[available.length - 1].getFullYear(), available[available.length - 1].getMonth(), 1);
  const canPrev = month > new Date(available[0].getFullYear(), available[0].getMonth(), 1);
  const canNext = month < lastMonth;
  const moveMonth = (step: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + step, 1));

  return (
    <>
      <section className="container bk-head">
        <div>
          <Rich as="h1" className="bk-head__title" text={page.title} />
          <p className="bk-head__lead">{page.lead}</p>
        </div>
        <ol className="bk-steps">
          {page.steps.map((s, i) => (
            <li key={s}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              {s}
            </li>
          ))}
        </ol>
      </section>

      <div className="container-card">
        <form className="bk" onSubmit={onSubmit} noValidate>
          {/* Escritorio: lista con radios. */}
          <fieldset className="bk-list">
            <legend>{page.listTitle}</legend>
            {options.map((t) => (
              <label key={t.slug} className="bk-option">
                <input
                  type="radio"
                  name="tratamiento"
                  value={t.slug}
                  checked={treatment?.slug === t.slug}
                  onChange={() => chooseTreatment(t.slug)}
                />
                <span className="bk-option__name">{t.name}</span>
                <span className="bk-option__tagline">{t.tagline}</span>
                <span className="bk-option__meta">{t.meta}</span>
              </label>
            ))}
          </fieldset>

          {/* Celular: selector. */}
          <label className="bk-select">
            <span className="bk-select__label">Elegí el tratamiento</span>
            <span className="bk-select__box">
              <select value={treatment?.slug ?? ''} onChange={(e) => chooseTreatment(e.target.value)}>
                <option value="" disabled>
                  Elegí un tratamiento
                </option>
                {options.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 9.5l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </label>

          {/* Turnero */}
          <div className="bk-panel">
            <div className="bk-panel__info">
              <p className="bk-panel__brand">{site.name}</p>
              <h2 className="bk-panel__title">{treatment?.name ?? 'Elegí un tratamiento'}</h2>
              <dl className="bk-panel__facts">
                <div>
                  <dt>Duración</dt>
                  <dd>{treatment ? (meta ? `${meta.minutes} min` : 'Consultar') : '—'}</dd>
                </div>
                <div>
                  <dt>Precio</dt>
                  <dd>{treatment ? (meta ? formatPrice(meta.price) : 'Consultar') : '—'}</dd>
                </div>
                <div>
                  <dt>Dirección</dt>
                  <dd>
                    {site.address}, {site.city.split(',')[0]}
                  </dd>
                </div>
              </dl>
              <p className="bk-panel__policy">{page.policy}</p>
            </div>

            <div className="bk-panel__main">
              <h3 className="bk-panel__subtitle">Seleccioná la fecha y horario</h3>
              {!treatment && <p className="bk-panel__notice">Elegí un tratamiento para ver los horarios disponibles</p>}

              <fieldset className="bk-cal" disabled={!treatment}>
                <legend className="sr-only">Fecha</legend>
                <div className="bk-cal__month">
                  <span>{monthName.format(month).replace(' de ', ' ')}</span>
                  <span className="bk-cal__arrows">
                    <button type="button" onClick={() => moveMonth(-1)} disabled={!canPrev} aria-label="Mes anterior">
                      ‹
                    </button>
                    <button type="button" onClick={() => moveMonth(1)} disabled={!canNext} aria-label="Mes siguiente">
                      ›
                    </button>
                  </span>
                </div>
                <div className="bk-cal__grid">
                  {weekdays.map((w) => (
                    <span key={w} className="bk-cal__weekday">
                      {w}
                    </span>
                  ))}
                  {cells.map((n, i) => {
                    if (n === null) return <span key={`v${i}`} />;
                    const date = new Date(month.getFullYear(), month.getMonth(), n);
                    const key = dayKey(date);
                    const open = availableKeys.has(key);
                    return (
                      <button
                        type="button"
                        key={key}
                        className="bk-cal__day"
                        disabled={!open}
                        aria-pressed={day === key}
                        aria-label={formatLongDay(date)}
                        onClick={() => {
                          setDay(key);
                          setTime(null);
                        }}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>

                {day && (
                  <div className="bk-cal__times" role="group" aria-label="Horario">
                    {slots.map((s) => (
                      <button type="button" key={s} className="chip" aria-pressed={time === s} onClick={() => setTime(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <div className="bk-cal__tz">
                  <span>Zona horaria</span>
                  Hora de Argentina (GMT-3)
                </div>
              </fieldset>

              {time && (
                <div className="bk-confirm">
                  <h3 className="bk-panel__subtitle">Confirmá tus datos</h3>
                  <ContactFields value={contact} errors={errors} onChange={setContact} />
                  <button type="submit" className="btn btn--primary btn--full">
                    Confirmar turno
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      <Quote text={page.quote} className="bk-quote" />

      <section className="container bk-faq">
        <Rich as="h2" className="bk-faq__title" text={[['preguntas\n', 0], ['frecuentes', 1]]} />
        <Accordion items={page.faq} />
      </section>
    </>
  );
}
