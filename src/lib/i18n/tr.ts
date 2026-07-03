const STATUS_LABELS: Record<string, string> = {
  active: "aktif",
  completed: "tamamlandı",
  running: "çalışıyor",
  processing: "işleniyor",
  failed: "başarısız",
  disabled: "devre dışı",
  draft: "taslak",
  pending: "bekliyor",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
