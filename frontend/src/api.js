const BASE = "/api";

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error((await res.text()) || res.statusText);
  return res.status === 204 ? null : res.json();
}

export const api = {
  listNotes: (q = "") => req(`/notes${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  createNote: (d) => req("/notes", { method: "POST", body: JSON.stringify(d) }),
  updateNote: (id, d) => req(`/notes/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  deleteNote: (id) => req(`/notes/${id}`, { method: "DELETE" }),

  listTasks: (status = "") => req(`/tasks${status ? `?status=${status}` : ""}`),
  createTask: (d) => req("/tasks", { method: "POST", body: JSON.stringify(d) }),
  updateTask: (id, d) => req(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  deleteTask: (id) => req(`/tasks/${id}`, { method: "DELETE" }),
};
