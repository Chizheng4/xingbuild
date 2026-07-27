import { useEffect, useMemo, useRef, useState } from "react";
import {
  applicationHref,
  conceptHref,
  explorerHref,
  frameworkConceptById,
  frameworkRelations,
  frameworkViewById,
} from "../../content/frameworkModel";
import { Link, navigate } from "../../lib/navigation";

function RelationText({ relation }) {
  const from = frameworkConceptById.get(relation.from);
  const to = frameworkConceptById.get(relation.to);
  return (
    <li>
      <span>{from?.name}</span>
      <strong>{relation.label}</strong>
      <span>{to?.name ?? "Robotaxi 应用"}</span>
    </li>
  );
}

function ConceptNode({ concept, viewId, selected, previewed, onPreview, onSelect }) {
  const href = conceptHref(concept.id, viewId);
  return (
    <li className="framework-node-item">
      <a
        className={`framework-node${selected ? " is-current" : ""}${previewed ? " is-previewed" : ""}`}
        href={href}
        aria-current={selected ? "true" : undefined}
        onMouseEnter={() => onPreview(concept.id)}
        onMouseLeave={() => onPreview(null)}
        onFocus={() => onPreview(concept.id)}
        onBlur={() => onPreview(null)}
        onClick={(event) => {
          if (window.matchMedia("(min-width: 900px)").matches) {
            event.preventDefault();
            onSelect(concept.id);
          }
        }}
      >
        <strong>{concept.name}</strong>
        <span>{concept.answers}</span>
        {selected ? <em>当前概念</em> : null}
      </a>
    </li>
  );
}

export function ConceptDetail({ concept, viewId, compact = false }) {
  if (!concept) {
    return (
      <aside className="concept-detail is-empty" aria-label="概念详情">
        <p>选择一个概念，查看其权威定义、依赖、上层结构与应用。</p>
      </aside>
    );
  }
  const dependencyLinks = concept.dependsOn
    .map((id) => frameworkConceptById.get(id))
    .filter(Boolean);
  const nextActions = {
    "digital-implementation": {
      href: conceptHref("enterprise-business-architecture", "digital"),
      label: "进入企业业务架构",
    },
    "enterprise-business-architecture": {
      href: conceptHref("business-objects-events", "business-architecture"),
      label: "进入业务对象与事件",
    },
    "business-objects-events": {
      href: conceptHref("business-object", "business-architecture"),
      label: "进入业务对象",
    },
  };
  const nextAction = nextActions[concept.id];
  return (
    <aside className="concept-detail object-stack" aria-label={`${concept.name}详情`}>
      <nav className="framework-path" aria-label="认知路径">
        <Link href={explorerHref("overview")}>总览</Link>
        <span aria-hidden="true">›</span>
        <span>{viewId === "business-architecture" ? "企业业务架构" : concept.plane}</span>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{concept.name}</span>
      </nav>
      <header className="concept-detail__header">
        <p>{concept.nature} · {concept.plane}</p>
        <h2>{concept.name}</h2>
      </header>
      <section className="concept-definition">
        <h3>权威定义</h3>
        <p>{concept.definition}</p>
      </section>
      <dl className="concept-properties">
        <div><dt>回答的问题</dt><dd>{concept.answers}</dd></div>
        <div>
          <dt>直接依赖</dt>
          <dd>{dependencyLinks.length ? dependencyLinks.map((item, index) => (
            <span key={item.id}>
              {index ? "、" : ""}
              <Link href={conceptHref(item.id, viewId)}>{item.name}</Link>
            </span>
          )) : "没有更低层的定义依赖"}</dd>
        </div>
        <div><dt>上层结构</dt><dd>{concept.parentContexts.join("、")}</dd></div>
      </dl>
      {concept.distinguishesFrom.length ? (
        <section className="concept-distinction">
          <h3>边界辨析</h3>
          {concept.distinguishesFrom.map((item) => <p key={item}>{item}</p>)}
        </section>
      ) : null}
      {concept.applications.includes("robotaxi-object") ? (
        <Link className="framework-action" href={applicationHref("robotaxi", concept.id)}>
          进入 Robotaxi 应用
        </Link>
      ) : null}
      {nextAction ? (
        <Link className="framework-action" href={nextAction.href}>
          {nextAction.label}
        </Link>
      ) : null}
      <footer className="framework-source">
        <span>来源与版本</span>
        <p>{concept.source.name} <span className="source-version">· {concept.source.version}</span></p>
      </footer>
      {compact ? (
        <Link className="framework-read-more" href={conceptHref(concept.id, viewId)}>
          阅读完整概念页
        </Link>
      ) : null}
    </aside>
  );
}

