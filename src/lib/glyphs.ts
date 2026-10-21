// Trazos de los glifos propios (rejilla de 24, trazo uniforme; la clase `n` es el nodo de la marca). Los usan Glyph.astro y el mapa del ecosistema.
export const GLYPHS: Record<string, string> = {
  app: '<path d="M12 12 5.4 6.4M12 12l6.6-5.6M12 12v7.6"/><circle cx="5" cy="6" r="1.9"/><circle cx="19" cy="6" r="1.9"/><circle cx="12" cy="20" r="1.9"/><circle class="n" cx="12" cy="12" r="2.6"/>',
  pos: '<rect x="5" y="3.5" width="14" height="17" rx="2.6"/><path d="M8.6 8h6.8"/><path d="M8.6 12h.01M12 12h.01M15.4 12h.01"/><circle class="n" cx="12" cy="16.4" r="1.5"/>',
  card: '<rect x="3" y="6" width="18" height="12" rx="2.8"/><path d="M13.6 10.3a2.9 2.9 0 0 1 0 3.4M16.3 8.9a5.2 5.2 0 0 1 0 6.2"/><circle class="n" cx="8" cy="12" r="1.7"/>',
  crm: '<rect x="3.5" y="4.5" width="4.8" height="15" rx="1.5"/><rect x="9.6" y="4.5" width="4.8" height="10" rx="1.5"/><rect x="15.7" y="4.5" width="4.8" height="6.2" rx="1.5"/><circle class="n" cx="5.9" cy="8.6" r="1.15"/>',
  inbox: '<path d="M3.5 13.5 6.4 5.5h11.2l2.9 8v4.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z"/><path d="M3.5 13.5h5l1 2.2h5l1-2.2h5"/><circle class="n" cx="12" cy="9.2" r="1.4"/>',
  loyalty: '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M12 10v10M4 14.2h16"/><path d="M12 10C11 6.6 7 6.6 7 8.8 7 10 9 10 12 10Zm0 0c1-3.4 5-3.4 5-1.2C17 10 15 10 12 10Z"/>',
  agent: '<path d="M5.5 4.5h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4.2 3.5V16.5H5.5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"/><path d="m8.6 11 3.4 2.6 3.4-2.6"/><circle class="n" cx="8.6" cy="9.6" r="1.35"/><circle class="n" cx="15.4" cy="9.6" r="1.35"/>',
  automation: '<path d="M5.4 9.6C5.4 4.4 18.6 4.4 18.6 9.6"/><path d="M7.6 14.4h2.8M13.6 14.4h2.8"/><circle cx="5" cy="14.4" r="2"/><circle cx="12" cy="14.4" r="2"/><circle class="n" cx="19" cy="14.4" r="2"/><path d="m16.8 7.3 1.8 2.3 2.3-1.8"/>',
  software: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.6"/><path d="M3.5 8.8h17"/><path d="m9.6 12.4-2.2 2.1 2.2 2.1M14.4 12.4l2.2 2.1-2.2 2.1"/><circle class="n" cx="6.4" cy="6.65" r="0.9"/>',
  restaurant: '<path d="M4 15.5a8 8 0 0 1 16 0Z"/><path d="M3 18.6h18"/><circle class="n" cx="12" cy="5.4" r="1.45"/><path d="M12 6.9v1.2"/>',
  clinic: '<rect x="4" y="5.5" width="16" height="14.5" rx="2.6"/><path d="M4 10h16M8.5 3.5v3.6M15.5 3.5v3.6"/><circle class="n" cx="12" cy="14.8" r="1.7"/>',
  property: '<path d="M4 11.2 12 4.6l8 6.6V19.6H4Z"/><path d="M9.5 19.6v-4"/><circle class="n" cx="14.2" cy="14.8" r="1.5"/>',
};
