import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog
import json


class TSFGEditor:
    def __init__(self, root):
        self.root = root
        self.root.title("TSFG Json Editor")
        self.data = {}
        self.current_passage_id = None
        self.current_action_index = None
        self.root.columnconfigure(2, weight=1)
        self.root.rowconfigure(1, weight=1)

        # --- Layout ---
        # Sidebar for Passages
        tk.Label(root, text="Passages").grid(row=0, column=0)
        self.pass_list = tk.Listbox(root, width=20)
        self.pass_list.grid(row=1, column=0, sticky="nsew", padx=5)
        self.pass_list.grid(row=1, column=0, sticky="ns", padx=5)
        self.pass_list.bind('<<ListboxSelect>>', self.on_passage_select)

        # Sidebar for Actions
        tk.Label(root, text="Actions").grid(row=0, column=1)
        self.act_list = tk.Listbox(root, width=20)
        self.act_list.grid(row=1, column=1, sticky="nsew", padx=5)
        self.act_list.grid(row=1, column=1, sticky="ns", padx=5)
        self.act_list.bind('<<ListboxSelect>>', self.on_action_select)

        # Main Text Editor
        self.text_editor = tk.Text(root, wrap="word", width=60, height=20)
        self.text_editor.grid(row=1, column=2, padx=10, sticky="nsew")

        # Controls
        btn_frame = tk.Frame(root)
        btn_frame.grid(row=2, column=2, sticky="e")
        tk.Button(btn_frame, text="Open JSON",
                  command=self.load_file).pack(side="left")
        tk.Button(btn_frame, text="Add Passage",
                  command=self.add_passage).pack(side="left")
        tk.Button(btn_frame, text="Add Action",
                  command=self.add_action).pack(side="left")
        tk.Button(btn_frame, text="Save Current",
                  command=self.save_current_text).pack(side="left")
        tk.Button(btn_frame, text="Export File",
                  command=self.export_json).pack(side="left")

    def refresh_listbox(self):
        self.pass_list.delete(0, tk.END)
        for p_id in self.data.keys():
            self.pass_list.insert(tk.END, p_id)

    def refresh_action_list(self):
        self.act_list.delete(0, tk.END)
        actions = self.data[self.current_passage_id].get(
            "Actions", {}).get("IDs", [])
        for action_id in actions:
            self.act_list.insert(tk.END, f"Action: {action_id}")

    def load_file(self):
        path = filedialog.askopenfilename()
        if path:
            with open(path, 'r') as f:
                self.data = json.load(f)
            self.refresh_listbox()

    def add_passage(self):
        new_id = simpledialog.askstring(
            "New Passage", "Enter a unique ID for this passage:")

        if not new_id:
            return
        if new_id in self.data:
            messagebox.showerror("Error", "This ID already exists!")
            return

        self.data.update({new_id: {"TextContent": "", "Actions": {
            "IDs": [], "TextContent": []}}})

        self.refresh_listbox()

    def add_action(self):
    # 1. Ensure a passage is selected first
        if not self.current_passage_id:
            messagebox.showwarning("Warning", "Please select a passage first!")
            return

        # 2. Ask for the new Action ID
        new_action_id = simpledialog.askstring(
            "New Action", "Enter ID for this action:")

        if not new_action_id:
            return

        # 3. Check for duplicates within this specific passage
        current_actions = self.data[self.current_passage_id]["Actions"]
        if new_action_id in current_actions["IDs"]:
            messagebox.showerror(
                "Error", "Action ID already exists in this passage!")
            return

        # 4. Append to BOTH arrays to keep them in sync
        current_actions["IDs"].append(new_action_id)
        current_actions["TextContent"].append("")  # Start with empty text

        # 5. Refresh the UI
        self.refresh_action_list()

        # Optional: Automatically select the newly created action
        self.act_list.selection_clear(0, tk.END)
        self.act_list.selection_set(tk.END)
        self.on_action_select(None)

    def on_passage_select(self, event):
        selection = self.pass_list.curselection()
        if not selection:
            return

        self.current_passage_id = self.pass_list.get(selection)
        self.current_action_index = None  # Reset action focus

        # Load Main Text
        content = self.data[self.current_passage_id].get("TextContent", "")
        self.update_text(content)

        # Load Actions into the second listbox
        self.refresh_action_list()

    def on_action_select(self, event):
        selection = self.act_list.curselection()
        if not selection:
            return

        self.current_action_index = selection[0]
        # Get the TextContent at the same index as the ID
        action_texts = self.data[self.current_passage_id]["Actions"]["TextContent"]
        self.update_text(action_texts[self.current_action_index])

    def update_text(self, content):
        self.text_editor.delete("1.0", tk.END)
        self.text_editor.insert("1.0", content)

    def save_current_text(self):
        new_text = self.text_editor.get("1.0", "end-1c")

        if self.current_action_index is not None:
            # Saving to a specific action
            self.data[self.current_passage_id]["Actions"]["TextContent"][self.current_action_index] = new_text
        elif self.current_passage_id:
            # Saving to the main passage
            self.data[self.current_passage_id]["TextContent"] = new_text

        messagebox.showinfo("Saved", "Changes kept in memory.")

    def export_json(self):
        with open("updated_passages.json", "w") as f:
            json.dump(self.data, f, indent=4)
        messagebox.showinfo("Exported", "Saved to updated_passages.json")


if __name__ == "__main__":
    root = tk.Tk()
    app = TSFGEditor(root)
    root.mainloop()
