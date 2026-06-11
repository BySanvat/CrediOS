"use client";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("credios-theme", next ? "dark" : "light");
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={toggleTheme} aria-label="Cambiar tema">
      <AppIcon name="moon" />
      Tema
    </Button>
  );
}