function StructureView({ view, selectedId, previewId, onPreview, onSelect }) {
  const nodes = view.nodes.map((id) => frameworkConceptById.get(id)).filter(Boolean);
  const relations = frameworkRelations.filter((item) => item.context === view.id);
  const primary = new Set(view.primaryNodes ?? view.nodes);
  const secondary = nodes.filter((item) => view.secondaryNodes?.includes(item.id));
  const main = nodes.filter((item) => !view.secondaryNodes?.includes(item.id));
  return (
    <div className={`structure-view is-${view.layout}`}>
      <ol className="framework-node-list" aria-label={`${view.name}概念`}>
        {main.map((item) => (
          <ConceptNode
            key={item.id}
            concept={item}
            viewId={view.id}
            selected={selectedId === item.id}
            previewed={previewId === item.id}
            onPreview={onPreview}
            onSelect={onSelect}
          />
        ))}
      </ol>
      {secondary.length ? (
        <section className="complete-perspectives">
          <h3>完整视角</h3>
          <p>以下视角与主路径视角同等权威；这里的次级呈现只用于学习顺序。</p>
          <ul>
            {secondary.map((item) => (
              <li key={item.id}><Link href={conceptHref(item.id, view.id)}>{item.name}</Link></li>
            ))}
          </ul>
        </section>
      ) : null}
      <details className="relation-equivalents">
        <summary>阅读关系文本</summary>
        <ul>{relations.map((item) => <RelationText key={item.id} relation={item} />)}</ul>
      </details>
      {primary.size ? <p className="structure-note">当前结构按关系顺序阅读；线条与位置不替代关系文字。</p> : null}
    </div>
  );
}

export function FrameworkExplorer({ viewId, selectedId, search }) {
  const view = frameworkViewById.get(viewId) ?? frameworkViewById.get("overview");
  const [previewId, setPreviewId] = useState(null);
  const liveRef = useRef(null);
  const selected = frameworkConceptById.get(selectedId);
  const preview = frameworkConceptById.get(previewId);
  const detailConcept = preview ?? selected;
  const query = useMemo(() => new URLSearchParams(search), [search]);

  useEffect(() => {
    const closePreview = (event) => {
      if (event.key === "Escape") {
        if (previewId) setPreviewId(null);
        else if (selectedId) navigate(explorerHref(viewId), { replace: true, scroll: false });
      }
    };
    window.addEventListener("keydown", closePreview);
    return () => window.removeEventListener("keydown", closePreview);
  }, [previewId, selectedId, viewId]);

  const selectConcept = (id) => {
    query.set("view", viewId);
    query.set("concept", id);
    navigate(`${window.location.pathname}?${query}`, {
      state: { sourceView: viewId, scrollY: window.scrollY },
      scroll: false,
    });
    liveRef.current.textContent = `已选择${frameworkConceptById.get(id).name}`;
  };

  return (
    <div className="framework-explorer">
      <section className="framework-canvas" aria-label={view.name}>
        <header className="framework-view-header">
          <p>当前视图</p>
          <h2>{view.name}</h2>
          <nav aria-label="框架视图">
            <Link className={view.id === "overview" ? "is-current" : ""} href={explorerHref("overview")}>总览</Link>
            <Link className={view.id === "digital" ? "is-current" : ""} href={explorerHref("digital")}>数字化实现</Link>
            <Link className={view.id === "business-architecture" ? "is-current" : ""} href={explorerHref("business-architecture")}>企业业务架构</Link>
          </nav>
        </header>
        <StructureView
          view={view}
          selectedId={selectedId}
          previewId={previewId}
          onPreview={setPreviewId}
          onSelect={selectConcept}
        />
      </section>
      <div className="framework-detail-column">
        {preview ? <p className="preview-label">快速预览 · 聚焦或悬停</p> : null}
        <ConceptDetail concept={detailConcept} viewId={view.id} compact />
      </div>
      <p className="sr-only" aria-live="polite" ref={liveRef} />
    </div>
  );
}
