import { useEffect, useState } from "react";
import { ObservationPage } from "./ObservationPage";

export function DraftObservationPage({ slug }) {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/__xingbuild/drafts/${encodeURIComponent(slug)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json();
      })
      .then((observation) => setState({ status: "ready", observation }))
      .catch((error) => {
        if (error.name !== "AbortError") setState({ status: "error", message: error.message });
      });
    return () => controller.abort();
  }, [slug]);

  if (state.status === "loading") {
    return <p className="draft-preview-state" role="status">正在读取本地草稿…</p>;
  }
  if (state.status === "error") {
    return (
      <section className="draft-preview-state" role="alert">
        <h1>草稿无法预览</h1>
        <p>{state.message}</p>
      </section>
    );
  }
  return <ObservationPage observation={state.observation} isDraft />;
}
