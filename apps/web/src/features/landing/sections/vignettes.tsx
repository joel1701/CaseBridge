import type { CSSProperties } from 'react';
import type { EngineFigure, VignetteData } from '../content';

// Small product cards (.vc) shown inside the view posters and engine cards.

function Bars({
  rows,
  style,
}: {
  rows: { label: string; width: number; value: string }[];
  style?: CSSProperties;
}) {
  return (
    <div className="rb" style={style}>
      {rows.map((r) => (
        <div key={r.label}>
          <span>{r.label}</span>
          <s style={{ width: r.width + '%' }} />
          <em>{r.value}</em>
        </div>
      ))}
    </div>
  );
}

function Timeline({
  events,
  style,
}: {
  events: { text: string; when: string; now?: boolean }[];
  style?: CSSProperties;
}) {
  return (
    <div className="tline" style={style}>
      {events.map((e) => (
        <div key={e.text} className={e.now ? 'now' : undefined}>
          <i />
          <span>{e.text}</span>
          <small>{e.when}</small>
        </div>
      ))}
    </div>
  );
}

export function ViewVignette({ data }: { data: VignetteData }) {
  switch (data.kind) {
    case 'institution':
      return (
        <div className="vc">
          <h4>{data.name}</h4>
          <p className="id">{data.permanentId}</p>
          <p className="m">{data.meta}</p>
          <div className="vgrid">
            {data.stats.map((s) => (
              <div key={s.label}>
                <b>{s.value}</b>
                <span className="m">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'caseTrack':
      return (
        <div className="vc">
          <h4>{data.title}</h4>
          <p className="m">{data.meta}</p>
          <Timeline events={data.events.map((e) => ({ ...e, when: e.date }))} />
        </div>
      );
    case 'overlap':
      return (
        <div className="vc">
          <h4>{data.title}</h4>
          <div className="pair">
            {data.pair.map((p) => (
              <div key={p.bureau}>
                <b>{p.bureau}</b>
                <p>{p.name}</p>
              </div>
            ))}
          </div>
          <div className="flag">{data.flag}</div>
        </div>
      );
    case 'reports':
      return (
        <div className="vc">
          <h4>{data.title}</h4>
          <Bars rows={data.rows} />
        </div>
      );
  }
}

export function EngineVignette({ figure }: { figure: EngineFigure }) {
  switch (figure.kind) {
    case 'match':
      return (
        <div className="vc">
          <p className="m">{figure.caseRef}</p>
          <div className="pair">
            {figure.pair.map((p) => (
              <div key={p.label}>
                <b>{p.label}</b>
                <p>{p.value}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case 'timeline':
      return (
        <div className="vc">
          <Timeline
            style={{ margin: 0 }}
            events={figure.events.map((e) => ({ ...e, when: e.time }))}
          />
        </div>
      );
    case 'countdown':
      return (
        <div className="vc">
          <p className="big">{figure.big}</p>
          <p className="m">{figure.note}</p>
        </div>
      );
    case 'bars':
      return (
        <div className="vc">
          <Bars rows={figure.rows} style={{ margin: 0 }} />
        </div>
      );
  }
}
