import React, { useEffect, useState } from "react";
import { api } from "./api";

function TaskForm({ onSave, initial, onCancel }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [priority, setPriority] = useState(initial?.priority || "medium");
  const [dueDate, setDueDate] = useState(initial?.due_date || "");

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title, description, priority, due_date: dueDate });
    if (!initial) { setTitle(""); setDescription(""); setPriority("medium"); setDueDate(""); }
  };

  return (
    <form className="form" onSubmit={submit}>
      <input placeholder="Task title..." value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="row">
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <button type="submit" className="primary">{initial ? "Save" : "Add Task"}</button>
        {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function TaskItem({ task, onToggle, onDelete, onEdit }) {
  return (
    <li className={`task-item ${task.done ? "done" : ""} p-${task.priority}`}>
      <label className="check">
        <input type="checkbox" checked={task.done} onChange={() => onToggle(task)} />
        <div>
          <div className="task-title">{task.title}</div>
          {task.description && <div className="task-desc">{task.description}</div>}
          <div className="meta">
            <span className="pill">{task.priority}</span>
            {task.due_date && <span className="pill">Due: {task.due_date}</span>}
          </div>
        </div>
      </label>
      <div className="actions">
        <button onClick={() => onEdit(task)}>Edit</button>
        <button className="danger" onClick={() => onDelete(task)}>Delete</button>
      </div>
    </li>
  );
}

function TasksView() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState(null);

  const load = async () => setTasks(await api.listTasks(filter));
  useEffect(() => { load(); }, [filter]);

  const add = async (d) => { await api.createTask(d); load(); };
  const save = async (d) => { await api.updateTask(editing.id, d); setEditing(null); load(); };
  const toggle = async (t) => { await api.updateTask(t.id, { done: !t.done }); load(); };
  const del = async (t) => { if (window.confirm("Delete task?")) { await api.deleteTask(t.id); load(); } };

  return (
    <div>
      {editing ? (
        <TaskForm initial={editing} onSave={save} onCancel={() => setEditing(null)} />
      ) : (
        <TaskForm onSave={add} />
      )}
      <div className="filters">
        <button className={filter === "" ? "active" : ""} onClick={() => setFilter("")}>All</button>
        <button className={filter === "active" ? "active" : ""} onClick={() => setFilter("active")}>Active</button>
        <button className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")}>Done</button>
      </div>
      <ul className="list">
        {tasks.length === 0 && <li className="empty">No tasks yet.</li>}
        {tasks.map((t) => (
          <TaskItem key={t.id} task={t} onToggle={toggle} onDelete={del} onEdit={setEditing} />
        ))}
      </ul>
    </div>
  );
}

function NoteForm({ onSave, initial, onCancel }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [tags, setTags] = useState((initial?.tags || []).join(", "));
  const [pinned, setPinned] = useState(initial?.pinned || false);

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const tagArr = tags.split(",").map((t) => t.trim()).filter(Boolean);
    onSave({ title, content, tags: tagArr, pinned });
    if (!initial) { setTitle(""); setContent(""); setTags(""); setPinned(false); }
  };

  return (
    <form className="form" onSubmit={submit}>
      <input placeholder="Note title..." value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea rows={5} placeholder="Write your note..." value={content} onChange={(e) => setContent(e.target.value)} />
      <div className="row">
        <input placeholder="tags, comma, separated" value={tags} onChange={(e) => setTags(e.target.value)} />
        <label className="check inline">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pin
        </label>
        <button type="submit" className="primary">{initial ? "Save" : "Add Note"}</button>
        {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function NotesView() {
  const [notes, setNotes] = useState([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);

  const load = async () => setNotes(await api.listNotes(q));
  useEffect(() => { const id = setTimeout(load, 200); return () => clearTimeout(id); }, [q]);

  const add = async (d) => { await api.createNote(d); load(); };
  const save = async (d) => { await api.updateNote(editing.id, d); setEditing(null); load(); };
  const togglePin = async (n) => { await api.updateNote(n.id, { pinned: !n.pinned }); load(); };
  const del = async (n) => { if (window.confirm("Delete note?")) { await api.deleteNote(n.id); load(); } };

  return (
    <div>
      {editing ? (
        <NoteForm initial={editing} onSave={save} onCancel={() => setEditing(null)} />
      ) : (
        <NoteForm onSave={add} />
      )}
      <input className="search" placeholder="🔍 Search notes..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="grid">
        {notes.length === 0 && <div className="empty">No notes yet.</div>}
        {notes.map((n) => (
          <div key={n.id} className={`note-card ${n.pinned ? "pinned" : ""}`}>
            <div className="note-head">
              <h3>{n.title}</h3>
              <button title="Pin" onClick={() => togglePin(n)}>{n.pinned ? "📌" : "📍"}</button>
            </div>
            <pre className="note-content">{n.content}</pre>
            <div className="tags">
              {n.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
            </div>
            <div className="actions">
              <span className="meta small">Updated {new Date(n.updated_at).toLocaleString()}</span>
              <div>
                <button onClick={() => setEditing(n)}>Edit</button>
                <button className="danger" onClick={() => del(n)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("tasks");
  return (
    <div className="app">
      <header>
        <h1>📝 NoteApp</h1>
        <nav>
          <button className={tab === "tasks" ? "active" : ""} onClick={() => setTab("tasks")}>Tasks</button>
          <button className={tab === "notes" ? "active" : ""} onClick={() => setTab("notes")}>Notes</button>
        </nav>
      </header>
      <main>
        {tab === "tasks" ? <TasksView /> : <NotesView />}
      </main>
      <footer>Flask + React · SQLite · v1.0</footer>
    </div>
  );
}
