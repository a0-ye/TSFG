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
        self.root.title("TSFG Json Editor")
        self.data = {}
        self.current_passage_id = None
        self.current_action_id = None
        self.current_tag_id = None

        self.root.columnconfigure(3, weight=1) # Give the text editor space
        self.root.rowconfigure(1, weight=1)

        # --- Layout ---
        # 1. Passages
        tk.Label(root, text="Passages").grid(row=0, column=0)
        self.pass_list = tk.Listbox(root, width=15)
        self.pass_list.grid(row=1, column=0, sticky="nsew", padx=5)
        self.pass_list.bind('<<ListboxSelect>>', self.on_passage_select)

        # 2. Actions
        tk.Label(root, text="Actions").grid(row=0, column=1)
        self.act_list = tk.Listbox(root, width=15)
        self.act_list.grid(row=1, column=1, sticky="nsew", padx=5)
        self.act_list.bind('<<ListboxSelect>>', self.on_action_select)

        # 3. Style Tags (New!)
        tk.Label(root, text="Style Tags").grid(row=0, column=2)
        self.tag_list = tk.Listbox(root, width=15)
        self.tag_list.grid(row=1, column=2, sticky="nsew", padx=5)
        self.tag_list.bind('<<ListboxSelect>>', self.on_tag_select)

        # 4. Text/Style Editor
        self.text_editor = tk.Text(root, wrap="word", width=50, height=20)
        self.text_editor.grid(row=1, column=3, padx=10, sticky="nsew")

        # Controls
        btn_frame = tk.Frame(root)
        btn_frame.grid(row=2, column=3, sticky="e", pady=5)
        tk.Button(btn_frame, text="Load JSON", command=self.load_file).pack(side="left")
        tk.Button(btn_frame, text="Add Passage", command=self.add_passage).pack(side="left")
        tk.Button(btn_frame, text="Add Action", command=self.add_action).pack(side="left")
        tk.Button(btn_frame, text="Add Tag", command=self.add_tag).pack(side="left")
        tk.Button(btn_frame, text="SAVE", command=self.save_current_text, bg="green", fg="white").pack(side="left", padx=10)
        tk.Button(btn_frame, text="Export", command=self.export_json).pack(side="left")

    def refresh_listbox(self):
        self.pass_list.delete(0, tk.END)
        for p_id in sorted(self.data.keys()):
            self.pass_list.insert(tk.END, p_id)

    def refresh_action_list(self):
        self.act_list.delete(0, tk.END)
        if self.current_passage_id:
            actions = self.data[self.current_passage_id].get("Actions", {})
            for a_id in actions.keys():
                self.act_list.insert(tk.END, a_id)

    def refresh_tag_list(self):
        self.tag_list.delete(0, tk.END)
        if self.current_passage_id:
            tags = self.data[self.current_passage_id].get("TextTags", {})
            for t_id in tags.keys():
                self.tag_list.insert(tk.END, t_id)

    # --- Selection Logic ---
    def on_passage_select(self, event):
        sel = self.pass_list.curselection()
        if not sel: return
        self.current_passage_id = self.pass_list.get(sel)
        self.current_action_id = None
        self.current_tag_id = None
        self.update_text(self.data[self.current_passage_id].get("TextContent", ""))
        self.refresh_action_list()
        self.refresh_tag_list()

    def on_action_select(self, event):
        sel = self.act_list.curselection()
        if not sel: return
        self.current_action_id = self.act_list.get(sel)
        self.current_tag_id = None
        txt = self.data[self.current_passage_id]["Actions"][self.current_action_id]["TextContent"]
        self.update_text(txt)

    def on_tag_select(self, event):
        sel = self.tag_list.curselection()
        if not sel: return
        self.current_tag_id = self.tag_list.get(sel)
        self.current_action_id = None
        # Tags are objects like {"color": "red"}, so we show as JSON string for editing
        style_obj = self.data[self.current_passage_id]["TextTags"][self.current_tag_id]
        self.update_text(json.dumps(style_obj, indent=2))

    # --- Data Creation ---
    def add_tag(self):
        if not self.current_passage_id: return
        t_id = simpledialog.askstring("New Tag", "Tag ID (e.g. t1):")
        if t_id:
            if "TextTags" not in self.data[self.current_passage_id]:
                self.data[self.current_passage_id]["TextTags"] = {}
            self.data[self.current_passage_id]["TextTags"][t_id] = {"color": "white"}
            self.refresh_tag_list()

    def save_current_text(self):
        txt = self.text_editor.get("1.0", "end-1c")
        pass_data = self.data[self.current_passage_id]

        if self.current_tag_id:
            try:
                pass_data["TextTags"][self.current_tag_id] = json.loads(txt)
            except:
                messagebox.showerror("Error", "Invalid JSON format for Tag Style!")
                return
        elif self.current_action_id:
            pass_data["Actions"][self.current_action_id]["TextContent"] = txt
        elif self.current_passage_id:
            pass_data["TextContent"] = txt
        
        messagebox.showinfo("Success", "Saved to memory.")

    # ... (Include other methods: load_file, add_passage, add_action, update_text, export_json from previous version)

    def update_text(self, content):
        self.text_editor.delete("1.0", tk.END)
        self.text_editor.insert("1.0", content)

    def load_file(self):
        path = filedialog.askopenfilename()
        if path:
            with open(path, 'r') as f:
                self.data = json.load(f)
            self.refresh_listbox()

    def add_passage(self):
        new_id = simpledialog.askstring("New Passage", "Enter a unique ID:")
        if not new_id: return
        self.data[new_id] = {"TextContent": "", "TextTags": {}, "Actions": {}}
        self.refresh_listbox()

    def add_action(self):
        if not self.current_passage_id: return
        a_id = simpledialog.askstring("New Action", "Action ID:")
        if a_id:
            self.data[self.current_passage_id]["Actions"][a_id] = {"TextContent": "", "setFlags": []}
            self.refresh_action_list()

    def export_json(self):
        path = filedialog.asksaveasfilename(defaultextension=".json")
        if path:
            with open(path, 'w') as f:
                json.dump(self.data, f, indent=4)

if __name__ == "__main__":
    root = tk.Tk()
    app = TSFGEditor(root)
    root.mainloop()