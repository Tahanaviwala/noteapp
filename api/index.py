"""Flask backend for Task/Note taking app."""
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(basedir, 'notes.db')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)


class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, default="")
    tags = db.Column(db.String(300), default="")
    pinned = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "tags": [t.strip() for t in (self.tags or "").split(",") if t.strip()],
            "pinned": self.pinned,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default="")
    done = db.Column(db.Boolean, default=False)
    priority = db.Column(db.String(10), default="medium")
    due_date = db.Column(db.String(30), default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "done": self.done,
            "priority": self.priority,
            "due_date": self.due_date,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


with app.app_context():
    db.create_all()


@app.route("/api/health")
def health():
    return {"status": "ok"}


@app.route("/api/notes", methods=["GET"])
def list_notes():
    q = request.args.get("q", "").strip()
    query = Note.query
    if q:
        like = f"%{q}%"
        query = query.filter((Note.title.ilike(like)) | (Note.content.ilike(like)) | (Note.tags.ilike(like)))
    notes = query.order_by(Note.pinned.desc(), Note.updated_at.desc()).all()
    return jsonify([n.to_dict() for n in notes])


@app.route("/api/notes", methods=["POST"])
def create_note():
    data = request.get_json() or {}
    if not data.get("title"):
        return {"error": "title required"}, 400
    n = Note(
        title=data["title"],
        content=data.get("content", ""),
        tags=",".join(data.get("tags", [])) if isinstance(data.get("tags"), list) else data.get("tags", ""),
        pinned=bool(data.get("pinned", False)),
    )
    db.session.add(n)
    db.session.commit()
    return n.to_dict(), 201


@app.route("/api/notes/<int:nid>", methods=["GET"])
def get_note(nid):
    n = Note.query.get_or_404(nid)
    return n.to_dict()


@app.route("/api/notes/<int:nid>", methods=["PUT"])
def update_note(nid):
    n = Note.query.get_or_404(nid)
    data = request.get_json() or {}
    if "title" in data:
        n.title = data["title"]
    if "content" in data:
        n.content = data["content"]
    if "tags" in data:
        n.tags = ",".join(data["tags"]) if isinstance(data["tags"], list) else data["tags"]
    if "pinned" in data:
        n.pinned = bool(data["pinned"])
    db.session.commit()
    return n.to_dict()


@app.route("/api/notes/<int:nid>", methods=["DELETE"])
def delete_note(nid):
    n = Note.query.get_or_404(nid)
    db.session.delete(n)
    db.session.commit()
    return {"deleted": nid}


@app.route("/api/tasks", methods=["GET"])
def list_tasks():
    status = request.args.get("status")
    query = Task.query
    if status == "active":
        query = query.filter_by(done=False)
    elif status == "done":
        query = query.filter_by(done=True)
    tasks = query.order_by(Task.done.asc(), Task.created_at.desc()).all()
    return jsonify([t.to_dict() for t in tasks])


@app.route("/api/tasks", methods=["POST"])
def create_task():
    data = request.get_json() or {}
    if not data.get("title"):
        return {"error": "title required"}, 400
    t = Task(
        title=data["title"],
        description=data.get("description", ""),
        priority=data.get("priority", "medium"),
        due_date=data.get("due_date", ""),
    )
    db.session.add(t)
    db.session.commit()
    return t.to_dict(), 201


@app.route("/api/tasks/<int:tid>", methods=["PUT"])
def update_task(tid):
    t = Task.query.get_or_404(tid)
    data = request.get_json() or {}
    for field in ("title", "description", "priority", "due_date"):
        if field in data:
            setattr(t, field, data[field])
    if "done" in data:
        t.done = bool(data["done"])
    db.session.commit()
    return t.to_dict()


@app.route("/api/tasks/<int:tid>", methods=["DELETE"])
def delete_task(tid):
    t = Task.query.get_or_404(tid)
    db.session.delete(t)
    db.session.commit()
    return {"deleted": tid}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
