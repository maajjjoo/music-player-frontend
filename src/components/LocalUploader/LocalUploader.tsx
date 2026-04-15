import { useRef, useState } from 'react';
import type { Song } from '../../models/Song';
import './LocalUploader.css';

// Default album art SVG (vinyl record style)
const DEFAULT_ART = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="%231a1a2e"/><circle cx="100" cy="100" r="80" fill="%2316213e"/><circle cx="100" cy="100" r="60" fill="%230f3460"/><circle cx="100" cy="100" r="40" fill="%23533483"/><circle cx="100" cy="100" r="20" fill="%231a1a2e"/><circle cx="100" cy="100" r="6" fill="%23e94560"/><text x="100" y="155" text-anchor="middle" fill="%23ffffff44" font-size="11" font-family="sans-serif">♪</text></svg>`;

interface PendingSong {
  file: File;
  title: string;
  artist: string;
  artPreview: string;       // data URL for preview
  artFile: File | null;
}

interface LocalUploaderProps {
  onAddSong: (song: Song) => void;
  onPlayNow: (song: Song) => void;
  onNotification?: (msg: string) => void;
}

export function LocalUploader({ onAddSong, onPlayNow, onNotification }: LocalUploaderProps) {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingSong[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // ── Pick audio files ──────────────────────────────────────────────────────
  function handleAudioPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const newPending: PendingSong[] = files.map((file) => ({
      file,
      title: file.name.replace(/\.[^/.]+$/, ''), // strip extension
      artist: 'Unknown Artist',
      artPreview: DEFAULT_ART,
      artFile: null,
    }));

    setPending(newPending);
    setIsOpen(true);
    // Reset input so same files can be re-selected
    e.target.value = '';
  }

  // ── Pick cover image for one pending song ─────────────────────────────────
  function handleArtPick(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPending((prev) =>
        prev.map((p, i) =>
          i === index ? { ...p, artPreview: dataUrl, artFile: file } : p
        )
      );
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleFieldChange(index: number, field: 'title' | 'artist', value: string) {
    setPending((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  function handleRemovePending(index: number) {
    setPending((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Build Song object from a PendingSong ──────────────────────────────────
  function buildSong(p: PendingSong): Song {
    const blobUrl = URL.createObjectURL(p.file);
    const artBlobUrl = p.artFile ? URL.createObjectURL(p.artFile) : undefined;

    return {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: p.title.trim() || p.file.name,
      artist: p.artist.trim() || 'Unknown Artist',
      album: 'Local',
      duration: 0,
      albumArt: artBlobUrl ?? p.artPreview,
      previewUrl: blobUrl,
      isFavorite: false,
      isLocal: true,
      blobUrl,
      artBlobUrl,
    };
  }

  function handleAddAll() {
    pending.forEach((p) => onAddSong(buildSong(p)));
    onNotification?.(`✓ ${pending.length} song${pending.length > 1 ? 's' : ''} added to queue`);
    close();
  }

  function handlePlayFirst() {
    if (!pending.length) return;
    const [first, ...rest] = pending;
    onPlayNow(buildSong(first));
    rest.forEach((p) => onAddSong(buildSong(p)));
    if (rest.length) onNotification?.(`✓ ${rest.length} more song${rest.length > 1 ? 's' : ''} added to queue`);
    close();
  }

  function close() {
    setPending([]);
    setIsOpen(false);
  }

  return (
    <>
      {/* Trigger button */}
      <button
        className="lu__trigger"
        onClick={() => audioInputRef.current?.click()}
        aria-label="Upload local files"
        title="Upload local files"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span>Upload</span>
      </button>

      {/* Hidden file input */}
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac"
        multiple
        style={{ display: 'none' }}
        onChange={handleAudioPick}
        aria-hidden="true"
      />

      {/* Modal */}
      {isOpen && (
        <div className="lu__overlay" role="dialog" aria-modal="true" aria-label="Edit uploaded songs">
          <div className="lu__modal">
            <div className="lu__modal-header">
              <h2 className="lu__modal-title">
                {pending.length} file{pending.length > 1 ? 's' : ''} ready to add
              </h2>
              <button className="lu__close" onClick={close} aria-label="Close">✕</button>
            </div>

            <div className="lu__list">
              {pending.map((p, i) => (
                <div key={i} className="lu__item">
                  {/* Cover */}
                  <div className="lu__art-wrap">
                    <img className="lu__art" src={p.artPreview} alt="Cover" />
                    <label className="lu__art-btn" title="Change cover">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleArtPick(i, e)}
                      />
                    </label>
                  </div>

                  {/* Fields */}
                  <div className="lu__fields">
                    <input
                      className="lu__input"
                      type="text"
                      placeholder="Title"
                      value={p.title}
                      onChange={(e) => handleFieldChange(i, 'title', e.target.value)}
                      aria-label="Song title"
                    />
                    <input
                      className="lu__input lu__input--secondary"
                      type="text"
                      placeholder="Artist"
                      value={p.artist}
                      onChange={(e) => handleFieldChange(i, 'artist', e.target.value)}
                      aria-label="Artist name"
                    />
                    <span className="lu__filename">{p.file.name}</span>
                  </div>

                  {/* Remove */}
                  <button
                    className="lu__remove"
                    onClick={() => handleRemovePending(i)}
                    aria-label={`Remove ${p.title}`}
                  >✕</button>
                </div>
              ))}
            </div>

            {/* Actions */}
            {pending.length > 0 && (
              <div className="lu__actions">
                <button className="lu__btn lu__btn--play" onClick={handlePlayFirst}>
                  ▶ Play Now
                </button>
                <button className="lu__btn lu__btn--add" onClick={handleAddAll}>
                  + Add All to Queue
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
