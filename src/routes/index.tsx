import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

const GameApp = lazy(() => import("@/GameApp"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aethelgard: Abismo de Cinzas" },
      { name: "description", content: "Plataforma de ação pixel-art com 50 mundos, Submundo e um Mundo Aberto Sandbox gigante cheio de segredos." },
      { property: "og:title", content: "Aethelgard: Abismo de Cinzas" },
      { property: "og:description", content: "Explore 50 mundos, o Submundo e um Mundo Aberto cheio de segredos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <div className="dark h-screen w-screen" style={{ backgroundColor: "#07050d", color: "#f5efe6" }}>
      {ready && (
        <Suspense fallback={null}>
          <GameApp />
        </Suspense>
      )}
    </div>
  );
}
