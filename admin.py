import tkinter as tk
from tkinter import ttk, messagebox
import json
import os
import subprocess
import threading

# Path to your json file
MENU_FILE = "public/menu.json"

# Helper: Load existing menu
def load_menu():
    if not os.path.exists(MENU_FILE):
        return []
    try:
        with open(MENU_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []

# Helper: Save menu
def save_menu(data):
    with open(MENU_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def deploy_to_web():
    """Runs the firebase deploy command in the background"""
    btn_add.config(state="disabled", text="Deploying (Wait)...")
    try:
        # This runs 'firebase deploy --only hosting' 
        # It assumes you have firebase-tools installed and logged in on this PC
        result = subprocess.run(["firebase", "deploy", "--only", "hosting"], capture_output=True, text=True, shell=True)
        
        if result.returncode == 0:
            messagebox.showinfo("Success", "Menu updated and website deployed!")
        else:
            messagebox.showerror("Error", f"Deploy failed:\n{result.stderr}")
    except Exception as e:
        messagebox.showerror("Error", str(e))
    finally:
        btn_add.config(state="normal", text="ADD ITEM")

def add_to_menu():
    name = entry_name.get()
    price = entry_price.get()
    desc = entry_desc.get()
    category = combo_category.get()
    # Checkbox for 'ismenu'
    is_menu_meal = var_ismenu.get()

    if name and price and category:
        # 1. Load current data
        current_data = load_menu()
        
        # 2. Add new item
        new_item = {
            "id": str(len(current_data) + 100), # Simple ID generation
            "name": name,
            "price": price,
            "description": desc,
            "category": category,
            "ismenu": is_menu_meal,
            "menu": True # This means it is visible
        }
        current_data.append(new_item)
        
        # 3. Save locally
        save_menu(current_data)
        
        # 4. Clear form
        entry_name.delete(0, tk.END)
        entry_price.delete(0, tk.END)
        entry_desc.delete(0, tk.END)
        var_ismenu.set(False)

        # 5. Deploy automatically
        # We run this in a separate thread so the app doesn't freeze
        threading.Thread(target=deploy_to_web).start()
        
    else:
        messagebox.showwarning("Error", "Name, Price, and Category are required!")

# --- GUI Setup ---
root = tk.Tk()
root.title("Tree 4. Familly Admin")
root.geometry("400x550")

tk.Label(root, text="Select Category:").pack(pady=(20, 5))
categories = ["Sandwiches", "Pizzas", "Fast Drinks", "Desserts", "Plates"]
combo_category = ttk.Combobox(root, values=categories, state="readonly")
combo_category.current(0)
combo_category.pack()

tk.Label(root, text="Item Name:").pack(pady=5)
entry_name = tk.Entry(root)
entry_name.pack()

tk.Label(root, text="Price:").pack(pady=5)
entry_price = tk.Entry(root)
entry_price.pack()

tk.Label(root, text="Description:").pack(pady=5)
entry_desc = tk.Entry(root)
entry_desc.pack()

# Checkbox for Menu Meal
var_ismenu = tk.BooleanVar()
chk_ismenu = tk.Checkbutton(root, text="Available as Meal (Menu)?", variable=var_ismenu)
chk_ismenu.pack(pady=10)

btn_add = tk.Button(root, text="ADD ITEM & DEPLOY", command=add_to_menu, bg="#27ae60", fg="white", height=2, width=25)
btn_add.pack(pady=20)

root.mainloop()