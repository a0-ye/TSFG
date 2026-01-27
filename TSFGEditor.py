import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog
import json


''' 
DISCLAIMER:
    this tool was generated using Gemini. Not stress tested, only for ease of use.
    Will be doing a full rewrite with graph node editors.
    
'''
class TSFGEditor:
    def __init__(self, root):
        self.root = root
        self.root.title("TSFG Editor - Passages, Actions, & Global Tags")
        self.data = {"__TextTags": {}}
        self.current_passage_id = None
        self.current_action_id = None
        self.current_global_tag = None

        self.root.columnconfigure(3, weight=1)
        self.root.rowconfigure(1, weight=1)

        # --- Column 0: Passages ---
        tk.Label(root, text="Passages").grid(row=0, column=0)
        self.pass_list = tk.Listbox(root, width=15)
        self.pass_list.grid(row=1, column=0, sticky="nsew", padx=5)
        self.pass_list.bind('<<ListboxSelect>>', self.on_passage_select)

        # --- Column 1: Actions ---
        tk.Label(root, text="Actions").grid(row=0, column=1)
        self.act_list = tk.Listbox(root, width=15)
        self.act_list.grid(row=1, column=1, sticky="nsew", padx=5)
        self.act_list.bind('<<ListboxSelect>>', self.on_action_select)

        # --- Column 2: Journal Flags (linked to selected action) ---
        tk.Label(root, text="Flags for Action").grid(row=0, column=2)
        self.flag_list = tk.Listbox(root, width=15)
        self.flag_list.grid(row=1, column=2, sticky="nsew", padx=5)

        # --- Column 3: Main Editor ---
        self.text_editor = tk.Text(root, wrap="word", width=50, height=20)
        self.text_editor.grid(row=1, column=3, padx=10, sticky="nsew")

        # --- Bottom Area: Global Tags ---
        tag_frame = tk.LabelFrame(root, text="Global Text Tags (__TextTags)")
        tag_frame.grid(row=2, column=0, columnspan=3, sticky="nsew", padx=5, pady=5)
        self.global_tag_list = tk.Listbox(tag_frame, height=4)
        self.global_tag_list.pack(side="left", fill="both", expand=True)
        self.global_tag_list.bind('<<ListboxSelect>>', self.on_global_tag_select)
        
        tk.Button(tag_frame, text="Add Tag", command=self.add_global_tag).pack(side="top", fill="x")

        # --- Button Panel ---
        btn_panel = tk.Frame(root)
        btn_panel.grid(row=2, column=3, sticky="e", padx=10)
        tk.Button(btn_panel, text="Load JSON", command=self.load_file).pack(side="left")
        tk.Button(btn_panel, text="Add Passage", command=self.add_passage).pack(side="left")
        tk.Button(btn_panel, text="Add Action", command=self.add_action).pack(side="left")
        tk.Button(btn_panel, text="Add Flag", command=self.add_flag).pack(side="left")
        tk.Button(btn_panel, text="SAVE", bg="#4CAF50", fg="white", command=self.save_current_text).pack(side="left", padx=10)
        tk.Button(btn_panel, text="Export JSON", command=self.export_json).pack(side="left")

    # --- Logic ---
    def on_passage_select(self, event):
        sel = self.pass_list.curselection()
        if not sel: return
        self.current_passage_id = self.pass_list.get(sel)
        self.current_action_id = None
        self.current_global_tag = None
        self.update_text(self.data[self.current_passage_id].get("TextContent", ""))
        self.refresh_action_list()
        self.flag_list.delete(0, tk.END)

    def on_action_select(self, event):
        sel = self.act_list.curselection()
        if not sel: return
        self.current_action_id = self.act_list.get(sel)
        self.current_global_tag = None
        action_data = self.data[self.current_passage_id]["Actions"][self.current_action_id]
        self.update_text(action_data.get("TextContent", "")) # Note: using TextContent key per your JSON
        self.refresh_flag_list()

    def on_global_tag_select(self, event):
        sel = self.global_tag_list.curselection()
        if not sel: return
        self.current_global_tag = self.global_tag_list.get(sel)
        self.current_action_id = None
        tag_data = self.data["__TextTags"][self.current_global_tag]
        self.update_text(json.dumps(tag_data, indent=4))

    def save_current_text(self):
        txt = self.text_editor.get("1.0", "end-1c")
        if self.current_global_tag:
            try: self.data["__TextTags"][self.current_global_tag] = json.loads(txt)
            except: messagebox.showerror("Error", "Invalid JSON")
        elif self.current_action_id:
            self.data[self.current_passage_id]["Actions"][self.current_action_id]["TextContent"] = txt
        elif self.current_passage_id:
            self.data[self.current_passage_id]["TextContent"] = txt
        messagebox.showinfo("Saved", "Data updated in memory.")

    def refresh_action_list(self):
        self.act_list.delete(0, tk.END)
        actions = self.data[self.current_passage_id].get("Actions", {})
        for a_id in actions.keys():
            self.act_list.insert(tk.END, a_id)

    def refresh_flag_list(self):
        self.flag_list.delete(0, tk.END)
        flags = self.data[self.current_passage_id]["Actions"][self.current_action_id].get("setFlags", [])
        for f in flags:
            self.flag_list.insert(tk.END, f)

    def add_action(self):
        if not self.current_passage_id: return
        a_id = simpledialog.askstring("New Action", "Target Passage ID:")
        if a_id:
            self.data[self.current_passage_id]["Actions"][a_id] = {"TextContent": "", "setFlags": []}
            self.refresh_action_list()

    def add_flag(self):
        if not self.current_action_id: return
        flag = simpledialog.askstring("New Flag", "Flag name:")
        if flag:
            self.data[self.current_passage_id]["Actions"][self.current_action_id]["setFlags"].append(flag)
            self.refresh_flag_list()

    def update_text(self, content):
        self.text_editor.delete("1.0", tk.END)
        self.text_editor.insert("1.0", content)

    def load_file(self):
        path = filedialog.askopenfilename()
        if path:
            with open(path, 'r') as f:
                self.data = json.load(f)
            self.pass_list.delete(0, tk.END)
            for p_id in sorted(self.data.keys()):
                if p_id != "__TextTags": self.pass_list.insert(tk.END, p_id)
            self.global_tag_list.delete(0, tk.END)
            for t_id in self.data.get("__TextTags", {}).keys(): self.global_tag_list.insert(tk.END, t_id)

    def export_json(self):
        path = filedialog.asksaveasfilename(defaultextension=".json")
        if path:
            with open(path, 'w') as f:
                json.dump(self.data, f, indent=4)

    def add_passage(self):
        new_id = simpledialog.askstring("New Passage", "Passage ID:")
        if new_id and new_id not in self.data:
            self.data[new_id] = {"TextContent": "", "Actions": {}}
            self.pass_list.insert(tk.END, new_id)

    def add_global_tag(self):
        t_id = simpledialog.askstring("New Tag", "Tag ID (e.g. t1):")
        if t_id:
            if "__TextTags" not in self.data: self.data["__TextTags"] = {}
            self.data["__TextTags"][t_id] = {"color": "white"}
            self.global_tag_list.insert(tk.END, t_id)

if __name__ == "__main__":
    root = tk.Tk()
    app = TSFGEditor(root)
    root.mainloop()