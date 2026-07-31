import { useEffect, useMemo, useRef, useState } from "react";

function headingsFrom(blocks) {
  return blocks.filter((block) => block.type === "heading" && [2, 3].includes(block.level) && block.id);
}

function TocLinks({ headings, activeId, onNavigate }) {
  return headings.map((heading) => (
    <a key={heading.id} href={`#${heading.id}`} data-level={heading.level} aria-current={activeId === heading.id ? "location" : undefined} onClick={onNavigate}>
      {heading.text}
    </a>
  ));
}

export function ReadingTOC({ blocks }) {
  const headings = useMemo(() => headingsFrom(blocks), [blocks]);
  const [activeId, setActiveId] = useState(() => window.location.hash.slice(1));
  const detailsRef = useRef(null);

  useEffect(() => {
    const targets = headings.map((heading) => document.getElementById(heading.id)).filter(Boolean);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveId(visible[0].target.id);
    }, { rootMargin: "-18% 0px -70% 0px" });
    targets.forEach((target) => observer.observe(target));
    const onHashChange = () => setActiveId(window.location.hash.slice(1));
    window.addEventListener("hashchange", onHashChange);
    return () => { observer.disconnect(); window.removeEventListener("hashchange", onHashChange); };
  }, [headings]);

  if (!headings.length) return null;
  const closeMobileToc = () => { if (detailsRef.current) detailsRef.current.open = false; };
  return (
    <>
      <nav className="reading-toc" aria-label="文章目录"><span>目录</span><TocLinks headings={headings} activeId={activeId} /></nav>
      <details ref={detailsRef} className="mobile-toc"><summary>目录</summary><nav aria-label="文章目录"><TocLinks headings={headings} activeId={activeId} onNavigate={closeMobileToc} /></nav></details>
    </>
  );
}
