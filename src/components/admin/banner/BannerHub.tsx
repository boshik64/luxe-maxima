"use client";

import { useState } from "react";
import { AdminPage } from "@/components/admin/AdminPage";
import { BannerEditor } from "@/components/admin/banner/BannerEditor";
import { CarouselEditor } from "@/components/admin/banner/CarouselEditor";

type Tab = "banners" | "carousel";

export function BannerHub() {
  const [tab, setTab] = useState<Tab>("banners");

  return (
    <AdminPage
      title="Баннеры"
      description="Перетяжки — широкие картинки между блоками главной. Карусель — посты с картинкой и текстом вместо сезонного блока."
    >
      <div className="mb-8 flex flex-wrap gap-2">
        {(
          [
            ["banners", "Перетяжки"],
            ["carousel", "Карусель"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded-full px-4 py-2 text-sm ${
              tab === id
                ? "bg-primary text-white"
                : "border border-line text-muted hover:text-foreground"
            }`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "banners" ? <BannerEditor /> : <CarouselEditor />}
    </AdminPage>
  );
}
