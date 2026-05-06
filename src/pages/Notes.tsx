import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown, ChevronRight, Plus, X, Save, Search,
  NotebookText, FilePlus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NoteRow {
  id: string;
  client_id: string;
  tab_key: string;
  tab_label: string;
  content: string;
  position: number;
  updated_at: string;
}

interface ClientRow {
  id: string;
  name: string;
}

export default function Notes() {
  const [searchParams] = useSearchParams();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [notesMap, setNotesMap] = useState<Record<string, NoteRow[]>>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());
  const [selectedNote, setSelectedNote] = useState<NoteRow | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [search, setSearch] = useState("");
  const [addingTabFor, setAddingTabFor] = useState<string | null>(null);
  const [newTabLabel, setNewTabLabel] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const pendingSaveRef = useRef<{ noteId: string; content: string } | null>(null);

  // ── Load clients ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("clients")
      .select("id,name")
      .eq("archived", false)
      .order("name")
      .then(({ data }) => setClients(data || []));
  }, []);

  // ── Auto-expand from URL param ─────────────────────────────────────────
  useEffect(() => {
    const clientId = searchParams.get("client");
    const tabKey = searchParams.get("tab");
    if (!clientId) return;
    setExpandedIds((s) => new Set([...s, clientId]));
    loadClientNotes(clientId).then((notes) => {
      if (!notes.length) return;
      const target = tabKey ? notes.find((n) => n.tab_key === tabKey) : notes[0];
      if (target) openNote(target);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Note loading ──────────────────────────────────────────────────────────
  const loadClientNotes = useCallback(async (clientId: string): Promise<NoteRow[]> => {
    const { data } = await supabase
      .from("client_notes")
      .select("*")
      .eq("client_id", clientId)
      .order("position");
    const rows = (data || []) as NoteRow[];
    setNotesMap((m) => ({ ...m, [clientId]: rows }));
    setLoadedIds((s) => new Set([...s, clientId]));
    return rows;
  }, []);

  const toggleClient = useCallback(async (clientId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
        if (!loadedIds.has(clientId)) loadClientNotes(clientId);
      }
      return next;
    });
  }, [loadedIds, loadClientNotes]);

  // ── Save logic ────────────────────────────────────────────────────────────
  const doSave = useCallback(async (noteId: string, content: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("client_notes")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", noteId);
    setSaving(false);
    if (error) { toast.error("Save failed"); return; }
    setIsDirty(false);
    setLastSaved(new Date());
    // Refresh local cache
    setNotesMap((m) => {
      const updated = { ...m };
      for (const cid in updated) {
        updated[cid] = updated[cid].map((n) =>
          n.id === noteId ? { ...n, content, updated_at: new Date().toISOString() } : n
        );
      }
      return updated;
    });
  }, []);

  const flushPending = useCallback(async () => {
    if (!pendingSaveRef.current) return;
    const { noteId, content } = pendingSaveRef.current;
    clearTimeout(debounceRef.current);
    pendingSaveRef.current = null;
    await doSave(noteId, content);
  }, [doSave]);

  // ── Open a note tab ───────────────────────────────────────────────────────
  const openNote = useCallback(async (note: NoteRow) => {
    await flushPending();
    setSelectedNote(note);
    setEditorContent(note.content || "");
    setIsDirty(false);
    setLastSaved(note.updated_at ? new Date(note.updated_at) : null);
  }, [flushPending]);

  // ── Editor onChange ───────────────────────────────────────────────────────
  const handleEditorChange = useCallback((html: string) => {
    setEditorContent(html);
    setIsDirty(true);
    if (!selectedNote) return;
    pendingSaveRef.current = { noteId: selectedNote.id, content: html };
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (pendingSaveRef.current) {
        const { noteId, content } = pendingSaveRef.current;
        pendingSaveRef.current = null;
        doSave(noteId, content);
      }
    }, 1500);
  }, [selectedNote, doSave]);

  // ── Add tab ───────────────────────────────────────────────────────────────
  const addTab = async (clientId: string) => {
    if (!newTabLabel.trim()) return;
    const tabKey = newTabLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_") + "_" + Date.now();
    const existing = notesMap[clientId] || [];
    const { error, data } = await supabase.from("client_notes").insert([{
      client_id: clientId,
      tab_key: tabKey,
      tab_label: newTabLabel.trim(),
      content: "",
      position: existing.length,
    } as any]).select().single();
    if (error) { toast.error(error.message); return; }
    setNewTabLabel("");
    setAddingTabFor(null);
    await loadClientNotes(clientId);
    if (data) openNote(data as NoteRow);
  };

  const deleteTab = async (note: NoteRow) => {
    if (selectedNote?.id === note.id) {
      const siblings = notesMap[note.client_id] || [];
      const next = siblings.find((n) => n.id !== note.id);
      if (next) openNote(next);
      else { setSelectedNote(null); setEditorContent(""); }
    }
    await supabase.from("client_notes").delete().eq("id", note.id);
    await loadClientNotes(note.client_id);
  };

  // ── Filtered clients ──────────────────────────────────────────────────────
  const filtered = search.trim()
    ? clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : clients;

  const selectedClient = clients.find((c) => c.id === selectedNote?.client_id);

  return (
    <div className="flex flex-col" style={{ height: "calc(100svh - 6.5rem)" }}>
      {/* Title bar */}
      <div className="px-6 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <NotebookText className="size-4 text-primary" />
          <span className="font-semibold tracking-wide text-sm">
            {selectedNote
              ? <>{selectedClient?.name} <span className="text-muted-foreground">/ {selectedNote.tab_label}</span></>
              : "Client Notes"
            }
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {saving && <span className="animate-pulse">Saving…</span>}
          {!saving && lastSaved && <span>Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
          {isDirty && !saving && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={flushPending}>
              <Save className="size-3" /> Save now
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside className="w-60 shrink-0 flex flex-col border-r border-border overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients…"
                className="h-8 pl-8 text-xs bg-white/5 border-white/10"
              />
            </div>
          </div>

          {/* Client list */}
          <div className="flex-1 overflow-y-auto py-2">
            {filtered.length === 0 && (
              <p className="px-4 py-6 text-xs text-muted-foreground text-center">No clients found</p>
            )}
            {filtered.map((client) => {
              const isExpanded = expandedIds.has(client.id);
              const notes = notesMap[client.id] || [];
              const mainNotes = notes.filter((_, i) => i === 0);
              const subNotes = notes.filter((_, i) => i > 0);

              return (
                <div key={client.id}>
                  {/* Client header */}
                  <button
                    type="button"
                    onClick={() => toggleClient(client.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors group"
                  >
                    {isExpanded
                      ? <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
                      : <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                    }
                    <span className="text-sm font-medium truncate flex-1">{client.name}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setAddingTabFor(client.id); setNewTabLabel(""); if (!isExpanded) toggleClient(client.id); }}
                      className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity shrink-0"
                      title="Add note tab"
                    >
                      <FilePlus className="size-3.5" />
                    </button>
                  </button>

                  {/* Tabs */}
                  {isExpanded && (
                    <div className="ml-6 border-l border-border/50 pl-2 py-0.5 space-y-0.5">
                      {notes.map((note, idx) => (
                        <div
                          key={note.id}
                          className={cn(
                            "flex items-center group rounded-md pr-1 transition-colors",
                            selectedNote?.id === note.id
                              ? "bg-primary/15 text-foreground"
                              : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => openNote(note)}
                            className="flex-1 text-left px-2 py-1.5 text-xs truncate"
                          >
                            {idx === 0 && <span className="mr-1 text-[9px] uppercase tracking-widest text-primary font-semibold">Main</span>}
                            {note.tab_label}
                          </button>
                          {notes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => deleteTab(note)}
                              className="opacity-0 group-hover:opacity-50 hover:!opacity-100 p-0.5 rounded transition-opacity shrink-0"
                              title="Delete tab"
                            >
                              <X className="size-3" />
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Add tab inline */}
                      {addingTabFor === client.id ? (
                        <div className="flex items-center gap-1 px-1 py-1">
                          <Input
                            autoFocus
                            value={newTabLabel}
                            onChange={(e) => setNewTabLabel(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") addTab(client.id);
                              if (e.key === "Escape") { setAddingTabFor(null); setNewTabLabel(""); }
                            }}
                            placeholder="Tab name…"
                            className="h-6 text-xs px-2 bg-white/5 border-white/10"
                          />
                          <Button size="sm" className="h-6 text-[10px] px-2 shrink-0" onClick={() => addTab(client.id)}>
                            Add
                          </Button>
                          <button
                            type="button"
                            onClick={() => { setAddingTabFor(null); setNewTabLabel(""); }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setAddingTabFor(client.id); setNewTabLabel(""); }}
                          className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full"
                        >
                          <Plus className="size-3" /> Add tab
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Editor area ── */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white/[0.01]">
          {selectedNote ? (
            <RichTextEditor
              key={selectedNote.id}
              content={editorContent}
              onChange={handleEditorChange}
              placeholder={
                selectedNote.tab_key.includes("target")
                  ? "Target ROAS, CPA goals, budget targets, KPIs the client tracks…"
                  : selectedNote.tab_key.includes("update")
                  ? "Account changes, budget adjustments, campaign launches, pauses…"
                  : selectedNote.tab_key.includes("adjust")
                  ? "Bid changes, audience tweaks, ad copy updates, structural changes…"
                  : `Notes for ${selectedNote.tab_label}…`
              }
              className="h-full"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
              <NotebookText className="size-10 text-muted-foreground opacity-30" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Select a client and note tab</p>
                <p className="text-xs text-muted-foreground mt-1 opacity-70">All client notes are stored here. Expand a client on the left to start.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
